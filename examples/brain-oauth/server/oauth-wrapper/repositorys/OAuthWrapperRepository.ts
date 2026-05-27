import { createAdminClient } from '@shared/supabase/admin';
import type { OAuthAuthorizationCodeRow } from '@schemas/oauth/OAuthAuthorizeSchema';
import type {
  OAuthRefreshTokenRow,
  OAuthUserCredentialsRow
} from '@schemas/oauth/OAuthClientSchema';
import type { OAuthWrapperRepositoryInterface } from '../interfaces/OAuthWrapperRepositoryInterface';

export type CreateAuthorizationCodeInput = {
  code: string;
  client_id: string;
  user_id: number;
  redirect_uri: string;
  scope: string | null;
  code_challenge: string | null;
  code_challenge_method: string | null;
  expires_at: string;
};

export type CreateOAuthRefreshTokenInput = {
  refresh_token: string;
  client_id: string;
  user_id: number;
  expires_at: string;
};

export class OAuthWrapperRepository implements OAuthWrapperRepositoryInterface {
  /**
   * @override
   */
  public async create(input: CreateAuthorizationCodeInput): Promise<void> {
    const supabase = createAdminClient();
    const { error } = await supabase
      .from('brain_oauth_authorization_codes')
      .insert({
        code: input.code,
        client_id: input.client_id,
        user_id: input.user_id,
        redirect_uri: input.redirect_uri,
        scope: input.scope,
        code_challenge: input.code_challenge,
        code_challenge_method: input.code_challenge_method,
        expires_at: input.expires_at,
        used: false
      });

    if (error) {
      throw new Error(error.message);
    }
  }

  /**
   * Atomically marks a valid, unused, non-expired code as used and returns the row.

   * @override
      */
  public async consumeCode(
    code: string
  ): Promise<OAuthAuthorizationCodeRow | null> {
    const supabase = createAdminClient();
    const { data, error } = await supabase
      .from('brain_oauth_authorization_codes')
      .update({ used: true })
      .eq('code', code)
      .eq('used', false)
      .gt('expires_at', new Date().toISOString())
      .select('*')
      .maybeSingle();

    if (error) {
      throw new Error(error.message);
    }

    return (data as OAuthAuthorizationCodeRow | null) ?? null;
  }

  /**
   * @override
   */
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

  /**
   * @override
   */
  public async upsertUserCredentials(
    userId: number,
    fields: {
      brain_refresh_token?: string | null;
      brain_session_token?: string | null;
    }
  ): Promise<void> {
    const supabase = createAdminClient();
    const { error } = await supabase
      .from('brain_oauth_user_credentials')
      .upsert(
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

  /**
   * @override
   */
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

  /**
   * @override
   */
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

  /**
   * @override
   */
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

  /**
   * @override
   */
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

  /**
   * @override
   */
  public async createRefreshToken(
    input: CreateOAuthRefreshTokenInput
  ): Promise<void> {
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

  /**
   * @override
   */
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
