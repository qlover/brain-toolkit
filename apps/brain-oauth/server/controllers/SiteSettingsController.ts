import {
  adminSiteSettingsPatchSchema,
  type AdminSiteSettingEntry
} from '@brain-toolkit/next-app-kit/shared';
import { inject, injectable } from '@shared/container';
import type { SiteSettingKey } from '@config/siteSettings';
import { SiteSettingsService } from '@server/services/SiteSettingsService';

@injectable()
export class SiteSettingsController {
  constructor(
    @inject(SiteSettingsService)
    protected readonly siteSettings: SiteSettingsService
  ) {}

  public getAdminSettings(): Promise<AdminSiteSettingEntry<SiteSettingKey>[]> {
    return this.siteSettings.getAdminSettings();
  }

  public patchAdminSettings(
    body: unknown
  ): Promise<AdminSiteSettingEntry<SiteSettingKey>[]> {
    return this.siteSettings.updateAdminSettings(
      adminSiteSettingsPatchSchema.parse(body)
    );
  }
}
