import { useEffect, type Dispatch, type RefObject, type SetStateAction } from 'react';

const STEP_VH = 0.45;

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
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
