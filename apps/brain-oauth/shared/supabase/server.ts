import { SUPABASE_URL } from '@qlover/next-kit/common';
import {
  createClient as createSupabaseClient,
  type SupabaseClient
} from '@supabase/supabase-js';

type AdminClientCache = typeof globalThis & {
  __brainOAuthAdminSupabase?: SupabaseClient;
  __brainOAuthAdminSupabaseCacheKey?: string;
};

/**
 * Service-role Supabase client (bypasses RLS). brain-oauth uses Supabase as a
 * plain database only — no Supabase Auth sessions — so every repository goes
 * through this client and scopes rows itself. Never import from client bundles.
 *
 * Cached on `globalThis` so TLS / HTTP keep-alive to Supabase is reused across
 * API requests. The cache key includes URL + key fingerprint so env changes do
 * not reuse a stale client. Never call `auth.*` sign-in methods on it — that
 * would replace the service_role Authorization header.
 */
export function createAdminClient(): SupabaseClient {
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!serviceKey) {
    throw new Error(
      'SUPABASE_SERVICE_ROLE_KEY is required for OAuth operations'
    );
  }

  const cache = globalThis as AdminClientCache;
  const cacheKey = `${SUPABASE_URL}::${serviceKey.slice(0, 16)}`;
  if (
    cache.__brainOAuthAdminSupabase &&
    cache.__brainOAuthAdminSupabaseCacheKey === cacheKey
  ) {
    return cache.__brainOAuthAdminSupabase;
  }

  cache.__brainOAuthAdminSupabase = createSupabaseClient(
    SUPABASE_URL!,
    serviceKey,
    {
      auth: { persistSession: false, autoRefreshToken: false },
      global: { headers: { Authorization: `Bearer ${serviceKey}` } }
    }
  );
  cache.__brainOAuthAdminSupabaseCacheKey = cacheKey;
  return cache.__brainOAuthAdminSupabase;
}
