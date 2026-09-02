import { inject, injectable } from '@shared/container';
import type {
  PamAdminSiteSettingEntry,
  PamPublicConfig
} from '@schemas/PamSiteSettingsSchema';
import { pamAdminSiteSettingsPatchSchema } from '@schemas/PamSiteSettingsSchema';
import { SiteSettingsService } from '@server/services/SiteSettingsService';

@injectable()
export class SiteSettingsController {
  constructor(
    @inject(SiteSettingsService)
    protected readonly siteSettings: SiteSettingsService
  ) {}

  public async getAdminSettings(): Promise<PamAdminSiteSettingEntry[]> {
    return this.siteSettings.getAdminSettings();
  }

  public async patchAdminSettings(
    body: unknown
  ): Promise<PamAdminSiteSettingEntry[]> {
    const parsed = pamAdminSiteSettingsPatchSchema.parse(body);
    return this.siteSettings.updateAdminSettings(parsed);
  }

  public async getPublicConfig(): Promise<PamPublicConfig> {
    return this.siteSettings.getPublicConfig();
  }
}
