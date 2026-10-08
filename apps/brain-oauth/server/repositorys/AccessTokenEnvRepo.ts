import { createHash } from 'crypto';
import { SupabaseRepo } from '@qlover/next-kit/server';
import { inject, injectable } from '@shared/container';
import { I } from '@config/ioc-identifiter';
import { oauthLocalUserConfig } from '@config/oauthLocalUser';
import type { LoggerInterface } from '@qlover/logger';

const { accessTokenEnvsTable } = oauthLocalUserConfig;

function hashAccessToken(accessToken: string): string {
  return createHash('sha256').update(accessToken).digest('hex');
}

/**
 * Brain access tokens handed to OAuth clients are opaque JWTs without an env,
 * so the env is recorded at `/oauth/token` and looked up on `/oauth/userinfo`.
 */
@injectable()
export class AccessTokenEnvRepo {
  constructor(
    @inject(I.Logger) protected readonly logger: LoggerInterface,
    @inject(SupabaseRepo)
    protected readonly supabaseRepo: SupabaseRepo<unknown>
  ) {}

  public async record(input: {
    accessToken: string;
    userId: string;
    env: string;
    expiresInSeconds: number;
  }): Promise<void> {
    const supabase = await this.supabaseRepo.getAdminSupabase();
    const now = Date.now();
    const { error } = await supabase.from(accessTokenEnvsTable).upsert(
      {
        token_hash: hashAccessToken(input.accessToken),
        user_id: input.userId,
        brain_env: input.env,
        expires_at: new Date(now + input.expiresInSeconds * 1000).toISOString()
      },
      { onConflict: 'token_hash' }
    );
    if (error) {
      throw new Error(
        `Failed to record ${accessTokenEnvsTable}: ${error.message}`
      );
    }

    const { error: cleanupError } = await supabase
      .from(accessTokenEnvsTable)
      .delete()
      .eq('user_id', input.userId)
      .lt('expires_at', new Date(now).toISOString());
    if (cleanupError) {
      this.logger.warn(`Failed to clean up ${accessTokenEnvsTable}`, {
        error: cleanupError.message
      });
    }
  }

  /** `null` when the token was not issued here (or the lookup failed). */
  public async findEnv(accessToken: string): Promise<string | null> {
    const supabase = await this.supabaseRepo.getAdminSupabase();
    const { data, error } = await supabase
      .from(accessTokenEnvsTable)
      .select('brain_env')
      .eq('token_hash', hashAccessToken(accessToken))
      .maybeSingle();
    if (error) {
      this.logger.warn(`Failed to read ${accessTokenEnvsTable}`, {
        error: error.message
      });
      return null;
    }
    const env = (data as { brain_env?: unknown } | null)?.brain_env;
    return typeof env === 'string' && env ? env : null;
  }
}
