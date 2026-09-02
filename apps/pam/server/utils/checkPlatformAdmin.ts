import { createAdminClient } from '@shared/supabase/server';
import {
  getPlatformAdminCache,
  resolvePlatformAdminFromDb,
  setPlatformAdminCache
} from '@server/utils/platformAdminCache';

export async function checkPlatformAdmin(userId: string): Promise<boolean> {
  const cached = getPlatformAdminCache(userId);
  if (cached !== undefined) {
    return cached;
  }

  return resolvePlatformAdminFromDb(userId, async (id) => {
    const supabase = createAdminClient();
    const { data, error } = await supabase
      .from('pam_users')
      .select('is_platform_admin')
      .eq('id', id)
      .maybeSingle();

    if (error) {
      return false;
    }

    const row = data as { is_platform_admin?: boolean } | null;
    const value = Boolean(row?.is_platform_admin);
    setPlatformAdminCache(id, value);
    return value;
  });
}
