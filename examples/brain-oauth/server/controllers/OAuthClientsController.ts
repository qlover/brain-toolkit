import { inject, injectable } from '@shared/container';
import type {
  OAuthClientCreateResponseSchema,
  OAuthClientCreateSchema,
  OAuthClientDetailSchema,
  OAuthClientListItemSchema,
  OAuthClientSecretRotateResponseSchema,
  OAuthClientUpdateSchema
} from '@schemas/oauth/OAuthAuthorizeSchema';
import { ServerAuth } from '../services/ServerAuth';
import { OAuthClientsService } from '../services/OAuthClientsService';
import type { ServerAuthInterface } from '../interfaces/ServerAuthInterface';

/**
 * Developer console OAuth clients API controller.
 * 
 * Manages OAuth client applications for developers.
 */
@injectable()
export class OAuthClientsController {
  constructor(
    @inject(ServerAuth) protected serverAuth: ServerAuthInterface,
    @inject(OAuthClientsService) protected clientsService: OAuthClientsService
  ) {}

  /**
   * List all OAuth clients owned by the current user
   */
  public async list(): Promise<OAuthClientListItemSchema[]> {
    const ownerId = await this.requireOwnerUserId();
    return this.clientsService.listForOwner(ownerId);
  }

  /**
   * Create a new OAuth client
   */
  public async create(
    body: OAuthClientCreateSchema
  ): Promise<OAuthClientCreateResponseSchema> {
    const ownerId = await this.requireOwnerUserId();
    return this.clientsService.create(ownerId, body);
  }

  /**
   * Get detailed information about a specific OAuth client
   */
  public async get(clientId: string): Promise<OAuthClientDetailSchema> {
    const ownerId = await this.requireOwnerUserId();
    return this.clientsService.getByClientId(ownerId, clientId);
  }

  /**
   * Update an existing OAuth client
   */
  public async update(
    clientId: string,
    body: OAuthClientUpdateSchema
  ): Promise<OAuthClientDetailSchema> {
    const ownerId = await this.requireOwnerUserId();
    return this.clientsService.update(ownerId, clientId, body);
  }

  /**
   * Rotate the client secret
   */
  public async rotateSecret(
    clientId: string
  ): Promise<OAuthClientSecretRotateResponseSchema> {
    const ownerId = await this.requireOwnerUserId();
    return this.clientsService.rotateSecret(ownerId, clientId);
  }

  /**
   * Delete an OAuth client
   */
  public async remove(clientId: string): Promise<void> {
    const ownerId = await this.requireOwnerUserId();
    return this.clientsService.delete(ownerId, clientId);
  }

  /**
   * Resolves Brain owner id from session
   */
  protected async requireOwnerUserId(): Promise<number> {
    await this.serverAuth.throwIfNotAuth();
    const session = await this.serverAuth.getSession();
    
    if (!session?.userId) {
      throw new Error('User not authenticated');
    }

    return session.userId;
  }
}
