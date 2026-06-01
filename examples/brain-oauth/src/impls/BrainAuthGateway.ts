import { HttpMethods } from '@qlover/fe-corekit';
import { inject, injectable } from '@shared/container';
import { API_OAUTH_VERIFY } from '@config/apiRoutes';
import {
  AppApiRequester,
  type AppApiConfig,
  type AppApiRequesterContext
} from './appApi/AppApiRequester';
import type { RequestExecutor } from '@qlover/fe-corekit';

export type BrainVerifyResult = {
  userId: number;
  email: string;
  name: string;
};

type BrainVerifyResponse = {
  success: boolean;
  data?: BrainVerifyResult;
  id?: string;
  message?: string;
};

/**
 * Client gateway for Brain OAuth login (`POST /api/brain/verify`).
 */
@injectable()
export class BrainAuthGateway {
  constructor(
    @inject(AppApiRequester)
    protected client: RequestExecutor<AppApiConfig, AppApiRequesterContext>
  ) {}

  public async verify(params: {
    email: string;
    password: string;
  }): Promise<BrainVerifyResult> {
    const response = await this.client.request<
      BrainVerifyResponse,
      { email: string; password: string }
    >({
      url: API_OAUTH_VERIFY,
      method: HttpMethods.POST,
      data: params
    });

    if (!response.data.success || !response.data.data) {
      throw new Error(response.data.message ?? 'Brain login failed');
    }

    return response.data.data;
  }
}
