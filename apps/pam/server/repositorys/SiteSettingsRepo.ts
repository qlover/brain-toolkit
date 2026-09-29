import { SiteSettingsRepository } from '@brain-toolkit/next-app-kit/server';
import { inject, injectable } from '@shared/container';
import { PAMSupabaseRepo } from './PAMSupabaseRepo';

export type { SiteSettingUpsertInput as PamSiteSettingUpsertInput } from '@brain-toolkit/next-app-kit/shared';

@injectable()
export class SiteSettingsRepo extends SiteSettingsRepository {
  constructor(
    @inject(PAMSupabaseRepo)
    supabaseBridge: PAMSupabaseRepo<unknown>
  ) {
    super(supabaseBridge, 'pam_site_settings');
  }
}
