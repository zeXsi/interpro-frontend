#!/bin/bash
# Конвертация video_3.mov в HLS (desktop + mobile) без аудио + создание обложек
# Требуется: ffmpeg (apt install ffmpeg / brew install ffmpeg)

set -e
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
# Поддержка video_3.mov или video-3.mp4
SRC_VIDEO="$PROJECT_ROOT/app/assets/videos/video_3/video_3.mov"
[[ -f "$SRC_VIDEO" ]] || SRC_VIDEO="$PROJECT_ROOT/app/assets/videos/video_3/video-3.mp4"
HLS_DIR="$PROJECT_ROOT/public/videos/video_3/hls"
ASSETS_DIR="$PROJECT_ROOT/app/assets/videos/video_3"

[[ -f "$SRC_VIDEO" ]] || { echo "Исходное видео не найдено: $SRC_VIDEO"; exit 1; }
mkdir -p "$HLS_DIR"

echo "1. Конвертация в HLS (desktop, без аудио)..."
cd "$HLS_DIR"
ffmpeg -y -i "$SRC_VIDEO" \
  -an \
  -c:v libx264 \
  -preset medium \
  -crf 23 \
  -hls_time 6 \
  -hls_playlist_type vod \
  -hls_segment_filename "video_%03d.ts" \
  -start_number 0 \
  video.m3u8

echo "2. Конвертация в HLS (mobile 375px, без аудио)..."
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

echo "3. Создание cover.jpg..."
ffmpeg -y -i "$SRC_VIDEO" \
  -ss 00:00:01 \
  -vframes 1 \
  -q:v 2 \
  "$ASSETS_DIR/cover.jpg"

echo "4. Создание cover_mobile.jpg..."
ffmpeg -y -i "$SRC_VIDEO" \
  -ss 00:00:01 \
  -vframes 1 \
  -vf "scale=376:-2" \
  -q:v 2 \
  "$ASSETS_DIR/cover_mobile.jpg"

echo "Готово! video_3 конвертирован в HLS (без музыки) + созданы обложки."
