import './styles.css';
import { memo, useEffect, useRef, useState } from 'react';

export interface VideoSource<T extends string> {
  src: string;
  type: 'video/mp4' | 'video/mov' | 'video/webm' | 'application/x-mpegURL' | T;
  cover?: string;
}

interface VideoHeroProps<T extends string = any> {
  videoSources: VideoSource<T>[];
  className?: string;
  videoClassName?: string;
  autoPlay?: boolean;
  muted?: boolean;
  loop?: boolean;
  playsInline?: boolean;
  cover?: string;
  preload?: 'auto' | 'metadata' | 'none';
  onError?: (error: Error) => void;
}

const VideoPlayer = ({
  videoSources,
  className = '',
  videoClassName = 'Hero-bg',
  autoPlay = true,
  muted = true,
  loop = true,
  playsInline = true,
  cover,
  preload = 'auto',
  onError,
}: VideoHeroProps) => {
  const refVideo = useRef<HTMLVideoElement>(null);
  const hlsRef = useRef<import('hls.js').default | null>(null);
  const [isVideoReady, setIsVideoReady] = useState(false);

  const updateSources = async () => {
    const video = refVideo.current;
    if (!video) return;

    // Очистка предыдущего HLS инстанса
    if (hlsRef.current) {
      hlsRef.current.destroy();
      hlsRef.current = null;
    }

    // Проверяем, есть ли HLS источник
    const hlsSource = videoSources.find(
      (source) => source.type === 'application/x-mpegURL' || source.src.endsWith('.m3u8')
    );

    if (hlsSource) {
      // Safari умеет HLS нативно — hls.js ему вообще не нужен.
      if (video.canPlayType('application/vnd.apple.mpegurl')) {
        video.src = hlsSource.src;
        video.addEventListener(
          'loadedmetadata',
          () => {
            setIsVideoReady(true);
            if (autoPlay) {
              playVideo();
            }
          },
          { once: true }
        );
      } else {
        // На остальных браузерах подгружаем hls.js только когда HLS-видео
        // действительно дошло до загрузки (MediaSection делает это по IntersectionObserver).
        const { default: Hls } = await import('hls.js');
        if (!refVideo.current || refVideo.current !== video || !Hls.isSupported()) return;

        const hls = new Hls({
          enableWorker: true,
          startFragPrefetch: true,
          testBandwidth: true,
          maxBufferLength: 30,
          maxMaxBufferLength: 60,
          backBufferLength: 30,
          maxBufferHole: 0.5,
          capLevelToPlayerSize: true,
          lowLatencyMode: false,
        });

        hlsRef.current = hls;

        hls.loadSource(hlsSource.src);
        hls.attachMedia(video);

        hls.on(Hls.Events.MEDIA_ATTACHED, () => {
          setIsVideoReady(true);
          if (autoPlay) playVideo();
        });

        hls.on(Hls.Events.ERROR, (_event, data) => {
          console.error('HLS ошибка:', data);
          if (data.fatal) {
            switch (data.type) {
              case Hls.ErrorTypes.NETWORK_ERROR:
                console.error('Фатальная сетевая ошибка');
                hls.startLoad();
                break;
              case Hls.ErrorTypes.MEDIA_ERROR:
                console.error('Фатальная медиа ошибка');
                hls.recoverMediaError();
                break;
              default:
                console.error('Невосстановимая ошибка');
                hls.destroy();
                break;
            }
          }
          if (onError) {
            onError(new Error(data.details));
          }
        });
      }
    } else {
      // Обычные видео форматы (mp4, webm, mov)
      while (video.firstChild) {
        video.removeChild(video.firstChild);
      }

      videoSources.forEach((source) => {
        const sourceElement = document.createElement('source');
        sourceElement.src = source.src;
        sourceElement.type = source.type;
        video.appendChild(sourceElement);
      });

      video.load();
    }
  };

  const playVideo = async () => {
    const video = refVideo.current;
    if (!video) return;

    try {
      await video.play();
      setIsVideoReady(true);
    } catch (error) {
      console.error('Ошибка автозапуска видео:', error);
      if (onError && error instanceof Error) {
        onError(error);
      }
      setIsVideoReady(false);
    }
  };

  // const handleVideoClick = () => {
  //   const video = refVideo.current;
  //   if (!video) return;

  //   if (video.paused || !isVideoReady) {
  //     void updateSources();
  //     playVideo();
  //   }
  // };

  useEffect(() => {
    const video = refVideo.current;
    if (!video) return;

    const handleCanPlay = () => {
      setIsVideoReady(true);
      playVideo();
    };

    updateSources();

    // Добавляем обработчик только для не-HLS видео
    const hasHlsSource = videoSources.some(
      (source) => source.type === 'application/x-mpegURL' || source.src.endsWith('.m3u8')
    );

    if (!hasHlsSource) {
      video.addEventListener('canplay', handleCanPlay);
    }

    return () => {
      video.removeEventListener('canplay', handleCanPlay);
      // Очистка HLS при размонтировании
      if (hlsRef.current) {
        hlsRef.current.destroy();
        hlsRef.current = null;
      }
    };
  }, [onError, videoSources]);

  return (
    <div className={`VideoPlayer ${className}`}>
      <video
        ref={refVideo}
        poster={cover}
        className={`VideoPlayer-video ${videoClassName}`}
        autoPlay={autoPlay}
        muted={muted}
        loop={loop}
        playsInline={playsInline}
        preload={preload}
        data-video-src={videoSources[0]?.src}
        // onClick={handleVideoClick}
      >
        {/* {videoSources.map((source, index) => (
          <source key={index} src={source.src} type={source.type} />
        ))} */}
        Ваш браузер не поддерживает видео.
      </video>
    </div>
  );
};

const arePropsEqual = (prevProps: VideoHeroProps, nextProps: VideoHeroProps) => {
  if (prevProps.videoSources.length !== nextProps.videoSources.length) {
    return false;
  }

  return prevProps.videoSources.every((prevSource, index) => {
    return prevSource.src === nextProps.videoSources[index].src;
  });
};

export default memo(VideoPlayer, arePropsEqual);
