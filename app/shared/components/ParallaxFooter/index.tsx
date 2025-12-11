import useEvent from '@qtpy/use-event';
import { useRef, useEffect } from 'react';
import './styles.css';

export function getElementPositionPercent(el: HTMLElement, step = 0): number {
  const pageHeight = document.documentElement.scrollHeight;
  const s = el?.offsetTop + el.offsetHeight;
  
  return Math.abs(Math.min(Math.max((window.scrollY - s) / (pageHeight - s) - step, -1), 0));
}

interface Props {
  PreElement: React.ElementType;
  Element: React.ElementType;
}
const smooth = (current: number, target: number, factor = 0.1) =>
  current + (target - current) * factor;

export default function ParallaxFooter({ PreElement, Element }: Props) {
  const refPreFooter = useRef<HTMLDivElement>(null);
  const refFooter = useRef<HTMLDivElement>(null);
  const refFakeFooter = useRef<HTMLDivElement>(null);
  const refPrevPercent = useRef(0)


  useEvent('scroll', () => {
    const preFooter = refPreFooter.current;
    const footer = refFooter.current;
    if (!preFooter || !footer) return;
    const preFooterPercent = getElementPositionPercent(preFooter, -0.2);
    refPrevPercent.current = smooth(refPrevPercent.current, preFooterPercent, 0.05);
    footer.style.transform = `translateY(-${preFooterPercent * 100}%)`;
  });


  useEffect(() => {
    const footer = refFooter.current;
    const fakeFooter = refFakeFooter.current;
    if (!footer || !fakeFooter) return;

    const resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const { width, height } = entry.contentRect;
        fakeFooter.style.width = `${width}px`;
        fakeFooter.style.height = `${height}px`;
      }
    });

    resizeObserver.observe(footer);

    return () => {
      resizeObserver.unobserve(footer);
    };
  }, []);

  return (
    <>
      <div className="ParallaxFooter-preElement" ref={ refPreFooter }>
        <PreElement />
      </div>
      <div className="ParallaxFooter_element">
        <div className="ParallaxFooter_element-origin" ref={ refFooter }>
          <Element />
        </div>
        <div className="ParallaxFooter_element-fake" ref={ refFakeFooter } />
      </div>
    </>
  );
}