import { inject } from 'inversify';
import { OAuthTokenResponse } from '@schemas/oauth/OAuthClientSchema';
import { OAuthUserInfoResponse } from '@schemas/oauth/OAuthUserInfoSchema';
import type {
  OAuthConsentResult,
  OAuthServiceInterface
} from '@server/oauth-wrapper/interfaces/OAuthServiceInterface';
import { OAuthWrapperService } from '@server/oauth-wrapper/services/OAuthWrapperService';

export class OAuthWrapperController {
  constructor(
    @inject(OAuthWrapperService) protected oauthService: OAuthServiceInterface
  ) {}

  public async submitConsent(
    requestBody: unknown
  ): Promise<OAuthConsentResult> {
    return await this.oauthService.processConsent(requestBody);
  }

  public async exchangeToken(
    fields: Record<string, string>
  ): Promise<OAuthTokenResponse> {
    return await this.oauthService.exchangeToken(fields);
  }

  public async getUserInfo(
    accessToken: string
  ): Promise<OAuthUserInfoResponse> {
    return await this.oauthService.getUserInfo(accessToken);
  }
}
