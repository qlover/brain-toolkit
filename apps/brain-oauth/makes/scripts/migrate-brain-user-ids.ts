/**
 * One-off: create auth.users + brain_oauth_user_links for legacy Brain ids still
 * used as owner_user_id / credentials.user_id, then re-run
 * makes/sql/003-migrate-existing.sql (remap section).
 *
 * Usage (from apps/brain-oauth, with .env.local loaded):
 *   pnpm exec ts-node --compiler-options "{\"module\":\"commonjs\"}" makes/scripts/migrate-brain-user-ids.ts
 *
 * Or: node --import tsx makes/scripts/migrate-brain-user-ids.ts
 */
import { createClient } from '@supabase/supabase-js';

const url = process.env.SUPABASE_URL?.trim();
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();
const provider = 'brain';

if (!url || !serviceKey) {
  console.error('SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required');
  process.exit(1);
}

const supabase = createClient(url, serviceKey, {
  auth: { persistSession: false, autoRefreshToken: false }
});

function isUuid(value: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
    value
  );
}

async function collectLegacyExternalIds(): Promise<string[]> {
  const ids = new Set<string>();

  const clients = await supabase
    .from('brain_oauth_clients')
    .select('owner_user_id');
  if (clients.error) throw clients.error;
  for (const row of clients.data ?? []) {
    const id = String(row.owner_user_id ?? '').trim();
    if (id && !isUuid(id)) ids.add(id);
  }

  const creds = await supabase
    .from('brain_oauth_user_credentials')
    .select('user_id');
  if (creds.error) throw creds.error;
  for (const row of creds.data ?? []) {
    const id = String(row.user_id ?? '').trim();
    if (id && !isUuid(id)) ids.add(id);
  }

  return [...ids];
}

async function ensureLink(externalUserId: string): Promise<string> {
  const existing = await supabase
    .from('brain_oauth_user_links')
    .select('auth_user_id')
    .eq('provider', provider)
    .eq('external_user_id', externalUserId)
    .maybeSingle();
  if (existing.error) throw existing.error;
  if (existing.data?.auth_user_id) {
    return String(existing.data.auth_user_id);
  }

  const email = `${externalUserId}@${provider}.users.local`;
  const created = await supabase.auth.admin.createUser({
    email,
    email_confirm: true,
    app_metadata: {
      provider,
      external_user_id: externalUserId
    },
    user_metadata: { migrated: true }
  });

  if (created.error || !created.data.user) {
    throw created.error ?? new Error(`createUser failed for ${externalUserId}`);
  }

  const authUserId = created.data.user.id;
  const link = await supabase.from('brain_oauth_user_links').upsert(
    {
      auth_user_id: authUserId,
      provider,
      external_user_id: externalUserId,
      updated_at: new Date().toISOString()
    },
    { onConflict: 'auth_user_id' }
  );
  if (link.error) throw link.error;

  return authUserId;
}

async function main() {
  const legacyIds = await collectLegacyExternalIds();
  console.log(`Found ${legacyIds.length} legacy external id(s)`);

  for (const externalId of legacyIds) {
    const authId = await ensureLink(externalId);
    console.log(
      `linked provider=${provider} external_user_id=${externalId} -> auth_user_id=${authId}`
    );
  }

  console.log(
    'Next: re-run makes/sql/003-migrate-existing.sql in Supabase SQL editor'
  );
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
