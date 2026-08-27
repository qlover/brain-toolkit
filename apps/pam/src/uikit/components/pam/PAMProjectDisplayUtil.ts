/**
 * Display helpers for PAM project list/card (host, repo path, primary URL).
 */

import type { PAMEnvWriteable } from '@schemas/PAMEnvironmentSchema';

export function getPAMPrimaryUrl(
  environments: readonly PAMEnvWriteable[] | undefined,
  repoUrl: string | null | undefined
): string {
  if (environments) {
    for (const env of environments) {
      if (env?.url) {
        return env.url;
      }
    }
  }
  return repoUrl || '';
}

export function getPAMDisplayHost(url: string): string {
  if (!url) {
    return '';
  }
  try {
    return new URL(url).host;
  } catch {
    return url.replace(/^https?:\/\//, '').split('/')[0] || url;
  }
}

export function getPAMRepoPath(url: string): string {
  if (!url) {
    return '';
  }
  try {
    const parsed = new URL(url);
    return parsed.pathname.replace(/^\//, '') || parsed.host;
  } catch {
    return url;
  }
}

export function getPAMAvatarLetter(name: string): string {
  const trimmed = (name || 'P').trim();
  return trimmed.charAt(0).toUpperCase();
}

const PAM_GIT_HOST_SNIPPETS = [
  'github.com',
  'gitlab.com',
  'gitee.com',
  'bitbucket.org'
] as const;

/** True when URL host is a known git forge (prefer PAMIcon over site favicon). */
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
 * Site icon candidates for a project URL. Skips git forges (use PAMIcon).
 * Order: favicon.ico → favicon.svg → logo.svg; caller advances on img onError.
 */
export function getPAMSiteIconCandidates(siteUrl: string): string[] {
  const trimmed = (siteUrl || '').trim();
  if (!trimmed || isPAMGitHostUrl(trimmed)) {
    return [];
  }
  try {
    const parsed = new URL(trimmed);
    if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
      return [];
    }
    const host = parsed.hostname.toLowerCase();
    if (
      host === 'localhost' ||
      host === '127.0.0.1' ||
      host.endsWith('.local')
    ) {
      return [];
    }
    const origin = parsed.origin;
    return [
      `${origin}/favicon.ico`,
      `${origin}/favicon.svg`,
      `${origin}/logo.svg`
    ];
  } catch {
    return [];
  }
}

/** @deprecated Prefer getPAMSiteIconCandidates */
export function getPAMFaviconUrl(siteUrl: string): string | null {
  return getPAMSiteIconCandidates(siteUrl)[0] ?? null;
}

/** Shorten long owner/user ids for dense list rows (e.g. UUID → 308c658e…44f7). */
export function shortenPAMOwnerId(id: string, head = 8, tail = 4): string {
  const value = (id || '').trim();
  if (!value || value.length <= head + tail + 1) {
    return value;
  }
  return `${value.slice(0, head)}…${value.slice(-tail)}`;
}
