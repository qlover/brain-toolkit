import { inject, injectable } from '@shared/container';
import { I } from '@config/ioc-identifiter';
import type { SeedServerConfigInterface } from '@interfaces/SeedConfigInterface';
import { BrainUserAdapter } from '../adapters/BrainUserAdapter';
import { OAuthCredentialsRepository } from '../repositorys/OAuthCredentialsRepository';
import { BrainSessionService } from '../services/BrainSessionService';
import { TokenEncryption } from '../utils/TokenEncryption';

/**
 * Brain credential verification for OAuth middleware login (Phase 2).
 */
@injectable()
export class BrainAuthController {
  protected tokenEncryption: TokenEncryption;

  constructor(
    @inject(BrainSessionService) protected brainSession: BrainSessionService,
    @inject(BrainUserAdapter) protected brainAdapter: BrainUserAdapter,
    @inject(OAuthCredentialsRepository)
    protected credentialsRepo: OAuthCredentialsRepository,
    @inject(I.AppConfig) config: SeedServerConfigInterface
  ) {
    this.tokenEncryption = new TokenEncryption(config.encryptionKey);
  }

  /**
   * Brain login: sets session cookie and persists encrypted refresh token.
   */
  public async verifyBrainLogin(
    email: string,
    password: string
  ): Promise<{ userId: number; email: string; name: string }> {
    const credentials = await this.brainAdapter.login(email, password);
    const sessionToken = credentials.token;
    if (!sessionToken) {
      throw new Error('Brain login did not return a session token');
    }

    const access = await this.brainAdapter.exchangeAccessToken({
      token: sessionToken
    });

    const userInfo = await this.brainAdapter.getUserInfo(access.access_token);
    const userId = Number(userInfo.id);
    if (!Number.isFinite(userId)) {
      throw new Error('Brain user id is missing from profile');
    }

    const profileEmail = userInfo.email ?? email;
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
