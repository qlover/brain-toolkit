import { CloudArrowUpIcon } from '@heroicons/react/24/outline';
import { clsx } from 'clsx';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import type { PAMI18nInterface } from '@config/i18n-mapping/PAMI18n';
import type { SearchPAMProject } from '@schemas/PAMProjectSchema';
import { PAMProjectCard } from './PAMProjectCard';
import {
  PAMProjectDetailDrawer,
  PAMProjectDetailSidePane,
  PAMProjectZoomCard,
  usePAMMediaQuery
} from './PAMProjectListDetail';
import { PAMProjectListItem } from './PAMProjectListItem';

const DETAIL_PINNED_KEY = 'pam-list-detail-pinned';

function isTypingTarget(target: EventTarget | null): boolean {
  const el = target as HTMLElement | null;
  return (
    !!el &&
    (el.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(el.tagName))
  );
}

/**
 * List-mode detail: drawer on ≥768px (pinnable into a side column on ≥1280px),
 * iOS-style expanding card on phones.
 */
function PAMProjectRowList(props: {
  tt: PAMI18nInterface;
  projects: readonly SearchPAMProject[];
  className?: string;
  highlightKeyword: string;
  highlightCategory: string;
}) {
  const { tt, projects, className, highlightKeyword, highlightCategory } =
    props;
  const isMobile = usePAMMediaQuery('(max-width: 767px)');
  const isXl = usePAMMediaQuery('(min-width: 1280px)');
  const listRef = useRef<HTMLDivElement>(null);
  const [pinned, setPinned] = useState(false);
  const [activeSlug, setActiveSlug] = useState<string | null>(null);
  const [zoomSlug, setZoomSlug] = useState<string | null>(null);

  useEffect(() => {
    setPinned(window.localStorage.getItem(DETAIL_PINNED_KEY) === '1');
  }, []);

  const savePinned = useCallback((value: boolean) => {
    setPinned(value);
    window.localStorage.setItem(DETAIL_PINNED_KEY, value ? '1' : '0');
  }, []);

  const split = pinned && isXl;
  const findProject = (slug: string | null) =>
    slug ? projects.find((p) => p.slug === slug) : undefined;
  const sideProject = split
    ? (findProject(activeSlug) ?? projects[0])
    : undefined;
  const drawerProject =
    !split && !isMobile ? findProject(activeSlug) : undefined;
  const zoomProject = findProject(zoomSlug);
  const currentSlug = (sideProject ?? drawerProject)?.slug ?? null;
  const currentIndex = currentSlug
    ? projects.findIndex((p) => p.slug === currentSlug)
    : -1;

  const step = useCallback(
    (delta: 1 | -1) => {
      const next = projects[currentIndex + delta];
      if (next) {
        setActiveSlug(next.slug);
        listRef.current
          ?.querySelector(`[data-pam-row="${CSS.escape(next.slug)}"]`)
          ?.scrollIntoView({ block: 'nearest' });
      }
    },
    [projects, currentIndex]
  );

  useEffect(() => {
    if (currentIndex < 0) {
      return;
    }
    const onKeyDown = (event: KeyboardEvent) => {
      if (isTypingTarget(event.target)) {
        return;
      }
      if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
        event.preventDefault();
        step(event.key === 'ArrowDown' ? 1 : -1);
      }
    };
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [currentIndex, step]);

  const openDetail = useCallback((slug: string) => {
    if (window.matchMedia('(max-width: 767px)').matches) {
      setZoomSlug(slug);
    } else {
      setActiveSlug(slug);
    }
  }, []);

  const getOrigin = useCallback(
    (slug: string) =>
      listRef.current?.querySelector<HTMLElement>(
        `[data-pam-row="${CSS.escape(slug)}"]`
      ) ?? null,
    []
  );

  return (
    <div
      data-testid="PAMProjectRowList"
      className={clsx(
        split && 'grid grid-cols-[minmax(0,1fr)_26rem] items-start gap-4'
      )}
    >
      <div
        ref={listRef}
        data-testid="PAMProjectList"
        className={clsx(
          'bg-secondary overflow-hidden rounded-2xl border border-primary-border shadow-sm',
          className
        )}
      >
        <div className="divide-y divide-primary-border">
          {projects.map((project) => (
            <PAMProjectListItem
              tt={tt}
              key={project.id}
              project={project}
              highlightKeyword={highlightKeyword}
              highlightCategory={highlightCategory}
              onOpenDetail={openDetail}
              selected={project.slug === currentSlug}
            />
          ))}
        </div>
      </div>

      {sideProject ? (
        <PAMProjectDetailSidePane
          tt={tt}
          project={sideProject}
          onUnpin={() => {
            savePinned(false);
            setActiveSlug(sideProject.slug);
          }}
        />
      ) : null}

      {drawerProject ? (
        <PAMProjectDetailDrawer
          tt={tt}
          project={drawerProject}
          canPrev={currentIndex > 0}
          canNext={currentIndex < projects.length - 1}
          onStep={step}
          onPin={() => savePinned(true)}
          onClose={() => setActiveSlug(null)}
        />
      ) : null}

      {zoomProject ? (
        <PAMProjectZoomCard
          tt={tt}
          project={zoomProject}
          getOrigin={getOrigin}
          onClosed={() => setZoomSlug(null)}
        />
      ) : null}
    </div>
  );
}

interface PAMProjectListProps {
  tt: PAMI18nInterface;
  projects: readonly SearchPAMProject[];
  viewMode: 'card' | 'compact';
  isOwner: (project: SearchPAMProject) => boolean;
  /** When false, hide readonly badges (guest). */
  isAuthenticated?: boolean;
  loading?: boolean;
  /** Dim list while a search/filter request is in flight. */
  searching?: boolean;
  /** Empty copy when keyword or category filter is active. */
  emptyFiltered?: boolean;
  /** Keyword used to highlight project titles. */
  highlightKeyword?: string;
  /** Active category filter used to highlight category chips. */
  highlightCategory?: string;
}

function PAMProjectListSkeleton({
  viewMode
}: {
  viewMode: 'card' | 'compact';
}) {
  const items = Array.from({ length: 6 }, (_, i) => i);

  if (viewMode === 'card') {
    return (
      <div
        data-testid="PAMProjectListSkeleton"
        className="grid grid-cols-1 items-start gap-2.5 sm:grid-cols-2 sm:gap-3 lg:grid-cols-3"
      >
        {items.map((key) => (
          <div
            data-testid="PAMProjectListSkeleton"
            key={key}
            className="animate-pulse overflow-hidden rounded-2xl border border-primary-border bg-secondary"
          >
            <div className="flex h-18 items-center gap-3 border-b border-primary-border px-3 sm:h-20 sm:px-3.5">
              <div className="h-11 w-11 shrink-0 rounded-xl bg-elevated sm:h-12 sm:w-12" />
              <div className="min-w-0 flex-1 space-y-2">
                <div className="h-3.5 w-2/3 rounded bg-elevated" />
                <div className="h-3 w-1/2 rounded bg-elevated" />
              </div>
            </div>
            <div className="p-3 sm:p-3.5">
              <div className="mb-3 space-y-2">
                <div className="h-4 w-2/3 rounded bg-elevated" />
                <div className="h-3 w-1/2 rounded bg-elevated" />
              </div>
              <div className="space-y-2">
                <div className="h-3 w-full rounded bg-elevated" />
                <div className="h-3 w-4/5 rounded bg-elevated" />
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div
      data-testid="PAMProjectListSkeleton"
      className="bg-secondary overflow-hidden rounded-2xl border border-primary-border shadow-sm"
    >
      <div className="divide-y divide-primary-border">
        {items.map((key) => (
          <div
            data-testid="PAMProjectListSkeleton"
            key={key}
            className="flex animate-pulse items-center gap-3 px-4 py-4 sm:gap-4 sm:px-5"
          >
            <div className="h-12 w-12 shrink-0 rounded-xl bg-elevated" />
            <div className="min-w-0 flex-1 space-y-2">
              <div className="h-4 w-1/3 rounded bg-elevated" />
              <div className="h-3 w-2/3 rounded bg-elevated" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function PAMProjectListEmpty({
  tt,
  filtered
}: {
  tt: PAMI18nInterface;
  filtered?: boolean;
}) {
  return (
    <div
      data-testid="PAMProjectListEmpty"
      className="bg-secondary mt-4 flex flex-col items-center justify-center rounded-2xl border border-dashed border-primary-border px-4 py-12 sm:py-16"
    >
      <CloudArrowUpIcon className="h-12 w-12 pam-empty-icon text-tertiary-text mb-3 text-4xl sm:text-5xl" />
      <p className="text-secondary-text text-sm sm:text-base">
        {filtered ? tt.noSearchMatch : tt.noProject}
      </p>
    </div>
  );
}

export const PAMProjectList: React.FC<PAMProjectListProps> = ({
  tt,
  projects,
  viewMode,
  isOwner,
  isAuthenticated = false,
  loading = false,
  searching = false,
  emptyFiltered = false,
  highlightKeyword = '',
  highlightCategory = ''
}) => {
  if (projects.length === 0) {
    return (
      <div data-testid="PAMProjectList">
        {loading ? (
          <PAMProjectListSkeleton viewMode={viewMode} />
        ) : (
          <PAMProjectListEmpty tt={tt} filtered={emptyFiltered} />
        )}
      </div>
    );
  }

  const listClassName = clsx(
    searching && 'pointer-events-none opacity-55 transition-opacity'
  );

  if (viewMode === 'card') {
    return (
      <div
        data-testid="PAMProjectList"
        className={clsx(
          'grid grid-cols-1 gap-2.5 sm:grid-cols-2 sm:gap-3 lg:grid-cols-3',
          listClassName
        )}
      >
        {projects.map((project) => (
          <PAMProjectCard
            tt={tt}
            key={project.id}
            project={project}
            isOwner={isOwner(project)}
            isAuthenticated={isAuthenticated}
            highlightKeyword={highlightKeyword}
            highlightCategory={highlightCategory}
          />
        ))}
      </div>
    );
  }

  return (
    <PAMProjectRowList
      tt={tt}
      projects={projects}
      className={listClassName}
      highlightKeyword={highlightKeyword}
      highlightCategory={highlightCategory}
    />
  );
};
