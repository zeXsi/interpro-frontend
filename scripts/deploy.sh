#!/usr/bin/env bash
set -Eeuo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd -P)"
ASSET_DIR="${DEPLOY_ASSET_DIR:-/srv/interpro-assets}"
CDN_ORIGIN="${DEPLOY_CDN_ORIGIN:-https://cdn.interpro.pro}"
ASSET_BASE_URL="${VITE_ASSET_BASE_URL:-$CDN_ORIGIN}"
IMAGE_REPOSITORY="${DEPLOY_IMAGE:-interpro-frontend}"
STATE_DIR="${DEPLOY_STATE_DIR:-$ROOT_DIR/.deploy}"
MODE=""
RELEASE=""
WORK_DIR=""
STAGE_DIR=""
BUILD_CONTAINER=""

die() { echo "$*" >&2; exit 1; }

usage() {
  cat <<'EOF'
Usage:
  scripts/deploy.sh --dry-run [--tag RELEASE_ID]
  scripts/deploy.sh --deploy [--tag RELEASE_ID]
  scripts/deploy.sh --rollback

Run this script on the production server from its Git checkout. Deploy installs
dependencies, builds the application and runtime image on the server, publishes
and verifies CDN assets, then switches the frontend container. Rollback switches
to the previously committed release. Both operations are serialized with flock.

The checkout must have no tracked changes. Update it explicitly before deploy:
  git pull --ff-only origin dev
  npm run deploy:prod
EOF
}

while (($#)); do
  case "$1" in
    --dry-run|--deploy|--rollback)
      [[ -z "$MODE" ]] || die 'Specify exactly one mode'
      MODE="${1#--}"
      shift
      ;;
    --tag)
      [[ $# -ge 2 && -z "$RELEASE" ]] || die 'Specify one release ID'
      RELEASE="$2"
      shift 2
      ;;
    -h|--help)
      usage
      exit 0
      ;;
    *) die "Unknown argument: $1" ;;
  esac
done

[[ -n "$MODE" ]] || { usage >&2; exit 2; }
[[ "$MODE" != rollback || -z "$RELEASE" ]] || die 'Rollback does not take a release ID'
[[ "$CDN_ORIGIN" =~ ^https://[a-z0-9]([a-z0-9.-]*[a-z0-9])?(:[0-9]+)?$ ]] || die 'Invalid canonical DEPLOY_CDN_ORIGIN'
[[ "$ASSET_BASE_URL" == "$CDN_ORIGIN" ]] || die 'VITE_ASSET_BASE_URL must equal DEPLOY_CDN_ORIGIN'
for path in "$ROOT_DIR" "$ASSET_DIR" "$STATE_DIR"; do
  [[ "$path" == /* && "$path" != / && "$path" != *$'\n'* ]] || die 'Deploy directories must be absolute non-root paths'
done

cd "$ROOT_DIR"
GIT_ROOT="$(cd "$(git rev-parse --show-toplevel)" && pwd -P)"
[[ "$GIT_ROOT" == "$ROOT_DIR" ]] || die 'Deploy script must be inside the production Git checkout'

if [[ -z "$RELEASE" && "$MODE" != rollback ]]; then
  RANDOM_SUFFIX="$(od -An -N6 -tx1 /dev/urandom | tr -d ' \n')"
  RELEASE="$(git rev-parse --short=12 HEAD)-$(date -u +%Y%m%dT%H%M%SZ)-$RANDOM_SUFFIX"
fi
[[ -z "$RELEASE" || "$RELEASE" =~ ^[A-Za-z0-9][A-Za-z0-9_.-]{0,100}$ ]] || die 'Invalid release ID'

if [[ "$MODE" == dry-run ]]; then
  printf 'Checkout: %s\nCommit: %s\nRelease: %s\nAssets: %s\nCDN: %s\nImage tag: %s:%s\n' \
    "$ROOT_DIR" "$(git rev-parse HEAD)" "$RELEASE" "$ASSET_DIR" "$CDN_ORIGIN" "$IMAGE_REPOSITORY" "$RELEASE"
  echo 'Run on the production server after: git pull --ff-only origin dev'
  exit 0
fi

for command in git docker curl sha256sum awk flock stat find sort od tr; do
  command -v "$command" >/dev/null || die "Required command is missing: $command"
done
docker compose version >/dev/null || die 'Docker Compose is unavailable'
docker info >/dev/null || die 'Docker daemon is unavailable'

mkdir -p "$STATE_DIR/releases"
exec 9>"$STATE_DIR/lock"
flock -n 9 || die 'Another production deploy or rollback is already running'

cleanup_resources() {
  [[ -z "$WORK_DIR" ]] || rm -rf -- "$WORK_DIR"
  [[ -z "$STAGE_DIR" ]] || rm -rf -- "$STAGE_DIR"
  [[ -z "$BUILD_CONTAINER" ]] || docker rm -f "$BUILD_CONTAINER" >/dev/null 2>&1 || true
}

cleanup() {
  local status=$?
  cleanup_resources
  exit "$status"
}
trap cleanup EXIT
trap 'exit 1' HUP INT TERM

metadata_id() {
  local release="$1" ref id
  [[ -f "$STATE_DIR/releases/$release/metadata" ]] || return 1
  ref="$(sed -n 's/^IMAGE_REF=//p' "$STATE_DIR/releases/$release/metadata")"
  id="$(sed -n 's/^IMAGE_ID=//p' "$STATE_DIR/releases/$release/metadata")"
  [[ "$id" =~ ^sha256:[a-f0-9]{64}$ && "$ref" == "$id" ]] || return 1
  [[ "$(docker image inspect --format '{{.Id}}' "$ref")" == "$id" ]] || return 1
  printf '%s' "$id"
}

compose_frontend() {
  IMAGE_REF="$1" ASSET_DIR="$ASSET_DIR" docker compose --project-directory "$ROOT_DIR" \
    -f "$ROOT_DIR/docker-compose.yml" -f "$ROOT_DIR/docker-compose.deploy.yml" \
    up -d --pull never --no-build --no-deps frontend
}

ensure_playwright() {
  local attempt status container_id current_image
  current_image="$(docker inspect --format '{{.Image}}' interpro-frontend)"
  IMAGE_REF="$current_image" ASSET_DIR="$ASSET_DIR" docker compose --project-directory "$ROOT_DIR" \
    -f "$ROOT_DIR/docker-compose.yml" -f "$ROOT_DIR/docker-compose.deploy.yml" \
    up -d --build playwright
  for attempt in {1..30}; do
    container_id="$(IMAGE_REF="$current_image" ASSET_DIR="$ASSET_DIR" docker compose --project-directory "$ROOT_DIR" \
      -f "$ROOT_DIR/docker-compose.yml" -f "$ROOT_DIR/docker-compose.deploy.yml" ps -q playwright)"
    status="$(docker inspect --format '{{if .State.Health}}{{.State.Health.Status}}{{else}}{{.State.Status}}{{end}}' "$container_id" 2>/dev/null || true)"
    [[ "$status" == healthy ]] && return 0
    sleep 2
  done
  return 1
}

start_asset_origin() {
  local current_image
  current_image="$(docker inspect --format '{{.Image}}' interpro-frontend)"
  IMAGE_REF="$current_image" ASSET_DIR="$ASSET_DIR" docker compose --project-directory "$ROOT_DIR" \
    -f "$ROOT_DIR/docker-compose.yml" -f "$ROOT_DIR/docker-compose.deploy.yml" \
    up -d --pull never --no-build --no-deps asset-origin
  [[ "$(docker inspect --format '{{.Config.Image}} {{.State.Running}}' interpro-asset-origin)" == \
    'nginx@sha256:a8b39bd9cf0f83869a2162827a0caf6137ddf759d50a171451b335cecc87d236 true' ]]
  docker exec interpro-asset-origin nginx -t >/dev/null
}

purge_cache() {
  docker exec nginx_proxy_manager sh -c 'find /var/lib/nginx/cache/public -type f -delete'
}

healthy() {
  local image_id="$1" check_hls="${2:-false}" attempt probe
  probe='fetch("http://127.0.0.1:5027/", {redirect:"manual", signal:AbortSignal.timeout(5000)}).then(async r=>{await r.arrayBuffer(); process.exit(r.status===200?0:1)}).catch(()=>process.exit(1))'
  if [[ "$check_hls" == true ]]; then
    probe='Promise.all(["/", "/videos/hls/hero.m3u8"].map(path=>fetch(`http://127.0.0.1:5027${path}`, {redirect:"manual", signal:AbortSignal.timeout(5000)}).then(async r=>{await r.arrayBuffer(); if(r.status!==200) throw Error(path)}))).catch(()=>process.exit(1))'
  fi
  for attempt in {1..30}; do
    if [[ "$(docker inspect --format '{{.Image}} {{.State.Running}}' interpro-frontend 2>/dev/null)" == "$image_id true" ]] &&
      docker exec interpro-frontend node -e "$probe" &&
      [[ "$(docker inspect --format '{{.Image}} {{.State.Running}}' interpro-frontend)" == "$image_id true" ]]; then
      return 0
    fi
    sleep 2
  done
  return 1
}

bootstrap_state() {
  local image_id bootstrap
  [[ -f "$STATE_DIR/state" ]] && return
  image_id="$(docker inspect --format '{{.Image}}' interpro-frontend)"
  [[ "$image_id" =~ ^sha256:[a-f0-9]{64}$ ]] || die 'Cannot bootstrap the running frontend image'
  healthy "$image_id" || die 'Existing frontend is not healthy; bootstrap refused'
  bootstrap="bootstrap-$(date -u +%Y%m%dT%H%M%SZ)-${image_id#sha256:}"
  mkdir "$STATE_DIR/releases/$bootstrap"
  docker image tag "$image_id" "interpro-deploy-retained:$bootstrap"
  printf 'IMAGE_REF=%s\nIMAGE_ID=%s\n' "$image_id" "$image_id" > "$STATE_DIR/releases/$bootstrap/metadata"
  touch "$STATE_DIR/releases/$bootstrap/ready"
  printf '%s\n\n' "$bootstrap" > "$STATE_DIR/state.tmp"
  mv "$STATE_DIR/state.tmp" "$STATE_DIR/state"
}

recover_committed_state() {
  local current old_id
  trap - EXIT HUP INT TERM
  if ! read -r current < "$STATE_DIR/state" || [[ ! "$current" =~ ^[A-Za-z0-9][A-Za-z0-9_.-]*$ ]]; then
    echo 'CRITICAL: deployment state is unavailable during recovery' >&2
    cleanup_resources
    exit 1
  fi
  old_id="$(metadata_id "$current")" || {
    echo 'CRITICAL: committed image is unavailable during recovery' >&2
    cleanup_resources
    exit 1
  }
  if compose_frontend "$old_id" && healthy "$old_id" && purge_cache; then
    rm -f "$STATE_DIR/transaction"
    echo "Restored and verified committed release: $current" >&2
  else
    echo "CRITICAL: recovery failed; restore image $old_id manually" >&2
  fi
  cleanup_resources
  exit 1
}

if [[ -f "$STATE_DIR/transaction" ]]; then
  echo 'Recovering interrupted transaction before starting new work' >&2
  recover_committed_state
fi

switch_release() {
  local target="$1" check_hls="$2" current previous old_id target_id
  bootstrap_state
  { read -r current; read -r previous; } < "$STATE_DIR/state"
  [[ "$current" =~ ^[A-Za-z0-9][A-Za-z0-9_.-]*$ ]] || die 'Invalid current deployment state'
  old_id="$(metadata_id "$current")" || die 'Current image is not recoverable'
  [[ -f "$STATE_DIR/transaction" || "$(docker inspect --format '{{.Image}}' interpro-frontend)" == "$old_id" ]] || \
    die 'Running image differs from committed deployment state'

  [[ "$target" =~ ^[A-Za-z0-9][A-Za-z0-9_.-]*$ && "$target" != "$current" ]] || die 'No distinct target release'
  [[ -f "$STATE_DIR/releases/$target/ready" ]] || die 'Target release is not ready'
  target_id="$(metadata_id "$target")" || die 'Target image identity mismatch'
  printf '%s\n' "$current" > "$STATE_DIR/transaction"
  trap recover_committed_state EXIT
  trap 'exit 1' HUP INT TERM
  compose_frontend "$target_id"
  healthy "$target_id" "$check_hls" || die 'Candidate health or identity check failed'
  purge_cache
  printf '%s\n%s\n' "$target" "$current" > "$STATE_DIR/state.tmp"
  mv "$STATE_DIR/state.tmp" "$STATE_DIR/state"
  trap cleanup EXIT
  trap 'exit 1' HUP INT TERM
  rm -f "$STATE_DIR/transaction"
  echo "Committed release: $target ($target_id)"
}

if [[ "$MODE" == rollback ]]; then
  bootstrap_state
  { read -r current_release; read -r previous_release; } < "$STATE_DIR/state"
  [[ -n "$previous_release" ]] || die 'No previous release recorded'
  switch_release "$previous_release" false
  exit 0
fi

[[ -z "$(git status --porcelain --untracked-files=normal --ignore-submodules=none)" ]] || \
  die 'Working tree must be clean before deploy'
release_dir="$STATE_DIR/releases/$RELEASE"
mkdir "$release_dir" || die "Release ID already reserved: $RELEASE"

echo "Deploying commit $(git rev-parse HEAD) as $RELEASE"
docker build --build-arg "VITE_ASSET_BASE_URL=$ASSET_BASE_URL" \
  --file Dockerfile.runtime --tag "$IMAGE_REPOSITORY:$RELEASE" .
image_id="$(docker image inspect --format '{{.Id}}' "$IMAGE_REPOSITORY:$RELEASE")"
[[ "$image_id" =~ ^sha256:[a-f0-9]{64}$ ]] || die 'Invalid runtime image ID'

WORK_DIR="$(mktemp -d)"
mkdir "$WORK_DIR/assets"
BUILD_CONTAINER="$(docker create "$image_id")"
docker cp "$BUILD_CONTAINER:/app/public/assets/." "$WORK_DIR/assets/"
docker rm "$BUILD_CONTAINER" >/dev/null
BUILD_CONTAINER=""
[[ -z "$(find "$WORK_DIR/assets" -type l -print -quit)" ]] || die 'Symlinks are not allowed in build assets'
: > "$WORK_DIR/inventory"
while IFS= read -r -d '' source; do
  name="${source#"$WORK_DIR/assets/"}"
  [[ "$name" =~ ^[A-Za-z0-9_/-][A-Za-z0-9_./-]*$ && "/$name/" != *'/../'* && "/$name/" != *'/./'* && "$name" != *.map ]] || die "Unsafe build asset path: $name"
  actual="$(sha256sum "$source")"
  printf '%s\t%s\t%s\n' "${actual%% *}" "$(stat -c %s "$source")" "$name" >> "$WORK_DIR/inventory"
done < <(find "$WORK_DIR/assets" -type f -print0 | sort -z)
[[ -s "$WORK_DIR/inventory" ]] || die 'Empty asset inventory'

mkdir -p "$ASSET_DIR"
STAGE_DIR="$(mktemp -d "${ASSET_DIR}.stage.XXXXXXXX")"
cp -a "$WORK_DIR/assets" "$WORK_DIR/inventory" "$STAGE_DIR/"
[[ "$(stat -c %d "$STAGE_DIR")" == "$(stat -c %d "$ASSET_DIR")" ]] || die 'Asset stage and destination must share a filesystem'
while IFS=$'\t' read -r hash size name; do
  [[ "$hash" =~ ^[a-f0-9]{64}$ && "$size" =~ ^[0-9]+$ && "$name" =~ ^[A-Za-z0-9_/-][A-Za-z0-9_./-]*$ && "$name" != /* && "/$name/" != *'/../'* && "/$name/" != *'/./'* ]] || die 'Invalid inventory entry'
  [[ -f "$STAGE_DIR/assets/$name" && ! -L "$STAGE_DIR/assets/$name" ]] || die "Missing staged asset: $name"
  actual="$(sha256sum "$STAGE_DIR/assets/$name")"
  [[ "${actual%% *}" == "$hash" && "$(stat -c %s "$STAGE_DIR/assets/$name")" == "$size" ]] || die "Stage integrity failure: $name"
  parent="$ASSET_DIR/$name"
  while [[ "$parent" != / ]]; do
    [[ ! -L "$parent" ]] || die "Symlink in asset path: $name"
    parent="$(dirname "$parent")"
  done
  if [[ -e "$ASSET_DIR/$name" ]]; then
    [[ -f "$ASSET_DIR/$name" ]] || die "Asset collision: $name"
    actual="$(sha256sum "$ASSET_DIR/$name")"
    [[ "${actual%% *}" == "$hash" ]] || die "Immutable asset collision: $name"
  fi
done < "$STAGE_DIR/inventory"
while IFS=$'\t' read -r hash size name; do
  mkdir -p "$(dirname "$ASSET_DIR/$name")"
  if [[ ! -e "$ASSET_DIR/$name" ]]; then
    chmod 644 "$STAGE_DIR/assets/$name"
    mv -T -- "$STAGE_DIR/assets/$name" "$ASSET_DIR/$name"
  fi
done < "$STAGE_DIR/inventory"
mv "$STAGE_DIR/inventory" "$release_dir/inventory"
rm -rf -- "$STAGE_DIR"
STAGE_DIR=""

start_asset_origin || die 'Asset origin failed validation'

header() {
  awk -v key="$1" 'tolower($0) ~ "^" key ":" {sub(/^[^:]*:[ \t]*/, ""); sub(/\r$/, ""); print tolower($0)}' "$WORK_DIR/headers"
}

check_headers() {
  local type
  [[ -z "$(header location)" ]] || die "CDN redirect: $name"
  [[ "$(header access-control-allow-origin)" == '*' ]] || die "CDN CORS: $name"
  type="$(header content-type)"
  type="${type%%;*}"
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
  status="$(curl -q --silent --show-error --connect-timeout 10 --max-time 120 \
    --header 'Accept-Encoding: identity' --header "Origin: $CDN_ORIGIN" \
    --dump-header "$WORK_DIR/headers" --output "$WORK_DIR/body" --write-out '%{http_code}' "$url")"
  [[ "$status" == 200 ]] || die "CDN full GET status $status: $name"
  check_headers
  actual="$(sha256sum "$WORK_DIR/body")"
  [[ "${actual%% *}" == "$hash" ]] || die "CDN SHA256 mismatch: $name"
  if ((size > 0)); then
    status="$(curl -q --silent --show-error --connect-timeout 10 --max-time 60 \
      --header 'Accept-Encoding: identity' --header "Origin: $CDN_ORIGIN" --range 0-0 \
      --dump-header "$WORK_DIR/headers" --output "$WORK_DIR/range" --write-out '%{http_code}' "$url")"
    [[ "$status" == 206 && "$(header content-range)" == "bytes 0-0/$size" && "$(wc -c < "$WORK_DIR/range")" -eq 1 ]] || die "CDN Range check failed: $name"
    check_headers
  fi
done < "$release_dir/inventory"

[[ "$(docker image inspect --format '{{.Id}}' "$image_id")" == "$image_id" ]] || die 'Runtime image disappeared before commit'
printf 'IMAGE_REF=%s\nIMAGE_ID=%s\nGIT_COMMIT=%s\n' "$image_id" "$image_id" "$(git rev-parse HEAD)" > "$release_dir/metadata.tmp"
mv "$release_dir/metadata.tmp" "$release_dir/metadata"
touch "$release_dir/ready"
ensure_playwright || die 'Playwright service failed its health check'
switch_release "$RELEASE" true
printf 'Deployed release: %s\nIMAGE_REF=%s\n' "$RELEASE" "$image_id"
