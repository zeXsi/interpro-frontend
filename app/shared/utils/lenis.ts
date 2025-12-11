
import Lenis from 'lenis';
import { signal } from 'shared/utils/_stm';

export class LenisManager {
  private lenis: Lenis | null = null;
  private rafId: number | null = null;
  state = signal<Lenis | null>(null);

  init() {
    if (typeof window === 'undefined') return;
    if (this.lenis) return;

    this.lenis = new Lenis({
      lerp: 0.95,
      duration: 1.1,
      smoothWheel: true,
      wheelMultiplier: 1,
    });
    
    this.state.v = this.lenis;
    this.startRaf();
  }

  private onRaf = (t: number) => {
    this.lenis?.raf(t);
    this.rafId = requestAnimationFrame(this.onRaf);
  };

  startRaf() {
    if (!this.rafId) {
      this.rafId = requestAnimationFrame(this.onRaf);
    }
  }

  stopRaf() {
    if (this.rafId) {
      cancelAnimationFrame(this.rafId);
      this.rafId = null;
    }
  }

  destroy() {
    this.stopRaf();
    this.lenis?.destroy();
    this.lenis = null;
    this.state.v = null;
  }
}

export const lenisManager = new LenisManager();
export const glLenis = lenisManager.state;
