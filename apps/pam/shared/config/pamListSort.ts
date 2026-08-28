import type { ResourceSearchParams } from '@qlover/corekit-bridge';

export const PAMListSortBy = {
  CreatedAt: 'created_at',
  UpdatedAt: 'updated_at'
} as const;

export type PAMListSortByType =
  (typeof PAMListSortBy)[keyof typeof PAMListSortBy];

export const PAMListSortOrder = {
  Desc: 'desc',
  Asc: 'asc'
} as const;

export type PAMListSortOrderType =
  (typeof PAMListSortOrder)[keyof typeof PAMListSortOrder];

type SortClause = NonNullable<ResourceSearchParams['sort']>[number];

function parseSortClauses(
  sort: ResourceSearchParams['sort'] | string | undefined
): SortClause[] | undefined {
  if (typeof sort === 'string') {
    try {
      return JSON.parse(sort) as SortClause[];
    } catch {
      return undefined;
    }
  }
  return sort as SortClause[] | undefined;
}

/** Stable list ordering: public first, then date field, then id. */
export function buildPamListSort(
  sortBy: PAMListSortByType,
  sortOrder: PAMListSortOrderType = PAMListSortOrder.Desc
): SortClause[] {
  const ascending = sortOrder === PAMListSortOrder.Asc;
  return [
    { orderBy: 'is_public', order: 'desc' },
    { orderBy: sortBy, order: sortOrder },
    { orderBy: 'id', order: ascending ? 'asc' : 'desc' }
  ];
}

export function resolvePamListSortBy(
  sort: ResourceSearchParams['sort'] | string | undefined
): PAMListSortByType {
  for (const clause of parseSortClauses(sort) ?? []) {
    if (clause.orderBy === PAMListSortBy.UpdatedAt) {
      return PAMListSortBy.UpdatedAt;
    }
    if (clause.orderBy === PAMListSortBy.CreatedAt) {
      return PAMListSortBy.CreatedAt;
    }
  }
  return PAMListSortBy.CreatedAt;
}

export function resolvePamListSortOrder(
  sort: ResourceSearchParams['sort'] | string | undefined
): PAMListSortOrderType {
  for (const clause of parseSortClauses(sort) ?? []) {
    if (
      clause.orderBy === PAMListSortBy.UpdatedAt ||
      clause.orderBy === PAMListSortBy.CreatedAt
    ) {
      return clause.order === PAMListSortOrder.Asc
        ? PAMListSortOrder.Asc
        : PAMListSortOrder.Desc;
    }
  }
  return PAMListSortOrder.Desc;
}

export function isDefaultPamListSort(
  sort: ResourceSearchParams['sort'] | string | undefined
): boolean {
  return (
    resolvePamListSortBy(sort) === PAMListSortBy.CreatedAt &&
    resolvePamListSortOrder(sort) === PAMListSortOrder.Desc
  );
}

export function isDefaultPamListSortState(
  sortBy: PAMListSortByType,
  sortOrder: PAMListSortOrderType
): boolean {
  return (
    sortBy === PAMListSortBy.CreatedAt && sortOrder === PAMListSortOrder.Desc
  );
}
