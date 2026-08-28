/**
 * Display helpers for PAM project list/card (host, repo path, primary URL).
 */

import {
  getPAMFaviconUrl,
  getPAMSiteIconCandidates,
  isPAMGitHostUrl,
  parsePAMSiteUrl
} from '@shared/utils/PAMSiteIconUtil';
import { API_PAM_SITE_LOGO } from '@config/apiRoutes';
import type { PAMEnvWriteable } from '@schemas/PAMEnvironmentSchema';

export {
  getPAMFaviconUrl,
  getPAMSiteIconCandidates,
  isPAMGitHostUrl,
  parsePAMSiteUrl
};

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

/** Proxy URL: server fetches favicon/logo for the given site page URL. */
export function buildPamSiteLogoApiUrl(siteUrl: string): string | null {
  if (!parsePAMSiteUrl(siteUrl)) {
    return null;
  }
  return `${API_PAM_SITE_LOGO}?url=${encodeURIComponent(siteUrl.trim())}`;
}

/** Shorten long owner/user ids for dense list rows (e.g. UUID → 308c658e…44f7). */
export function shortenPAMOwnerId(id: string, head = 8, tail = 4): string {
  const value = (id || '').trim();
  if (!value || value.length <= head + tail + 1) {
    return value;
  }
  return `${value.slice(0, head)}…${value.slice(-tail)}`;
}
