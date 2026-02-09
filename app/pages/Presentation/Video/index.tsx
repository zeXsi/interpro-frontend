import './styles.css';
import { useEffect, useRef } from 'react';

function getEmbedSrc({ vid_embed, vid_provider }: any) {
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

export default function Video({ data, id }: any) {
  const src = getEmbedSrc(data.fields);
  const containerRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const handleWheel = (e: WheelEvent) => {
      // Останавливаем propagation внутрь iframe, чтобы событие не ушло туда
      e.stopPropagation();
      
      // Диспатчим новое событие на window, чтобы Lenis мог его перехватить
      // Это позволяет Lenis обработать событие естественным образом
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
      
      // Предотвращаем стандартное поведение исходного события
      e.preventDefault();
      
      // Диспатчим на window, где Lenis слушает события
      window.dispatchEvent(syntheticEvent);
    };

    // Используем capture phase, чтобы перехватить событие до того, как оно дойдёт до iframe
    container.addEventListener('wheel', handleWheel, { passive: false, capture: true });

    return () => {
      container.removeEventListener('wheel', handleWheel, { capture: true } as EventListenerOptions);
    };
  }, []);

  return (
    src && (
      <section ref={containerRef} className="Video" id={id}>
        <iframe
          src={src}
          // allow="autoplay; fullscreen; picture-in-picture"
          // webkitAllowFullScreen
          // mozallowfullscreen
          allowFullScreen
          frameBorder="0"
          title="video"
        />
      </section>
    )
  );
}
