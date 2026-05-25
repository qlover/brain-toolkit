import { injectable } from '@shared/container';
import { createAdminClient } from '@shared/supabase/admin';
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
}
