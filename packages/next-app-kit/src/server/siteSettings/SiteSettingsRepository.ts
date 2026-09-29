import type {
  SiteSettingRow,
  SiteSettingUpsertInput
} from '../../shared/siteSettings';
import type { SupabaseAdminBridge } from '../repositorys/RolePermissionsRepository';

/** Key/value site settings table (`key` primary key, jsonb `value`). */
export class SiteSettingsRepository {
  constructor(
    protected readonly supabaseBridge: SupabaseAdminBridge,
    protected readonly tableName: string
  ) {}

  public async getAll(): Promise<SiteSettingRow[]> {
    const supabase = await this.supabaseBridge.getAdminSupabase();
    const result = await supabase.from(this.tableName).select('*');
    this.supabaseBridge.throwIfError(result);
    return (result.data ?? []) as SiteSettingRow[];
  }

  public async upsertMany(rows: SiteSettingUpsertInput[]): Promise<void> {
    if (rows.length === 0) {
      return;
    }

    const payload = rows.map((row) => ({
      key: row.key,
      value: row.value,
      description: row.description,
      is_sensitive: row.isSensitive,
      updated_at: new Date().toISOString()
    }));

    const supabase = await this.supabaseBridge.getAdminSupabase();
    const result = await supabase
      .from(this.tableName)
      .upsert(payload, { onConflict: 'key' });
    this.supabaseBridge.throwIfError(result);
  }
}
