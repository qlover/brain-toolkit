import { SupabaseRepo } from '@qlover/next-kit/server';
import {
  verifyClientSecret,
  hashClientSecret,
  generateOAuthClientId,
  generateOAuthClientSecret
} from '@qlover/oauth-wrapper';
import { inject, injectable } from '@shared/container';
import { normalizeLogoUri } from '@config/oauthClientLogoSchema';
import type {
  OAuthClientRow,
  OAuthClientListItem,
  OAuthClientDetail,
  OAuthClientCreate,
  OAuthClientUpdate,
  OAuthAuthorizationCodeRow,
  CreateAuthorizationCodeInput,
  CreateOAuthRefreshTokenInput,
  OAuthWrapperRepositoryInterface,
  OAuthRefreshTokenRow,
  OAuthUserCredentialsRow
} from '@qlover/oauth-wrapper';

type OAuthClientWriteInput = (OAuthClientCreate | OAuthClientUpdate) & {
  logo_uri?: string;
};

@injectable()
export class OAuthWrapperRepository implements OAuthWrapperRepositoryInterface {
  constructor(
    @inject(SupabaseRepo)
    protected supabaseBridge: SupabaseRepo<unknown>
  ) {}

  /**
   * oauth-wrapper compares owner ids with `!==`. PG `integer` columns come
   * back as numbers from Supabase JS while session ids are always strings —
   * normalize so delete/update/get ownership checks work.
   */
  protected normalizeUserId(value: unknown): string {
    return String(value ?? '').trim();
  }

  protected normalizeClientRow(row: OAuthClientRow): OAuthClientRow {
    return {
      ...row,
      owner_user_id: this.normalizeUserId(row.owner_user_id)
    };
  }

  protected normalizeAuthCodeRow(
    row: OAuthAuthorizationCodeRow
  ): OAuthAuthorizationCodeRow {
    return {
      ...row,
      user_id: this.normalizeUserId(row.user_id)
    };
  }

  protected normalizeCredentialsRow(
    row: OAuthUserCredentialsRow
  ): OAuthUserCredentialsRow {
    return {
      ...row,
      user_id: this.normalizeUserId(row.user_id)
    };
  }

  protected normalizeRefreshTokenRow(
    row: OAuthRefreshTokenRow
  ): OAuthRefreshTokenRow {
    return {
      ...row,
      user_id: this.normalizeUserId(row.user_id)
    };
  }
  /**
   * @override
   */
  public async create(input: CreateAuthorizationCodeInput): Promise<void> {
    const supabase = await this.supabaseBridge.getAdminSupabase();
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
    const supabase = await this.supabaseBridge.getAdminSupabase();
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

    return data
      ? this.normalizeAuthCodeRow(data as OAuthAuthorizationCodeRow)
      : null;
  }

  /**
   * @override
   */
  public async getUserCredentials(
    userId: string
  ): Promise<OAuthUserCredentialsRow | null> {
    const supabase = await this.supabaseBridge.getAdminSupabase();
    const { data, error } = await supabase
      .from('brain_oauth_user_credentials')
      .select('*')
      .eq('user_id', userId)
      .maybeSingle();

    if (error) {
      throw new Error(error.message);
    }
    return data
      ? this.normalizeCredentialsRow(data as OAuthUserCredentialsRow)
      : null;
  }

  /**
   * @override
   */
  public async upsertUserCredentials(
    userId: string,
    fields: {
      provider_refresh_token?: string | null;
      provider_session_token?: string | null;
    }
  ): Promise<void> {
    const supabase = await this.supabaseBridge.getAdminSupabase();
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
    const supabase = await this.supabaseBridge.getAdminSupabase();
    const { data, error } = await supabase
      .from('brain_oauth_refresh_tokens')
      .select('*')
      .eq('refresh_token', tokenHash)
      .maybeSingle();

    if (error) {
      throw new Error(error.message);
    }
    return data
      ? this.normalizeRefreshTokenRow(data as OAuthRefreshTokenRow)
      : null;
  }

  /**
   * @override
   */
  public async upsertRefreshToken(input: {
    refresh_token: string;
    client_id: string;
    user_id: string;
    expires_at: string;
  }): Promise<void> {
    const supabase = await this.supabaseBridge.getAdminSupabase();
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
    const supabase = await this.supabaseBridge.getAdminSupabase();
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
    const supabase = await this.supabaseBridge.getAdminSupabase();
    const { data, error } = await supabase
      .from('brain_oauth_refresh_tokens')
      .select('*')
      .eq('refresh_token', tokenHash)
      .maybeSingle();

    if (error) {
      throw new Error(error.message);
    }

    return data
      ? this.normalizeRefreshTokenRow(data as OAuthRefreshTokenRow)
      : null;
  }

  /**
   * @override
   */
  public async createRefreshToken(
    input: CreateOAuthRefreshTokenInput
  ): Promise<void> {
    const supabase = await this.supabaseBridge.getAdminSupabase();
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
    const supabase = await this.supabaseBridge.getAdminSupabase();
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
  public async revokeRefreshTokensByUserId(userId: string): Promise<void> {
    const supabase = await this.supabaseBridge.getAdminSupabase();
    const { error } = await supabase
      .from('brain_oauth_refresh_tokens')
      .update({ revoked: true })
      .eq('user_id', userId)
      .eq('revoked', false);

    if (error) {
      throw new Error(error.message);
    }
  }

  /**
   * @override
   */
  public async findClientById(
    clientId: string
  ): Promise<OAuthClientRow | null> {
    const supabase = await this.supabaseBridge.getAdminSupabase();
    const { data, error } = await supabase
      .from('brain_oauth_clients')
      .select('*')
      .eq('client_id', clientId)
      .maybeSingle();

    if (error) {
      throw new Error(error.message);
    }

    return data ? this.normalizeClientRow(data as OAuthClientRow) : null;
  }

  /**
   * @override
   */
  public async listClientByOwner(
    ownerUserId: string
  ): Promise<OAuthClientListItem[]> {
    const supabase = await this.supabaseBridge.getAdminSupabase();
    const { data, error } = await supabase
      .from('brain_oauth_clients')
      .select(
        'client_id, client_name, client_uri, logo_uri, redirect_uris, confidential, created_at, updated_at'
      )
      .eq('owner_user_id', ownerUserId)
      .order('created_at', { ascending: false });

    if (error) {
      throw new Error(error.message);
    }

    return (data as OAuthClientListItem[]) ?? [];
  }

  /**
   * @override
   */
  public async createClient(
    ownerUserId: string,
    input: OAuthClientCreate
  ): Promise<{ client: OAuthClientRow; clientSecret?: string }> {
    const supabase = await this.supabaseBridge.getAdminSupabase();

    const confidential = input.confidential ?? true;
    const clientId = generateOAuthClientId();
    const logoUri = normalizeLogoUri((input as OAuthClientWriteInput).logo_uri);

    let clientSecret: string | undefined;
    let clientSecretHash: string | null = null;

    if (confidential) {
      clientSecret = generateOAuthClientSecret();
      clientSecretHash = await hashClientSecret(clientSecret);
    }

    const { data, error } = await supabase
      .from('brain_oauth_clients')
      .insert({
        client_id: clientId,
        client_secret_hash: clientSecretHash,
        client_name: input.client_name,
        client_uri: input.client_uri || null,
        logo_uri: logoUri,
        redirect_uris: input.redirect_uris,
        grant_types: ['authorization_code', 'refresh_token'],
        scopes: ['openid', 'profile', 'email'],
        confidential,
        owner_user_id: ownerUserId
      })
      .select('*')
      .single();

    if (error) {
      throw new Error(error.message);
    }

    return {
      client: this.normalizeClientRow(data as OAuthClientRow),
      clientSecret
    };
  }

  /**
   * @override
   */
  public async updateClient(
    ownerUserId: string,
    clientId: string,
    input: OAuthClientUpdate
  ): Promise<OAuthClientDetail> {
    const supabase = await this.supabaseBridge.getAdminSupabase();
    const logoUri = normalizeLogoUri((input as OAuthClientWriteInput).logo_uri);

    const { data, error } = await supabase
      .from('brain_oauth_clients')
      .update({
        client_name: input.client_name,
        client_uri: input.client_uri || null,
        logo_uri: logoUri,
        redirect_uris: input.redirect_uris,
        updated_at: new Date().toISOString()
      })
      .eq('client_id', clientId)
      .eq('owner_user_id', ownerUserId)
      .select('*')
      .single();

    if (error) {
      throw new Error(error.message);
    }

    if (!data) {
      throw new Error('Client not found or access denied');
    }

    return this.mapToDetail(this.normalizeClientRow(data as OAuthClientRow));
  }

  /**
   * @override
   */
  public async rotateClientSecret(
    ownerUserId: string,
    clientId: string
  ): Promise<{ clientSecret: string }> {
    const existing = await this.findClientById(clientId);
    if (!existing?.confidential) {
      throw new Error('public_client_no_secret');
    }

    const supabase = await this.supabaseBridge.getAdminSupabase();

    // Generate new secret
    const clientSecret = generateOAuthClientSecret();
    const clientSecretHash = await hashClientSecret(clientSecret);

    const { error } = await supabase
      .from('brain_oauth_clients')
      .update({
        client_secret_hash: clientSecretHash,
        updated_at: new Date().toISOString()
      })
      .eq('client_id', clientId)
      .eq('owner_user_id', ownerUserId);

    if (error) {
      throw new Error(error.message);
    }

    return { clientSecret };
  }

  /**
   * @override
   */
  public async deleteClient(
    ownerUserId: string,
    clientId: string
  ): Promise<void> {
    const supabase = await this.supabaseBridge.getAdminSupabase();

    const { error } = await supabase
      .from('brain_oauth_clients')
      .delete()
      .eq('client_id', clientId)
      .eq('owner_user_id', ownerUserId);

    if (error) {
      throw new Error(error.message);
    }
  }

  /**
   * @override
   */
  public async verifyClientCredentials(
    clientId: string,
    clientSecret: string | undefined
  ): Promise<OAuthClientRow> {
    const client = await this.findClientById(clientId);
    if (!client) {
      throw new Error('invalid_client');
    }

    if (client.confidential) {
      if (!clientSecret?.trim()) {
        throw new Error('invalid_client');
      }
      if (!client.client_secret_hash) {
        throw new Error('invalid_client');
      }
      const valid = await verifyClientSecret(
        clientSecret,
        client.client_secret_hash
      );
      if (!valid) {
        throw new Error('invalid_client');
      }
    }

    return client;
  }

  private mapToDetail(row: OAuthClientRow): OAuthClientDetail {
    return {
      client_id: row.client_id,
      client_name: row.client_name,
      client_uri: row.client_uri,
      logo_uri: row.logo_uri,
      redirect_uris: row.redirect_uris,
      grant_types: row.grant_types,
      scopes: row.scopes,
      confidential: row.confidential,
      created_at: row.created_at,
      updated_at: row.updated_at
    };
  }
}
