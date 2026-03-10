# video_3 — HLS и обложки

## Конвертация из video-3.mp4

**Требуется:** [ffmpeg](https://ffmpeg.org/)
- Windows: `winget install ffmpeg` или `choco install ffmpeg`
- macOS: `brew install ffmpeg`
- Linux: `apt install ffmpeg`

### Команда (из корня проекта)

**Windows PowerShell:**
```powershell
npm run convert-video-3
# или
pwsh -File scripts/convert-video-3.ps1
```

**Linux/macOS:**
```bash
chmod +x scripts/convert-video-3.sh
./scripts/convert-video-3.sh
```

### Результат

1. **public/videos/video_3/hls/** — HLS для desktop (`video.m3u8`) и mobile (`video_mobile.m3u8`), **без аудио**
2. **app/assets/videos/video_3/cover.jpg** — обложка для desktop
3. **app/assets/videos/video_3/cover_mobile.jpg** — обложка для mobile (375px)
