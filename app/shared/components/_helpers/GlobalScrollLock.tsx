import Lenis from 'lenis';
import React, { useRef, useLayoutEffect, useEffect } from 'react';
import { glLenis, lenisManager } from 'shared/utils/lenis';

const useIsomorphicLayoutEffect = typeof window !== 'undefined' ? useLayoutEffect : useEffect;
const activeContainers = new Set<HTMLElement>();

type GlobalScrollLockProps = {
  children?: React.ReactNode;
  className?: string;
  classInner?: string;
  active?: boolean;
};

export const GlobalScrollLock: React.FC<GlobalScrollLockProps> = ({
  children,
  className = '',
  active = true,
  classInner,
}) => {
  const containerRef = useRef<HTMLDivElement | null>(null);

  const localManagerRef = useRef<LocalLenisManager | null>(null);
  if (!localManagerRef.current) {
    localManagerRef.current = new LocalLenisManager();
  }

  useIsomorphicLayoutEffect(() => {
    if (!active) return;
    if (typeof window === 'undefined' || typeof document === 'undefined') return;

    const wrapper = containerRef.current;
    const localManager = localManagerRef.current;

    if (!wrapper || !localManager) return;

    const content = wrapper.firstElementChild as HTMLElement | null;
    if (!content) return;

    activeContainers.add(wrapper);
    const stopRoot = () => {
      if (!activeContainers.has(wrapper)) return;
      lenisManager.stopRaf();
      glLenis.v?.stop();
    };
    const initialization = lenisManager.init();
    stopRoot();
    // The global Lenis instance may still be loading when the popup opens.
    if (initialization) void initialization.then(stopRoot);
    localManager.create(wrapper, content);

    const isInsideContainer = (target: EventTarget | null): boolean => {
      if (!(target instanceof Node)) return false;
      const topContainer = Array.from(activeContainers).at(-1);
      return topContainer?.contains(target) ?? false;
    };

    const preventScroll = (event: WheelEvent | TouchEvent) => {
      if (isInsideContainer(event.target)) return;
      event.preventDefault();
    };

    const preventKeys = (event: KeyboardEvent) => {
      if (isInsideContainer(document.activeElement)) return;
      const keys = ['ArrowUp', 'ArrowDown', 'PageUp', 'PageDown', 'Home', 'End', ' '];
      if (keys.includes(event.key)) {
        event.preventDefault();
      }
    };

    const controller = new AbortController();
    const { signal } = controller;
    const options: AddEventListenerOptions = {
      passive: false,
      capture: true,
      signal,
    };

    window.addEventListener('wheel', preventScroll as EventListener, options);
    window.addEventListener('touchmove', preventScroll as EventListener, options);
    document.addEventListener('touchmove', preventScroll as EventListener, options);
    window.addEventListener('keydown', preventKeys as EventListener, options);

    lockBodyScroll();

    return () => {
      controller.abort();
      unlockBodyScroll();
      localManager.destroy();
      activeContainers.delete(wrapper);
      if (!activeContainers.size) {
        lenisManager.startRaf();
        glLenis.v?.start();
      }
    };
  }, [active]);

  return (
    <div ref={containerRef} className={className} data-locker>
      <div className={classInner}>{children}</div>
    </div>
  );
};

let bodyLockCount = 0;
let previousBodyStyles: { htmlOverflow: string; bodyOverflow: string; touchAction: string } | null = null;

export function lockBodyScroll() {
  if (typeof document === 'undefined') return;
  if (bodyLockCount++ > 0) return;
  previousBodyStyles = {
    htmlOverflow: document.documentElement.style.overflow,
    bodyOverflow: document.body.style.overflow,
    touchAction: document.body.style.touchAction,
  };
  document.documentElement.style.overflow = 'hidden';
  document.body.style.overflow = 'hidden';
  document.body.style.touchAction = 'none';
}

export function unlockBodyScroll() {
  if (typeof document === 'undefined') return;
  if (!bodyLockCount || --bodyLockCount > 0) return;
  document.documentElement.style.overflow = previousBodyStyles?.htmlOverflow ?? '';
  document.body.style.overflow = previousBodyStyles?.bodyOverflow ?? '';
  document.body.style.touchAction = previousBodyStyles?.touchAction ?? '';
  previousBodyStyles = null;
}

export class LocalLenisManager {
  private lenis: Lenis | null = null;
  private rafId: number | null = null;

  create(wrapper: HTMLElement, content: HTMLElement) {
    this.destroy();

    this.lenis = new Lenis({
      wrapper,
      content,
      smoothWheel: true,
      wheelMultiplier: 1,
      touchMultiplier: 1.2,
    });

    this.start();
  }

  private onRaf = (time: number) => {
    this.lenis?.raf(time);
    this.rafId = requestAnimationFrame(this.onRaf);
  };

  start() {
    if (this.rafId == null) {
      this.rafId = requestAnimationFrame(this.onRaf);
    }
  }

  stop() {
    if (this.rafId != null) {
      cancelAnimationFrame(this.rafId);
      this.rafId = null;
    }
  }

  destroy() {
    this.stop();
    this.lenis?.destroy();
    this.lenis = null;
  }
}
