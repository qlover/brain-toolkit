import { inject, injectable } from '@shared/container';
import { API_ADMIN_SITE_SETTINGS } from '@config/route';
import type { SiteSettingKey } from '@config/siteSettings';
import { AppApiRequester } from './AppApiRequester';
import type {
  AdminSiteSettingEntry,
  CorsRule
} from '@brain-toolkit/next-app-kit/shared';
import type { NextKitApiSuccess } from '@qlover/next-kit/common';

export type AdminSiteSettingRow = AdminSiteSettingEntry<SiteSettingKey>;

@injectable()
export class SiteSettingsApi {
  constructor(
    @inject(AppApiRequester) private readonly appApiRequester: AppApiRequester
  ) {}

  public async list(): Promise<AdminSiteSettingRow[]> {
    const response = await this.appApiRequester.get(API_ADMIN_SITE_SETTINGS);
    const envelope = response.data as NextKitApiSuccess<AdminSiteSettingRow[]>;
    return envelope.data ?? [];
  }

  public async patch(
    settings: Partial<
      Record<SiteSettingKey, string | boolean | string[] | CorsRule[]>
    >
  ): Promise<AdminSiteSettingRow[]> {
    const response = await this.appApiRequester.put(API_ADMIN_SITE_SETTINGS, {
      settings
    });
    const envelope = response.data as NextKitApiSuccess<AdminSiteSettingRow[]>;
    return envelope.data ?? [];
  }
}
