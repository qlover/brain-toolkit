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
