import { unstable_cache } from 'next/cache';
import { defaultSearchParams } from '@config/common';
import { buildPamListSort, PAMListSortBy } from '@config/pamListSort';
import type { SearchPAMProject } from '@schemas/PAMProjectSchema';
import { BootstrapServer } from '@server/BootstrapServer';
import { PAMProjectRepo } from '@server/repositorys/PAMProjectRepo';
import type { ResourceSearchResult } from '@qlover/corekit-bridge';

const HOME_PUBLIC_LIST_REVALIDATE_SECONDS = 60;

function homePublicListSort() {
  return buildPamListSort(PAMListSortBy.CreatedAt);
}

/**
 * Fetch first-page public projects for the home shell.
 *
 * Uses the repo directly (no session/cookie) so the page can stay statically
 * generated / ISR-friendly. Logged-in private rows are merged on the client.
 */
async function fetchPublicProjectsForHome(): Promise<
  ResourceSearchResult<SearchPAMProject>
> {
  const server = new BootstrapServer('pam-home-public-list');
  const repo = server.getIOC(PAMProjectRepo);

  return repo.searchProjects({
    page: defaultSearchParams.page,
    pageSize: defaultSearchParams.pageSize,
    sort: homePublicListSort()
  });
}

const getCachedPublicProjectsForHome = unstable_cache(
  fetchPublicProjectsForHome,
  ['pam-home-public-projects'],
  { revalidate: HOME_PUBLIC_LIST_REVALIDATE_SECONDS }
);

/**
 * Best-effort public list for SSR/ISR. Returns null on failure so the client
 * can still load via `/api/pam/search`.
 */
export async function getPublicProjectsForHome(): Promise<ResourceSearchResult<SearchPAMProject> | null> {
  try {
    const result = await getCachedPublicProjectsForHome();
    // Ensure a plain serializable object for RSC → client props.
    return JSON.parse(
      JSON.stringify(result)
    ) as ResourceSearchResult<SearchPAMProject>;
  } catch (error) {
    console.error('[getPublicProjectsForHome] failed:', error);
    return null;
  }
}

/**
 * Fetch distinct public project categories for ISR (no session).
 */
async function fetchPublicCategoriesForHome(): Promise<string[]> {
  const server = new BootstrapServer('pam-home-public-categories');
  const repo = server.getIOC(PAMProjectRepo);
  return repo.listDistinctCategories();
}

const getCachedPublicCategoriesForHome = unstable_cache(
  fetchPublicCategoriesForHome,
  ['pam-home-public-categories'],
  { revalidate: HOME_PUBLIC_LIST_REVALIDATE_SECONDS }
);

/**
 * Best-effort public categories for SSR/ISR. Empty array on failure.
 */
export async function getPublicCategoriesForHome(): Promise<string[]> {
  try {
    const result = await getCachedPublicCategoriesForHome();
    return JSON.parse(JSON.stringify(result)) as string[];
  } catch (error) {
    console.error('[getPublicCategoriesForHome] failed:', error);
    return [];
  }
}
