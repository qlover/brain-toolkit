import { inject, injectable } from '@shared/container';
import type { PamSiteSettingKey } from '@config/pamSiteSettings';
import { API_ADMIN_SITE_SETTINGS } from '@config/route';
import type { PamAdminSiteSettingEntry } from '@schemas/PamSiteSettingsSchema';
import { AppApiRequester } from './AppApiRequester';
import type { NextKitApiSuccess } from '@qlover/next-kit/common';

@injectable()
export class SiteSettingsApi {
  constructor(
    @inject(AppApiRequester) private readonly appApiRequester: AppApiRequester
  ) {}

  public async list(): Promise<PamAdminSiteSettingEntry[]> {
    const response = await this.appApiRequester.get(API_ADMIN_SITE_SETTINGS);
    const envelope = response.data as NextKitApiSuccess<
      PamAdminSiteSettingEntry[]
    >;
    return envelope.data ?? [];
  }

  public async patch(
    settings: Partial<Record<PamSiteSettingKey, string | boolean | string[]>>
  ): Promise<PamAdminSiteSettingEntry[]> {
    const response = await this.appApiRequester.put(API_ADMIN_SITE_SETTINGS, {
      settings
    });
    const envelope = response.data as NextKitApiSuccess<
      PamAdminSiteSettingEntry[]
    >;
    return envelope.data ?? [];
  }
}
