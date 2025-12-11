import './styles.css';
import { memo, useEffect, useRef, useState } from 'react';

export interface VideoSource<T extends string> {
  src: string;
  type: 'video/mp4' | 'video/mov' | 'video/webm' | T;
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
  const [isVideoReady, setIsVideoReady] = useState(false);

  const updateSources = () => {
    const video = refVideo.current;
    if (!video) return;

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

  const handleVideoClick = () => {
    const video = refVideo.current;
    if (!video) return;

    if (video.paused || !isVideoReady) {
      updateSources();
      playVideo();
    }
  };

  useEffect(() => {
    const video = refVideo.current;
    if (!video) return;

    const handleCanPlay = () => {
      setIsVideoReady(true);
      playVideo();
    };

    updateSources();
    video.addEventListener('canplay', handleCanPlay);

    return () => {
      video.removeEventListener('canplay', handleCanPlay);
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
        onClick={handleVideoClick}
      >
        {videoSources.map((source, index) => (
          <source key={index} src={source.src} type={source.type} />
        ))}
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
