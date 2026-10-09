import { SupabaseRepo } from '@qlover/next-kit/server';
import { inject, injectable } from '@shared/container';
import {
  pamLinkedLoginProviderSchema,
  type PamLinkedLogin
} from '@schemas/PamUserSchema';
import { PamUserIdentitiesRepo } from '@server/repositorys/PamUserIdentitiesRepo';
import { BRAIN_IDENTITY_PROVIDER } from '@server/services/BrainIdentityLinkService';
import type { UserIdentity } from '@supabase/supabase-js';

function pickIdentityAccount(identity: UserIdentity): string | null {
  const data = identity.identity_data ?? {};
  for (const key of ['user_name', 'preferred_username', 'email', 'name']) {
    const value = data[key];
    if (typeof value === 'string' && value.trim()) {
      return value.trim();
    }
  }
  return null;
}

/**
 * Lists the third-party logins linked to a user: Brain links live in
 * `pam_user_identities`, GitHub / Google in Supabase Auth identities.
 */
@injectable()
export class PamLinkedLoginService {
  constructor(
    @inject(SupabaseRepo)
    protected readonly supabaseBridge: SupabaseRepo<unknown>,
    @inject(PamUserIdentitiesRepo)
    protected readonly identities: PamUserIdentitiesRepo
  ) {}

  public async listForUser(userId: string): Promise<PamLinkedLogin[]> {
    const [pamIdentities, authIdentities] = await Promise.all([
      this.identities.listByUserId(userId),
      this.listAuthIdentities(userId)
    ]);

    const brain: PamLinkedLogin[] = pamIdentities
      .filter((row) => row.provider === BRAIN_IDENTITY_PROVIDER)
      .map((row) => ({
        provider: 'brain',
        account: null,
        linked_at: row.created_at,
        last_login_at: row.last_login_at
      }));

    const social = authIdentities.flatMap<PamLinkedLogin>((identity) => {
      const provider = pamLinkedLoginProviderSchema.safeParse(
        identity.provider
      );
      if (!provider.success || provider.data === 'brain') {
        return [];
      }
      return [
        {
          provider: provider.data,
          account: pickIdentityAccount(identity),
          linked_at: identity.created_at ?? null,
          last_login_at: identity.last_sign_in_at ?? null
        }
      ];
    });

    return [...brain, ...social];
  }

  protected async listAuthIdentities(userId: string): Promise<UserIdentity[]> {
    const admin = await this.supabaseBridge.getAdminSupabase();
    const result = await admin.auth.admin.getUserById(userId);
    if (result.error || !result.data.user) {
      return [];
    }
    return result.data.user.identities ?? [];
  }
}
