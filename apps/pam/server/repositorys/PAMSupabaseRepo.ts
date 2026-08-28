import { ExecutorError } from '@qlover/fe-corekit/executor';
import { SupabaseRepo, type RepoSearchParams } from '@qlover/next-kit/server';
import { API_SERVER_ERROR } from '@config/i18n-identifier/api';
import { toStableApiExecutorError } from '@server/utils/normalizeApiExecutorError';
import {
  extractPostgrestError,
  isPostgrestRangeNotSatisfiable,
  parsePostgrestRowCount
} from '@server/utils/postgrestError';
import type { ResourceSearchResult } from '@qlover/corekit-bridge';

/**
 * Multi-column ILIKE OR search params (free-text keyword across several columns).
 */
export interface IlikeOrParams {
  columns: string[];
  query: string;
}

export type PAMSearchParams<Raw> = RepoSearchParams<Raw> & {
  table?: string;
  ilikeOr?: IlikeOrParams;
  /**
   * Exact `count=exact` is expensive with `.or()` + ilike; default planned.
   */
  exactCount?: boolean;
  /** When false, skip PostgREST count (faster page 2+ / load-more). */
  includeCount?: boolean;
};

/** Mirrors kit's protected (unexported) `getSearchBuilder` return tuple. */
type SearchBuilderResult<Raw, T> = Awaited<
  ReturnType<SupabaseRepo<Raw, T>['getSearchBuilder']>
>;

/**
 * PAM-specific `SupabaseRepo` extension.
 *
 * Kit's generic `SupabaseRepo` only supports single-column `where`/`whereOr`
 * triples; PAM project keyword search needs a substring match across several
 * text columns (name/slug/description/...), so this adds `ilikeOr` back as a
 * thin layer on top of kit's protected `getSearchBuilder`.
 */
export class PAMSupabaseRepo<Raw, T = Raw> extends SupabaseRepo<Raw, T> {
  /**
   * Remaps kit infrastructure error ids (`SupabasePGRSTError`, …) to
   * {@link API_SERVER_ERROR} before they bubble to the API envelope.
   *
   * @override
   */
  public override throwIfError(
    ...args: Parameters<SupabaseRepo<Raw, T>['throwIfError']>
  ): void {
    try {
      super.throwIfError(...args);
    } catch (error) {
      if (error instanceof ExecutorError) {
        throw toStableApiExecutorError(error);
      }
      throw new ExecutorError(API_SERVER_ERROR, { cause: error });
    }
  }

  /**
   * Escape ILIKE wildcards and wrap for PostgREST `.or()` filter values.
   */
  protected escapeIlikePattern(raw: string): string {
    const escaped = raw
      .replace(/\\/g, '\\\\')
      .replace(/%/g, '\\%')
      .replace(/_/g, '\\_');
    const pattern = `%${escaped}%`;
    // Quote so commas / reserved chars in the pattern do not break `.or()` parsing.
    return `"${pattern.replace(/"/g, '\\"')}"`;
  }

  /**
   * Build `col.ilike."%kw%",...` for PostgREST `.or()`.
   */
  protected buildIlikeOrString(columns: string[], query: string): string {
    const pattern = this.escapeIlikePattern(query);
    return columns
      .filter((col) => typeof col === 'string' && col.length > 0)
      .map((col) => `${col}.ilike.${pattern}`)
      .join(',');
  }

  /**
   * Widen public `search` so callers can pass `ilikeOr` (handled in
   * {@link getSearchBuilder}). Parent typing only knows `RepoSearchParams`.
   *
   * Also normalizes `total`/`hasMore` when PostgREST returns rows but a null
   * exact count (common with `.or()` + embedded joins), which otherwise shows
   * “0 results” while the list is non-empty.
   *
   * @override
   */
  public async search(
    params: PAMSearchParams<Raw>
  ): Promise<ResourceSearchResult<T>> {
    try {
      return this.normalizeSearchResult(params, await super.search(params));
    } catch (error) {
      if (
        error instanceof ExecutorError &&
        error.id === 'SupabasePGRSTError' &&
        isPostgrestRangeNotSatisfiable(error.cause ?? error)
      ) {
        return this.emptySearchPage(params, error.cause ?? error);
      }
      if (isPostgrestRangeNotSatisfiable(error)) {
        return this.emptySearchPage(params, error);
      }
      throw error;
    }
  }

  protected normalizeSearchResult(
    params: PAMSearchParams<Raw>,
    result: ResourceSearchResult<T>
  ): ResourceSearchResult<T> {
    const loaded = result.items?.length ?? 0;
    const pageSize = params.pageSize ?? result.pageSize ?? 20;
    const exactCount = params.exactCount === true;
    let total = result.total ?? 0;

    if (loaded > 0 && total < loaded) {
      total = Math.max(total, loaded);
    }

    const offset =
      params.offset ?? (params.page != null ? (params.page - 1) * pageSize : 0);

    let hasMore = result.hasMore ?? false;
    if (loaded < pageSize) {
      hasMore = false;
    } else if (exactCount && total > 0 && offset + loaded >= total) {
      hasMore = false;
    } else if (loaded >= pageSize) {
      // Full page — keep fetching when count is planned/estimated.
      hasMore = true;
    } else if (loaded > 0 && total === 0) {
      hasMore = loaded >= pageSize;
    }

    // `count=planned` can over-estimate vs actual rows.
    if (!hasMore && loaded > 0 && total > offset + loaded) {
      total = offset + loaded;
    }

    return {
      ...result,
      page: params.page ?? result.page ?? 1,
      pageSize,
      total,
      hasMore
    };
  }

  protected emptySearchPage(
    params: PAMSearchParams<Raw>,
    error: unknown
  ): ResourceSearchResult<T> {
    const pageSize = params.pageSize ?? 20;
    const page = params.page ?? 1;
    const pg = extractPostgrestError(error);
    const parsedTotal = pg?.message
      ? parsePostgrestRowCount(pg.message)
      : undefined;

    return {
      page,
      pageSize,
      total: parsedTotal ?? 0,
      items: [],
      hasMore: false
    };
  }

  /**
   * @override
   */
  protected async getSearchBuilder(
    params: PAMSearchParams<Raw>
  ): Promise<SearchBuilderResult<Raw, T>> {
    const { ilikeOr, exactCount = false, includeCount, ...rest } = params;
    const page = rest.page ?? 1;
    const shouldCount = includeCount ?? page <= 1;
    const client = this.getAdminSupabase();
    let selector = '*';
    if (rest.fields) {
      if (Array.isArray(rest.fields)) {
        selector = rest.fields.join(',');
      }
      if (typeof rest.fields === 'string') {
        selector = rest.fields;
      }
    }

    let query = client
      .from(rest.table ?? this.getRepoName())
      .select(
        selector,
        shouldCount
          ? { count: exactCount ? 'exact' : 'planned', head: false }
          : { head: false }
      );

    if (rest.where && rest.where.length) {
      for (const cond of rest.where) {
        query = this.applyFilter(query, cond);
      }
    }
    if (rest.whereOr && rest.whereOr.length) {
      const orString = this.buildOrString(rest.whereOr);
      query = query.or(orString);
    }

    const sortClauses = this.ensureStableSort(rest.sort);
    if (sortClauses.length) {
      for (const sort of sortClauses) {
        const field = sort.orderBy;
        let ascending = true;
        let nullsFirst: boolean | undefined;
        if (typeof sort.order === 'string') {
          ascending = sort.order === 'asc';
        } else if (sort.order && typeof sort.order === 'object') {
          const orderObj = sort.order as {
            direction?: string;
            nulls?: string;
          };
          if (orderObj.direction) {
            ascending = orderObj.direction === 'asc';
          }
          if (orderObj.nulls) {
            nullsFirst = orderObj.nulls === 'first';
          }
        }
        query = query.order(field, {
          ascending,
          nullsFirst
        });
      }
    }

    if (ilikeOr?.columns.length && ilikeOr.query.trim()) {
      const orString = this.buildIlikeOrString(
        ilikeOr.columns,
        ilikeOr.query.trim()
      );
      if (orString) {
        query = query.or(orString);
      }
    }

    const pageSize = rest.pageSize || 20;
    let offset = rest.offset;
    if (offset === undefined && rest.page !== undefined) {
      offset = (rest.page - 1) * pageSize;
    }
    if (offset !== undefined) {
      query = query.range(offset, offset + pageSize - 1);
    } else if (rest.pageSize) {
      query = query.range(0, pageSize - 1);
    }

    return [
      query,
      {
        offset,
        pageSize
      }
    ] as SearchBuilderResult<Raw, T>;
  }
}
