import { type PropsWithChildren, useRef, useEffect } from 'react';
import './styles.css';

interface Props extends PropsWithChildren {
  className?: string;
}

export default function MarqueeCarousel({ className = '', children }: Props) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (typeof window == undefined) return;
    const container = ref.current;
    if (!container) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        entry.isIntersecting
          ? container.classList.add('active')
          : container.classList.remove('active');
      },
      {
        root: null,
        threshold: 0.1,
      }
    );

    observer.observe(container);

    return () => {
      if (container) observer.unobserve(container);
    };
  }, []);

  return (
    <div ref={ref} className={`MarqueeCarousel ${className}`} id="Customers">
      <div className={`MarqueeCarousel-wrapper`} aria-hidden="true">
        {children}
        {children}
      </div>
    </div>
  );
}
