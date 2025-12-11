import { memo } from 'react';
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
  return (
    <div
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
          alt={`Медиа-блок: ${title || 'без названия'}${subtitle ? ` — ${subtitle}` : ''}`}
        />
      ) : (
        <VideoPlayer
          className="MediaSection_media"
          cover={source.cover}
          videoSources={[{ src: source.src, type: source.type }]}
        />
      )}
    </div>
  );
}

export default memo(MediaSection);
