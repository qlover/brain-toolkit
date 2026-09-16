import { inject, injectable } from '@shared/container';
import { PAMSupabaseRepo } from './PAMSupabaseRepo';
import type { PamSiteSettingRow } from '@schemas/PamSiteSettingsSchema';

const TABLE = 'pam_site_settings';

export type PamSiteSettingUpsertInput = {
  readonly key: string;
  readonly value: unknown;
  readonly description: string;
  readonly isSensitive: boolean;
};

@injectable()
export class SiteSettingsRepo {
  constructor(
    @inject(PAMSupabaseRepo)
    protected readonly supabaseBridge: PAMSupabaseRepo<unknown>
  ) {}

  public async getAll(): Promise<PamSiteSettingRow[]> {
    const { data } = await this.supabaseBridge
      .getAdminSupabase()
      .from(TABLE)
      .select('*')
      .throwOnError();
    return (data ?? []) as PamSiteSettingRow[];
  }

  public async upsertMany(rows: PamSiteSettingUpsertInput[]): Promise<void> {
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

    await this.supabaseBridge
      .getAdminSupabase()
      .from(TABLE)
      .upsert(payload, { onConflict: 'key' })
      .throwOnError();
  }
}
