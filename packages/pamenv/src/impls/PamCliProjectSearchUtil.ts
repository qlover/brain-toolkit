import type {
  PamCliListProjectsOptionsType,
  PamCliProjectType
} from '../interfaces/PamCliTypes';
import { PamCliProjectAccessUtil } from './PamCliProjectAccessUtil';

/**
 * Builds `/api/pam/search` query params aligned with the PAM web home list.
 * Access filters (`mine` / `writable`) go on the wire as `filters.*` (server-side).
 * CLI uses `view=compact` so the payload stays small.
 */
export class PamCliProjectSearchUtil {
  /**
   * @param options - CLI search options
   * @returns URLSearchParams ready to append to `/api/pam/search`
   */
  public static buildQuery(
    options: PamCliListProjectsOptionsType = {}
  ): URLSearchParams {
    const page = Math.max(1, options.page ?? 1);
    const pageSize = Math.min(100, Math.max(1, options.pageSize ?? 100));
    const params = new URLSearchParams({
      page: String(page),
      pageSize: String(pageSize)
    });

    const keyword = options.keyword?.trim();
    if (keyword) {
      params.set('keyword', keyword);
    }

    const view = options.view ?? 'compact';
    params.set('view', view);

    const filters: Record<string, string | boolean> = {
      // Also embed view so validators that drop unknown top-level keys still work.
      view
    };
    const category = options.category?.trim();
    if (category) {
      filters.category = category;
    }
    if (options.visibility === 'public' || options.visibility === 'private') {
      filters.visibility = options.visibility;
    }
    if (options.mine === true) {
      filters.mine = true;
    }
    if (options.writable === true) {
      filters.writable = true;
    }
    params.set('filters', JSON.stringify(filters));

    const sortBy = options.sortBy ?? 'created_at';
    const sortOrder = options.sortOrder ?? 'desc';
    const ascending = sortOrder === 'asc';
    params.set(
      'sort',
      JSON.stringify([
        { orderBy: 'is_public', order: 'desc' },
        { orderBy: sortBy, order: sortOrder },
        { orderBy: 'id', order: ascending ? 'asc' : 'desc' }
      ])
    );

    return params;
  }

  /**
   * Normalizes `listProjects` overload input to options.
   */
  public static normalizeOptions(
    keywordOrOptions?: string | PamCliListProjectsOptionsType
  ): PamCliListProjectsOptionsType {
    if (keywordOrOptions == null) {
      return {};
    }
    if (typeof keywordOrOptions === 'string') {
      return { keyword: keywordOrOptions };
    }
    return keywordOrOptions;
  }

  /**
   * @deprecated Prefer server `filters.mine` / `filters.writable`. Kept for tests.
   */
  public static filterByAccess(
    projects: readonly PamCliProjectType[],
    options: { readonly mine?: boolean; readonly writable?: boolean }
  ): PamCliProjectType[] {
    return projects.filter((project) => {
      if (options.mine && !PamCliProjectAccessUtil.isOwner(project)) {
        return false;
      }
      if (options.writable && !PamCliProjectAccessUtil.isWritable(project)) {
        return false;
      }
      return true;
    });
  }
}
