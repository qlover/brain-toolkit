import { SUPABASE_URL } from '@qlover/next-kit/common';
import { createClient as createSupabaseClient } from '@supabase/supabase-js';

/**
 * Service-role Supabase client (bypasses RLS). brain-oauth uses Supabase as a
 * plain database only — no Supabase Auth sessions — so every repository goes
 * through this client and scopes rows itself. Never import from client bundles.
 */
export function createAdminClient() {
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!serviceKey) {
    throw new Error(
      'SUPABASE_SERVICE_ROLE_KEY is required for OAuth operations'
    );
  }
  return createSupabaseClient(SUPABASE_URL!, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false }
  });
}
