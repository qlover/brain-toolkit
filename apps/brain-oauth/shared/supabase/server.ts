import {
  createClient as createSupabaseClient,
  type SupabaseClient
} from '@supabase/supabase-js';
import { getRuntimeEnv } from '@shared/env/RuntimeEnvBridge';

type AdminClientCache = typeof globalThis & {
  __brainOAuthAdminSupabase?: SupabaseClient;
  __brainOAuthAdminSupabaseCacheKey?: string;
};

function requireSupabaseUrl(): string {
  const url = getRuntimeEnv('SUPABASE_URL')?.trim();
  if (!url) {
    throw new Error('SUPABASE_URL is required for OAuth operations');
  }
  return url;
}

/**
 * Service-role Supabase client（绕过 RLS）。经 {@link getRuntimeEnv} 读密钥，
 * 与入口 bind 的袋同源。勿从客户端 bundle 引入。
 */
export function createAdminClient(): SupabaseClient {
  const serviceKey = getRuntimeEnv('SUPABASE_SERVICE_ROLE_KEY');
  if (!serviceKey) {
    throw new Error(
      'SUPABASE_SERVICE_ROLE_KEY is required for OAuth operations'
    );
  }

  const supabaseUrl = requireSupabaseUrl();
  const cache = globalThis as AdminClientCache;
  const cacheKey = `${supabaseUrl}::${serviceKey.slice(0, 16)}`;
  if (
    cache.__brainOAuthAdminSupabase &&
    cache.__brainOAuthAdminSupabaseCacheKey === cacheKey
  ) {
    return cache.__brainOAuthAdminSupabase;
  }

  cache.__brainOAuthAdminSupabase = createSupabaseClient(
    supabaseUrl,
    serviceKey,
    {
      auth: { persistSession: false, autoRefreshToken: false },
      global: { headers: { Authorization: `Bearer ${serviceKey}` } }
    }
  );
  cache.__brainOAuthAdminSupabaseCacheKey = cacheKey;
  return cache.__brainOAuthAdminSupabase;
}
