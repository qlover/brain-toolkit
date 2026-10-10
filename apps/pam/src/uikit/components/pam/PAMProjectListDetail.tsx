'use client';

import { useElementZoom } from '@brain-toolkit/element-sizer/react';
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
  useRef,
  useState,
  useSyncExternalStore
} from 'react';
import { createPortal } from 'react-dom';
import { Link } from '@/i18n/routing';
import type { PAMI18nInterface } from '@config/i18n-mapping/PAMI18n';
import { ROUTE_PROJECT_DETAIL } from '@config/route';
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
        pathname: ROUTE_PROJECT_DETAIL,
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
  const { targetRef, backdropRef, ghostRef, scrollRef, contentRef, close } =
    useElementZoom({
      origin: () => getOrigin(project.slug),
      history: { stateKey: 'pamZoom' },
      onClosed
    });

  return createPortal(
    <div data-testid="PAMProjectZoomCard" className="fixed inset-0 z-60">
      <div
        ref={backdropRef}
        className="absolute inset-0 bg-black/50 opacity-0 backdrop-blur-[2px]"
        onClick={close}
      />
      <div
        ref={targetRef}
        role="dialog"
        aria-modal="true"
        aria-label={project.name}
        className="overflow-hidden bg-secondary"
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
          ref={contentRef}
          type="button"
          aria-label={tt.detailClose}
          onClick={close}
          className="absolute top-3 right-3 z-10 inline-flex h-8 w-8 items-center justify-center rounded-full bg-black/45 text-white opacity-0 backdrop-blur"
        >
          <XMarkIcon className="h-4 w-4" />
        </button>
      </div>
    </div>,
    document.body
  );
}
