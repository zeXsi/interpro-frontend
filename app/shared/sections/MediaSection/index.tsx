import { memo, useEffect, useRef, useState } from 'react';
import './styles.css';
import VideoPlayer, { VideoSource } from 'shared/components/VideoPlayer';

interface Props {
  source: VideoSource<'img'>;
  aspectRation?: string;
  subtitle?: string;
  title?: React.ReactNode;
  className?: string;
}

function MediaSection({ className = '', subtitle, title, source, aspectRation = '1' }: Props) {
  const refSection = useRef<HTMLDivElement>(null);
  const [shouldLoadVideo, setShouldLoadVideo] = useState(source.type === 'img');

  useEffect(() => {
    if (source.type === 'img') {
      setShouldLoadVideo(true);
      return;
    }

    const section = refSection.current;
    if (!section) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry?.isIntersecting) return;
        setShouldLoadVideo(true);
        observer.disconnect();
      },
      {
        rootMargin: '300px 0px',
      }
    );

    observer.observe(section);

    return () => {
      observer.disconnect();
    };
  }, [source.type]);

  return (
    <div
      ref={refSection}
      className={`MediaSection ${className}`}
      style={{ '--aspectRatioMedia': aspectRation } as React.CSSProperties}
    >
      <div className="MediaSection_text px">
        <div className="MediaSection_text-subtitle">{subtitle}</div>
        <div className="MediaSection_text-title">{title}</div>
      </div>
      {source.type === 'img' ? (
        <img
          src={source.src}
          className="MediaSection_media"
          loading="lazy"
          decoding="async"
          alt={`Медиа-блок: ${title || 'без названия'}${subtitle ? ` — ${subtitle}` : ''}`}
        />
      ) : !shouldLoadVideo && source.cover ? (
        <img
          src={source.cover}
          className="MediaSection_media"
          loading="lazy"
          decoding="async"
          alt=""
          aria-hidden="true"
        />
      ) : (
        <VideoPlayer
          className="MediaSection_media"
          cover={source.cover}
          preload="metadata"
          videoSources={[{ src: source.src, type: source.type }]}
        />
      )}
    </div>
  );
}

export default memo(MediaSection);
