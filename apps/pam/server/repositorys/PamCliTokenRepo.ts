import { SupabaseRepo } from '@qlover/next-kit/server';
import { inject, injectable } from '@shared/container';

export const PamCliTokenTableName = 'n_pam_cli_tokens' as const;

export type PamCliTokenInsertType = {
  readonly jti: string;
  readonly userId: string;
  readonly expiresAt: string;
  readonly loginMethod?: string | null;
  readonly userAgent?: string | null;
  readonly ipAddress?: string | null;
};

/**
 * Persistence for PAM CLI JWT `jti` rows (issue / active check / revoke).
 *
 * Significance: Makes CLI bearer tokens revocable server-side.
 * Core idea: Allowlist by jti until expiry or revoked flag.
 * Main function: Insert and query `n_pam_cli_tokens` via service role.
 * Main purpose: Support short-lived CLI tokens with logout revoke.
 */
@injectable()
export class PamCliTokenRepo {
  constructor(
    @inject(SupabaseRepo)
    protected readonly supabaseBridge: SupabaseRepo<unknown>
  ) {}

  /**
   * Records a newly issued CLI token.
   *
   * @param input - jti + user + expiry metadata
   */
  public async insert(input: PamCliTokenInsertType): Promise<void> {
    const supabase = await this.supabaseBridge.getAdminSupabase();
    const { error } = await supabase.from(PamCliTokenTableName).insert({
      jti: input.jti,
      user_id: input.userId,
      expires_at: input.expiresAt,
      login_method: input.loginMethod ?? null,
      user_agent: input.userAgent ?? null,
      ip_address: input.ipAddress ?? null,
      revoked: false
    });

    if (error) {
      throw new Error(error.message);
    }
  }

  /**
   * @param jti - JWT id claim
   * @returns True when row exists, not revoked, and not expired
   */
  public async isActive(jti: string): Promise<boolean> {
    const supabase = await this.supabaseBridge.getAdminSupabase();
    const { data, error } = await supabase
      .from(PamCliTokenTableName)
      .select('jti')
      .eq('jti', jti)
      .eq('revoked', false)
      .gt('expires_at', new Date().toISOString())
      .maybeSingle();

    if (error) {
      throw new Error(error.message);
    }

    return data != null;
  }

  /**
   * Marks one token revoked by jti.
   *
   * @param jti - JWT id claim
   * @returns True when a row was updated
   */
  public async revoke(jti: string): Promise<boolean> {
    const supabase = await this.supabaseBridge.getAdminSupabase();
    const { data, error } = await supabase
      .from(PamCliTokenTableName)
      .update({
        revoked: true,
        revoked_at: new Date().toISOString()
      })
      .eq('jti', jti)
      .eq('revoked', false)
      .select('jti');

    if (error) {
      throw new Error(error.message);
    }

    return Array.isArray(data) && data.length > 0;
  }

  /**
   * Revokes all active tokens for a user.
   *
   * @param userId - Auth user id
   * @returns Number of rows updated
   */
  public async revokeAllForUser(userId: string): Promise<number> {
    const supabase = await this.supabaseBridge.getAdminSupabase();
    const { data, error } = await supabase
      .from(PamCliTokenTableName)
      .update({
        revoked: true,
        revoked_at: new Date().toISOString()
      })
      .eq('user_id', userId)
      .eq('revoked', false)
      .select('jti');

    if (error) {
      throw new Error(error.message);
    }

    return Array.isArray(data) ? data.length : 0;
  }
}
