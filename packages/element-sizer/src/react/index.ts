import { useCallback, useLayoutEffect, useRef, type RefObject } from 'react';
import {
  ElementZoom,
  bindHistoryBack,
  lockBodyScroll,
  type ElementZoomOptions,
  type ElementZoomRect
} from '../ElementZoom';

export type UseElementZoomOptions = {
  /** Element the card grows out of; re-read on close. */
  origin?: () => HTMLElement | null;
  /** Expanded rect; defaults to `viewportInsetRect()`. */
  to?: () => ElementZoomRect;
  originRadius?: number;
  duration?: number;
  easing?: string;
  hideOrigin?: boolean;
  /**
   * Push a history entry so the browser / system back gesture closes the card.
   * @default true
   */
  history?: boolean | { stateKey?: string };
  /** @default true */
  lockScroll?: boolean;
  /**
   * Pull down from the top of the `scrollRef` element to close.
   * @default true
   */
  dragToDismiss?: boolean | { distance?: number };
  /** Called after the close animation; unmount the card here. */
  onClosed: () => void;
};

export type UseElementZoomResult = {
  /** The card element. */
  targetRef: RefObject<HTMLDivElement | null>;
  backdropRef: RefObject<HTMLDivElement | null>;
  /** Absolutely positioned container at the card's top-left for the origin copy. */
  ghostRef: RefObject<HTMLDivElement | null>;
  /** Card content scroll container: faded in after opening starts, and used by pull-to-dismiss. */
  scrollRef: RefObject<HTMLDivElement | null>;
  /** Callback ref for extra elements faded with the content, e.g. a close button (may be used on several). */
  contentRef: (el: HTMLElement | null) => void;
  /** Close the card (through history when enabled). */
  close: () => void;
};

/**
 * Open an {@link ElementZoom} card on mount and close it with animation.
 *
 * Render the card in a portal and unmount it in `onClosed`.
 *
 * @example
 * // Destructure: React Compiler lint flags property access on objects holding refs.
 * const { targetRef, backdropRef, ghostRef, scrollRef, contentRef, close } =
 *   useElementZoom({ origin: () => rowEl, onClosed: () => setOpen(false) });
 * return createPortal(
 *   <div className="fixed inset-0">
 *     <div ref={backdropRef} onClick={close} className="opacity-0" />
 *     <div ref={targetRef} role="dialog" className="overflow-hidden">
 *       <div ref={ghostRef} className="absolute top-0 left-0" />
 *       <div ref={scrollRef} className="h-full overflow-y-auto opacity-0" />
 *       <button ref={contentRef} onClick={close} className="opacity-0" />
 *     </div>
 *   </div>,
 *   document.body
 * );
 */
export function useElementZoom(
  options: UseElementZoomOptions
): UseElementZoomResult {
  const targetRef = useRef<HTMLDivElement | null>(null);
  const backdropRef = useRef<HTMLDivElement | null>(null);
  const ghostRef = useRef<HTMLDivElement | null>(null);
  const scrollRef = useRef<HTMLDivElement | null>(null);
  const contentEls = useRef(new Set<HTMLElement>());
  const latest = useRef(options);
  const requestClose = useRef<() => void>(() => undefined);

  useLayoutEffect(() => {
    latest.current = options;
  });

  const contentRef = useCallback((el: HTMLElement | null) => {
    if (el) {
      contentEls.current.add(el);
    }
  }, []);

  useLayoutEffect(() => {
    const target = targetRef.current;
    if (!target) {
      return;
    }
    const opts = latest.current;
    const zoomOptions: ElementZoomOptions = {
      target,
      origin: () => latest.current.origin?.() ?? null,
      to: opts.to,
      originRadius: opts.originRadius,
      duration: opts.duration,
      easing: opts.easing,
      hideOrigin: opts.hideOrigin,
      backdrop: backdropRef.current,
      ghost: ghostRef.current,
      content: () =>
        [scrollRef.current, ...contentEls.current].filter(
          (el): el is HTMLElement => !!el && el.isConnected
        )
    };
    const zoom = new ElementZoom(zoomOptions);
    const unlock = opts.lockScroll === false ? null : lockBodyScroll();
    let closing = false;

    const animateClose = () => {
      if (closing) {
        return;
      }
      closing = true;
      unlock?.();
      void zoom.close().then(() => latest.current.onClosed());
    };

    const historyOpt = opts.history ?? true;
    const history = historyOpt
      ? bindHistoryBack(
          animateClose,
          typeof historyOpt === 'object' ? historyOpt : {}
        )
      : null;
    requestClose.current = history ? history.back : animateClose;

    const dragOpt = opts.dragToDismiss ?? true;
    const scrollEl = scrollRef.current;
    const disposeDrag =
      dragOpt && scrollEl
        ? zoom.enableDragDismiss({
            scrollEl,
            distance: typeof dragOpt === 'object' ? dragOpt.distance : undefined,
            onDismiss: () => requestClose.current()
          })
        : null;

    void zoom.open();

    return () => {
      disposeDrag?.();
      history?.dispose();
      unlock?.();
      zoom.destroy();
    };
  }, []);

  const close = useCallback(() => requestClose.current(), []);

  return { targetRef, backdropRef, ghostRef, scrollRef, contentRef, close };
}
