import { inject, injectable } from '@shared/container';
import type {
  PamAdminSiteSettingEntry,
  PamPublicConfig
} from '@schemas/PamSiteSettingsSchema';
import { pamAdminSiteSettingsPatchSchema } from '@schemas/PamSiteSettingsSchema';
import { OAuthUserService } from '@server/services/OAuthUserService';
import { SiteSettingsService } from '@server/services/SiteSettingsService';

@injectable()
export class SiteSettingsController {
  constructor(
    @inject(SiteSettingsService)
    protected readonly siteSettings: SiteSettingsService,
    @inject(OAuthUserService)
    protected readonly oauthUserService: OAuthUserService
  ) {}

  public async getAdminSettings(): Promise<PamAdminSiteSettingEntry[]> {
    await this.oauthUserService.throwIfNotAuth();
    return this.siteSettings.getAdminSettings();
  }

  public async patchAdminSettings(
    body: unknown
  ): Promise<PamAdminSiteSettingEntry[]> {
    await this.oauthUserService.throwIfNotAuth();
    const parsed = pamAdminSiteSettingsPatchSchema.parse(body);
    return this.siteSettings.updateAdminSettings(parsed);
  }

  public async getPublicConfig(): Promise<PamPublicConfig> {
    return this.siteSettings.getPublicConfig();
  }
}
