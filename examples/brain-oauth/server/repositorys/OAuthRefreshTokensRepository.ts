import { injectable } from '@shared/container';
import { createAdminClient } from '@shared/supabase/admin';
import type { OAuthRefreshTokenRow } from '@schemas/oauth/OAuthClientSchema';

export type CreateOAuthRefreshTokenInput = {
  refresh_token: string;
  client_id: string;
  user_id: number;
  expires_at: string;
};

/**
 * Middleware-issued refresh tokens mapped to Brain users and OAuth clients.
 */
@injectable()
export class OAuthRefreshTokensRepository {
  public async findByTokenHash(
    tokenHash: string
  ): Promise<OAuthRefreshTokenRow | null> {
    const supabase = createAdminClient();
    const { data, error } = await supabase
      .from('brain_oauth_refresh_tokens')
      .select('*')
      .eq('refresh_token', tokenHash)
      .maybeSingle();

    if (error) {
      throw new Error(error.message);
    }

    return (data as OAuthRefreshTokenRow | null) ?? null;
  }

  public async create(input: CreateOAuthRefreshTokenInput): Promise<void> {
    const supabase = createAdminClient();
    const { error } = await supabase.from('brain_oauth_refresh_tokens').insert({
      refresh_token: input.refresh_token,
      client_id: input.client_id,
      user_id: input.user_id,
      expires_at: input.expires_at,
      revoked: false
    });

    if (error) {
      throw new Error(error.message);
    }
  }

  public async revokeByTokenHash(tokenHash: string): Promise<void> {
    const supabase = createAdminClient();
    const { error } = await supabase
      .from('brain_oauth_refresh_tokens')
      .update({ revoked: true })
      .eq('refresh_token', tokenHash);

    if (error) {
      throw new Error(error.message);
    }
  }
}
