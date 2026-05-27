import { ExecutorError } from '@qlover/fe-corekit';
import { injectable, inject } from '@shared/container';
import type {
  OAuthAuthorizePageData,
  OAuthAuthorizeValidationError,
  OAuthConsentResult,
  OAuthServiceInterface,
  OAuthSessionInterface,
  OAuthUserAdapterInterface,
  OAuthWrapperRepositoryInterface
} from '@shared/oauth-wrapper';
import {
  OAuthWrapperService,
  OAuthTokenService,
  OAuthTokenResponse,
  OAuthUserInfoResponse
} from '@shared/oauth-wrapper';
import { LoginValidator } from '@shared/validators/LoginValidator';
import type { ValidatorInterface } from '@shared/validators/ValidatorInterface';
import { API_OAUTH_BRAIN_AUTH_FAILED } from '@config/i18n-identifier/api';
import { I } from '@config/ioc-identifiter';
import { LoginSchema } from '@schemas/LoginSchema';
import type { SeedServerConfigInterface } from '@interfaces/SeedConfigInterface';
import type {
  BrainAuthServiceInterface,
  BrainVerifyLoginResult
} from '@server/interfaces/BrainAuthServiceInterface';
import { BrainOAuthRepository } from '@server/repositorys/BrainOAuthRepository';
import { BrainAuthService } from '@server/services/BrainAuthService';
import {
  BrainSessionPayload,
  BrainSessionService
} from '@server/services/BrainSessionService';

@injectable()
export class OAuthWrapperController {
  protected oauthService: OAuthServiceInterface;
  constructor(
    @inject(I.AppConfig) config: SeedServerConfigInterface,
    @inject(I.OAuthUserAdapterInterface)
    userAdapter: OAuthUserAdapterInterface,
    @inject(BrainSessionService)
    brainSession: OAuthSessionInterface<BrainSessionPayload>,
    @inject(BrainOAuthRepository)
    oauthRepo: OAuthWrapperRepositoryInterface,
    @inject(LoginValidator)
    protected loginValidator: ValidatorInterface<LoginSchema>,
    @inject(BrainAuthService)
    protected brainAuthService: BrainAuthServiceInterface
  ) {
    this.oauthService = new OAuthWrapperService(
      brainSession,
      userAdapter,
      new OAuthTokenService(config.encryptionKey, userAdapter, oauthRepo),
      oauthRepo
    );
  }

  public getService(): OAuthServiceInterface {
    return this.oauthService;
  }

  /**
   * Validates credentials and performs Brain login via service layer.
   */
  public async verifyBrainLogin(
    requestBody: unknown
  ): Promise<BrainVerifyLoginResult> {
    const body = await this.loginValidator.getThrow(requestBody);

    try {
      return await this.brainAuthService.verifyLogin({
        email: body.email,
        password: body.password
      });
    } catch (err) {
      throw new ExecutorError(
        API_OAUTH_BRAIN_AUTH_FAILED,
        err instanceof Error ? err.message : 'Brain login failed'
      );
    }
  }

  public resolveAuthorizePage(
    rawQuery: Record<string, string | string[] | undefined>
  ): Promise<
    | { ok: true; data: OAuthAuthorizePageData }
    | { ok: false; error: OAuthAuthorizeValidationError }
  > {
    return this.oauthService.resolveAuthorizePage(rawQuery);
  }

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
