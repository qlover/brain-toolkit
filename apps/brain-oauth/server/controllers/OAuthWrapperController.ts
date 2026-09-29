import { isTrustedAllow } from '@brain-toolkit/next-app-kit/server';
import { ExecutorError } from '@qlover/fe-corekit';
import { Base64Serializer } from '@qlover/fe-corekit/serializer';
import {
  LoginValidator,
  StringEncryptor,
  type LoginSchema,
  type UserSchema,
  type ValidatorInterface
} from '@qlover/next-kit/common';
import { OAuthTokenResponse } from '@qlover/oauth-wrapper';
import { injectable, inject } from '@shared/container';
import { API_OAUTH_WRAPPER_AUTH_FAILED } from '@config/i18n-identifier/api';
import { I } from '@config/ioc-identifiter';
import type { SeedServerConfigInterface } from '@interfaces/SeedConfigInterface';
import type { OAuthAuthorizeClientPreview } from '@interfaces/UserServiceInterface';
import type { OAuthWrapperProviderInterface } from '@server/interfaces/OAuthWrapperProviderInterface';
import { ServerConfig } from '@server/ServerConfig';
import { OAuthUserService } from '@server/services/OAuthUserService';
import {
  ensureConsentDevice,
  readConsentDevice
} from '@server/utils/oauthConsentDevice';
import type { LoggerInterface } from '@qlover/logger';
import type {
  OAuthAuthorizePageData,
  OAuthAuthorizeValidationError,
  OAuthConsentResult,
  OAuthTokenRequest
} from '@qlover/oauth-wrapper';

@injectable()
export class OAuthWrapperController {
  @inject(I.Logger)
  protected logger!: LoggerInterface;

  protected stringEncryptor: StringEncryptor;
  protected secureCookie: boolean;

  constructor(
    @inject(LoginValidator)
    protected loginValidator: ValidatorInterface<LoginSchema>,
    @inject(I.OAuthWrapperProviderInterface)
    protected oauthProvider: OAuthWrapperProviderInterface,
    @inject(OAuthUserService)
    protected oauthService: OAuthUserService,
    @inject(ServerConfig) serverConfig: SeedServerConfigInterface,
    @inject(Base64Serializer) base64Serializer: Base64Serializer
  ) {
    this.stringEncryptor = new StringEncryptor(
      serverConfig.stringEncryptorKey,
      base64Serializer
    );
    this.secureCookie = serverConfig.isProduction;
  }

  /**
   * Validates credentials and performs demo provider login via service layer.
   */
  public async verifyLogin(requestBody: unknown): Promise<UserSchema> {
    try {
      if ((requestBody as LoginSchema).password) {
        (requestBody as LoginSchema).password = this.stringEncryptor.decrypt(
          (requestBody as LoginSchema).password
        );
      }
    } catch {
      throw new ExecutorError(
        'encrypt_password_failed',
        'Encrypt password failed'
      );
    }
    const body = await this.loginValidator.getThrow(requestBody);

    try {
      return await this.oauthService.login({
        email: body.email,
        password: body.password
      });
    } catch (err) {
      if (err instanceof ExecutorError) {
        throw err;
      }

      throw new ExecutorError(API_OAUTH_WRAPPER_AUTH_FAILED, err);
    }
  }

  public resolveAuthorizePage(
    rawQuery: Record<string, string | string[] | undefined>
  ): Promise<
    | { ok: true; data: OAuthAuthorizePageData }
    | { ok: false; error: OAuthAuthorizeValidationError; redirectUrl?: string }
  > {
    return this.oauthProvider.resolveAuthorizePage(rawQuery);
  }

  /**
   * Public app name / logo for the login page "signing in to <app>" card.
   * Only answers for a fully valid authorize request, so it exposes nothing
   * beyond what the consent page itself would show.
   */
  public async previewAuthorizeClient(
    rawQuery: Record<string, string | string[] | undefined>
  ): Promise<OAuthAuthorizeClientPreview | null> {
    const result = await this.resolveAuthorizePage(rawQuery);
    if (!result.ok) {
      return null;
    }
    return {
      clientName: result.data.clientName,
      logoUri: result.data.logoUri ?? null
    };
  }

  public async submitConsent(
    requestBody: unknown
  ): Promise<OAuthConsentResult> {
    // Only issue the device cookie when the user actually asks to trust.
    const device = isTrustedAllow(requestBody)
      ? await ensureConsentDevice(this.secureCookie)
      : await readConsentDevice();
    return await this.oauthProvider.processConsent(requestBody, device);
  }

  /**
   * Redirect URL when the user already trusted this client, else `null`.
   * Runs during Server Component render: failures fall back to the consent
   * page.
   */
  public async tryAutoConsent(
    data: OAuthAuthorizePageData
  ): Promise<string | null> {
    try {
      const result = await this.oauthProvider.tryAutoConsent(
        data,
        await readConsentDevice()
      );
      return result?.redirectUrl ?? null;
    } catch (error) {
      this.logger.warn('OAuth auto-consent skipped, showing consent page', {
        clientId: data.clientId,
        error
      });
      return null;
    }
  }

  public getAuthorizingUser(): Promise<UserSchema | null> {
    return this.oauthProvider.getEmbeddedUser();
  }

  public async exchangeToken(
    fields: Record<string, string> | OAuthTokenRequest
  ): Promise<OAuthTokenResponse> {
    return await this.oauthProvider.exchangeToken(fields);
  }

  public async revokeToken(fields: Record<string, string>): Promise<void> {
    return await this.oauthProvider.revokeToken(fields);
  }

  public async getUserInfo(accessToken: string): Promise<UserSchema> {
    return await this.oauthProvider.getUserInfoWithAccessToken(accessToken);
  }

  public hasNeedLogged(): boolean {
    return this.oauthProvider.hasNeedLogged();
  }
}
