import { HttpMethods } from '@qlover/fe-corekit';
import { inject, injectable } from '@shared/container';
import { API_USER_PHONE_LOGIN } from '@config/apiRoutes';
import {
  AppApiRequester,
  type AppApiConfig,
  type AppApiRequesterContext
} from './appApi/AppApiRequester';
import type { RequestExecutor } from '@qlover/fe-corekit';

export type PhoneLoginResponse = {
  message?: string;
  OTP_EXP?: number;
  existing?: boolean;
  required_fields?: Record<string, unknown>;
  token?: string;
};

type PhoneLoginApiResponse = {
  success: boolean;
  data?: PhoneLoginResponse;
  id?: string;
  message?: string;
};

/**
 * Client gateway for phone OTP login (`POST /api/user/phone-login`).
 *
 * Two-step flow:
 * 1. Send OTP: `{ phone }` → `{ message, OTP_EXP }`
 * 2. Verify OTP: `{ phone, otp }` → `{ existing, required_fields, token }`
 */
@injectable()
export class PhoneLoginGateway {
  constructor(
    @inject(AppApiRequester)
    protected client: RequestExecutor<AppApiConfig, AppApiRequesterContext>
  ) {}

  /**
   * Send OTP to phone number (step 1)
   */
  public async sendOtp(phone: string): Promise<PhoneLoginResponse> {
    const response = await this.client.request<
      PhoneLoginApiResponse,
      { phone: string }
    >({
      url: API_USER_PHONE_LOGIN,
      method: HttpMethods.POST,
      data: { phone }
    });

    if (!response.data.success || !response.data.data) {
      throw new Error(response.data.message ?? 'Send OTP failed');
    }

    return response.data.data;
  }

  /**
   * Verify OTP code (step 2)
   */
  public async verifyOtp(
    phone: string,
    otp: string
  ): Promise<PhoneLoginResponse> {
    const response = await this.client.request<
      PhoneLoginApiResponse,
      { phone: string; otp: string }
    >({
      url: API_USER_PHONE_LOGIN,
      method: HttpMethods.POST,
      data: { phone, otp }
    });

    if (!response.data.success || !response.data.data) {
      throw new Error(response.data.message ?? 'Phone login failed');
    }

    return response.data.data;
  }
}
