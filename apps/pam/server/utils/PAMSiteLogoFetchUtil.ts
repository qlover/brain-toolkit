import { getPAMSiteIconCandidates } from '@shared/utils/PAMSiteIconUtil';

export type FetchedSiteLogo = {
  bytes: Uint8Array;
  contentType: string;
};

const FETCH_TIMEOUT_MS = 8_000;
const MAX_BYTES = 256 * 1024;
const CACHE_TTL_MS = 60 * 60 * 1000;

const logoCache = new Map<
  string,
  { expiresAt: number; logo: FetchedSiteLogo | null }
>();

function guessImageContentType(
  url: string,
  header: string | null,
  bytes: Uint8Array
): string | null {
  const fromHeader = header?.split(';')[0]?.trim().toLowerCase();
  if (fromHeader?.startsWith('image/')) {
    return fromHeader;
  }
  if (bytes.length >= 3 && bytes[0] === 0x89 && bytes[1] === 0x50) {
    return 'image/png';
  }
  if (bytes.length >= 3 && bytes[0] === 0xff && bytes[1] === 0xd8) {
    return 'image/jpeg';
  }
  if (
    bytes.length >= 4 &&
    bytes[0] === 0x52 &&
    bytes[1] === 0x49 &&
    bytes[2] === 0x46 &&
    bytes[3] === 0x46
  ) {
    return 'image/webp';
  }
  const lower = url.toLowerCase();
  if (lower.endsWith('.svg') || lower.includes('.svg?')) {
    return 'image/svg+xml';
  }
  if (lower.endsWith('.png')) {
    return 'image/png';
  }
  if (lower.endsWith('.webp')) {
    return 'image/webp';
  }
  if (lower.endsWith('.ico')) {
    return 'image/x-icon';
  }
  return null;
}

async function fetchCandidate(url: string): Promise<FetchedSiteLogo | null> {
  const response = await fetch(url, {
    headers: { Accept: 'image/*,*/*' },
    redirect: 'follow',
    signal: AbortSignal.timeout(FETCH_TIMEOUT_MS)
  });
  if (!response.ok) {
    return null;
  }

  const buffer = new Uint8Array(await response.arrayBuffer());
  if (buffer.byteLength < 16 || buffer.byteLength > MAX_BYTES) {
    return null;
  }

  const contentType = guessImageContentType(
    url,
    response.headers.get('content-type'),
    buffer
  );
  if (!contentType) {
    return null;
  }

  return { bytes: buffer, contentType };
}

/**
 * Fetches the first usable site logo for a page URL (favicon / logo.svg).
 */
export async function fetchSiteLogoForUrl(
  siteUrl: string
): Promise<FetchedSiteLogo | null> {
  const trimmed = siteUrl.trim();
  if (!trimmed) {
    return null;
  }

  const cached = logoCache.get(trimmed);
  if (cached && cached.expiresAt > Date.now()) {
    return cached.logo;
  }

  const candidates = getPAMSiteIconCandidates(trimmed);
  for (const candidate of candidates) {
    try {
      const logo = await fetchCandidate(candidate);
      if (logo) {
        logoCache.set(trimmed, {
          expiresAt: Date.now() + CACHE_TTL_MS,
          logo
        });
        return logo;
      }
    } catch {
      // try next candidate
    }
  }

  logoCache.set(trimmed, {
    expiresAt: Date.now() + 5 * 60 * 1000,
    logo: null
  });
  return null;
}
