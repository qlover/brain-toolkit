import { inject, injectable } from '@shared/container';
import type { OAuthUserInfoResponse } from '@schemas/oauth/OAuthUserInfoSchema';
import { OAuthUserInfoService } from '../services/OAuthUserInfoService';

/**
 * HTTP entry for OAuth userinfo (`GET /userinfo`).
 */
@injectable()
export class OAuthUserInfoController {
  constructor(
    @inject(OAuthUserInfoService) protected userInfoService: OAuthUserInfoService
  ) {}

  public async getUserInfo(accessToken: string): Promise<OAuthUserInfoResponse> {
    return await this.userInfoService.getUserInfo(accessToken);
  }
}
