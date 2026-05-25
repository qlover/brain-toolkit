import { injectable } from '@shared/container';
import { createAdminClient } from '@shared/supabase/admin';
import { verifyClientSecret } from '@server/utils/clientSecretHash';
import type { OAuthClientRow } from '@schemas/oauth/OAuthAuthorizeSchema';

/**
 * Reads registered OAuth clients from Supabase (service role).
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
}
