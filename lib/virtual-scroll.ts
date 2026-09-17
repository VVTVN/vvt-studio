import { clamp, damp } from './scroll-geometry';

/** An element's static (layout) offset from `ancestor`. A translate
 * transform on `ancestor` (or anything between the two) shifts both rects by
 * the same amount, so the difference cancels it out — unlike walking
 * `offsetParent`, this doesn't silently skip non-positioned elements in
 * between. */
export function getOffsetWithin(el: HTMLElement, ancestor: HTMLElement) {
  return el.getBoundingClientRect().top - ancestor.getBoundingClientRect().top;
}

export type VirtualScrollOptions = {
  motion: boolean;
  response?: number;
  wheelMultiplier?: number;
  touchMultiplier?: number;
};

/**
 * Owns the "document" scroll position ourselves instead of relying on native
 * scrolling: the viewport is fixed and overflow-hidden, and `track` is moved
 * with a transform. Wheel/touch/keyboard input accumulates a target, which is
 * damped toward every frame — the same technique unseen.co uses (their body
 * is `overflow:hidden; height:0`, confirmed by inspecting it live), so we get
 * full control over momentum/easing instead of being at the mercy of each
 * browser's native scroll timing.
 */
export class VirtualScroll {
  motion: boolean;
  response: number;
  private wheelMultiplier: number;
  private touchMultiplier: number;
  private target = 0;
  private current = 0;
  private maxValue = 0;
  private frame = 0;
  private last = 0;
  private disposed = false;
  private touchY = 0;
  private touchActive = false;
  private listeners = new Set<() => void>();
  private resizeObserver: ResizeObserver;

  constructor(
    private viewport: HTMLElement,
    private track: HTMLElement,
    options: VirtualScrollOptions,
  ) {
    this.motion = options.motion;
    this.response = options.response ?? 90;
    this.wheelMultiplier = options.wheelMultiplier ?? 1;
    this.touchMultiplier = options.touchMultiplier ?? 1.7;
    this.measure();
    viewport.addEventListener('wheel', this.onWheel, { passive: false });
    viewport.addEventListener('touchstart', this.onTouchStart, { passive: true });
    viewport.addEventListener('touchmove', this.onTouchMove, { passive: false });
    viewport.addEventListener('touchend', this.onTouchEnd, { passive: true });
    window.addEventListener('keydown', this.onKeyDown);
    window.addEventListener('resize', this.measure);
    this.resizeObserver = new ResizeObserver(this.measure);
    this.resizeObserver.observe(track);
  }

  get value() {
    return this.current;
  }
  get max() {
    return this.maxValue;
  }

  getOffsetTop(el: HTMLElement) {
    return getOffsetWithin(el, this.track);
  }

  scrollTo(y: number, { instant = false } = {}) {
    this.target = clamp(y, 0, this.maxValue);
    if (instant) this.current = this.target;
    this.schedule();
  }

  scrollToEl(el: HTMLElement, offset = 0, opts?: { instant?: boolean }) {
    this.scrollTo(this.getOffsetTop(el) + offset, opts);
  }

  subscribe(fn: () => void) {
    this.listeners.add(fn);
    return () => {
      this.listeners.delete(fn);
    };
  }

  private measure = () => {
    this.maxValue = Math.max(0, this.track.scrollHeight - this.viewport.clientHeight);
    const clamped = clamp(this.target, 0, this.maxValue);
    if (clamped !== this.target) {
      this.target = clamped;
      this.schedule();
    }
  };

  private onWheel = (e: WheelEvent) => {
    e.preventDefault();
    // deltaMode 1 = "lines" (rare, some mice/firefox); normalize to pixels.
    const delta = e.deltaMode === 1 ? e.deltaY * 16 : e.deltaY;
    this.target = clamp(this.target + delta * this.wheelMultiplier, 0, this.maxValue);
    this.schedule();
  };
  private onTouchStart = (e: TouchEvent) => {
    this.touchActive = true;
    this.touchY = e.touches[0].clientY;
  };
  private onTouchMove = (e: TouchEvent) => {
    if (!this.touchActive) return;
    e.preventDefault();
    const y = e.touches[0].clientY;
    this.target = clamp(
      this.target + (this.touchY - y) * this.touchMultiplier,
      0,
      this.maxValue,
    );
    this.touchY = y;
    this.schedule();
  };
  private onTouchEnd = () => {
    this.touchActive = false;
  };
  private onKeyDown = (e: KeyboardEvent) => {
    const active = document.activeElement as HTMLElement | null;
    if (active && (active.tagName === 'INPUT' || active.tagName === 'TEXTAREA')) return;
    const step = this.viewport.clientHeight * 0.85;
    let next: number | null = null;
    switch (e.key) {
      case 'ArrowDown':
        next = this.target + 70;
        break;
      case 'ArrowUp':
        next = this.target - 70;
        break;
      case 'PageDown':
      case ' ':
        next = this.target + step;
        break;
      case 'PageUp':
        next = this.target - step;
        break;
      case 'Home':
        next = 0;
        break;
      case 'End':
        next = this.maxValue;
        break;
      default:
        return;
    }
    e.preventDefault();
    this.target = clamp(next, 0, this.maxValue);
    this.schedule();
  };

  /** Keeps a focused element on screen even though native focus-scrolling
   * can't reach into a track moved by transform. */
  bringIntoView(el: HTMLElement) {
    const top = this.getOffsetTop(el) - this.current;
    const bottom = top + el.offsetHeight;
    const vh = this.viewport.clientHeight;
    if (top < 0) this.scrollTo(this.current + top - 24);
    else if (bottom > vh) this.scrollTo(this.current + (bottom - vh) + 24);
  }

  private paint = (time: number) => {
    if (this.disposed) return;
    const elapsed = this.last ? Math.min(time - this.last, 64) : 16.67;
    this.last = time;
    this.current = this.motion
      ? damp(this.current, this.target, elapsed, this.response)
      : this.target;
    if (Math.abs(this.target - this.current) < 0.05) this.current = this.target;
    this.track.style.transform = `translate3d(0, ${-this.current}px, 0)`;
    this.listeners.forEach((fn) => fn());
    if (this.current !== this.target) this.frame = requestAnimationFrame(this.paint);
    else {
      this.frame = 0;
      this.last = 0;
    }
  };
  private schedule = () => {
    if (!this.frame && !this.disposed) this.frame = requestAnimationFrame(this.paint);
  };

  dispose() {
    this.disposed = true;
    cancelAnimationFrame(this.frame);
    this.resizeObserver.disconnect();
    this.viewport.removeEventListener('wheel', this.onWheel);
    this.viewport.removeEventListener('touchstart', this.onTouchStart);
    this.viewport.removeEventListener('touchmove', this.onTouchMove);
    this.viewport.removeEventListener('touchend', this.onTouchEnd);
    window.removeEventListener('keydown', this.onKeyDown);
    window.removeEventListener('resize', this.measure);
  }
}
