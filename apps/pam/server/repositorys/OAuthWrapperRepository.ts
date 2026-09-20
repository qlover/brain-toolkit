import { SupabaseRepo } from '@qlover/next-kit/server';
import { verifyClientSecret, hashClientSecret } from '@qlover/oauth-wrapper';
import { PamTables } from '@shared/config/pamTables';
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
   * @override
   */
  public async create(input: CreateAuthorizationCodeInput): Promise<void> {
    const supabase = await this.supabaseBridge.getAdminSupabase();
    const result = await supabase
      .from(PamTables.oauthAuthorizationCodes)
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
    this.supabaseBridge.throwIfError(result);
  }

  /**
   * Atomically marks a valid, unused, non-expired code as used and returns the row.

   * @override
      */
  public async consumeCode(
    code: string
  ): Promise<OAuthAuthorizationCodeRow | null> {
    const supabase = await this.supabaseBridge.getAdminSupabase();
    const result = await supabase
      .from(PamTables.oauthAuthorizationCodes)
      .update({ used: true })
      .eq('code', code)
      .eq('used', false)
      .gt('expires_at', new Date().toISOString())
      .select('*')
      .maybeSingle();
    this.supabaseBridge.throwIfError(result);

    return (result.data as OAuthAuthorizationCodeRow | null) ?? null;
  }

  /**
   * @override
   */
  public async getUserCredentials(
    userId: string
  ): Promise<OAuthUserCredentialsRow | null> {
    const supabase = await this.supabaseBridge.getAdminSupabase();
    const result = await supabase
      .from(PamTables.oauthUserCredentials)
      .select('*')
      .eq('user_id', userId)
      .maybeSingle();
    this.supabaseBridge.throwIfError(result);
    return (result.data as OAuthUserCredentialsRow | null) ?? null;
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
    const result = await supabase.from(PamTables.oauthUserCredentials).upsert(
      {
        user_id: userId,
        ...fields,
        updated_at: new Date().toISOString()
      },
      { onConflict: 'user_id' }
    );
    this.supabaseBridge.throwIfError(result);
  }

  public async deleteUserCredentials(userId: string): Promise<void> {
    const supabase = await this.supabaseBridge.getAdminSupabase();
    const result = await supabase
      .from(PamTables.oauthUserCredentials)
      .delete()
      .eq('user_id', userId);
    this.supabaseBridge.throwIfError(result);
  }

  public async reassignClientOwner(
    fromUserId: string,
    toUserId: string
  ): Promise<void> {
    if (fromUserId === toUserId) {
      return;
    }
    const supabase = await this.supabaseBridge.getAdminSupabase();
    const result = await supabase
      .from(PamTables.oauthClients)
      .update({
        owner_user_id: toUserId,
        updated_at: new Date().toISOString()
      })
      .eq('owner_user_id', fromUserId);
    this.supabaseBridge.throwIfError(result);
  }

  public async reassignRefreshTokensUserId(
    fromUserId: string,
    toUserId: string
  ): Promise<void> {
    if (fromUserId === toUserId) {
      return;
    }
    const supabase = await this.supabaseBridge.getAdminSupabase();
    const result = await supabase
      .from(PamTables.oauthRefreshTokens)
      .update({ user_id: toUserId })
      .eq('user_id', fromUserId)
      .eq('revoked', false);
    this.supabaseBridge.throwIfError(result);
  }

  /**
   * @override
   */
  public async findRefreshToken(
    tokenHash: string
  ): Promise<OAuthRefreshTokenRow | null> {
    const supabase = await this.supabaseBridge.getAdminSupabase();
    const result = await supabase
      .from(PamTables.oauthRefreshTokens)
      .select('*')
      .eq('refresh_token', tokenHash)
      .maybeSingle();
    this.supabaseBridge.throwIfError(result);
    return (result.data as OAuthRefreshTokenRow | null) ?? null;
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
    const result = await supabase.from(PamTables.oauthRefreshTokens).upsert(
      {
        ...input,
        revoked: false
      },
      { onConflict: 'refresh_token' }
    );
    this.supabaseBridge.throwIfError(result);
  }

  /**
   * @override
   */
  public async revokeRefreshToken(tokenHash: string): Promise<void> {
    const supabase = await this.supabaseBridge.getAdminSupabase();
    const result = await supabase
      .from(PamTables.oauthRefreshTokens)
      .update({ revoked: true })
      .eq('refresh_token', tokenHash);
    this.supabaseBridge.throwIfError(result);
  }

  /**
   * @override
   */
  public async findByTokenHash(
    tokenHash: string
  ): Promise<OAuthRefreshTokenRow | null> {
    const supabase = await this.supabaseBridge.getAdminSupabase();
    const result = await supabase
      .from(PamTables.oauthRefreshTokens)
      .select('*')
      .eq('refresh_token', tokenHash)
      .maybeSingle();
    this.supabaseBridge.throwIfError(result);

    return (result.data as OAuthRefreshTokenRow | null) ?? null;
  }

  /**
   * @override
   */
  public async createRefreshToken(
    input: CreateOAuthRefreshTokenInput
  ): Promise<void> {
    const supabase = await this.supabaseBridge.getAdminSupabase();
    const result = await supabase.from(PamTables.oauthRefreshTokens).insert({
      refresh_token: input.refresh_token,
      client_id: input.client_id,
      user_id: input.user_id,
      expires_at: input.expires_at,
      revoked: false
    });
    this.supabaseBridge.throwIfError(result);
  }

  /**
   * @override
   */
  public async revokeByTokenHash(tokenHash: string): Promise<void> {
    const supabase = await this.supabaseBridge.getAdminSupabase();
    const result = await supabase
      .from(PamTables.oauthRefreshTokens)
      .update({ revoked: true })
      .eq('refresh_token', tokenHash);
    this.supabaseBridge.throwIfError(result);
  }

  /**
   * @override
   */
  public async revokeRefreshTokensByUserId(userId: string): Promise<void> {
    const supabase = await this.supabaseBridge.getAdminSupabase();
    const result = await supabase
      .from(PamTables.oauthRefreshTokens)
      .update({ revoked: true })
      .eq('user_id', userId)
      .eq('revoked', false);
    this.supabaseBridge.throwIfError(result);
  }

  /**
   * @override
   */
  public async findClientById(
    clientId: string
  ): Promise<OAuthClientRow | null> {
    const supabase = await this.supabaseBridge.getAdminSupabase();
    const result = await supabase
      .from(PamTables.oauthClients)
      .select('*')
      .eq('client_id', clientId)
      .maybeSingle();
    this.supabaseBridge.throwIfError(result);

    return (result.data as OAuthClientRow | null) ?? null;
  }

  /**
   * @override
   */
  public async listClientByOwner(
    ownerUserId: string
  ): Promise<OAuthClientListItem[]> {
    const supabase = await this.supabaseBridge.getAdminSupabase();
    const result = await supabase
      .from(PamTables.oauthClients)
      .select(
        'client_id, client_name, client_uri, logo_uri, redirect_uris, confidential, created_at, updated_at'
      )
      .eq('owner_user_id', ownerUserId)
      .order('created_at', { ascending: false });
    this.supabaseBridge.throwIfError(result);

    return (result.data as OAuthClientListItem[]) ?? [];
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
    const clientId = `client_${Math.random().toString(36).substring(2, 15)}`;
    const logoUri = normalizeLogoUri((input as OAuthClientWriteInput).logo_uri);

    let clientSecret: string | undefined;
    let clientSecretHash: string | null = null;

    if (confidential) {
      clientSecret =
        Math.random().toString(36).substring(2, 20) +
        Math.random().toString(36).substring(2, 20);
      clientSecretHash = await hashClientSecret(clientSecret);
    }

    const result = await supabase
      .from(PamTables.oauthClients)
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
    this.supabaseBridge.throwIfError(result);

    return {
      client: result.data as OAuthClientRow,
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

    const result = await supabase
      .from(PamTables.oauthClients)
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
    this.supabaseBridge.throwIfError(result);

    if (!result.data) {
      throw new Error('Client not found or access denied');
    }

    return this.mapToDetail(result.data as OAuthClientRow);
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
    const clientSecret =
      Math.random().toString(36).substring(2, 20) +
      Math.random().toString(36).substring(2, 20);
    const clientSecretHash = await hashClientSecret(clientSecret);

    const result = await supabase
      .from(PamTables.oauthClients)
      .update({
        client_secret_hash: clientSecretHash,
        updated_at: new Date().toISOString()
      })
      .eq('client_id', clientId)
      .eq('owner_user_id', ownerUserId);
    this.supabaseBridge.throwIfError(result);

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

    const result = await supabase
      .from(PamTables.oauthClients)
      .delete()
      .eq('client_id', clientId)
      .eq('owner_user_id', ownerUserId);
    this.supabaseBridge.throwIfError(result);
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
