'use client';

import {
  ArrowRightIcon,
  ArrowTopRightOnSquareIcon,
  DocumentTextIcon,
  GlobeAltIcon,
  LinkIcon,
  SwatchIcon,
  TicketIcon
} from '@heroicons/react/24/outline';
import { clsx } from 'clsx';
import React, {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState
} from 'react';
import { createPortal } from 'react-dom';
import { Link } from '@/i18n/routing';
import type {
  PAMDescLink,
  PAMDescLinkKind
} from '@shared/utils/PAMDescMarkdownUtil';
import type { PAMI18nInterface } from '@config/i18n-mapping/PAMI18n';
import { ROUTE_PROJECT_DETAIL } from '@config/route';
import type { PAMEnvWriteable } from '@schemas/PAMEnvironmentSchema';
import { PAMIcon } from './PAMIcon';
import { getPAMDisplayHost } from './PAMProjectDisplayUtil';

const LINK_KIND_ICON: Record<PAMDescLinkKind, typeof LinkIcon> = {
  design: SwatchIcon,
  issue: TicketIcon,
  doc: DocumentTextIcon,
  link: LinkIcon
};

export function getPAMDescLinkKindLabel(
  tt: PAMI18nInterface,
  kind: PAMDescLinkKind
): string {
  switch (kind) {
    case 'design':
      return tt.linkKindDesign;
    case 'issue':
      return tt.linkKindIssue;
    case 'doc':
      return tt.linkKindDoc;
    default:
      return tt.linkKindLink;
  }
}

/**
 * Description link chip: dashed border so it reads differently from env chips.
 * `iconOnly` keeps just the kind icon (title on hover) for dense rows.
 */
export function PAMDescLinkChip(props: {
  tt: PAMI18nInterface;
  link: PAMDescLink;
  compact?: boolean;
  iconOnly?: boolean;
  className?: string;
}) {
  const { tt, link, compact = false, iconOnly = false, className } = props;
  const Icon = LINK_KIND_ICON[link.kind];
  const label = `${getPAMDescLinkKindLabel(tt, link.kind)} · ${link.title}`;

  return (
    <a
      data-testid="PAMDescLinkChip"
      href={link.url}
      target="_blank"
      rel="noopener noreferrer"
      title={label}
      aria-label={label}
      className={clsx(
        'relative inline-flex shrink-0 items-center border border-dashed border-primary-border text-secondary-text no-underline transition hover:border-brand hover:text-brand',
        iconOnly
          ? 'h-6 w-6 justify-center rounded sm:h-7 sm:w-7'
          : compact
            ? 'max-w-36 gap-1 rounded px-1.5 py-0.5 text-[0.7rem] sm:gap-1.5 sm:px-2 sm:py-1 sm:text-xs'
            : 'max-w-48 gap-1.5 rounded-md px-2.5 py-1 text-xs sm:text-sm',
        className
      )}
    >
      <Icon
        className={clsx(
          'shrink-0',
          compact || iconOnly ? 'h-3.5 w-3.5' : 'h-3.5 w-3.5 sm:h-4 sm:w-4'
        )}
        aria-hidden
      />
      {iconOnly ? null : <span className="truncate">{link.title}</span>}
    </a>
  );
}

/** Stable hue per project so placeholder covers differ across the grid. */
function hueFromSlug(slug: string): number {
  let hue = 7;
  for (const char of slug) {
    hue = (hue * 31 + char.charCodeAt(0)) % 360;
  }
  return hue;
}

/**
 * Cover for projects without a preview image, so card rows keep the same structure.
 * `iconOnly` drops the name and hint (used when a title is overlaid on the cover).
 */
export function PAMProjectPlaceholderCover(props: {
  tt: PAMI18nInterface;
  name: string;
  slug: string;
  repoUrl?: string | null;
  iconOnly?: boolean;
}) {
  const { tt, name, slug, repoUrl, iconOnly = false } = props;
  return (
    <div
      data-testid="PAMProjectPlaceholderCover"
      style={{ '--ph-h': hueFromSlug(slug) } as React.CSSProperties}
      className="absolute inset-0 flex flex-col items-center justify-center gap-2.5 bg-elevated bg-[linear-gradient(135deg,hsl(var(--ph-h)_60%_50%/0.22),hsl(calc(var(--ph-h)_+_40)_60%_45%/0.08))]"
    >
      <span className="flex h-14 w-14 items-center justify-center rounded-2xl border border-[hsl(var(--ph-h)_60%_60%/0.3)] bg-[hsl(var(--ph-h)_60%_50%/0.15)] text-2xl text-[hsl(var(--ph-h)_60%_40%)] dark:text-[hsl(var(--ph-h)_70%_70%)]">
        <PAMIcon repoUrl={repoUrl || undefined} />
      </span>
      {iconOnly ? null : (
        <>
          <span className="max-w-[80%] truncate text-[0.95rem] font-semibold text-secondary-text">
            {name}
          </span>
          <span className="text-[0.7rem] text-tertiary-text">
            {tt.noPreviewImage}
          </span>
        </>
      )}
    </div>
  );
}

const MOBILE_MQ = '(max-width: 767px)';
const POPOVER_WIDTH = 320;
const VIEWPORT_MARGIN = 12;

function QuickAccessItem(props: {
  icon: React.ReactNode;
  title: string;
  sub: string;
  url: string;
  dev?: boolean;
}) {
  const { icon, title, sub, url, dev } = props;
  return (
    <a
      data-testid="QuickAccessItem"
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className="flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-sm no-underline transition hover:bg-elevated active:bg-elevated"
    >
      <span
        className={clsx(
          'flex h-[30px] w-[30px] shrink-0 items-center justify-center rounded-lg',
          dev
            ? 'bg-[color-mix(in_srgb,#1a7f37_14%,transparent)] text-[#1a7f37] dark:bg-[color-mix(in_srgb,#3fb950_14%,transparent)] dark:text-[#3fb950]'
            : 'bg-elevated text-secondary-text'
        )}
      >
        {icon}
      </span>
      <span className="min-w-0 flex-1">
        <span className="block truncate font-medium text-primary-text">
          {title}
        </span>
        <span className="block truncate text-xs text-tertiary-text">{sub}</span>
      </span>
      <ArrowTopRightOnSquareIcon className="h-3.5 w-3.5 shrink-0 text-tertiary-text" />
    </a>
  );
}

function QuickAccessContent(props: {
  tt: PAMI18nInterface;
  slug: string;
  envs: readonly PAMEnvWriteable[];
  links: readonly PAMDescLink[];
}) {
  const { tt, slug, envs, links } = props;
  const groupLabel =
    'px-2.5 pt-2 pb-1 text-[0.62rem] font-bold tracking-wide text-tertiary-text uppercase';
  return (
    <>
      {envs.length > 0 ? (
        <>
          <div className={groupLabel}>{tt.quickAccessEnvs}</div>
          {envs.map((env) => (
            <QuickAccessItem
              key={env.id || env.name}
              icon={<GlobeAltIcon className="h-4 w-4" />}
              title={(env.name || '').toUpperCase()}
              sub={getPAMDisplayHost(env.url || '')}
              url={env.url || ''}
              dev={/^dev(elopment)?$/i.test((env.name || '').trim())}
            />
          ))}
        </>
      ) : null}
      {links.length > 0 ? (
        <>
          <div className={groupLabel}>{tt.quickAccessLinks}</div>
          {links.map((link) => {
            const Icon = LINK_KIND_ICON[link.kind];
            return (
              <QuickAccessItem
                key={link.url}
                icon={<Icon className="h-4 w-4" />}
                title={link.title}
                sub={`${getPAMDescLinkKindLabel(tt, link.kind)} · ${getPAMDisplayHost(link.url)}`}
                url={link.url}
              />
            );
          })}
        </>
      ) : null}
      <Link
        href={{ pathname: ROUTE_PROJECT_DETAIL, params: { projectId: slug } }}
        className="mt-1 flex items-center justify-center gap-1.5 border-t border-primary-border px-2.5 pt-2.5 pb-1.5 text-sm text-brand no-underline hover:text-brand-hover"
      >
        {tt.viewProjectDetail}
        <ArrowRightIcon className="h-3.5 w-3.5" />
      </Link>
    </>
  );
}

/**
 * Button listing every env + description link of a project:
 * popover under the button on desktop, bottom sheet on mobile.
 */
export function PAMProjectQuickAccess(props: {
  tt: PAMI18nInterface;
  slug: string;
  name: string;
  repoUrl?: string | null;
  envs: readonly PAMEnvWriteable[];
  links: readonly PAMDescLink[];
  children: React.ReactNode;
  className?: string;
}) {
  const { tt, slug, name, repoUrl, envs, links, children, className } = props;
  const total = envs.length + links.length;
  const buttonRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const [mode, setMode] = useState<'closed' | 'popover' | 'sheet'>('closed');
  const [sheetShown, setSheetShown] = useState(false);
  const [position, setPosition] = useState<{ top: number; left: number }>();

  const close = useCallback(() => {
    setMode('closed');
    setSheetShown(false);
  }, []);

  const toggle = useCallback(() => {
    if (mode !== 'closed') {
      close();
      return;
    }
    setMode(window.matchMedia(MOBILE_MQ).matches ? 'sheet' : 'popover');
  }, [mode, close]);

  useLayoutEffect(() => {
    if (mode !== 'popover' || !buttonRef.current) {
      return;
    }
    const rect = buttonRef.current.getBoundingClientRect();
    const maxLeft = window.innerWidth - POPOVER_WIDTH - VIEWPORT_MARGIN;
    setPosition({
      top: rect.bottom + 6,
      left: Math.max(
        VIEWPORT_MARGIN,
        Math.min(rect.right - POPOVER_WIDTH, maxLeft)
      )
    });
  }, [mode]);

  useEffect(() => {
    if (mode === 'closed') {
      return;
    }
    const raf =
      mode === 'sheet' ? requestAnimationFrame(() => setSheetShown(true)) : 0;
    const onPointerDown = (event: PointerEvent) => {
      const target = event.target as Node;
      if (
        panelRef.current?.contains(target) ||
        buttonRef.current?.contains(target)
      ) {
        return;
      }
      close();
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        close();
      }
    };
    document.addEventListener('pointerdown', onPointerDown);
    document.addEventListener('keydown', onKeyDown);
    // Mobile browsers fire resize/scroll when the address bar toggles: only the anchored popover closes.
    if (mode === 'popover') {
      window.addEventListener('resize', close);
      window.addEventListener('scroll', close, true);
    }
    return () => {
      cancelAnimationFrame(raf);
      document.removeEventListener('pointerdown', onPointerDown);
      document.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('resize', close);
      window.removeEventListener('scroll', close, true);
    };
  }, [mode, close]);

  if (total === 0) {
    return null;
  }

  const content = (
    <QuickAccessContent tt={tt} slug={slug} envs={envs} links={links} />
  );

  return (
    <>
      <button
        ref={buttonRef}
        type="button"
        data-testid="PAMProjectQuickAccess"
        title={tt.quickAccessAll.replace('%count%', String(total))}
        aria-label={tt.quickAccessAll.replace('%count%', String(total))}
        aria-expanded={mode !== 'closed'}
        onClick={toggle}
        className={clsx(
          'relative inline-flex shrink-0 items-center justify-center gap-1 rounded-lg border border-primary-border bg-secondary text-xs text-secondary-text transition hover:border-brand hover:text-brand',
          mode !== 'closed' && 'border-brand text-brand',
          className
        )}
      >
        {children}
      </button>

      {mode === 'popover' && position
        ? createPortal(
            <div
              ref={panelRef}
              role="dialog"
              aria-label={name}
              style={{
                top: position.top,
                left: position.left,
                width: POPOVER_WIDTH
              }}
              className="fixed z-50 max-h-[70vh] overflow-auto rounded-xl border border-primary-border bg-secondary p-1.5 shadow-lg"
            >
              {content}
            </div>,
            document.body
          )
        : null}

      {mode === 'sheet'
        ? createPortal(
            <div
              className={clsx(
                'fixed inset-0 z-50 bg-black/45 transition-opacity duration-200',
                sheetShown ? 'opacity-100' : 'opacity-0'
              )}
            >
              <div
                ref={panelRef}
                role="dialog"
                aria-label={name}
                className={clsx(
                  'absolute inset-x-0 bottom-0 flex max-h-[75vh] flex-col rounded-t-2xl border-t border-primary-border bg-secondary pb-[env(safe-area-inset-bottom)] transition-transform duration-200',
                  sheetShown ? 'translate-y-0' : 'translate-y-full'
                )}
              >
                <div className="mx-auto mt-2 mb-2.5 h-1 w-9 rounded-full bg-primary-border" />
                <div className="flex items-center gap-3 px-4 pb-2">
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-primary-border bg-elevated text-sm text-primary-text">
                    <PAMIcon repoUrl={repoUrl || undefined} />
                  </span>
                  <div className="min-w-0">
                    <div className="truncate font-semibold text-primary-text">
                      {name}
                    </div>
                    <div className="text-xs text-tertiary-text">
                      {tt.quickEntryTitle}
                    </div>
                  </div>
                </div>
                <div className="overflow-auto px-2 pb-3">{content}</div>
              </div>
            </div>,
            document.body
          )
        : null}
    </>
  );
}
