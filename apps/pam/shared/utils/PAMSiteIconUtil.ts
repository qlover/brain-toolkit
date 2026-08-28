const PAM_GIT_HOST_SNIPPETS = [
  'github.com',
  'gitlab.com',
  'gitee.com',
  'bitbucket.org'
] as const;

/** True when URL host is a known git forge (prefer repo icon over site favicon). */
export function isPAMGitHostUrl(url: string): boolean {
  if (!url) {
    return false;
  }
  try {
    const host = new URL(url).hostname.toLowerCase();
    return PAM_GIT_HOST_SNIPPETS.some((snippet) => host.includes(snippet));
  } catch {
    return false;
  }
}

/**
 * Parses a public http(s) site URL for logo fetch. Returns null when unsafe or unsupported.
 */
export function parsePAMSiteUrl(siteUrl: string): URL | null {
  const trimmed = (siteUrl || '').trim();
  if (!trimmed || isPAMGitHostUrl(trimmed)) {
    return null;
  }
  try {
    const parsed = new URL(trimmed);
    if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
      return null;
    }
    const host = parsed.hostname.toLowerCase();
    if (
      host === 'localhost' ||
      host === '127.0.0.1' ||
      host === '0.0.0.0' ||
      host.endsWith('.local') ||
      host.endsWith('.localhost')
    ) {
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}

/**
 * Site icon candidates. Skips git forges.
 * Order: favicon.ico → favicon.svg → logo.svg
 */
export function getPAMSiteIconCandidates(siteUrl: string): string[] {
  const parsed = parsePAMSiteUrl(siteUrl);
  if (!parsed) {
    return [];
  }
  const origin = parsed.origin;
  return [
    `${origin}/favicon.ico`,
    `${origin}/favicon.svg`,
    `${origin}/logo.svg`
  ];
}

/** @deprecated Prefer getPAMSiteIconCandidates */
export function getPAMFaviconUrl(siteUrl: string): string | null {
  return getPAMSiteIconCandidates(siteUrl)[0] ?? null;
}
