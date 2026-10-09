'use client';

import { clsx } from 'clsx';
import type { AdminSiteSettingEntry } from '../../shared/siteSettings/siteSettings';
import type { ReactNode } from 'react';

export const settingsFieldClass = clsx(
  'w-full border border-primary-border rounded-[10px]',
  'bg-secondary text-primary-text',
  'px-3.5 py-2 text-sm',
  'transition-[border-color,box-shadow] duration-150',
  'focus:outline-none focus:border-brand focus:ring-[3px] focus:ring-brand/20',
  'touch-manipulation'
);

export type SiteSettingSourceLabels = {
  readonly sourceDb: string;
  readonly sourceDefault: string;
};

export function SiteSettingSourceBadge({
  source,
  labels
}: {
  source: AdminSiteSettingEntry['source'] | undefined;
  labels: SiteSettingSourceLabels;
}) {
  if (!source) {
    return null;
  }

  return (
    <span
      data-testid="SourceBadge"
      className={clsx(
        'rounded-full px-2 py-0.5 text-[11px] font-medium',
        source === 'db'
          ? 'bg-brand/10 text-brand'
          : 'bg-elevated text-tertiary-text'
      )}
    >
      {source === 'db' ? labels.sourceDb : labels.sourceDefault}
    </span>
  );
}

export function SettingToggleSwitch({
  checked,
  onChange
}: {
  checked: boolean;
  onChange: (checked: boolean) => void;
}) {
  return (
    <button
      data-testid="ToggleSwitch"
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className={clsx(
        'relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200',
        checked ? 'bg-brand' : 'bg-elevated'
      )}
    >
      <span
        className={clsx(
          'pointer-events-none inline-block h-5 w-5 rounded-full bg-white shadow-sm transition-transform duration-200',
          checked ? 'translate-x-5' : 'translate-x-0'
        )}
      />
    </button>
  );
}

export function SiteSettingRow({
  entry,
  labels,
  children,
  controlClassName,
  layout = 'stacked'
}: {
  entry: AdminSiteSettingEntry | undefined;
  labels: SiteSettingSourceLabels;
  children: ReactNode;
  controlClassName?: string;
  /** stacked: label left, control right (~20rem on large screens); block: label above, control full width. */
  layout?: 'stacked' | 'inline' | 'block';
}) {
  if (!entry) {
    return null;
  }

  const isInline = layout === 'inline';
  const isBlock = layout === 'block';

  return (
    <div
      data-testid="SettingRow"
      className={clsx(
        'gap-3 border-b border-primary-border/50 py-4 last:border-b-0',
        isInline && 'flex items-start justify-between',
        isBlock && 'flex flex-col',
        !isInline &&
          !isBlock &&
          'flex flex-col md:flex-row md:items-start md:justify-between md:gap-8'
      )}
    >
      <div className={clsx('min-w-0', isInline ? 'flex-1 pr-3' : 'flex-1')}>
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-sm font-semibold text-primary-text">
            {entry.label}
          </span>
          <SiteSettingSourceBadge source={entry.source} labels={labels} />
        </div>
        <p className="mt-1 text-sm leading-relaxed text-secondary-text">
          {entry.description}
        </p>
      </div>
      <div
        className={clsx(
          isInline && 'shrink-0 pt-0.5',
          isBlock && 'w-full min-w-0',
          !isInline && !isBlock && 'w-full shrink-0 md:w-72 lg:w-80',
          controlClassName
        )}
      >
        {children}
      </div>
    </div>
  );
}
