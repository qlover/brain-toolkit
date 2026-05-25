import { injectable } from '@shared/container';
import { createAdminClient } from '@shared/supabase/admin';

export type CreateAuthorizationCodeInput = {
  code: string;
  client_id: string;
  user_id: number;
  redirect_uri: string;
  scope: string | null;
  expires_at: string;
};

/**
 * Persists one-time OAuth authorization codes.
 */
@injectable()
export class OAuthAuthorizationCodesRepository {
  public async create(input: CreateAuthorizationCodeInput): Promise<void> {
    const supabase = createAdminClient();
    const { error } = await supabase.from('brain_oauth_authorization_codes').insert({
      code: input.code,
      client_id: input.client_id,
      user_id: input.user_id,
      redirect_uri: input.redirect_uri,
      scope: input.scope,
      expires_at: input.expires_at,
      used: false
    });

    if (error) {
      throw new Error(error.message);
    }
  }
}
