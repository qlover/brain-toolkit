import { AnimationState } from './AnimationState';

/**
 * Viewport rect (px) used as the start or end shape of a zoom.
 */
export type ElementZoomRect = {
  top: number;
  left: number;
  width: number;
  height: number;
  /** Corner radius in px. */
  radius?: number;
};

export type ElementZoomOptions = {
  /**
   * The card element. ElementZoom positions it `fixed` at the expanded rect and
   * animates `transform` + `clip-path` only, so its content never reflows.
   */
  target: HTMLElement;
  /**
   * Element the card grows out of and shrinks back into. Re-read on close, so the
   * position stays correct after scrolling. When it returns null or the element is
   * off screen, the card fades and scales instead.
   */
  origin?: () => HTMLElement | null;
  /**
   * Expanded rect, evaluated on every open.
   * @default viewportInsetRect()
   */
  to?: () => ElementZoomRect;
  /**
   * Corner radius used for the origin shape.
   * @default 12
   */
  originRadius?: number;
  /** @default 460 */
  duration?: number;
  /** @default 'cubic-bezier(.32,.72,0,1)' (iOS spring-like ease) */
  easing?: string;
  /** Mask behind the card; faded in and out with the card. */
  backdrop?: HTMLElement | null;
  /**
   * Container inside the target (absolutely positioned at its top-left) that shows a
   * static copy of the origin while the card grows and shrinks, so the origin appears
   * to turn into the card.
   */
  ghost?: HTMLElement | null;
  /** Elements faded in after the card starts opening and out when it starts closing. */
  content?: () => readonly HTMLElement[];
  /**
   * Hide the origin element while the card is open.
   * @default true
   */
  hideOrigin?: boolean;
};

export type ElementZoomDragOptions = {
  /** Scroll container; the drag only starts while it is scrolled to the top. */
  scrollEl: HTMLElement;
  /**
   * Pull distance (px) that triggers `onDismiss` on release.
   * @default 110
   */
  distance?: number;
  /** Called when the pull passes `distance`; usually closes the card. */
  onDismiss: () => void;
};

type FrameType = {
  transform: string;
  clipPath: string;
  opacity: string;
};

const DEFAULT_EASING = 'cubic-bezier(.32,.72,0,1)';

/**
 * Rect inset from the viewport edges, the default expanded shape.
 *
 * @example
 * new ElementZoom({ target, to: viewportInsetRect({ top: 28, gap: 10, radius: 22 }) });
 */
export function viewportInsetRect(
  options: { top?: number; gap?: number; radius?: number } = {}
): () => ElementZoomRect {
  const { top = 28, gap = 10, radius = 22 } = options;
  return () => ({
    top,
    left: gap,
    width: window.innerWidth - gap * 2,
    height: window.innerHeight - top - gap,
    radius
  });
}

function px(value: number): string {
  return `${Math.round(value * 100) / 100}px`;
}

function expandedFrame(radius: number, scale = 1): FrameType {
  return {
    transform: `translate(0px, 0px) scale(${scale})`,
    clipPath: `inset(0px 0px 0px 0px round ${px(radius)})`,
    opacity: '1'
  };
}

/**
 * Card translated onto the origin and clipped to its size, so the card's top-left
 * part sits exactly where the origin is.
 */
function originFrame(origin: ElementZoomRect, to: ElementZoomRect): FrameType {
  const right = Math.max(0, to.width - origin.width);
  const bottom = Math.max(0, to.height - origin.height);
  return {
    transform: `translate(${px(origin.left - to.left)}, ${px(origin.top - to.top)}) scale(1)`,
    clipPath: `inset(0px ${px(right)} ${px(bottom)} 0px round ${px(origin.radius ?? 0)})`,
    opacity: '1'
  };
}

function fallbackFrame(radius: number): FrameType {
  return { ...expandedFrame(radius, 0.92), opacity: '0' };
}

function supportsAnimate(el: HTMLElement): boolean {
  return typeof el.animate === 'function';
}

/**
 * iOS-style "card grows out of an element" transition built on the Web Animations API.
 *
 * Significance: Shared element zoom for lists, cards and galleries.
 * Core idea: The card is laid out once at its final rect; only `transform` and
 * `clip-path` animate, so frames stay on the compositor and content is never squeezed.
 * Main function: `open()` / `close()` (interruptible, promise based) plus optional
 * pull-down-to-dismiss.
 * Main purpose: Framework-agnostic core; see `@brain-toolkit/element-sizer/react` for a hook.
 *
 * @example
 * const zoom = new ElementZoom({ target: card, origin: () => row, backdrop: mask });
 * await zoom.open();
 * await zoom.close();
 * zoom.destroy();
 */
export class ElementZoom {
  private _state: AnimationState = AnimationState.IDLE;
  private readonly running = new WeakMap<Element, Animation>();
  private hiddenOrigin: HTMLElement | null = null;
  private expandedRect: ElementZoomRect | null = null;
  private closePromise: Promise<void> | null = null;

  constructor(protected options: ElementZoomOptions) {}

  public get state(): AnimationState {
    return this._state;
  }

  public get target(): HTMLElement {
    return this.options.target;
  }

  public setOptions(options: Partial<ElementZoomOptions>): this {
    this.options = { ...this.options, ...options };
    return this;
  }

  private get duration(): number {
    return this.options.duration ?? 460;
  }

  private get easing(): string {
    return this.options.easing ?? DEFAULT_EASING;
  }

  private get radius(): number {
    return this.expandedRect?.radius ?? 0;
  }

  /** Origin rect, or null when there is no origin or it is scrolled out of view. */
  private measureOrigin(): { el: HTMLElement; rect: ElementZoomRect } | null {
    const el = this.options.origin?.() ?? null;
    if (!el) {
      return null;
    }
    const rect = el.getBoundingClientRect();
    if (rect.bottom < 0 || rect.top > window.innerHeight) {
      return null;
    }
    return {
      el,
      rect: {
        top: rect.top,
        left: rect.left,
        width: rect.width,
        height: rect.height,
        radius: this.options.originRadius ?? 12
      }
    };
  }

  private fillGhost(origin: HTMLElement | null): void {
    const ghost = this.options.ghost;
    if (!ghost) {
      return;
    }
    if (!origin) {
      ghost.replaceChildren();
      return;
    }
    const copy = origin.cloneNode(true) as HTMLElement;
    copy.style.visibility = 'visible';
    copy.style.width = `${origin.offsetWidth}px`;
    copy.querySelectorAll('a, button, input, select, textarea').forEach((n) => {
      n.setAttribute('tabindex', '-1');
    });
    copy.removeAttribute('id');
    ghost.replaceChildren(copy);
  }

  /**
   * Animate `el` to `to`. With `from` omitted the animation starts from the element's
   * current visual state, which makes it safe to interrupt a running animation.
   */
  private run(
    el: HTMLElement | null | undefined,
    from: Partial<FrameType> | null,
    to: Partial<FrameType>,
    timing: { duration: number; delay?: number; easing?: string }
  ): Promise<void> {
    if (!el) {
      return Promise.resolve();
    }
    const prev = this.running.get(el);
    if (prev) {
      try {
        prev.commitStyles();
      } catch {
        // element not rendered; nothing to commit
      }
      prev.cancel();
      this.running.delete(el);
    }
    if (!supportsAnimate(el) || timing.duration <= 0) {
      Object.assign(el.style, to);
      return Promise.resolve();
    }
    const animation = el.animate(
      (from ? [from, to] : [to]) as Keyframe[],
      { ...timing, fill: 'both' }
    );
    this.running.set(el, animation);
    return animation.finished.then(
      () => {
        if (this.running.get(el) === animation) {
          Object.assign(el.style, to);
          animation.cancel();
          this.running.delete(el);
        }
      },
      () => undefined
    );
  }

  private stopAll(): void {
    const { target, backdrop, ghost } = this.options;
    const els = [target, backdrop, ghost, ...(this.options.content?.() ?? [])];
    for (const el of els) {
      if (el) {
        this.running.get(el)?.cancel();
        this.running.delete(el);
      }
    }
  }

  private restoreOrigin(): void {
    if (this.hiddenOrigin) {
      this.hiddenOrigin.style.visibility = '';
      this.hiddenOrigin = null;
    }
  }

  /**
   * Grow the card out of the origin. Resolves when the card is fully open.
   */
  public async open(): Promise<void> {
    const { target, backdrop, ghost, hideOrigin = true } = this.options;
    const to = (this.options.to ?? viewportInsetRect())();
    const origin = this.measureOrigin();
    const duration = this.duration;
    const easing = this.easing;

    this.closePromise = null;
    this.expandedRect = to;
    this._state = AnimationState.EXPANDING;

    Object.assign(target.style, {
      position: 'fixed',
      top: px(to.top),
      left: px(to.left),
      width: px(to.width),
      height: px(to.height),
      transformOrigin: '50% 50%'
    });

    this.fillGhost(origin?.el ?? null);
    if (origin && hideOrigin) {
      this.restoreOrigin();
      origin.el.style.visibility = 'hidden';
      this.hiddenOrigin = origin.el;
    }

    const from = origin
      ? originFrame(origin.rect, to)
      : fallbackFrame(to.radius ?? 0);
    const content = this.options.content?.() ?? [];

    const done = Promise.all([
      this.run(target, from, expandedFrame(to.radius ?? 0), {
        duration,
        easing
      }),
      this.run(
        backdrop,
        { opacity: '0' },
        { opacity: '1' },
        {
          duration: Math.min(300, duration)
        }
      ),
      this.run(
        ghost,
        { opacity: '1' },
        { opacity: '0' },
        {
          duration: 160
        }
      ),
      ...content.map((el) =>
        this.run(
          el,
          { opacity: '0' },
          { opacity: '1' },
          {
            duration: 260,
            delay: 90
          }
        )
      )
    ]);
    await done;
    if (this._state === AnimationState.EXPANDING) {
      this._state = AnimationState.EXPANDED;
    }
  }

  /**
   * Shrink the card back into the origin (re-measured now). Safe to call while
   * opening or mid-drag; repeated calls share one animation.
   */
  public close(): Promise<void> {
    if (this.closePromise) {
      return this.closePromise;
    }
    const { target, backdrop, ghost } = this.options;
    const to = this.expandedRect;
    const origin = this.measureOrigin();
    const duration = this.duration;
    const easing = this.easing;
    this._state = AnimationState.COLLAPSING;

    this.fillGhost(origin?.el ?? null);
    const end =
      origin && to ? originFrame(origin.rect, to) : fallbackFrame(this.radius);
    const content = this.options.content?.() ?? [];

    this.closePromise = Promise.all([
      this.run(target, null, end, { duration, easing }),
      this.run(
        backdrop,
        null,
        { opacity: '0' },
        {
          duration: Math.min(300, duration)
        }
      ),
      this.run(
        ghost,
        null,
        { opacity: origin ? '1' : '0' },
        {
          duration: 200,
          delay: 120
        }
      ),
      ...content.map((el) =>
        this.run(
          el,
          null,
          { opacity: '0' },
          {
            duration: 120
          }
        )
      )
    ]).then(() => {
      this.restoreOrigin();
      this._state = AnimationState.COLLAPSED;
    });
    return this.closePromise;
  }

  /**
   * Pull down from the top of `scrollEl` to shrink the card; releasing past
   * `distance` calls `onDismiss`, otherwise the card springs back.
   * @returns Function that removes the listeners.
   */
  public enableDragDismiss(options: ElementZoomDragOptions): () => void {
    const { scrollEl, distance = 110, onDismiss } = options;
    const target = this.options.target;
    let startY: number | null = null;
    let deltaY = 0;

    const onStart = (event: TouchEvent) => {
      startY = scrollEl.scrollTop <= 0 ? event.touches[0].clientY : null;
      deltaY = 0;
    };
    const onMove = (event: TouchEvent) => {
      if (startY === null || this._state !== AnimationState.EXPANDED) {
        return;
      }
      deltaY = event.touches[0].clientY - startY;
      if (deltaY <= 0) {
        return;
      }
      event.preventDefault();
      const scale = 1 - Math.min(deltaY, 400) / 1600;
      const radius = Math.max(this.radius, Math.min(32, deltaY / 4));
      const frame = expandedFrame(radius, scale);
      Object.assign(target.style, {
        transform: frame.transform,
        clipPath: frame.clipPath
      });
    };
    const onEnd = () => {
      if (startY === null || this._state !== AnimationState.EXPANDED) {
        startY = null;
        return;
      }
      startY = null;
      if (deltaY > distance) {
        onDismiss();
        return;
      }
      if (deltaY > 0) {
        void this.run(target, null, expandedFrame(this.radius), {
          duration: 260,
          easing: this.easing
        });
      }
    };

    scrollEl.addEventListener('touchstart', onStart, { passive: true });
    scrollEl.addEventListener('touchmove', onMove, { passive: false });
    scrollEl.addEventListener('touchend', onEnd);
    scrollEl.addEventListener('touchcancel', onEnd);
    return () => {
      scrollEl.removeEventListener('touchstart', onStart);
      scrollEl.removeEventListener('touchmove', onMove);
      scrollEl.removeEventListener('touchend', onEnd);
      scrollEl.removeEventListener('touchcancel', onEnd);
    };
  }

  /** Cancel animations and show the origin again. */
  public destroy(): void {
    this.stopAll();
    this.restoreOrigin();
    this.closePromise = null;
    this._state = AnimationState.IDLE;
  }
}

/**
 * Lock page scroll while an overlay is open.
 * @returns Function that restores the previous overflow value.
 */
export function lockBodyScroll(): () => void {
  const body = document.body;
  const prev = body.style.overflow;
  body.style.overflow = 'hidden';
  return () => {
    body.style.overflow = prev;
  };
}

/**
 * Make the browser / system back gesture close an overlay: pushes one history entry
 * (skipped when the current entry already carries `stateKey`, e.g. on a StrictMode
 * re-run) and calls `onBack` on `popstate`.
 *
 * Close the overlay with `back()` so the pushed entry is consumed.
 */
export function bindHistoryBack(
  onBack: () => void,
  options: { stateKey?: string } = {}
): { back: () => void; dispose: () => void } {
  const stateKey = options.stateKey ?? 'elementZoom';
  const current = window.history.state as Record<string, unknown> | null;
  if (!current?.[stateKey]) {
    window.history.pushState({ ...current, [stateKey]: true }, '');
  }
  window.addEventListener('popstate', onBack);
  return {
    back: () => window.history.back(),
    dispose: () => window.removeEventListener('popstate', onBack)
  };
}
