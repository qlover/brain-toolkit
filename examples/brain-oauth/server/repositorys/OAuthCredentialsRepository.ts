import { createHash } from 'crypto';
import { injectable } from '@shared/container';
import { createAdminClient } from '@shared/supabase/admin';
import type {
  OAuthRefreshTokenRow,
  OAuthUserCredentialsRow
} from '@schemas/oauth/OAuthClientSchema';

export function hashOpaqueToken(token: string): string {
  return createHash('sha256').update(token).digest('hex');
}

@injectable()
export class OAuthCredentialsRepository {
  public async getUserCredentials(
    userId: number
  ): Promise<OAuthUserCredentialsRow | null> {
    const supabase = createAdminClient();
    const { data, error } = await supabase
      .from('brain_oauth_user_credentials')
      .select('*')
      .eq('user_id', userId)
      .maybeSingle();

    if (error) {
      throw new Error(error.message);
    }
    return (data as OAuthUserCredentialsRow | null) ?? null;
  }

  public async upsertUserCredentials(
    userId: number,
    fields: {
      brain_refresh_token?: string | null;
      brain_session_token?: string | null;
    }
  ): Promise<void> {
    const supabase = createAdminClient();
    const { error } = await supabase.from('brain_oauth_user_credentials').upsert(
      {
        user_id: userId,
        ...fields,
        updated_at: new Date().toISOString()
      },
      { onConflict: 'user_id' }
    );

    if (error) {
      throw new Error(error.message);
    }
  }

  public async findRefreshToken(
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

  public async upsertRefreshToken(input: {
    refresh_token: string;
    client_id: string;
    user_id: number;
    expires_at: string;
  }): Promise<void> {
    const supabase = createAdminClient();
    const { error } = await supabase.from('brain_oauth_refresh_tokens').upsert(
      {
        ...input,
        revoked: false
      },
      { onConflict: 'refresh_token' }
    );

    if (error) {
      throw new Error(error.message);
    }
  }

  public async revokeRefreshToken(tokenHash: string): Promise<void> {
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
