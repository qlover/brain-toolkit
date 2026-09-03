import { inject, injectable } from '@shared/container';
import { API_ADMIN_PHONE_OTPS } from '@config/route';
import type { PamPhoneOtpAdminItem } from '@schemas/PamPhoneOtpSchema';
import { AppApiRequester } from './AppApiRequester';
import type { NextKitApiSuccess } from '@qlover/next-kit/common';

@injectable()
export class AdminPhoneOtpsApi {
  constructor(
    @inject(AppApiRequester) private readonly appApiRequester: AppApiRequester
  ) {}

  public async list(params?: {
    phone?: string;
    limit?: number;
  }): Promise<PamPhoneOtpAdminItem[]> {
    const response = await this.appApiRequester.get(API_ADMIN_PHONE_OTPS, {
      params: {
        phone: params?.phone ?? '',
        limit: params?.limit ?? 50
      }
    });

    const envelope = response.data as NextKitApiSuccess<PamPhoneOtpAdminItem[]>;
    return envelope.data ?? [];
  }
}
