'use client';
import { useEffect, useRef, useState } from 'react';
import { VirtualScroll } from './virtual-scroll';

export type VirtualScrollApi = {
  getCurrent: () => number;
  getMax: () => number;
  getOffsetTop: (el: HTMLElement) => number;
  scrollTo: (y: number, opts?: { instant?: boolean }) => void;
  scrollToEl: (el: HTMLElement, offset?: number, opts?: { instant?: boolean }) => void;
  subscribe: (fn: () => void) => () => void;
};

/**
 * Wires up a fully virtualized scroll: `viewportRef` should get a
 * fixed/overflow-hidden wrapper and `trackRef` the real content inside it.
 * Wheel/touch/keyboard input then drives everything instead of native
 * document scrolling — see lib/virtual-scroll.ts for why.
 */
export function useVirtualScrollEngine(motion: boolean) {
  const viewportRef = useRef<HTMLDivElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  const vsRef = useRef<VirtualScroll | null>(null);
  const motionRef = useRef(motion);
  motionRef.current = motion;
  // Flips true once the VirtualScroll instance exists, so consumers (like
  // ScrollScene, which measures layout in its own effect) know to wait for
  // it instead of racing it — a plain useEffect here runs after every
  // descendant's effects have already fired once.
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const viewport = viewportRef.current,
      track = trackRef.current;
    if (!viewport || !track) return;
    const vs = new VirtualScroll(viewport, track, { motion: motionRef.current });
    vsRef.current = vs;
    document.documentElement.classList.add('vs-ready');
    setReady(true);
    const onFocus = (e: FocusEvent) => {
      if (e.target instanceof HTMLElement && track.contains(e.target))
        vs.bringIntoView(e.target);
    };
    track.addEventListener('focusin', onFocus);
    return () => {
      track.removeEventListener('focusin', onFocus);
      vs.dispose();
      vsRef.current = null;
      setReady(false);
      document.documentElement.classList.remove('vs-ready');
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (vsRef.current) vsRef.current.motion = motion;
  }, [motion]);

  const api = useRef<VirtualScrollApi>({
    getCurrent: () => vsRef.current?.value ?? 0,
    getMax: () => vsRef.current?.max ?? 0,
    getOffsetTop: (el) => vsRef.current?.getOffsetTop(el) ?? 0,
    scrollTo: (y, opts) => vsRef.current?.scrollTo(y, opts),
    scrollToEl: (el, offset, opts) => vsRef.current?.scrollToEl(el, offset, opts),
    subscribe: (fn) => vsRef.current?.subscribe(fn) ?? (() => {}),
  }).current;

  return { viewportRef, trackRef, vs: api, ready };
}
