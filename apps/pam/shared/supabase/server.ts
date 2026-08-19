import { SUPABASE_KEY, SUPABASE_URL } from '@qlover/next-kit/common';
import { createServerClient as createSupabaseServerClient } from '@supabase/ssr';
import { createClient as createSupabaseClient } from '@supabase/supabase-js';
import { cookies } from 'next/headers';

/**
 * Especially important if using Fluid compute: Don't put this client in a
 * global variable. Always create a new client within each function when using
 * it.
 */
export async function createServerClient() {
  const cookieStore = await cookies();

  return createSupabaseServerClient(SUPABASE_URL!, SUPABASE_KEY!, {
    // global: {
    //   fetch: (input, init) => {
    //     console.log('supabase globals fetch', input, init);

    //     return fetch(input, init);
    //   }
    // },
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
 * Service-role Supabase client for OAuth server operations (bypasses RLS).
 * Never import from client bundles.
 *
 * Cached on `globalThis` so TLS / HTTP keep-alive to Supabase is reused
 * across API requests (creating a client per request re-handshakes ~200–400ms
 * from CN to hosted Supabase).
 */
export function createAdminClient() {
  const cache = globalThis as typeof globalThis & {
    __pamAdminSupabase?: ReturnType<typeof createSupabaseClient>;
  };
  if (cache.__pamAdminSupabase) {
    return cache.__pamAdminSupabase;
  }

  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!serviceKey) {
    throw new Error(
      'SUPABASE_SERVICE_ROLE_KEY is required for OAuth operations'
    );
  }
  cache.__pamAdminSupabase = createSupabaseClient(SUPABASE_URL!, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false }
  });
  return cache.__pamAdminSupabase;
}
