import { ExecutorError } from '@qlover/fe-corekit/executor';
import { SupabaseRepo, type RepoSearchParams } from '@qlover/next-kit/server';
import { API_SERVER_ERROR } from '@config/i18n-identifier/api';
import { toStableApiExecutorError } from '@server/utils/normalizeApiExecutorError';
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
    const result = await super.search(params);
    const loaded = result.items?.length ?? 0;
    const apiTotal = result.total ?? 0;
    if (loaded === 0 || apiTotal >= loaded) {
      return result;
    }

    const pageSize = params.pageSize ?? result.pageSize ?? loaded;
    return {
      ...result,
      total: Math.max(apiTotal, loaded),
      hasMore: result.hasMore || loaded >= pageSize
    };
  }

  /**
   * @override
   */
  protected async getSearchBuilder(
    params: PAMSearchParams<Raw>
  ): Promise<SearchBuilderResult<Raw, T>> {
    const { ilikeOr, ...rest } = params;
    const [query, meta] = await super.getSearchBuilder(rest);

    if (ilikeOr?.columns.length && ilikeOr.query.trim()) {
      const orString = this.buildIlikeOrString(
        ilikeOr.columns,
        ilikeOr.query.trim()
      );
      if (orString) {
        return [query.or(orString), meta] as SearchBuilderResult<Raw, T>;
      }
    }

    return [query, meta];
  }
}
