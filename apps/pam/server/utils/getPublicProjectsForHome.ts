import { unstable_cache } from 'next/cache';
import { defaultSearchParams } from '@config/common';
import type { SearchPAMProject } from '@schemas/PAMProjectSchema';
import { BootstrapServer } from '@server/BootstrapServer';
import { PAMProjectRepo } from '@server/repositorys/PAMProjectRepo';
import type { ResourceSearchResult } from '@qlover/corekit-bridge';

const HOME_PUBLIC_LIST_REVALIDATE_SECONDS = 60;

function homePublicListSort() {
  return [
    { orderBy: 'is_public', order: 'desc' as const },
    ...defaultSearchParams.sort,
    { orderBy: 'id', order: 'desc' as const }
  ];
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
