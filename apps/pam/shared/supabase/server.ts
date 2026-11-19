import { createServerClient as createSupabaseServerClient } from '@supabase/ssr';
import {
  createClient as createSupabaseClient,
  type SupabaseClient
} from '@supabase/supabase-js';
import { cookies } from 'next/headers';
import { getRuntimeEnv } from '@shared/env/RuntimeEnvBridge';

function requireSupabaseUrl(): string {
  const url = getRuntimeEnv('SUPABASE_URL')?.trim();
  if (!url) {
    throw new Error('SUPABASE_URL is required');
  }
  return url;
}

function requireAnonKey(): string {
  const key = getRuntimeEnv('SUPABASE_ANON_KEY')?.trim();
  if (!key) {
    throw new Error('SUPABASE_ANON_KEY is required');
  }
  return key;
}

/**
 * Decode JWT payload without verifying signature (config sanity check only).
 */
function readJwtRole(jwt: string): string | null {
  try {
    const part = jwt.split('.')[1];
    if (!part) {
      return null;
    }
    const pad = part + '='.repeat((4 - (part.length % 4)) % 4);
    const json = Buffer.from(
      pad.replace(/-/g, '+').replace(/_/g, '/'),
      'base64'
    ).toString('utf8');
    const payload = JSON.parse(json) as { role?: string };
    return typeof payload.role === 'string' ? payload.role : null;
  } catch {
    return null;
  }
}

function requireServiceRoleKey(): string {
  const key = getRuntimeEnv('SUPABASE_SERVICE_ROLE_KEY')?.trim();
  if (!key) {
    throw new Error(
      'SUPABASE_SERVICE_ROLE_KEY is required for OAuth operations'
    );
  }
  // New Dashboard "publishable" keys must not be used as service role —
  // they hit PostgREST as anon and RLS returns empty pam_roles.
  if (key.startsWith('sb_publishable_') || key.startsWith('sb_secret_')) {
    throw new Error(
      'SUPABASE_SERVICE_ROLE_KEY must be the legacy service_role JWT (eyJ…), ' +
        'not sb_publishable_ / sb_secret_. Copy service_role from Project Settings → API.'
    );
  }
  const role = readJwtRole(key);
  if (role !== 'service_role') {
    throw new Error(
      `SUPABASE_SERVICE_ROLE_KEY JWT role is "${role ?? 'unreadable'}", expected "service_role". ` +
        'A publishable/anon key yields empty pam_roles under RLS.'
    );
  }
  return key;
}

/**
 * Especially important if using Fluid compute: Don't put this client in a
 * global variable. Always create a new client within each function when using
 * it.
 */
export async function createServerClient() {
  const cookieStore = await cookies();

  return createSupabaseServerClient(requireSupabaseUrl(), requireAnonKey(), {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options)
          );
        } catch {
          // The `setAll` method was called from a Server Component.
          // This can be ignored if you have proxy refreshing
          // user sessions.
        }
      }
    }
  });
}

/**
 * 无 cookie 的 anon 客户端，只用于 GoTrue（`refreshSession` / `getUser`）。
 *
 * 不要在缓存的 service_role 客户端上刷新会话。`refreshSession` 会把用户 JWT
 * 写进该客户端，随后的 PostgREST 请求会以该用户身份命中 RLS（例如 `pam_roles` 为空）。
 */
export function createEphemeralAuthClient(): SupabaseClient {
  return createSupabaseClient(requireSupabaseUrl(), requireAnonKey(), {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false
    }
  });
}

/**
 * 发送邮箱魔法链接用的无 cookie Auth 客户端。
 *
 * `createServerClient` 把 `flowType` 固定为 pkce，`code_verifier` 只写在发信浏览器的 cookie 里。
 * 邮件经常在别的客户端打开，回调拿不到这张 cookie，`exchangeCodeForSession` 会失败。
 * 这里使用 implicit：校验链接不带 `pkce_`，Supabase 把 session 放在回调 URL 的 hash 上。
 */
export function createMagicLinkAuthClient(): SupabaseClient {
  return createSupabaseClient(requireSupabaseUrl(), requireAnonKey(), {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false,
      flowType: 'implicit'
    }
  });
}

/**
 * Drop the process-wide admin client so the next {@link createAdminClient}
 * builds a clean service_role client (clears user-session pollution).
 */
export function resetAdminSupabaseClient(): void {
  const cache = globalThis as typeof globalThis & {
    __pamAdminSupabase?: SupabaseClient;
    __pamAdminSupabaseCacheKey?: string;
  };
  delete cache.__pamAdminSupabase;
  delete cache.__pamAdminSupabaseCacheKey;
}

/**
 * Service-role Supabase client for OAuth server operations (bypasses RLS).
 * Never import from client bundles.
 *
 * Do NOT call `auth.refreshSession` / `signIn*` on this client — that replaces
 * the service_role Authorization header with a user JWT.
 *
 * Cached on `globalThis` so TLS / HTTP keep-alive to Supabase is reused
 * across API requests. Cache key includes URL + key fingerprint so env
 * changes do not reuse a wrong client (e.g. anon/publishable).
 */
export function createAdminClient() {
  const url = requireSupabaseUrl();
  const serviceKey = requireServiceRoleKey();

  const cache = globalThis as typeof globalThis & {
    __pamAdminSupabase?: ReturnType<typeof createSupabaseClient>;
    __pamAdminSupabaseCacheKey?: string;
  };
  const cacheKey = `${url}::${serviceKey.slice(0, 16)}`;
  if (
    cache.__pamAdminSupabase &&
    cache.__pamAdminSupabaseCacheKey === cacheKey
  ) {
    return cache.__pamAdminSupabase;
  }

  cache.__pamAdminSupabase = createSupabaseClient(url, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
    // Pin service_role on PostgREST even if auth session was polluted earlier.
    global: {
      headers: {
        Authorization: `Bearer ${serviceKey}`
      }
    }
  });
  cache.__pamAdminSupabaseCacheKey = cacheKey;
  return cache.__pamAdminSupabase;
}
