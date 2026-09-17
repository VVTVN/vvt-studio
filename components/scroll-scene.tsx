'use client';
import { useLayoutEffect, useRef, type ReactNode } from 'react';
import {
  clamp,
  damp,
  rowTop,
  sceneLayout,
  type SceneLayout,
} from '@/lib/scroll-geometry';
import { SheetRenderer, type Texture } from '@/lib/sheet-renderer';
import type { VirtualScrollApi } from '@/lib/use-virtual-scroll';

export function ScrollScene({
  children,
  motion,
  resetKey,
  vs,
  ready,
}: {
  children: ReactNode;
  motion: boolean;
  resetKey: string;
  vs: VirtualScrollApi;
  ready: boolean;
}) {
  const ref = useRef<HTMLDivElement>(null);
  useLayoutEffect(() => {
    const stage = ref.current,
      section = stage?.parentElement;
    // `vs` isn't backed by a real VirtualScroll instance until `ready` — see
    // use-virtual-scroll.ts for why relying on effect ordering alone isn't
    // enough (this effect otherwise fires before that one exists).
    if (!stage || !section || !vs || !ready) return;
    const canvas = stage.querySelector<HTMLCanvasElement>('canvas')!;
    const cards = [...stage.querySelectorAll<HTMLElement>('.project-card')];
    const wireframe = new URLSearchParams(window.location.search).get('foldDebug') === 'wireframe';
    let renderer: SheetRenderer | undefined;
    try {
      renderer = new SheetRenderer(canvas);
      renderer.wireframe = wireframe;
      const angle = Number(new URLSearchParams(window.location.search).get('wrap'));
      if (angle >= 90 && angle <= 180) renderer.foldOptions.maxWrapAngle = angle * Math.PI / 180;
    } catch {
      stage.dataset.renderer = 'fallback';
    }
    let layout: SceneLayout,
      sectionStart = 0,
      frame = 0,
      last = 0,
      current = 0,
      disposed = false;
    let textures: (Texture | undefined)[] = [];
    let resizeVersion = 0;
    const images = cards.map((card) =>
      card.querySelector<HTMLImageElement>('.image-motion img')!,
    );
    const paint = (time: number) => {
      if (disposed) return;
      const elapsed = last ? Math.min(time - last, 64) : 16.67;
      last = time;
      const vsCurrent = vs.getCurrent();
      // Scroll progress is forward when the virtual scroll position increases.
      // Keep the sign explicit here: rowTop subtracts this distance, so down
      // advances to the next row and up reverses back to the previous row.
      const scrollProgress = sectionStart - vsCurrent;
      const target = clamp(
        -scrollProgress * layout.gain,
        0,
        layout.travel,
      );
      current = motion
        ? damp(current, target, elapsed, layout.mobile ? 70 : 155)
        : target;
      if (Math.abs(target - current) < 0.08) current = target;
      // Emulates `position: sticky; top: 0` inside a spacer of height
      // `layout.scrollLength` — the stage otherwise sits at its normal
      // (transformed-with-the-track) position, `rawY`. There is no real
      // scroll container for native sticky to attach to once the page is
      // virtually scrolled, so the clamp is done by hand.
      const rawY = sectionStart - vsCurrent;
      const pinCompensation = -clamp(rawY, -layout.scrollLength, 0);
      stage.style.transform = `translate3d(0, ${pinCompensation}px, 0)`;
      stage.dataset.settled = String(current === target);
      stage.dataset.frames = String(Number(stage.dataset.frames || '0') + 1);
      stage.dataset.distance = current.toFixed(2);
      stage.dataset.target = target.toFixed(2);
      stage.dataset.cycle = (current / layout.pitch).toFixed(4);
      stage.dataset.pinned = String(
        vsCurrent >= sectionStart && vsCurrent <= sectionStart + layout.scrollLength,
      );
      renderer?.begin();
      const renderQueue: {
        index: number;
        top: number;
        zIndex: number;
      }[] = [];
      cards.forEach((card, index) => {
        const layoutTop = rowTop(layout, index, 0),
          top = layoutTop - current,
          bottom = top + layout.imageHeight;
        // Incoming (larger top, still in front of the gate) draws last.
        const zIndex = Math.round(top);
        card.style.transform = `translate3d(${layout.margin + (index % layout.columns) * (layout.cardWidth + layout.gap)}px,${top}px,0)`;
        card.style.zIndex = String(zIndex);
        card.dataset.baseY = top.toFixed(2);
        card.dataset.row = String(Math.floor(index / layout.columns));
        const clip = Math.max(0, layout.gate - 26 - top);
        card.style.clipPath = `inset(${clip}px -15px -15px -15px)`;
        const button = card.querySelector<HTMLButtonElement>('.project-link')!;
        button.tabIndex =
          bottom + layout.captionHeight < layout.gate - 20 ? -1 : 0;
        card.style.visibility =
          (wireframe && index !== 0) || bottom < layout.gate ||
          top > layout.height + layout.pitch
            ? 'hidden'
            : 'visible';
        const imageClip = clamp(layout.gate - top, 0, layout.imageHeight);
        const hover = card.querySelector<HTMLElement>('.view-project');
        if (hover)
          hover.style.top = `${imageClip + (layout.imageHeight - imageClip) / 2}px`;
        if (renderer && textures[index] && (!wireframe || index === 0))
          renderQueue.push({ index, top, zIndex });
      });
      renderQueue
        .sort((a, b) => a.zIndex - b.zIndex)
        .forEach(({ index }) => {
          const bounds = renderer!.draw(
            textures[index]!,
            index,
            rowTop(layout, index, 0),
            current,
            layout,
            motion,
            time,
          );
          cards[index].dataset.renderedTop = bounds.top.toFixed(2);
          cards[index].dataset.renderedBottom = bounds.bottom.toFixed(2);
          cards[index].dataset.sheetOpacity = bounds.opacity.toFixed(3);
        });
      // The virtual-scroll's own frame loop wakes us via subscribe(); do not
      // redraw WebGL forever while idle — that was especially expensive and
      // visibly sticky on iOS.
      if (current !== target) frame = requestAnimationFrame(paint);
      else {
        frame = 0;
        last = 0;
      }
    };
    const schedule = () => {
      if (!frame && !disposed) frame = requestAnimationFrame(paint);
    };
    const resize = () => {
      const oldLayout = layout,
        oldStart = sectionStart;
      layout = sceneLayout(stage.clientWidth, window.innerHeight, cards.length);
      sectionStart = vs.getOffsetTop(stage);
      section.style.height = `${layout.height + layout.scrollLength}px`;
      stage.style.height = `${layout.height}px`;
      stage.style.setProperty('--fold-gate', `${layout.gate}px`);
      stage.dataset.pitch = layout.pitch.toFixed(2);
      stage.dataset.gain = String(layout.gain);
      stage.dataset.scrollLength = layout.scrollLength.toFixed(2);
      cards.forEach((card) => {
        card.style.width = `${layout.cardWidth}px`;
        card.querySelector<HTMLElement>('.image-frame')!.style.height =
          `${layout.imageHeight}px`;
      });
      renderer?.resize(layout);
      renderer?.clearTextures();
      textures = [];
      const version = ++resizeVersion;
      images.forEach((image, index) => {
        const load = () => {
          if (disposed || version !== resizeVersion || !image.naturalWidth)
            return;
          if (renderer) {
            textures[index] = renderer.texture(image, cards[index], layout);
            cards[index].dataset.textured = 'true';
          }
          schedule();
        };
        if (image.complete && image.naturalWidth) load();
        else {
          image.loading = 'eager';
          void image
            .decode()
            .then(load)
            .catch(() => {
              cards[index].dataset.textured = 'false';
              schedule();
            });
        }
      });
      const vsCurrent = vs.getCurrent();
      if (
        oldLayout &&
        vsCurrent >= oldStart &&
        vsCurrent <= oldStart + oldLayout.scrollLength
      ) {
        const progress = clamp(
          current / oldLayout.pitch,
          0,
          oldLayout.rows + 1,
        );
        current = clamp(progress * layout.pitch, 0, layout.travel);
        vs.scrollTo(sectionStart + current / layout.gain, { instant: true });
      } else {
        current = clamp(
          (vsCurrent - sectionStart) * layout.gain,
          0,
          layout.travel,
        );
      }
      stage.dataset.ready = 'true';
      stage.dataset.renderer = renderer ? 'webgl' : 'fallback';
      schedule();
    };
    resize();
    const focus = (event: FocusEvent) => {
      const card = (event.target as HTMLElement).closest<HTMLElement>(
        '.project-card',
      );
      if (!card || !(event.target as HTMLElement).matches(':focus-visible')) return;
      const index = cards.indexOf(card);
      if (index < 0) return;
      const top = rowTop(layout, index, current);
      if (top < layout.gate || top + layout.imageHeight > layout.height) {
        vs.scrollTo(
          sectionStart + (Math.floor(index / layout.columns) * layout.pitch) / layout.gain,
          { instant: true },
        );
        schedule();
      }
    };
    const contextLost = (e: Event) => {
      e.preventDefault();
      stage.dataset.renderer = 'fallback';
    };
    canvas.addEventListener('webglcontextlost', contextLost);
    const unsubscribe = vs.subscribe(schedule);
    window.addEventListener('resize', resize);
    stage.addEventListener('focusin', focus);
    return () => {
      disposed = true;
      cancelAnimationFrame(frame);
      renderer?.dispose();
      unsubscribe();
      window.removeEventListener('resize', resize);
      stage.removeEventListener('focusin', focus);
      canvas.removeEventListener('webglcontextlost', contextLost);
    };
  }, [motion, resetKey, vs, ready]);
  return (
    <div className="scroll-stage" ref={ref}>
      <canvas className="sheet-canvas" aria-hidden="true" />
      {children}
    </div>
  );
}
