'use client';

import { ChevronLeftIcon, ChevronRightIcon } from '@heroicons/react/24/outline';
import type { AdminShellI18nInterface } from '@config/i18n-mapping/admin18n';
import { fill } from './adminFormat';

export interface AdminPagerProps {
  page: number;
  pageSize: number;
  total: number;
  onChange: (page: number, pageSize: number) => void;
  /** Omit to hide the page size select. */
  pageSizeOptions?: readonly number[];
  tt: Pick<
    AdminShellI18nInterface,
    'range' | 'perPage' | 'prevPage' | 'nextPage'
  >;
}

/** Page numbers with gaps, e.g. `1 … 4 5 6 … 12`. */
export function pagerItems(page: number, pageCount: number): (number | null)[] {
  const pages = new Set([1, pageCount, page - 1, page, page + 1]);
  const sorted = [...pages]
    .filter((p) => p >= 1 && p <= pageCount)
    .sort((a, b) => a - b);
  const items: (number | null)[] = [];
  sorted.forEach((p, index) => {
    if (index > 0 && p - sorted[index - 1] > 1) items.push(null);
    items.push(p);
  });
  return items;
}

export function AdminPager({
  page,
  pageSize,
  total,
  onChange,
  pageSizeOptions,
  tt
}: AdminPagerProps) {
  const pageCount = Math.max(1, Math.ceil(total / pageSize));
  const from = total === 0 ? 0 : (page - 1) * pageSize + 1;
  const to = Math.min(total, page * pageSize);

  return (
    <div data-testid="AdminPager" className="brain-pager">
      <span>
        {fill(tt.range, { from, to, total })}
        {pageSizeOptions && (
          <>
            {' · '}
            {tt.perPage}
            <select
              value={pageSize}
              aria-label={tt.perPage}
              onChange={(event) => onChange(1, Number(event.target.value))}
            >
              {pageSizeOptions.map((size) => (
                <option data-testid="AdminPager" key={size} value={size}>
                  {size}
                </option>
              ))}
            </select>
          </>
        )}
      </span>
      <div className="brain-pager-pages">
        <button
          type="button"
          aria-label={tt.prevPage}
          disabled={page <= 1}
          onClick={() => onChange(page - 1, pageSize)}
        >
          <ChevronLeftIcon className="h-3.5 w-3.5" aria-hidden />
        </button>
        {pagerItems(page, pageCount).map((item, index) =>
          item === null ? (
            <button key={`gap-${index}`} type="button" disabled>
              …
            </button>
          ) : (
            <button
              key={item}
              type="button"
              aria-current={item === page ? 'page' : undefined}
              onClick={() => item !== page && onChange(item, pageSize)}
            >
              {item}
            </button>
          )
        )}
        <button
          type="button"
          aria-label={tt.nextPage}
          disabled={page >= pageCount}
          onClick={() => onChange(page + 1, pageSize)}
        >
          <ChevronRightIcon className="h-3.5 w-3.5" aria-hidden />
        </button>
      </div>
    </div>
  );
}
