import { SupabaseRepo } from '@qlover/next-kit/server';
import { inject, injectable } from '@shared/container';
import { I } from '@config/ioc-identifiter';
import { OAuthWrapperRepository } from '@server/repositorys/OAuthWrapperRepository';
import { PamCliTokenRepo } from '@server/repositorys/PamCliTokenRepo';
import { PamUsersRepo } from '@server/repositorys/PamUsersRepo';
import { PamSupabaseSessionMintService } from '@server/services/PamSupabaseSessionMintService';
import { setSessionsRevokedCache } from '@server/utils/sessionRevocation';
import type { LoggerInterface } from '@qlover/logger';

/**
 * Signs a user out everywhere: PAM browser sessions, pamenv CLI tokens,
 * third-party OAuth refresh tokens and Supabase refresh tokens.
 */
@injectable()
export class PamSessionRevokeService {
  constructor(
    @inject(I.Logger) protected readonly logger: LoggerInterface,
    @inject(SupabaseRepo)
    protected readonly supabaseBridge: SupabaseRepo<unknown>,
    @inject(PamUsersRepo) protected readonly pamUsersRepo: PamUsersRepo,
    @inject(PamCliTokenRepo) protected readonly cliTokenRepo: PamCliTokenRepo,
    @inject(OAuthWrapperRepository)
    protected readonly oauthRepo: OAuthWrapperRepository,
    @inject(PamSupabaseSessionMintService)
    protected readonly sessionMint: PamSupabaseSessionMintService
  ) {}

  public async revokeAll(params: {
    userId: string;
    email?: string | null;
  }): Promise<void> {
    const { userId } = params;
    const now = new Date();

    await this.pamUsersRepo.setSessionsRevokedAt(userId, now.toISOString());
    setSessionsRevokedCache(userId, now.getTime());

    const cliRevoked = await this.cliTokenRepo.revokeAllForUser(userId);
    await this.oauthRepo.revokeRefreshTokensByUserId(userId);
    await this.oauthRepo.upsertUserCredentials(userId, {
      provider_refresh_token: null,
      provider_session_token: null
    });

    await this.revokeSupabaseSessions(userId, params.email);

    this.logger.info('PamSessionRevokeService: all sessions revoked', {
      userId,
      cliRevoked
    });
  }

  /**
   * GoTrue global sign-out needs a user JWT; mint a throwaway session and
   * sign it out with scope `global`. Best effort.
   */
  protected async revokeSupabaseSessions(
    userId: string,
    email?: string | null
  ): Promise<void> {
    const mintEmail = email?.trim();
    if (!mintEmail) {
      return;
    }
    try {
      const session = await this.sessionMint.mintSessionForAuthUser({
        userId,
        email: mintEmail
      });
      const admin = await this.supabaseBridge.getAdminSupabase();
      const result = await admin.auth.admin.signOut(
        session.access_token,
        'global'
      );
      if (result.error) {
        throw result.error;
      }
    } catch (error) {
      this.logger.warn('Supabase global sign-out failed', { userId, error });
    }
  }
}
