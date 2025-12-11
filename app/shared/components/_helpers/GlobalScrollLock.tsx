import Lenis from 'lenis';
import React, { useRef, useLayoutEffect, useEffect } from 'react';
import { glLenis, lenisManager } from 'shared/utils/lenis';

const useIsomorphicLayoutEffect = typeof window !== 'undefined' ? useLayoutEffect : useEffect;

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

    lenisManager.init();

    const root = glLenis.v;
    const wrapper = containerRef.current;
    const localManager = localManagerRef.current;

    if (!root || !wrapper || !localManager) return;

    const content = wrapper.firstElementChild as HTMLElement | null;
    if (!content) return;

    lenisManager.stopRaf();
    root.stop();
    localManager.create(wrapper, content);

    const isInsideContainer = (target: EventTarget | null): boolean => {
      if (!containerRef.current) return false;
      if (!(target instanceof Node)) return false;
      return containerRef.current.contains(target);
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
      lenisManager.startRaf();
      root.start();
    };
  }, [active]);

  return (
    <div ref={containerRef} className={className} data-locker>
      <div className={classInner}>{children}</div>
    </div>
  );
};

function isMobileLike() {
  if (typeof window === 'undefined') return false;
  const coarse = window.matchMedia('(pointer: coarse)').matches;
  const hover = window.matchMedia('(hover: hover)').matches;
  const narrow = window.matchMedia('(max-width: 768px)').matches;

  return coarse || narrow || hover;
}

export function lockBodyScroll() {
  if (typeof document === 'undefined') return;
  if (!isMobileLike()) return;
  document.documentElement.style.overflow = 'hidden';
  document.body.style.overflow = 'hidden';
  document.body.style.touchAction = 'none';
}

export function unlockBodyScroll() {
  if (typeof document === 'undefined') return;
  document.documentElement.style.overflow = '';
  document.body.style.overflow = '';
  document.body.style.touchAction = '';
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
