'use client';

import {
  ArrowTopRightOnSquareIcon,
  ChevronDownIcon,
  ChevronUpIcon,
  ViewColumnsIcon,
  XMarkIcon
} from '@heroicons/react/24/outline';
import { clsx } from 'clsx';
import React, {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  useSyncExternalStore
} from 'react';
import { createPortal } from 'react-dom';
import { Link } from '@/i18n/routing';
import type { PAMI18nInterface } from '@config/i18n-mapping/PAMI18n';
import { ROUTE_PROJECT_GENERAL } from '@config/route';
import {
  PAMProjectDetailBody,
  type PAMProjectDetailModel
} from './PAMProjectDetailBody';

export function usePAMMediaQuery(query: string): boolean {
  const subscribe = useCallback(
    (onChange: () => void) => {
      const mql = window.matchMedia(query);
      mql.addEventListener('change', onChange);
      return () => mql.removeEventListener('change', onChange);
    },
    [query]
  );
  return useSyncExternalStore(
    subscribe,
    () => window.matchMedia(query).matches,
    () => false
  );
}

const ICON_BUTTON =
  'inline-flex h-8 w-8 items-center justify-center rounded-lg text-secondary-text transition hover:bg-elevated hover:text-primary-text disabled:pointer-events-none disabled:opacity-35';

function OpenPageLink(props: { tt: PAMI18nInterface; slug: string }) {
  return (
    <Link
      href={{
        pathname: ROUTE_PROJECT_GENERAL,
        params: { projectId: props.slug }
      }}
      title={props.tt.detailOpenPage}
      aria-label={props.tt.detailOpenPage}
      className={ICON_BUTTON}
    >
      <ArrowTopRightOnSquareIcon className="h-4 w-4" />
    </Link>
  );
}

const DRAWER_MS = 200;

/** Right-side drawer (≥768px). Esc / mask closes; pin turns it into the side column on ≥1280px. */
export function PAMProjectDetailDrawer(props: {
  tt: PAMI18nInterface;
  project: PAMProjectDetailModel;
  canPrev: boolean;
  canNext: boolean;
  onStep: (delta: 1 | -1) => void;
  onPin: () => void;
  onClose: () => void;
}) {
  const { tt, project, canPrev, canNext, onStep, onPin, onClose } = props;
  const [shown, setShown] = useState(false);
  const panelRef = useRef<HTMLElement>(null);

  const requestClose = useCallback(() => {
    setShown(false);
    window.setTimeout(onClose, DRAWER_MS);
  }, [onClose]);

  useEffect(() => {
    const raf = requestAnimationFrame(() => setShown(true));
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      cancelAnimationFrame(raf);
      document.body.style.overflow = prevOverflow;
    };
  }, []);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        requestClose();
      }
    };
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [requestClose]);

  useEffect(() => {
    panelRef.current?.scrollTo({ top: 0 });
  }, [project.slug]);

  return createPortal(
    <div data-testid="PAMProjectDetailDrawer" className="fixed inset-0 z-60">
      <div
        className={clsx(
          'absolute inset-0 bg-black/25 transition-opacity duration-200',
          shown ? 'opacity-100' : 'opacity-0'
        )}
        onClick={requestClose}
      />
      <aside
        ref={panelRef}
        role="dialog"
        aria-label={project.name}
        className={clsx(
          'absolute inset-y-0 right-0 w-full max-w-120 overflow-y-auto overscroll-contain border-l border-primary-border bg-secondary p-5 shadow-2xl transition-transform duration-200 ease-out',
          shown ? 'translate-x-0' : 'translate-x-full'
        )}
      >
        <PAMProjectDetailBody
          tt={tt}
          project={project}
          variant="panel"
          actions={
            <>
              <button
                type="button"
                className={ICON_BUTTON}
                disabled={!canPrev}
                title={tt.detailPrev}
                aria-label={tt.detailPrev}
                onClick={() => onStep(-1)}
              >
                <ChevronUpIcon className="h-4 w-4" />
              </button>
              <button
                type="button"
                className={ICON_BUTTON}
                disabled={!canNext}
                title={tt.detailNext}
                aria-label={tt.detailNext}
                onClick={() => onStep(1)}
              >
                <ChevronDownIcon className="h-4 w-4" />
              </button>
              <button
                type="button"
                className={clsx(ICON_BUTTON, 'max-xl:hidden')}
                title={tt.detailPin}
                aria-label={tt.detailPin}
                onClick={onPin}
              >
                <ViewColumnsIcon className="h-4 w-4" />
              </button>
              <OpenPageLink tt={tt} slug={project.slug} />
              <button
                type="button"
                className={ICON_BUTTON}
                title={tt.detailClose}
                aria-label={tt.detailClose}
                onClick={requestClose}
              >
                <XMarkIcon className="h-4 w-4" />
              </button>
            </>
          }
        />
      </aside>
    </div>,
    document.body
  );
}

/** Pinned side column next to the list (≥1280px). */
export function PAMProjectDetailSidePane(props: {
  tt: PAMI18nInterface;
  project: PAMProjectDetailModel;
  onUnpin: () => void;
}) {
  const { tt, project, onUnpin } = props;
  const paneRef = useRef<HTMLElement>(null);

  useEffect(() => {
    paneRef.current?.scrollTo({ top: 0 });
  }, [project.slug]);

  return (
    <aside
      ref={paneRef}
      data-testid="PAMProjectDetailSidePane"
      aria-label={project.name}
      className="sticky top-20 max-h-[calc(100vh-6rem)] overflow-y-auto overscroll-contain rounded-2xl border border-primary-border bg-secondary p-5 shadow-sm"
    >
      <PAMProjectDetailBody
        tt={tt}
        project={project}
        variant="panel"
        actions={
          <>
            <button
              type="button"
              className={clsx(ICON_BUTTON, 'text-brand hover:text-brand')}
              title={tt.detailUnpin}
              aria-label={tt.detailUnpin}
              aria-pressed
              onClick={onUnpin}
            >
              <ViewColumnsIcon className="h-4 w-4" />
            </button>
            <OpenPageLink tt={tt} slug={project.slug} />
          </>
        }
      />
    </aside>
  );
}

const IOS_EASE = 'cubic-bezier(.32,.72,0,1)';
const ZOOM_MS = 460;
const ZOOM_TRANSITION = [
  'top',
  'left',
  'width',
  'height',
  'border-radius',
  'transform',
  'opacity'
]
  .map((prop) => `${prop} ${ZOOM_MS}ms ${IOS_EASE}`)
  .join(',');
const ZOOM_GAP = 10;
const ZOOM_TOP = 28;
const ZOOM_RADIUS = 22;
const DISMISS_DISTANCE = 110;

type ZoomRect = {
  top: number;
  left: number;
  width: number;
  height: number;
  radius: number;
};

function zoomTargetRect(): ZoomRect {
  return {
    top: ZOOM_TOP,
    left: ZOOM_GAP,
    width: window.innerWidth - ZOOM_GAP * 2,
    height: window.innerHeight - ZOOM_TOP - ZOOM_GAP,
    radius: ZOOM_RADIUS
  };
}

/** Rect of the origin row, or null when it is scrolled out of view. */
function originRect(origin: HTMLElement | null): ZoomRect | null {
  const rect = origin?.getBoundingClientRect();
  if (!rect || rect.bottom < 0 || rect.top > window.innerHeight) {
    return null;
  }
  return {
    top: rect.top,
    left: rect.left,
    width: rect.width,
    height: rect.height,
    radius: 12
  };
}

function applyRect(el: HTMLElement, rect: ZoomRect) {
  el.style.top = `${rect.top}px`;
  el.style.left = `${rect.left}px`;
  el.style.width = `${rect.width}px`;
  el.style.height = `${rect.height}px`;
  el.style.borderRadius = `${rect.radius}px`;
}

function fadeTo(el: HTMLElement | null, opacity: number, transition: string) {
  if (el) {
    el.style.transition = transition;
    el.style.opacity = String(opacity);
  }
}

/** Static copy of the row shown while the card grows / shrinks, so the row appears to turn into the card. */
function fillGhost(ghost: HTMLElement | null, origin: HTMLElement | null) {
  if (!ghost || !origin) {
    return;
  }
  const copy = origin.cloneNode(true) as HTMLElement;
  copy.style.visibility = 'visible';
  copy.style.width = `${origin.offsetWidth}px`;
  copy.querySelectorAll('a, button').forEach((node) => {
    node.setAttribute('tabindex', '-1');
  });
  ghost.replaceChildren(copy);
}

/**
 * Mobile (<768px) iOS-style expanding card: the tapped row grows into a card with a small
 * gap around it and shrinks back into the row on close. Close via ✕, mask, system back,
 * or pulling down from the top of the card.
 */
export function PAMProjectZoomCard(props: {
  tt: PAMI18nInterface;
  project: PAMProjectDetailModel;
  getOrigin: (slug: string) => HTMLElement | null;
  onClosed: () => void;
}) {
  const { tt, project, getOrigin, onClosed } = props;
  const maskRef = useRef<HTMLDivElement>(null);
  const boxRef = useRef<HTMLDivElement>(null);
  const ghostRef = useRef<HTMLDivElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  const closingRef = useRef(false);
  const latest = useRef({ slug: project.slug, getOrigin, onClosed });

  useLayoutEffect(() => {
    latest.current = { slug: project.slug, getOrigin, onClosed };
  }, [project.slug, getOrigin, onClosed]);

  const animateClose = useCallback(() => {
    const box = boxRef.current;
    if (!box || closingRef.current) {
      return;
    }
    closingRef.current = true;
    const origin = latest.current.getOrigin(latest.current.slug);
    const to = originRect(origin);
    fillGhost(ghostRef.current, origin);
    box.style.transition = ZOOM_TRANSITION;
    fadeTo(scrollRef.current, 0, 'opacity 120ms');
    fadeTo(closeRef.current, 0, 'opacity 120ms');
    fadeTo(ghostRef.current, 1, 'opacity 200ms 120ms');
    if (to) {
      box.style.transform = '';
      applyRect(box, to);
    } else {
      box.style.opacity = '0';
      box.style.transform = 'scale(0.92)';
    }
    if (maskRef.current) {
      maskRef.current.style.opacity = '0';
    }
    document.body.style.overflow = '';
    window.setTimeout(() => latest.current.onClosed(), ZOOM_MS);
  }, []);

  useLayoutEffect(() => {
    const box = boxRef.current;
    const scroll = scrollRef.current;
    if (!box || !scroll) {
      return;
    }
    const origin = latest.current.getOrigin(latest.current.slug);
    const target = zoomTargetRect();
    const from = originRect(origin);

    fillGhost(ghostRef.current, origin);
    if (origin) {
      origin.style.visibility = 'hidden';
    }
    scroll.style.width = `${target.width}px`;
    box.style.transition = 'none';
    applyRect(box, from ?? target);
    if (!from) {
      box.style.opacity = '0';
      box.style.transform = 'scale(0.92)';
    }
    // Commit the start rect before transitioning to the target.
    void box.offsetWidth;

    const raf = requestAnimationFrame(() => {
      box.style.transition = ZOOM_TRANSITION;
      applyRect(box, target);
      box.style.opacity = '1';
      box.style.transform = '';
      if (maskRef.current) {
        maskRef.current.style.opacity = '1';
      }
      fadeTo(ghostRef.current, 0, 'opacity 160ms');
      fadeTo(scroll, 1, 'opacity 260ms 90ms');
      fadeTo(closeRef.current, 1, 'opacity 260ms 90ms');
    });

    document.body.style.overflow = 'hidden';
    // Guarded so a re-run effect (StrictMode) does not stack history entries.
    if (!(window.history.state as { pamZoom?: boolean } | null)?.pamZoom) {
      window.history.pushState(
        { ...(window.history.state as object), pamZoom: true },
        ''
      );
    }
    window.addEventListener('popstate', animateClose);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('popstate', animateClose);
      document.body.style.overflow = '';
      if (origin) {
        origin.style.visibility = '';
      }
    };
  }, [animateClose]);

  useEffect(() => {
    const box = boxRef.current;
    const scroll = scrollRef.current;
    if (!box || !scroll) {
      return;
    }
    let startY: number | null = null;
    let deltaY = 0;
    const onStart = (event: TouchEvent) => {
      startY = scroll.scrollTop <= 0 ? event.touches[0].clientY : null;
      deltaY = 0;
    };
    const onMove = (event: TouchEvent) => {
      if (startY === null || closingRef.current) {
        return;
      }
      deltaY = event.touches[0].clientY - startY;
      if (deltaY <= 0) {
        return;
      }
      event.preventDefault();
      box.style.transition = 'none';
      box.style.transform = `scale(${1 - Math.min(deltaY, 400) / 1600})`;
      box.style.borderRadius = `${Math.max(ZOOM_RADIUS, Math.min(32, deltaY / 4))}px`;
    };
    const onEnd = () => {
      if (startY === null || closingRef.current) {
        return;
      }
      startY = null;
      box.style.transition = ZOOM_TRANSITION;
      if (deltaY > DISMISS_DISTANCE) {
        window.history.back();
        return;
      }
      box.style.transform = '';
      box.style.borderRadius = `${ZOOM_RADIUS}px`;
    };
    scroll.addEventListener('touchstart', onStart, { passive: true });
    scroll.addEventListener('touchmove', onMove, { passive: false });
    scroll.addEventListener('touchend', onEnd);
    scroll.addEventListener('touchcancel', onEnd);
    return () => {
      scroll.removeEventListener('touchstart', onStart);
      scroll.removeEventListener('touchmove', onMove);
      scroll.removeEventListener('touchend', onEnd);
      scroll.removeEventListener('touchcancel', onEnd);
    };
  }, []);

  return createPortal(
    <div data-testid="PAMProjectZoomCard" className="fixed inset-0 z-60">
      <div
        ref={maskRef}
        className="absolute inset-0 bg-black/50 opacity-0 backdrop-blur-[2px] transition-opacity duration-300"
        onClick={() => window.history.back()}
      />
      <div
        ref={boxRef}
        role="dialog"
        aria-modal="true"
        aria-label={project.name}
        className="fixed overflow-hidden border border-primary-border bg-secondary shadow-2xl"
      >
        <div
          ref={ghostRef}
          aria-hidden
          className="pointer-events-none absolute top-0 left-0"
        />
        <div
          ref={scrollRef}
          className="h-full overflow-y-auto overscroll-contain opacity-0"
        >
          <PAMProjectDetailBody tt={tt} project={project} variant="card" />
        </div>
        <button
          ref={closeRef}
          type="button"
          aria-label={tt.detailClose}
          onClick={() => window.history.back()}
          className="absolute top-3 right-3 z-10 inline-flex h-8 w-8 items-center justify-center rounded-full bg-black/45 text-white opacity-0 backdrop-blur"
        >
          <XMarkIcon className="h-4 w-4" />
        </button>
      </div>
    </div>,
    document.body
  );
}
