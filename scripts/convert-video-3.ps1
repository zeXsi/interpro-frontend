# Конвертация video_3.mov в HLS (desktop + mobile) без аудио + создание обложек
# Требуется: ffmpeg (установить: winget install ffmpeg  или choco install ffmpeg)

$ErrorActionPreference = "Stop"
$projectRoot = Split-Path -Parent (Split-Path -Parent $PSScriptRoot)
$srcVideo = Join-Path $projectRoot "app\assets\videos\video_3\video_3.mov"
if (-not (Test-Path $srcVideo)) { $srcVideo = Join-Path $projectRoot "app\assets\videos\video_3\video-3.mp4" }
$hlsDir = Join-Path $projectRoot "public\videos\video_3\hls"
$assetsDir = Join-Path $projectRoot "app\assets\videos\video_3"

if (-not (Test-Path $srcVideo)) { Write-Error "Исходное видео не найдено (ожидается video_3.mov или video-3.mp4)" }

# Создаём директории
New-Item -ItemType Directory -Force -Path $hlsDir | Out-Null

Write-Host "1. Конвертация в HLS (desktop, без аудио)..."
Push-Location $hlsDir
ffmpeg -y -i $srcVideo `
    -an `
    -c:v libx264 `
    -preset medium `
    -crf 23 `
    -hls_time 6 `
    -hls_playlist_type vod `
    -hls_segment_filename "video_%03d.ts" `
    -start_number 0 `
    video.m3u8
if ($LASTEXITCODE -ne 0) { Pop-Location; throw "Ошибка конвертации desktop" }
Pop-Location

Write-Host "2. Конвертация в HLS (mobile 375px, без аудио)..."
Push-Location $hlsDir
ffmpeg -y -i $srcVideo `
    -an `
    -vf "scale=376:-2" `
    -c:v libx264 `
    -preset medium `
    -crf 23 `
    -hls_time 6 `
    -hls_playlist_type vod `
    -hls_segment_filename "video_mobile_%03d.ts" `
    -start_number 0 `
    video_mobile.m3u8
if ($LASTEXITCODE -ne 0) { Pop-Location; throw "Ошибка конвертации mobile" }
Pop-Location

$coverPath = Join-Path $assetsDir "cover.jpg"
$coverMobilePath = Join-Path $assetsDir "cover_mobile.jpg"

Write-Host "3. Создание cover.jpg (кадр на 1 сек)..."
ffmpeg -y -i $srcVideo `
    -ss 00:00:01 `
    -vframes 1 `
    -q:v 2 `
    $coverPath
if ($LASTEXITCODE -ne 0) { throw "Ошибка создания cover" }

Write-Host "4. Создание cover_mobile.jpg..."
ffmpeg -y -i $srcVideo `
    -ss 00:00:01 `
    -vframes 1 `
    -vf "scale=376:-2" `
    -q:v 2 `
    $coverMobilePath
if ($LASTEXITCODE -ne 0) { throw "Ошибка создания cover_mobile" }

Write-Host "Готово! video_3 конвертирован в HLS (без музыки) + созданы обложки."
