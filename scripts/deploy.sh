#!/usr/bin/env bash
set -Eeuo pipefail

SSH_HOST="${DEPLOY_SSH:-interpro}"
REMOTE_DIR="${DEPLOY_DIR:-/root/interpro/frontend}"
ASSET_DIR="${DEPLOY_ASSET_DIR:-/srv/interpro-assets}"
CDN_ORIGIN="${DEPLOY_CDN_ORIGIN:-https://cdn.interpro.pro}"
ASSET_BASE_URL="${VITE_ASSET_BASE_URL:-$CDN_ORIGIN}"
IMAGE_REPOSITORY="${DEPLOY_IMAGE:-interpro-frontend}"
STATE_DIR="${DEPLOY_STATE_DIR:-$REMOTE_DIR/.deploy}"
MODE="" RELEASE=""
die() { echo "$*" >&2; exit 1; }
usage() {
  cat <<'EOF'
Usage:
  scripts/deploy.sh --dry-run [--tag RELEASE_ID]
  scripts/deploy.sh --deploy [--tag RELEASE_ID]
  scripts/deploy.sh --publish-assets [--tag RELEASE_ID]
  scripts/deploy.sh --deploy-server RELEASE_ID
  scripts/deploy.sh --rollback

Deploy publishes, verifies and then switches to the new release. Publish-assets
stops after creating a ready release for a separate deploy-server command.
Both generate a commit+UTC timestamp+random release ID when omitted. IDs cannot
be reused, including failed publishes. Publish builds once, stages the full asset
inventory, checks every CDN object, and loads/verifies a content-addressed image.
Deploy-server requires an explicit ready release ID. Deploy/rollback hold a remote flock
through health checks, recovery and atomic state commit. Images/assets are retained.
DEPLOY_CDN_ORIGIN must be a canonical HTTPS origin (no path or trailing slash);
VITE_ASSET_BASE_URL, if set, must equal it. Requires bash, node, docker, curl,
tar and sha256sum locally; bash, flock, GNU coreutils, tar and Docker Compose remotely.
EOF
}
while (($#)); do
  case "$1" in
    --dry-run|--deploy|--publish-assets|--rollback)
      [[ -z "$MODE" ]] || die 'Specify exactly one mode'
      MODE="${1#--}"; shift ;;
    --deploy-server)
      [[ -z "$MODE" && $# -ge 2 && -n "$2" ]] || die 'Deploy requires a release ID'
      MODE=deploy-server; RELEASE="$2"; shift 2 ;;
    --tag)
      [[ $# -ge 2 && -z "$RELEASE" ]] || die 'Specify one release ID'
      RELEASE="$2"; shift 2 ;;
    -h|--help) usage; exit 0 ;;
    *) die "Unknown argument: $1" ;;
  esac
done
[[ -n "$MODE" ]] || { usage >&2; exit 2; }
[[ "$MODE" != rollback || -z "$RELEASE" ]] || die 'Rollback does not take a release ID'
[[ "$CDN_ORIGIN" =~ ^https://[a-z0-9]([a-z0-9.-]*[a-z0-9])?(:[0-9]+)?$ ]] || die 'Invalid canonical DEPLOY_CDN_ORIGIN'
[[ "$ASSET_BASE_URL" == "$CDN_ORIGIN" ]] || die 'Build origin must equal DEPLOY_CDN_ORIGIN'
if [[ -z "$RELEASE" && "$MODE" != rollback ]]; then
  [[ "$MODE" != deploy-server ]] || die 'Deploy requires a release ID'
  RELEASE="$(git rev-parse --short=12 HEAD)-$(date -u +%Y%m%dT%H%M%SZ)-$(node -e 'console.log(require("crypto").randomBytes(6).toString("hex"))')"
fi
[[ -z "$RELEASE" || "$RELEASE" =~ ^[A-Za-z0-9][A-Za-z0-9_.-]{0,100}$ ]] || die 'Invalid release ID'
for path in "$REMOTE_DIR" "$ASSET_DIR" "$STATE_DIR"; do
  [[ "$path" == /* && "$path" != / && "$path" != *$'\n'* ]] || die 'Remote directories must be absolute non-root paths'
done

# The entire remote program and each argument are POSIX single-quoted. No data
# is interpolated into shell source; stdin remains available for tar/image data.
shell_quote() { printf "'%s'" "${1//\'/\'\\\'\'}"; }
remote() {
  local command arg
  command="bash -c $(shell_quote "$(declare -f remote_main); remote_main \"\$@\"") --"
  for arg in "$REMOTE_DIR" "$ASSET_DIR" "$STATE_DIR" "$@"; do
    command+=" $(shell_quote "$arg")"
  done
  ssh "$SSH_HOST" "$command"
}
remote_main() {
  set -Eeuo pipefail
  local root="$1" assets="$2" state="$3" action="$4" release="${5:-}" image="${6:-}" tag="${7:-}"
  local dir stage hash size name actual current previous target old_id target_id bootstrap
  fail() { echo "$*" >&2; exit 1; }
  mkdir -p "$state/releases"
  exec 9>"$state/lock"
  flock -x 9
  dir="$state/releases/$release"
  metadata_id() {
    local ref id
    [[ -f "$state/releases/$1/metadata" ]] || return 1
    ref="$(sed -n 's/^IMAGE_REF=//p' "$state/releases/$1/metadata")"
    id="$(sed -n 's/^IMAGE_ID=//p' "$state/releases/$1/metadata")"
    [[ "$id" =~ ^sha256:[a-f0-9]{64}$ && "$ref" == "$id" ]] || return 1
    [[ "$(docker image inspect --format '{{.Id}}' "$ref")" == "$id" ]] || return 1
    printf '%s' "$id"
  }
  compose() {
    IMAGE_REF="$1" ASSET_DIR="$assets" docker compose --project-directory "$root" \
      -f "$root/docker-compose.yml" -f "$root/docker-compose.deploy.yml" \
      up -d --pull never --no-build --no-deps frontend
  }
  origin() {
    IMAGE_REF="$(docker inspect --format '{{.Image}}' interpro-frontend)" ASSET_DIR="$assets" \
      docker compose --project-directory "$root" \
      -f "$root/docker-compose.yml" -f "$root/docker-compose.deploy.yml" \
      up -d --pull never --no-build --no-deps asset-origin
    [[ "$(docker inspect --format '{{.Config.Image}} {{.State.Running}}' interpro-asset-origin)" == \
      'nginx@sha256:a8b39bd9cf0f83869a2162827a0caf6137ddf759d50a171451b335cecc87d236 true' ]]
    docker exec interpro-asset-origin nginx -t >/dev/null
  }
  purge_cache() {
    docker exec nginx_proxy_manager sh -c 'find /var/lib/nginx/cache/public -type f -delete'
  }
  healthy() {
    local attempt check_hls="${2:-false}" probe
    probe='fetch("http://127.0.0.1:5027/", {redirect:"manual", signal:AbortSignal.timeout(5000)}).then(async r=>{await r.arrayBuffer(); process.exit(r.status===200?0:1)}).catch(()=>process.exit(1))'
    if [[ "$check_hls" == true ]]; then
      probe='Promise.all(["/", "/videos/hls/hero.m3u8"].map(path=>fetch(`http://127.0.0.1:5027${path}`, {redirect:"manual", signal:AbortSignal.timeout(5000)}).then(async r=>{await r.arrayBuffer(); if(r.status!==200) throw Error(path)}))).catch(()=>process.exit(1))'
    fi
    for attempt in {1..30}; do
      if [[ "$(docker inspect --format '{{.Image}} {{.State.Running}}' interpro-frontend 2>/dev/null)" == "$1 true" ]] &&
        docker exec interpro-frontend node -e "$probe" &&
        [[ "$(docker inspect --format '{{.Image}} {{.State.Running}}' interpro-frontend)" == "$1 true" ]]; then
        return 0
      fi
      sleep 2
    done
    return 1
  }
  case "$action" in
    reserve)
      mkdir "$dir" || fail "Release ID already reserved: $release"
      ;;
    assets)
      [[ -d "$dir" && ! -e "$dir/inventory" ]] || fail 'Invalid asset publication state'
      mkdir -p "$assets"
      # Sibling stage: not served, but on the same filesystem for atomic rename.
      stage="$(mktemp -d "${assets}.stage.XXXXXXXX")"
      trap 'rm -rf -- "$stage"' EXIT
      tar -xf - -C "$stage"
      [[ -s "$stage/inventory" ]] || fail 'Empty inventory'
      [[ "$(stat -c %d "$stage")" == "$(stat -c %d "$assets")" ]] || fail 'Stage and assets must share a filesystem'
      while IFS=$'\t' read -r hash size name; do
        [[ "$hash" =~ ^[a-f0-9]{64}$ && "$size" =~ ^[0-9]+$ && "$name" =~ ^[A-Za-z0-9_/-][A-Za-z0-9_./-]*$ && "$name" != /* && "/$name/" != *'/../'* && "/$name/" != *'/./'* ]] || fail 'Invalid inventory entry'
        [[ -f "$stage/assets/$name" && ! -L "$stage/assets/$name" ]] || fail 'Missing staged asset'
        actual="$(sha256sum "$stage/assets/$name")"
        [[ "${actual%% *}" == "$hash" && "$(stat -c %s "$stage/assets/$name")" == "$size" ]] || fail "Stage integrity: $name"
        # Reject symlink traversal in live storage, including parent directories.
        local parent="$assets/$name"
        while [[ "$parent" != / ]]; do
          [[ ! -L "$parent" ]] || fail "Symlink in asset path: $name"
          parent="$(dirname "$parent")"
        done
        if [[ -e "$assets/$name" ]]; then
          [[ -f "$assets/$name" ]] || fail "Asset collision: $name"
          actual="$(sha256sum "$assets/$name")"
          [[ "${actual%% *}" == "$hash" ]] || fail "Immutable asset collision: $name"
        fi
      done < "$stage/inventory"
      while IFS=$'\t' read -r hash size name; do
        mkdir -p "$(dirname "$assets/$name")"
        if [[ ! -e "$assets/$name" ]]; then
          chmod 644 "$stage/assets/$name"
          mv -T -- "$stage/assets/$name" "$assets/$name"
        fi
      done < "$stage/inventory"
      mv "$stage/inventory" "$dir/inventory"
      rm -rf -- "$stage"
      trap - EXIT
      ;;
    origin)
      origin || fail 'Asset origin failed validation'
      ;;
    load)
      [[ -f "$dir/inventory" && ! -e "$dir/ready" ]] || fail 'Invalid image publication state'
      [[ "$image" =~ ^sha256:[a-f0-9]{64}$ ]] || fail 'Invalid image ID'
      docker load >/dev/null
      [[ "$(docker image inspect --format '{{.Id}}' "$tag")" == "$image" ]] || fail 'Uploaded image identity mismatch'
      [[ "$(docker image inspect --format '{{.Id}}' "$image")" == "$image" ]] || fail 'Uploaded image missing'
      printf 'IMAGE_REF=%s\nIMAGE_ID=%s\n' "$image" "$image" > "$dir/metadata.tmp"
      mv "$dir/metadata.tmp" "$dir/metadata"
      # Called only after the local full-inventory CDN gate has succeeded.
      touch "$dir/ready"
      ;;
    deploy-server|rollback)
      if [[ ! -f "$state/state" ]]; then
        [[ "$action" != rollback ]] || fail 'No previous release recorded'
        old_id="$(docker inspect --format '{{.Image}}' interpro-frontend)"
        [[ "$old_id" =~ ^sha256:[a-f0-9]{64}$ ]] || fail 'Cannot bootstrap running image'
        healthy "$old_id" || fail 'Existing frontend is not healthy; bootstrap refused'
        bootstrap="bootstrap-$(date -u +%Y%m%dT%H%M%SZ)-${old_id#sha256:}"
        mkdir "$state/releases/$bootstrap"
        docker image tag "$old_id" "interpro-deploy-retained:$bootstrap"
        printf 'IMAGE_REF=%s\nIMAGE_ID=%s\n' "$old_id" "$old_id" > "$state/releases/$bootstrap/metadata"
        touch "$state/releases/$bootstrap/ready"
        printf '%s\n\n' "$bootstrap" > "$state/state.tmp"
        mv "$state/state.tmp" "$state/state"
      fi
      { read -r current; read -r previous; } < "$state/state"
      [[ "$current" =~ ^[A-Za-z0-9][A-Za-z0-9_.-]*$ ]] || fail 'Invalid current state'
      target="$release"
      [[ "$action" != rollback ]] || target="$previous"
      old_id="$(metadata_id "$current")" || fail 'Current image is not recoverable'
      [[ -f "$state/transaction" || "$(docker inspect --format '{{.Image}}' interpro-frontend)" == "$old_id" ]] || fail 'Running image differs from committed state'
      # Persist a recovery marker before switching, also protecting against SIGKILL
      # or SSH loss. A later invocation refuses a fresh switch until recovery.
      local recovery_state="$state"
      recover() {
        trap - EXIT HUP INT TERM
        # The atomic state rename is the commit point. If a signal arrives just
        # after it, recover the newly committed image, not the pre-switch image.
        read -r current < "$recovery_state/state"
        old_id="$(metadata_id "$current")" || { echo 'CRITICAL: committed image unavailable' >&2; exit 1; }
        if compose "$old_id" && healthy "$old_id" && purge_cache; then
          rm -f "$recovery_state/transaction"
          echo "Restored and verified previous release: $current" >&2
        else
          echo "CRITICAL: recovery or cache purge failed; retained transaction requires operator recovery to $old_id" >&2
        fi
        exit 1
      }
      trap recover EXIT
      trap 'exit 1' HUP INT TERM
      if [[ -f "$state/transaction" ]]; then
        echo 'Recovering interrupted transaction before any new switch' >&2
        exit 1
      fi
      [[ "$target" =~ ^[A-Za-z0-9][A-Za-z0-9_.-]*$ && "$target" != "$current" ]] || fail 'No distinct target release'
      [[ -f "$state/releases/$target/ready" ]] || fail 'Target is not ready'
      target_id="$(metadata_id "$target")" || fail 'Target image identity mismatch'
      printf '%s\n' "$current" > "$state/transaction"
      compose "$target_id"
      if [[ "$action" == deploy-server ]]; then
        healthy "$target_id" true || fail 'Candidate health or identity check failed'
      else
        healthy "$target_id" || fail 'Rollback health or identity check failed'
      fi
      # Cache purge is part of the transaction, not a cached public health check.
      purge_cache
      printf '%s\n%s\n' "$target" "$current" > "$state/state.tmp"
      mv "$state/state.tmp" "$state/state"
      trap - EXIT HUP INT TERM
      rm -f "$state/transaction"
      echo "Committed release: $target ($target_id)"
      ;;
    *) fail 'Unknown remote action' ;;
  esac
}

if [[ "$MODE" == dry-run ]]; then
  printf 'Release: %s\nBuild origin: %s\nAssets: %s:%s\nImage transport tag: %s:%s\n' "$RELEASE" "$CDN_ORIGIN" "$SSH_HOST" "$ASSET_DIR" "$IMAGE_REPOSITORY" "$RELEASE"
  echo 'Gate: full SHA256 inventory, MIME, CORS, HTTP 200 and Range 206.'
  echo 'Use --deploy for publish-and-switch or --publish-assets to stop before the switch.'
  exit 0
fi
if [[ "$MODE" == deploy-server || "$MODE" == rollback ]]; then
  remote "$MODE" "$RELEASE"
  exit 0
fi

lock_dir="$(git rev-parse --git-path interpro-deploy-publish.lock)"
mkdir "$lock_dir" || die 'Another asset publication is already running from this checkout'
work=""
cleanup_local() {
  local status=$?
  [[ -z "$work" ]] || rm -rf -- "$work"
  if [[ -n "$lock_dir" ]] && ! rmdir -- "$lock_dir"; then
    echo "Local publication lock remains: $lock_dir" >&2
  fi
  exit "$status"
}
trap cleanup_local EXIT
trap 'exit 1' HUP INT TERM

remote reserve "$RELEASE"
VITE_ASSET_BASE_URL="$ASSET_BASE_URL" npm run build
[[ -f build/server/index.js && -d build/client/assets ]] || die 'Missing build output'
work="$(mktemp -d)"
mkdir "$work/assets"
# Snapshot the complete inventory, not just manifest references. Reject paths
# needing URL escaping rather than silently probing a different CDN object.
node - "$work" <<'NODE'
const fs = require('fs'), path = require('path'), crypto = require('crypto');
const out = process.argv[2], inventory = [];
function walk(dir, prefix = '') {
  for (const entry of fs.readdirSync(dir, {withFileTypes:true}).sort((a,b)=>a.name.localeCompare(b.name))) {
    const name = prefix + entry.name, source = path.join(dir, entry.name);
    if (!/^[A-Za-z0-9_/-][A-Za-z0-9_./-]*$/.test(name) || name.split('/').some(x=>x==='.'||x==='..')) throw Error(`Unsafe asset path: ${name}`);
    if (entry.isDirectory()) walk(source, name + '/');
    else {
      if (!entry.isFile() || name.endsWith('.map')) throw Error(`Disallowed asset: ${name}`);
      const data = fs.readFileSync(source), dest = path.join(out, 'assets', name);
      fs.mkdirSync(path.dirname(dest), {recursive:true}); fs.writeFileSync(dest, data);
      inventory.push(`${crypto.createHash('sha256').update(data).digest('hex')}\t${data.length}\t${name}\n`);
    }
  }
}
walk('build/client/assets');
if (!inventory.length) throw Error('Empty asset inventory');
fs.writeFileSync(path.join(out, 'inventory'), inventory.join(''));
NODE
docker build --file Dockerfile.runtime --tag "$IMAGE_REPOSITORY:$RELEASE" .
image_id="$(docker image inspect --format '{{.Id}}' "$IMAGE_REPOSITORY:$RELEASE")"
[[ "$image_id" =~ ^sha256:[a-f0-9]{64}$ ]] || die 'Invalid local image ID'
tar -C "$work" -cf - inventory assets | remote assets "$RELEASE"
remote origin

header() {
  awk -v key="$1" 'tolower($0) ~ "^" key ":" {sub(/^[^:]*:[ \t]*/, ""); sub(/\r$/, ""); print tolower($0)}' "$work/headers"
}
check_headers() {
  local type
  [[ -z "$(header location)" ]] || die "CDN redirect: $name"
  [[ "$(header access-control-allow-origin)" == '*' ]] || die "CDN CORS: $name"
  type="$(header content-type)"; type="${type%%;*}"
  [[ "$type" =~ $expected ]] || die "CDN MIME '$type': $name"
}
while IFS=$'\t' read -r hash size name; do
  case "${name,,}" in
    *.js|*.mjs) expected='^(text|application)/(javascript|x-javascript)$' ;;
    *.css) expected='^text/css$' ;;
    *.woff) expected='^(font/woff|application/font-woff)$' ;;
    *.woff2) expected='^(font/woff2|application/font-woff2)$' ;;
    *.ttf) expected='^(font/ttf|application/x-font-ttf)$' ;;
    *.otf) expected='^(font/otf|application/x-font-opentype)$' ;;
    *.svg) expected='^image/svg\+xml$' ;;
    *.png) expected='^image/png$' ;;
    *.jpg|*.jpeg) expected='^image/jpeg$' ;;
    *.webp) expected='^image/webp$' ;;
    *.avif) expected='^image/avif$' ;;
    *.gif) expected='^image/gif$' ;;
    *.ico) expected='^image/(x-icon|vnd.microsoft.icon)$' ;;
    *.mp4) expected='^video/mp4$' ;;
    *.webm) expected='^video/webm$' ;;
    *.mp3) expected='^audio/mpeg$' ;;
    *.wav) expected='^audio/(wav|x-wav)$' ;;
    *.json) expected='^application/json$' ;;
    *.wasm) expected='^application/wasm$' ;;
    *) die "No MIME policy for inventory asset: $name" ;;
  esac
  url="$CDN_ORIGIN/assets/$name"
  # -q disables curlrc (in particular implicit --location); identity encoding
  # ensures the checksum is of the published bytes, not a compressed variant.
  status="$(curl -q --silent --show-error --connect-timeout 10 --max-time 120 \
    --header 'Accept-Encoding: identity' --header "Origin: $CDN_ORIGIN" \
    --dump-header "$work/headers" --output "$work/body" --write-out '%{http_code}' "$url")"
  [[ "$status" == 200 ]] || die "CDN full GET status $status: $name"
  check_headers
  actual="$(sha256sum "$work/body")"
  [[ "${actual%% *}" == "$hash" ]] || die "CDN SHA256 mismatch: $name"
  if ((size > 0)); then
    status="$(curl -q --silent --show-error --connect-timeout 10 --max-time 60 \
      --header 'Accept-Encoding: identity' --header "Origin: $CDN_ORIGIN" --range 0-0 \
      --dump-header "$work/headers" --output "$work/range" --write-out '%{http_code}' "$url")"
    [[ "$status" == 206 && "$(header content-range)" == "bytes 0-0/$size" && "$(wc -c < "$work/range")" -eq 1 ]] || die "CDN Range check failed: $name"
    check_headers
  fi
done < "$work/inventory"
docker save "$image_id" "$IMAGE_REPOSITORY:$RELEASE" | remote load "$RELEASE" "$image_id" "$IMAGE_REPOSITORY:$RELEASE"
if [[ "$MODE" == deploy ]]; then
  remote deploy-server "$RELEASE"
  printf 'Deployed release: %s\nIMAGE_REF=%s\n' "$RELEASE" "$image_id"
  exit 0
fi
printf 'Ready release: %s\nIMAGE_REF=%s\nDeploy: scripts/deploy.sh --deploy-server %s\n' "$RELEASE" "$image_id" "$RELEASE"
