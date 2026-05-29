#!/bin/bash
# Convert video_4 to HLS (desktop + mobile) without audio and create covers.
# Requires: ffmpeg (apt install ffmpeg / brew install ffmpeg)

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
ASSETS_DIR="$PROJECT_ROOT/app/assets/videos/video_4"
HLS_DIR="$PROJECT_ROOT/public/videos/video_4/hls"
SRC_VIDEO="$(find "$ASSETS_DIR" -maxdepth 1 -type f -iname '*.mp4' | head -n 1)"

[[ -f "$SRC_VIDEO" ]] || { echo "Source video not found in: $ASSETS_DIR"; exit 1; }

mkdir -p "$HLS_DIR"

echo "1. Convert to HLS (desktop 1920px, no audio)..."
cd "$HLS_DIR"
ffmpeg -y -i "$SRC_VIDEO" \
  -an \
  -vf "scale=1920:-2" \
  -c:v libx264 \
  -preset medium \
  -crf 23 \
  -hls_time 6 \
  -hls_playlist_type vod \
  -hls_segment_filename "video_%03d.ts" \
  -start_number 0 \
  video.m3u8

echo "2. Convert to HLS (mobile 376px, no audio)..."
ffmpeg -y -i "$SRC_VIDEO" \
  -an \
  -vf "scale=376:-2" \
  -c:v libx264 \
  -preset medium \
  -crf 23 \
  -hls_time 6 \
  -hls_playlist_type vod \
  -hls_segment_filename "video_mobile_%03d.ts" \
  -start_number 0 \
  video_mobile.m3u8

cd "$PROJECT_ROOT"

echo "3. Create cover.jpg..."
ffmpeg -y -i "$SRC_VIDEO" \
  -ss 00:00:01 \
  -vframes 1 \
  -vf "scale=1920:-2" \
  -q:v 2 \
  "$ASSETS_DIR/cover.jpg"

echo "4. Create cover_mobile.jpg..."
ffmpeg -y -i "$SRC_VIDEO" \
  -ss 00:00:01 \
  -vframes 1 \
  -vf "scale=376:-2" \
  -q:v 2 \
  "$ASSETS_DIR/cover_mobile.jpg"

echo "Done. video_4 converted to HLS and covers were created."
