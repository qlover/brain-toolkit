import { SupabaseRepo } from '@qlover/next-kit/server';
import { inject, injectable } from '@shared/container';
import { I } from '@config/ioc-identifiter';
import type { PamSiteSettingRow } from '@schemas/PamSiteSettingsSchema';
import type { LoggerInterface } from '@qlover/logger';

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
    @inject(SupabaseRepo)
    protected readonly supabaseBridge: SupabaseRepo<unknown>,
    @inject(I.Logger)
    protected readonly logger: LoggerInterface
  ) {}

  public async getAll(): Promise<PamSiteSettingRow[]> {
    const supabase = await this.supabaseBridge.getAdminSupabase();
    const { data, error } = await supabase.from(TABLE).select('*');

    if (error) {
      this.logger.error('SiteSettingsRepo.getAll failed', { error });
      throw new Error(error.message);
    }

    return (data ?? []) as PamSiteSettingRow[];
  }

  public async upsertMany(rows: PamSiteSettingUpsertInput[]): Promise<void> {
    if (rows.length === 0) {
      return;
    }

    const supabase = await this.supabaseBridge.getAdminSupabase();
    const payload = rows.map((row) => ({
      key: row.key,
      value: row.value,
      description: row.description,
      is_sensitive: row.isSensitive,
      updated_at: new Date().toISOString()
    }));

    const { error } = await supabase.from(TABLE).upsert(payload, {
      onConflict: 'key'
    });

    if (error) {
      this.logger.error('SiteSettingsRepo.upsertMany failed', { error });
      throw new Error(error.message);
    }
  }
}
