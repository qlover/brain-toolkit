import { OAuthTokenService, OAuthWrapperService } from '@qlover/oauth-wrapper';
import { inject, injectable } from '@shared/container';
import { I } from '@config/ioc-identifiter';
import { LoginPhoneOtpSchema } from '@schemas/LoginSchema';
import { UserRole, UserSchema } from '@schemas/UserSchema';
import type { SeedServerConfigInterface } from '@interfaces/SeedConfigInterface';
import { BrainUserAdapter } from '@server/adapters/BrainUserAdapter';
import {
  LoginWithPhoneOTPResult,
  OAuthWrapperProviderInterface
} from '@server/interfaces/OAuthWrapperProviderInterface';
import { OAuthWrapperRepository } from '@server/repositorys/OAuthWrapperRepository';
import { OAuthSessionService } from '@server/services/OAuthSessionService';
import { TokenEncryption } from '@server/utils/TokenEncryption';
import type {
  OAuthSessionPayload,
  OAuthSessionInterface,
  OAuthWrapperRepositoryInterface
} from '@qlover/oauth-wrapper';

@injectable()
export class BrainUserOAuthProvider
  extends OAuthWrapperService
  implements OAuthWrapperProviderInterface
{
  constructor(
    @inject(I.AppConfig) config: SeedServerConfigInterface,
    @inject(OAuthSessionService)
    oauthSession: OAuthSessionInterface<OAuthSessionPayload>,
    @inject(BrainUserAdapter) protected adapter: BrainUserAdapter,
    @inject(OAuthWrapperRepository) oauthRepo: OAuthWrapperRepositoryInterface
  ) {
    super(
      oauthSession,
      adapter,
      new OAuthTokenService(
        new TokenEncryption(config.encryptionKey),
        adapter,
        oauthRepo
      ),
      oauthRepo
    );
  }

  /**
   * @override
   */
  public getUserSchema(session: OAuthSessionPayload): Promise<UserSchema> {
    // TODO: 补上真实的用户角色信息，重置role
    return Promise.resolve({
      id: String(session.userId),
      email: session.email,
      role: UserRole.USER,
      password: '',
      credential_token: session.providerSessionToken,
      created_at: new Date().toISOString(),
      updated_at: null
    } as UserSchema);
  }

  /**
   * @override
   */
  public async loginWithPhoneOTP(
    params: LoginPhoneOtpSchema
  ): Promise<LoginWithPhoneOTPResult> {
    const result = await this.adapter.loginWithPhoneOTP(params);

    // // send otp: message: 'Waiting on OTP.', OTP_EXP: 60, required
    // // else has: token
    // if (result.message && result.token && result.required) {
    //   return {
    //     ...result,
    //     token: result.token!
    //   };
    // }

    // if (!result.token) {
    //   throw new Error('Brain user Otp login token invalid', { cause: result });
    // }

    return {
      ...result,
      token: result.token!
    };
  }
}
