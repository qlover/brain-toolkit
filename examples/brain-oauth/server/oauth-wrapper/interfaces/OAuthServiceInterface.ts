import type { OAuthTokenResponse } from '@schemas/oauth/OAuthClientSchema';
import type { OAuthUserInfoResponse } from '@schemas/oauth/OAuthUserInfoSchema';
import type { OAuthAuthorizePageData } from '@interfaces/oauth/OAuthAuthorizePageData';

export type OAuthAuthorizeValidationError = {
  errorKey: string;
  message: string;
};

export type OAuthConsentResult = {
  redirectUrl: string;
};

export interface OAuthServiceInterface {
  resolveAuthorizePage(
    rawQuery: Record<string, string | string[] | undefined>
  ): Promise<
    | { ok: true; data: OAuthAuthorizePageData }
    | { ok: false; error: OAuthAuthorizeValidationError }
  >;

  processConsent(requestBody: unknown): Promise<OAuthConsentResult>;

  exchangeToken(rawFields: Record<string, string>): Promise<OAuthTokenResponse>;

  getUserInfo(accessToken: string): Promise<OAuthUserInfoResponse>;
}
