import { inject, injectable } from '@shared/container';
import type {
  OAuthClientListItem,
  OAuthClientDetail,
  OAuthClientRow,
  OAuthClientCreate,
  OAuthClientUpdate,
  OAuthClientCreateResponse,
  OAuthClientSecretRotateResponse
} from '@schemas/oauth/OAuthAuthorizeSchema';
import { OAuthClientsRepository } from '../repositorys/OAuthClientsRepository';

/**
 * Business logic for OAuth client management in developer console.
 */
@injectable()
export class OAuthClientsService {
  constructor(
    @inject(OAuthClientsRepository)
    protected clientsRepo: OAuthClientsRepository
  ) {}

  /**
   * List all OAuth clients owned by a user
   */
  public async listForOwner(
    ownerUserId: number
  ): Promise<OAuthClientListItem[]> {
    return this.clientsRepo.listByOwner(ownerUserId);
  }

  /**
   * Get detailed information about a specific OAuth client
   */
  public async getByClientId(
    ownerUserId: number,
    clientId: string
  ): Promise<OAuthClientDetail> {
    const client = await this.clientsRepo.findByClientId(clientId);

    if (!client) {
      throw new Error('Client not found');
    }

    if (client.owner_user_id !== ownerUserId) {
      throw new Error('Access denied');
    }

    return this.mapToDetail(client);
  }

  /**
   * Create a new OAuth client
   */
  public async create(
    ownerUserId: number,
    input: OAuthClientCreate
  ): Promise<OAuthClientCreateResponse> {
    const result = await this.clientsRepo.create(ownerUserId, input);

    return {
      client_id: result.client.client_id,
      client_secret: result.clientSecret,
      client_name: result.client.client_name,
      client_uri: result.client.client_uri,
      redirect_uris: result.client.redirect_uris,
      created_at: result.client.created_at
    };
  }

  /**
   * Update an existing OAuth client
   */
  public async update(
    ownerUserId: number,
    clientId: string,
    input: OAuthClientUpdate
  ): Promise<OAuthClientDetail> {
    // Verify ownership first
    const existing = await this.clientsRepo.findByClientId(clientId);
    if (!existing) {
      throw new Error('Client not found');
    }
    if (existing.owner_user_id !== ownerUserId) {
      throw new Error('Access denied');
    }

    return this.clientsRepo.update(ownerUserId, clientId, input);
  }

  /**
   * Rotate the client secret
   */
  public async rotateSecret(
    ownerUserId: number,
    clientId: string
  ): Promise<OAuthClientSecretRotateResponse> {
    // Verify ownership first
    const existing = await this.clientsRepo.findByClientId(clientId);
    if (!existing) {
      throw new Error('Client not found');
    }
    if (existing.owner_user_id !== ownerUserId) {
      throw new Error('Access denied');
    }

    const result = await this.clientsRepo.rotateSecret(ownerUserId, clientId);

    return {
      client_id: clientId,
      client_secret: result.clientSecret
    };
  }

  /**
   * Delete an OAuth client
   */
  public async delete(ownerUserId: number, clientId: string): Promise<void> {
    // Verify ownership first
    const existing = await this.clientsRepo.findByClientId(clientId);
    if (!existing) {
      throw new Error('Client not found');
    }
    if (existing.owner_user_id !== ownerUserId) {
      throw new Error('Access denied');
    }

    await this.clientsRepo.delete(ownerUserId, clientId);
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
