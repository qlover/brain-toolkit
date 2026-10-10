import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  AnimationState,
  ElementZoom,
  bindHistoryBack,
  lockBodyScroll,
  viewportInsetRect
} from '../src/index';

function rect(top: number, left: number, width: number, height: number) {
  return {
    top,
    left,
    width,
    height,
    right: left + width,
    bottom: top + height,
    x: left,
    y: top,
    toJSON: () => ({})
  } as DOMRect;
}

function setViewport(width: number, height: number) {
  Object.defineProperty(window, 'innerWidth', { value: width, configurable: true });
  Object.defineProperty(window, 'innerHeight', { value: height, configurable: true });
}

type FakeAnimation = {
  keyframes: Keyframe[];
  options: KeyframeAnimationOptions;
  finished: Promise<void>;
  finish: () => void;
  cancel: ReturnType<typeof vi.fn>;
  commitStyles: ReturnType<typeof vi.fn>;
};

/** Installs a controllable `Element.prototype.animate`. */
function mockAnimate() {
  const calls: { el: Element; anim: FakeAnimation }[] = [];
  const animate = vi.fn(function (
    this: Element,
    keyframes: Keyframe[],
    options: KeyframeAnimationOptions
  ) {
    let resolve!: () => void;
    const finished = new Promise<void>((r) => (resolve = r));
    const anim: FakeAnimation = {
      keyframes,
      options,
      finished,
      finish: () => resolve(),
      cancel: vi.fn(),
      commitStyles: vi.fn()
    };
    calls.push({ el: this, anim });
    return anim as unknown as Animation;
  });
  Object.defineProperty(HTMLElement.prototype, 'animate', {
    value: animate,
    configurable: true,
    writable: true
  });
  return {
    calls,
    finishAll: () => calls.forEach((c) => c.anim.finish()),
    restore: () => {
      delete (HTMLElement.prototype as { animate?: unknown }).animate;
    }
  };
}

describe('ElementZoom', () => {
  let target: HTMLDivElement;
  let origin: HTMLDivElement;
  let backdrop: HTMLDivElement;
  let ghost: HTMLDivElement;

  beforeEach(() => {
    setViewport(400, 800);
    target = document.createElement('div');
    origin = document.createElement('div');
    backdrop = document.createElement('div');
    ghost = document.createElement('div');
    origin.innerHTML = '<a href="#">row</a>';
    target.appendChild(ghost);
    document.body.append(origin, backdrop, target);
    origin.getBoundingClientRect = () => rect(300, 0, 400, 72);
  });

  afterEach(() => {
    document.body.innerHTML = '';
    document.body.style.overflow = '';
  });

  describe('without Web Animations API', () => {
    it('positions the card at the expanded rect and hides the origin', async () => {
      const zoom = new ElementZoom({
        target,
        origin: () => origin,
        backdrop,
        ghost,
        to: viewportInsetRect({ top: 28, gap: 10, radius: 22 })
      });

      await zoom.open();

      expect(zoom.state).toBe(AnimationState.EXPANDED);
      expect(target.style.position).toBe('fixed');
      expect(target.style.top).toBe('28px');
      expect(target.style.left).toBe('10px');
      expect(target.style.width).toBe('380px');
      expect(target.style.height).toBe('762px');
      expect(target.style.transform).toBe('translate(0px, 0px) scale(1)');
      expect(backdrop.style.opacity).toBe('1');
      expect(origin.style.visibility).toBe('hidden');
    });

    it('copies the origin into the ghost without focusable links', async () => {
      const zoom = new ElementZoom({ target, origin: () => origin, ghost });
      await zoom.open();

      const copy = ghost.firstElementChild as HTMLElement;
      expect(copy.textContent).toBe('row');
      expect(copy.style.visibility).toBe('visible');
      expect(copy.querySelector('a')?.getAttribute('tabindex')).toBe('-1');
    });

    it('restores the origin after closing and shares one close promise', async () => {
      const zoom = new ElementZoom({ target, origin: () => origin });
      await zoom.open();

      const first = zoom.close();
      expect(zoom.close()).toBe(first);
      await first;

      expect(zoom.state).toBe(AnimationState.COLLAPSED);
      expect(origin.style.visibility).toBe('');
    });

    it('keeps the origin visible when hideOrigin is false', async () => {
      const zoom = new ElementZoom({
        target,
        origin: () => origin,
        hideOrigin: false
      });
      await zoom.open();
      expect(origin.style.visibility).toBe('');
    });

    it('destroy shows the origin again', async () => {
      const zoom = new ElementZoom({ target, origin: () => origin });
      await zoom.open();
      zoom.destroy();
      expect(origin.style.visibility).toBe('');
      expect(zoom.state).toBe(AnimationState.IDLE);
    });
  });

  describe('with Web Animations API', () => {
    let fake: ReturnType<typeof mockAnimate>;

    beforeEach(() => {
      fake = mockAnimate();
    });

    afterEach(() => {
      fake.restore();
    });

    it('opens from the origin shape to the expanded shape', async () => {
      const zoom = new ElementZoom({
        target,
        origin: () => origin,
        to: () => ({ top: 28, left: 10, width: 380, height: 762, radius: 22 })
      });

      const opening = zoom.open();
      const card = fake.calls.find((c) => c.el === target)!.anim;
      expect(card.keyframes).toEqual([
        {
          transform: 'translate(-10px, 272px) scale(1)',
          clipPath: 'inset(0px 0px 690px 0px round 12px)',
          opacity: '1'
        },
        {
          transform: 'translate(0px, 0px) scale(1)',
          clipPath: 'inset(0px 0px 0px 0px round 22px)',
          opacity: '1'
        }
      ]);
      expect(card.options).toMatchObject({
        duration: 460,
        easing: 'cubic-bezier(.32,.72,0,1)',
        fill: 'both'
      });
      expect(zoom.state).toBe(AnimationState.EXPANDING);

      fake.finishAll();
      await opening;
      expect(zoom.state).toBe(AnimationState.EXPANDED);
      expect(target.style.clipPath).toBe('inset(0px 0px 0px 0px round 22px)');
    });

    it('fades and scales when the origin is off screen', async () => {
      origin.getBoundingClientRect = () => rect(-200, 0, 400, 72);
      const zoom = new ElementZoom({ target, origin: () => origin });

      void zoom.open();
      const card = fake.calls.find((c) => c.el === target)!.anim;
      expect(card.keyframes[0]).toMatchObject({
        opacity: '0',
        transform: 'translate(0px, 0px) scale(0.92)'
      });
      expect(origin.style.visibility).toBe('');
    });

    it('interrupting open with close starts from the current frame', async () => {
      const zoom = new ElementZoom({ target, origin: () => origin });
      void zoom.open();
      const openCard = fake.calls.find((c) => c.el === target)!.anim;

      void zoom.close();

      expect(openCard.commitStyles).toHaveBeenCalled();
      expect(openCard.cancel).toHaveBeenCalled();
      const closeCard = fake.calls.filter((c) => c.el === target)[1].anim;
      expect(closeCard.keyframes).toHaveLength(1);
      expect(zoom.state).toBe(AnimationState.COLLAPSING);
    });
  });

  describe('enableDragDismiss', () => {
    function touch(type: string, clientY: number) {
      const event = new Event(type, { cancelable: true }) as TouchEvent;
      Object.defineProperty(event, 'touches', { value: [{ clientY }] });
      return event;
    }

    it('dismisses after pulling past the distance', async () => {
      const scrollEl = document.createElement('div');
      target.appendChild(scrollEl);
      const onDismiss = vi.fn();
      const zoom = new ElementZoom({ target, origin: () => origin });
      await zoom.open();
      const dispose = zoom.enableDragDismiss({ scrollEl, onDismiss, distance: 50 });

      scrollEl.dispatchEvent(touch('touchstart', 100));
      scrollEl.dispatchEvent(touch('touchmove', 180));
      expect(target.style.transform).toContain('scale(0.95)');
      scrollEl.dispatchEvent(new Event('touchend'));

      expect(onDismiss).toHaveBeenCalledTimes(1);
      dispose();
    });

    it('springs back for a short pull', async () => {
      const scrollEl = document.createElement('div');
      target.appendChild(scrollEl);
      const onDismiss = vi.fn();
      const zoom = new ElementZoom({ target, origin: () => origin });
      await zoom.open();
      zoom.enableDragDismiss({ scrollEl, onDismiss, distance: 110 });

      scrollEl.dispatchEvent(touch('touchstart', 100));
      scrollEl.dispatchEvent(touch('touchmove', 140));
      scrollEl.dispatchEvent(new Event('touchend'));

      expect(onDismiss).not.toHaveBeenCalled();
      expect(target.style.transform).toBe('translate(0px, 0px) scale(1)');
    });

    it('ignores pulls while the content is scrolled', async () => {
      const scrollEl = document.createElement('div');
      scrollEl.scrollTop = 40;
      Object.defineProperty(scrollEl, 'scrollTop', { value: 40 });
      const onDismiss = vi.fn();
      const zoom = new ElementZoom({ target, origin: () => origin });
      await zoom.open();
      zoom.enableDragDismiss({ scrollEl, onDismiss, distance: 10 });

      scrollEl.dispatchEvent(touch('touchstart', 100));
      scrollEl.dispatchEvent(touch('touchmove', 300));
      scrollEl.dispatchEvent(new Event('touchend'));

      expect(onDismiss).not.toHaveBeenCalled();
    });
  });
});

describe('lockBodyScroll', () => {
  it('restores the previous overflow', () => {
    document.body.style.overflow = 'auto';
    const unlock = lockBodyScroll();
    expect(document.body.style.overflow).toBe('hidden');
    unlock();
    expect(document.body.style.overflow).toBe('auto');
  });
});

describe('bindHistoryBack', () => {
  afterEach(() => {
    window.history.replaceState(null, '');
  });

  it('pushes one entry and calls onBack on popstate', () => {
    const push = vi.spyOn(window.history, 'pushState');
    const onBackA = vi.fn();
    const onBackB = vi.fn();
    const first = bindHistoryBack(onBackA, { stateKey: 'zoomTest' });
    const second = bindHistoryBack(onBackB, { stateKey: 'zoomTest' });

    expect(push).toHaveBeenCalledTimes(1);
    window.dispatchEvent(new PopStateEvent('popstate'));
    expect(onBackA).toHaveBeenCalledTimes(1);
    expect(onBackB).toHaveBeenCalledTimes(1);

    first.dispose();
    second.dispose();
    window.dispatchEvent(new PopStateEvent('popstate'));
    expect(onBackA).toHaveBeenCalledTimes(1);
    expect(onBackB).toHaveBeenCalledTimes(1);
    push.mockRestore();
  });
});
