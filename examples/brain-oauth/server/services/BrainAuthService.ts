import { inject, injectable } from '@shared/container';
import { I } from '@config/ioc-identifiter';
import type { SeedServerConfigInterface } from '@interfaces/SeedConfigInterface';
import type { OAuthUserAdapterInterface } from '@server/oauth/interfaces/OAuthUserAdapterInterface';
import { OAuthCredentialsRepository } from '@server/oauth/repositorys/OAuthCredentialsRepository';
import { BrainSessionService } from './BrainSessionService';
import { TokenEncryption } from '../utils/TokenEncryption';
import type {
  BrainAuthServiceInterface,
  BrainVerifyLoginParams,
  BrainVerifyLoginResult
} from '../interfaces/BrainAuthServiceInterface';
import type { LoggerInterface } from '@qlover/logger';

/**
 * Brain credential verification for OAuth middleware login.
 *
 * Orchestrates Brain login, token exchange, session cookie, and credential persistence.
 *
 * @example
 * const user = await brainAuthService.verifyLogin({ email, password });
 */
@injectable()
export class BrainAuthService implements BrainAuthServiceInterface {
  protected tokenEncryption: TokenEncryption;

  @inject(I.Logger)
  protected logger!: LoggerInterface;

  constructor(
    @inject(BrainSessionService) protected brainSession: BrainSessionService,
    @inject(I.OAuthUserAdapterInterface)
    protected userAdapter: OAuthUserAdapterInterface,
    @inject(OAuthCredentialsRepository)
    protected credentialsRepo: OAuthCredentialsRepository,
    @inject(I.AppConfig) config: SeedServerConfigInterface
  ) {
    this.tokenEncryption = new TokenEncryption(config.encryptionKey);
  }

  /**
   * @override
   */
  public async verifyLogin(
    params: BrainVerifyLoginParams
  ): Promise<BrainVerifyLoginResult> {
    const credentials = await this.userAdapter.login(
      params.email,
      params.password
    );

    this.logger.debug('User provider login successful', credentials);

    const sessionToken = credentials.token;
    if (!sessionToken) {
      throw new Error('User provider login did not return a session token');
    }

    const access = await this.userAdapter.exchangeAccessToken({
      token: sessionToken
    });

    // Provider user info with session token.
    const userInfo = await this.userAdapter.getUserInfo(sessionToken);
    const userId = Number(userInfo.id);
    if (!Number.isFinite(userId)) {
      throw new Error('User provider id is missing from profile');
    }

    const profileEmail = userInfo.email ?? params.email;
    const nameFromParts = [userInfo.first_name, userInfo.last_name]
      .filter(Boolean)
      .join(' ');
    const profileName = userInfo.name ?? (nameFromParts || profileEmail);

    await this.brainSession.setSession({
      userId,
      email: profileEmail,
      name: profileName,
      brainToken: sessionToken
    });

    await this.credentialsRepo.upsertUserCredentials(userId, {
      brain_session_token: sessionToken,
      brain_refresh_token: access.refresh_token
        ? this.tokenEncryption.encrypt(access.refresh_token)
        : null
    });

    return { userId, email: profileEmail, name: profileName };
  }
}
