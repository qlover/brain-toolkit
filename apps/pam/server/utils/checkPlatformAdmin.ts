import { createAdminClient } from '@shared/supabase/server';
import {
  isPlatformAdminRole,
  normalizeSystemRole
} from '@shared/auth/systemRole';
import {
  getPlatformAdminCache,
  resolvePlatformAdminFromDb,
  setPlatformAdminCache
} from '@server/utils/platformAdminCache';

/**
 * Uses pam_users.system_role (new column). Does not read is_platform_admin.
 */
export async function checkPlatformAdmin(userId: string): Promise<boolean> {
  const cached = getPlatformAdminCache(userId);
  if (cached !== undefined) {
    return cached;
  }

  return resolvePlatformAdminFromDb(userId, async (id) => {
    const supabase = createAdminClient();
    const { data, error } = await supabase
      .from('pam_users')
      .select('system_role')
      .eq('id', id)
      .maybeSingle();

    if (error) {
      return false;
    }

    const row = data as { system_role?: string } | null;
    const value = isPlatformAdminRole(normalizeSystemRole(row?.system_role));
    setPlatformAdminCache(id, value);
    return value;
  });
}
