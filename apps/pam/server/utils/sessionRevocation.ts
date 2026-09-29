import { createAdminClient } from '@shared/supabase/server';
import type { OAuthSessionPayload } from '@qlover/oauth-wrapper';

/** Per-process cache; other instances observe a revoke within this window. */
const CACHE_TTL_MS = 30_000;

type CacheEntry = {
  readonly revokedAtMs: number | null;
  readonly expires: number;
};

const cache = new Map<string, CacheEntry>();

export function setSessionsRevokedCache(
  userId: string,
  revokedAtMs: number | null
): void {
  cache.set(userId, { revokedAtMs, expires: Date.now() + CACHE_TTL_MS });
}

/**
 * Middleware-safe lookup of `pam_users.sessions_revoked_at` (no IOC).
 * Fails open (null) on query errors, e.g. before the column migration ran.
 */
export async function getSessionsRevokedAtMs(
  userId: string
): Promise<number | null> {
  const cached = cache.get(userId);
  if (cached && cached.expires > Date.now()) {
    return cached.revokedAtMs;
  }

  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from('pam_users')
    .select('sessions_revoked_at')
    .eq('id', userId)
    .maybeSingle();

  if (error) {
    return null;
  }

  const raw = (data as { sessions_revoked_at?: string | null } | null)
    ?.sessions_revoked_at;
  const parsed = raw ? Date.parse(raw) : Number.NaN;
  const revokedAtMs = Number.isFinite(parsed) ? parsed : null;
  setSessionsRevokedCache(userId, revokedAtMs);
  return revokedAtMs;
}

/** True when the session JWT was issued before the user's last "revoke all". */
export async function isSessionPayloadRevoked(
  payload: OAuthSessionPayload
): Promise<boolean> {
  const withMeta = payload as OAuthSessionPayload & {
    iat?: number;
    user?: { id?: string };
  };
  const userId = String(withMeta.userId ?? withMeta.user?.id ?? '');
  if (!userId || typeof withMeta.iat !== 'number') {
    return false;
  }
  const revokedAtMs = await getSessionsRevokedAtMs(userId);
  return revokedAtMs !== null && withMeta.iat * 1000 < revokedAtMs;
}
