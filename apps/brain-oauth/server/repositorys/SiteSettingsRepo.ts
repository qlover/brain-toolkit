import { SiteSettingsRepository } from '@brain-toolkit/next-app-kit/server';
import { SupabaseRepo } from '@qlover/next-kit/server';
import { inject, injectable } from '@shared/container';
import { oauthLocalUserConfig } from '@config/oauthLocalUser';

@injectable()
export class SiteSettingsRepo extends SiteSettingsRepository {
  constructor(@inject(SupabaseRepo) supabaseRepo: SupabaseRepo<unknown>) {
    super(supabaseRepo, oauthLocalUserConfig.siteSettingsTable);
  }
}
