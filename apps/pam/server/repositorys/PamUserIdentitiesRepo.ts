import { SupabaseRepo } from '@qlover/next-kit/server';
import { inject, injectable } from '@shared/container';
import { PamTables } from '@config/pamTables';

const UNIQUE_VIOLATION = '23505';

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

  /**
   * Link an external identity to a PAM user. When a concurrent login already
   * linked it, returns the existing user id instead.
   */
  public async link(params: {
    provider: string;
    externalUserId: string;
    userId: string;
  }): Promise<string> {
    const supabase = await this.supabaseBridge.getAdminSupabase();
    const result = await supabase.from(PamTables.userIdentities).insert({
      provider: params.provider,
      external_user_id: params.externalUserId,
      user_id: params.userId,
      last_login_at: new Date().toISOString()
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
    externalUserId: string
  ): Promise<void> {
    const supabase = await this.supabaseBridge.getAdminSupabase();
    const result = await supabase
      .from(PamTables.userIdentities)
      .update({ last_login_at: new Date().toISOString() })
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
