import { SupabaseRepo } from '@qlover/next-kit/server';
import { inject, injectable } from '@shared/container';
import { PamTables } from '@config/pamTables';

const UNIQUE_VIOLATION = '23505';

/**
 * Provider-specific snapshot from the latest login (e.g. Brain: `env`,
 * `account`); replaced as a whole on every login.
 */
export type PamIdentityData = Record<string, string>;

export type PamUserIdentityRow = {
  provider: string;
  external_user_id: string;
  identity_data: PamIdentityData | null;
  created_at: string;
  last_login_at: string | null;
};

function toIdentityDataColumn(identityData?: PamIdentityData): {
  identity_data?: PamIdentityData;
} {
  return identityData ? { identity_data: identityData } : {};
}

@injectable()
export class PamUserIdentitiesRepo {
  constructor(
    @inject(SupabaseRepo)
    protected readonly supabaseBridge: SupabaseRepo<unknown>
  ) {}

  public async findUserId(
    provider: string,
    externalUserId: string
  ): Promise<string | null> {
    const supabase = await this.supabaseBridge.getAdminSupabase();
    const result = await supabase
      .from(PamTables.userIdentities)
      .select('user_id')
      .eq('provider', provider)
      .eq('external_user_id', externalUserId)
      .maybeSingle();
    this.supabaseBridge.throwIfError(result);

    return (result.data as { user_id: string } | null)?.user_id ?? null;
  }

  public async listByUserId(userId: string): Promise<PamUserIdentityRow[]> {
    const supabase = await this.supabaseBridge.getAdminSupabase();
    const result = await supabase
      .from(PamTables.userIdentities)
      .select(
        'provider, external_user_id, identity_data, created_at, last_login_at'
      )
      .eq('user_id', userId)
      .order('created_at', { ascending: true });
    this.supabaseBridge.throwIfError(result);

    return result.data ?? [];
  }

  /**
   * Link an external identity to a PAM user. When a concurrent login already
   * linked it, returns the existing user id instead.
   */
  public async link(params: {
    provider: string;
    externalUserId: string;
    userId: string;
    identityData?: PamIdentityData;
  }): Promise<string> {
    const supabase = await this.supabaseBridge.getAdminSupabase();
    const result = await supabase.from(PamTables.userIdentities).insert({
      provider: params.provider,
      external_user_id: params.externalUserId,
      user_id: params.userId,
      last_login_at: new Date().toISOString(),
      ...toIdentityDataColumn(params.identityData)
    });

    if (result.error?.code === UNIQUE_VIOLATION) {
      const existing = await this.findUserId(
        params.provider,
        params.externalUserId
      );
      if (existing) {
        return existing;
      }
    }
    this.supabaseBridge.throwIfError(result);

    return params.userId;
  }

  public async touchLastLogin(
    provider: string,
    externalUserId: string,
    identityData?: PamIdentityData
  ): Promise<void> {
    const supabase = await this.supabaseBridge.getAdminSupabase();
    const result = await supabase
      .from(PamTables.userIdentities)
      .update({
        last_login_at: new Date().toISOString(),
        ...toIdentityDataColumn(identityData)
      })
      .eq('provider', provider)
      .eq('external_user_id', externalUserId);
    this.supabaseBridge.throwIfError(result);
  }

  public async reassignUserId(
    fromUserId: string,
    toUserId: string
  ): Promise<void> {
    if (fromUserId === toUserId) {
      return;
    }
    const supabase = await this.supabaseBridge.getAdminSupabase();
    const result = await supabase
      .from(PamTables.userIdentities)
      .update({ user_id: toUserId })
      .eq('user_id', fromUserId);
    this.supabaseBridge.throwIfError(result);
  }
}
