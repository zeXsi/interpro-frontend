import './styles.css';
import { useEffect, useRef } from 'react';

function getEmbedSrc(fields?: any) {
  const { vid_embed, vid_provider } = fields ?? {};

  switch (vid_provider) {
    case 'youtube':
      return `${vid_embed}`;

    case 'rutube':
      return `${vid_embed}`;

    case 'vk':
      return vid_embed;

    default:
      return vid_embed;
  }
}

function getPublicVideoUrl(fields?: any) {
  const { vid_url, vid_embed } = fields ?? {};

  return vid_url || vid_embed || '';
}

export default function Video({ data, id }: any) {
  const fields = data.fields;
  const src = getEmbedSrc(fields);
  const publicUrl = getPublicVideoUrl(fields);
  const containerRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const handleWheel = (e: WheelEvent) => {
      e.stopPropagation();

      const syntheticEvent = new WheelEvent('wheel', {
        deltaX: e.deltaX,
        deltaY: e.deltaY,
        deltaZ: e.deltaZ,
        deltaMode: e.deltaMode,
        bubbles: true,
        cancelable: true,
        clientX: e.clientX,
        clientY: e.clientY,
      });

      e.preventDefault();
      window.dispatchEvent(syntheticEvent);
    };

    container.addEventListener('wheel', handleWheel, { passive: false, capture: true });

    return () => {
      container.removeEventListener(
        'wheel',
        handleWheel,
        { capture: true } as EventListenerOptions
      );
    };
  }, []);

  return (
    src && (
      <section ref={containerRef} className="Video" id={id}>
        <iframe src={src} allowFullScreen frameBorder="0" title="video" />
        <p className="Video__print-link">
          Ссылка на видео:{' '}
          <a href={publicUrl} target="_blank" rel="noreferrer">
            {publicUrl}
          </a>
        </p>
      </section>
    )
  );
}
