import { useEffect, useRef, type Dispatch, type RefObject, type SetStateAction } from 'react';
import { lenisManager } from 'shared/utils/lenis';

const STEP_VH = 0.3;
const END_SPACE_VH = 0.2;
const SNAP_IDLE_MS = 160;
const LOCK_MS = 900;

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}

export function useStickyStepCycle(
  refSection: RefObject<HTMLElement | null>,
  stepsCount: number,
  setActiveIndex: Dispatch<SetStateAction<number>>
) {
  const lockRef = useRef(false);
  const lockTimerRef = useRef<number | null>(null);
  const snapTimerRef = useRef<number | null>(null);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const clearLockTimer = () => {
      if (lockTimerRef.current !== null) {
        window.clearTimeout(lockTimerRef.current);
        lockTimerRef.current = null;
      }
    };

    const clearSnapTimer = () => {
      if (snapTimerRef.current !== null) {
        window.clearTimeout(snapTimerRef.current);
        snapTimerRef.current = null;
      }
    };

    const getMetrics = () => {
      const section = refSection.current;
      if (!section) return null;

      const rect = section.getBoundingClientRect();
      const start = window.scrollY + rect.top;
      const stepDistance = window.innerHeight * STEP_VH;
      const snapDistance = stepDistance * (stepsCount - 1);
      const endSpace = window.innerHeight * END_SPACE_VH;
      const scrollInSection = window.scrollY - start;
      const scrollForSteps = clamp(scrollInSection, 0, snapDistance);

      return {
        start,
        stepDistance,
        snapDistance,
        end: start + snapDistance + endSpace,
        scrollInSection,
        scrollForSteps,
      };
    };

    const scrollToIndex = (index: number) => {
      const metrics = getMetrics();
      if (!metrics) return;

      const targetIndex = clamp(index, 0, stepsCount - 1);
      const targetTop = metrics.start + targetIndex * metrics.stepDistance;
      const lenis = lenisManager.state.v;

      clearLockTimer();
      clearSnapTimer();
      lockRef.current = true;
      setActiveIndex(targetIndex);

      if (lenis) {
        lenis.scrollTo(targetTop, { duration: 0.75 });
      } else {
        window.scrollTo({ top: targetTop, behavior: 'smooth' });
      }

      lockTimerRef.current = window.setTimeout(() => {
        lockRef.current = false;
        lockTimerRef.current = null;
      }, LOCK_MS);
    };

    const updateActiveIndex = () => {
      const metrics = getMetrics();
      if (!metrics) return;

      const rawIndex = metrics.scrollForSteps / metrics.stepDistance;
      setActiveIndex(clamp(Math.round(rawIndex), 0, stepsCount - 1));
    };

    const snapToNearestStep = () => {
      if (lockRef.current) return;

      const metrics = getMetrics();
      if (!metrics) return;
      if (metrics.scrollInSection < 0 || metrics.scrollInSection > metrics.snapDistance) return;

      const rawIndex = metrics.scrollForSteps / metrics.stepDistance;
      const baseIndex = Math.floor(rawIndex);
      const fraction = rawIndex - baseIndex;
      const targetIndex = clamp(baseIndex + (fraction > 0.5 ? 1 : 0), 0, stepsCount - 1);

      scrollToIndex(targetIndex);
    };

    const handleScroll = () => {
      updateActiveIndex();
      clearSnapTimer();
      snapTimerRef.current = window.setTimeout(snapToNearestStep, SNAP_IDLE_MS);
    };

    const handleWheel = (event: WheelEvent) => {
      const metrics = getMetrics();
      if (!metrics) return;

      const direction = event.deltaY > 0 ? 1 : -1;
      const isBeforeSticky = metrics.scrollInSection < 0;
      const isAfterSticky = metrics.scrollInSection > metrics.snapDistance;
      const isAtFirstStep = metrics.scrollInSection <= 0 && direction < 0;
      const isAtLastStep = metrics.scrollInSection >= metrics.snapDistance && direction > 0;

      if (isBeforeSticky || isAfterSticky || isAtFirstStep || isAtLastStep) return;

      event.preventDefault();

      if (lockRef.current) return;

      const rawIndex = metrics.scrollForSteps / metrics.stepDistance;
      const currentIndex =
        direction > 0
          ? clamp(Math.floor(rawIndex), 0, stepsCount - 1)
          : clamp(Math.ceil(rawIndex), 0, stepsCount - 1);
      const nextIndex = clamp(currentIndex + direction, 0, stepsCount - 1);

      if (nextIndex === currentIndex) return;
      scrollToIndex(nextIndex);
    };

    updateActiveIndex();
    window.addEventListener('scroll', handleScroll);
    window.addEventListener('wheel', handleWheel, { passive: false, capture: true });

    return () => {
      clearLockTimer();
      clearSnapTimer();
      window.removeEventListener('scroll', handleScroll);
      window.removeEventListener('wheel', handleWheel, { capture: true });
    };
  }, [refSection, setActiveIndex, stepsCount]);
}
