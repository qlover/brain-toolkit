import { injectable } from '@shared/container';
import { createAdminClient } from '@shared/supabase/admin';
import { verifyClientSecret, hashClientSecret } from '@server/utils/clientSecretHash';
import type { OAuthClientRow } from '@schemas/oauth/OAuthAuthorizeSchema';
import type { 
  OAuthClientListItem, 
  OAuthClientDetail,
  OAuthClientCreate,
  OAuthClientUpdate 
} from '@schemas/oauth/OAuthAuthorizeSchema';

/**
 * Reads and manages registered OAuth clients from Supabase (service role).
 */
@injectable()
export class OAuthClientsRepository {
  public async findByClientId(clientId: string): Promise<OAuthClientRow | null> {
    const supabase = createAdminClient();
    const { data, error } = await supabase
      .from('brain_oauth_clients')
      .select('*')
      .eq('client_id', clientId)
      .maybeSingle();

    if (error) {
      throw new Error(error.message);
    }

    return (data as OAuthClientRow | null) ?? null;
  }

  public async listByOwner(ownerUserId: number): Promise<OAuthClientListItem[]> {
    const supabase = createAdminClient();
    const { data, error } = await supabase
      .from('brain_oauth_clients')
      .select('client_id, client_name, client_uri, logo_uri, redirect_uris, created_at, updated_at')
      .eq('owner_user_id', ownerUserId)
      .order('created_at', { ascending: false });

    if (error) {
      throw new Error(error.message);
    }

    return (data as OAuthClientListItem[]) ?? [];
  }

  public async create(
    ownerUserId: number,
    input: OAuthClientCreate
  ): Promise<{ client: OAuthClientRow; clientSecret: string }> {
    const supabase = createAdminClient();
    
    // Generate client_id and client_secret
    const clientId = `client_${Math.random().toString(36).substring(2, 15)}`;
    const clientSecret = Math.random().toString(36).substring(2, 20) + Math.random().toString(36).substring(2, 20);
    const clientSecretHash = await hashClientSecret(clientSecret);

    const { data, error } = await supabase
      .from('brain_oauth_clients')
      .insert({
        client_id: clientId,
        client_secret_hash: clientSecretHash,
        client_name: input.client_name,
        client_uri: input.client_uri || null,
        redirect_uris: input.redirect_uris,
        grant_types: ['authorization_code', 'refresh_token'],
        scopes: ['openid', 'profile', 'email'],
        confidential: true,
        owner_user_id: ownerUserId
      })
      .select('*')
      .single();

    if (error) {
      throw new Error(error.message);
    }

    return {
      client: data as OAuthClientRow,
      clientSecret
    };
  }

  public async update(
    ownerUserId: number,
    clientId: string,
    input: OAuthClientUpdate
  ): Promise<OAuthClientDetail> {
    const supabase = createAdminClient();
    
    const { data, error } = await supabase
      .from('brain_oauth_clients')
      .update({
        client_name: input.client_name,
        client_uri: input.client_uri || null,
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

    return this.mapToDetail(data as OAuthClientRow);
  }

  public async rotateSecret(
    ownerUserId: number,
    clientId: string
  ): Promise<{ clientSecret: string }> {
    const supabase = createAdminClient();
    
    // Generate new secret
    const clientSecret = Math.random().toString(36).substring(2, 20) + Math.random().toString(36).substring(2, 20);
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

  public async delete(ownerUserId: number, clientId: string): Promise<void> {
    const supabase = createAdminClient();
    
    const { error } = await supabase
      .from('brain_oauth_clients')
      .delete()
      .eq('client_id', clientId)
      .eq('owner_user_id', ownerUserId);

    if (error) {
      throw new Error(error.message);
    }
  }

  public async verifyClientCredentials(
    clientId: string,
    clientSecret: string | undefined
  ): Promise<OAuthClientRow> {
    const client = await this.findByClientId(clientId);
    if (!client) {
      throw new Error('invalid_client');
    }

    if (client.confidential) {
      if (!clientSecret?.trim()) {
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
