import {
  isPlatformAdminRole,
  normalizeSystemRole
} from '@shared/auth/systemRole';
import { createAdminClient } from '@shared/supabase/server';
import {
  getPlatformAdminCache,
  resolvePlatformAdminFromDb,
  setPlatformAdminCache
} from '@server/utils/platformAdminCache';

/** Uses pam_users.role_id → pam_roles.key (no hardcoded UUIDs). */
export async function checkPlatformAdmin(userId: string): Promise<boolean> {
  const cached = getPlatformAdminCache(userId);
  if (cached !== undefined) {
    return cached;
  }

  return resolvePlatformAdminFromDb(userId, async (id) => {
    const supabase = createAdminClient();
    const { data, error } = await supabase
      .from('pam_users')
      .select('pam_roles ( key )')
      .eq('id', id)
      .maybeSingle();

    if (error) {
      return false;
    }

    const row = data as { pam_roles?: { key?: string } | null } | null;
    const key = row?.pam_roles?.key;
    const value = isPlatformAdminRole(normalizeSystemRole(key));
    setPlatformAdminCache(id, value);
    return value;
  });
}
