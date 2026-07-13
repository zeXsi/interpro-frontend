import {
  useEffect,
  useLayoutEffect,
  useRef,
  type Dispatch,
  type RefObject,
  type SetStateAction,
} from 'react';

const STEP_VH = 0.45;
const CYCLE_MARKER_OPTICAL_OFFSET = -1;

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}

export function useCycleLineMarker(activeIndex: number, stepsCount: number) {
  const lineRef = useRef<HTMLDivElement | null>(null);
  const markerRef = useRef<HTMLSpanElement | null>(null);
  const numbersRef = useRef<HTMLDivElement | null>(null);

  useLayoutEffect(() => {
    const line = lineRef.current;
    const marker = markerRef.current;
    const numbers = numbersRef.current;
    const activeNumber = numbers?.children.item(activeIndex);

    if (!line || !marker || !numbers || !(activeNumber instanceof HTMLElement)) return;

    const updateMarker = () => {
      if (activeIndex === 0) {
        marker.style.top = '0px';
        return;
      }

      if (activeIndex === stepsCount - 1) {
        marker.style.top = 'calc(100% - var(--cycleLineMarkerHeight))';
        return;
      }

      const lineRect = line.getBoundingClientRect();
      const markerRect = marker.getBoundingClientRect();
      const numberRect = activeNumber.getBoundingClientRect();
      const offset =
        numberRect.top -
        lineRect.top +
        (numberRect.height - markerRect.height) / 2 +
        CYCLE_MARKER_OPTICAL_OFFSET;

      marker.style.top = `${offset}px`;
    };

    updateMarker();

    const resizeObserver = new ResizeObserver(updateMarker);
    resizeObserver.observe(line);
    resizeObserver.observe(numbers);

    let cancelled = false;
    void document.fonts.ready.then(() => {
      if (!cancelled) updateMarker();
    });

    return () => {
      cancelled = true;
      resizeObserver.disconnect();
    };
  }, [activeIndex, stepsCount]);

  return { lineRef, markerRef, numbersRef };
}

export function useStickyStepCycle(
  refSection: RefObject<HTMLElement | null>,
  stepsCount: number,
  setActiveIndex: Dispatch<SetStateAction<number>>
) {
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const getMetrics = () => {
      const section = refSection.current;
      if (!section) return null;

      const mobileTrack = section.querySelector<HTMLElement>('[data-cycle-scroll-track]');
      const track = window.innerWidth <= 1000 && mobileTrack ? mobileTrack : section;
      const stickyPanel = track.querySelector<HTMLElement>('[data-cycle-sticky-panel]');
      const rect = track.getBoundingClientRect();
      const viewportHeight = stickyPanel?.getBoundingClientRect().height ?? window.innerHeight;
      const stepDistance = viewportHeight * STEP_VH;
      // The step is derived only from the track's position relative to the viewport.
      // 0, 45, 90, 135, 180 and 225lvh select the six steps; 225-270lvh holds the last.
      const scrollInSection = -rect.top;

      return {
        stepDistance,
        scrollInSection,
      };
    };

    const updateActiveIndex = () => {
      const metrics = getMetrics();
      if (!metrics) return;

      const rawIndex = Math.floor(metrics.scrollInSection / metrics.stepDistance);
      setActiveIndex(clamp(rawIndex, 0, stepsCount - 1));
    };

    updateActiveIndex();
    window.addEventListener('scroll', updateActiveIndex, { passive: true });
    window.addEventListener('resize', updateActiveIndex);

    return () => {
      window.removeEventListener('scroll', updateActiveIndex);
      window.removeEventListener('resize', updateActiveIndex);
    };
  }, [refSection, setActiveIndex, stepsCount]);
}
