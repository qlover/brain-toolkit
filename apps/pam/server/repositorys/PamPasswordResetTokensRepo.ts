import { createHash, randomBytes } from 'node:crypto';
import { SupabaseRepo } from '@qlover/next-kit/server';
import { inject, injectable } from '@shared/container';

const TABLE = 'pam_password_reset_tokens';

export type PamPasswordResetTokenRow = {
  id: string;
  user_id: string;
  email: string;
  token_hash: string;
  expires_at: string;
  used_at: string | null;
  created_ip: string | null;
  created_at: string;
};

export function generatePasswordResetToken(): string {
  return randomBytes(32).toString('base64url');
}

export function hashPasswordResetToken(token: string): string {
  return createHash('sha256').update(token.trim()).digest('hex');
}

@injectable()
export class PamPasswordResetTokensRepo {
  constructor(
    @inject(SupabaseRepo)
    protected readonly supabaseBridge: SupabaseRepo<unknown>
  ) {}

  public async insert(input: {
    userId: string;
    email: string;
    tokenHash: string;
    expiresAt: string;
    createdIp?: string | null;
  }): Promise<void> {
    const supabase = await this.supabaseBridge.getAdminSupabase();
    const result = await supabase.from(TABLE).insert({
      user_id: input.userId,
      email: input.email,
      token_hash: input.tokenHash,
      expires_at: input.expiresAt,
      created_ip: input.createdIp ?? null
    });
    this.supabaseBridge.throwIfError(result);
  }

  public async findByHash(
    tokenHash: string
  ): Promise<PamPasswordResetTokenRow | null> {
    const supabase = await this.supabaseBridge.getAdminSupabase();
    const result = await supabase
      .from(TABLE)
      .select('*')
      .eq('token_hash', tokenHash)
      .maybeSingle();
    this.supabaseBridge.throwIfError(result);
    return (result.data as PamPasswordResetTokenRow | null) ?? null;
  }

  /** Atomically consumes an unused token; false when already used. */
  public async markUsed(id: string): Promise<boolean> {
    const supabase = await this.supabaseBridge.getAdminSupabase();
    const result = await supabase
      .from(TABLE)
      .update({ used_at: new Date().toISOString() })
      .eq('id', id)
      .is('used_at', null)
      .select('id');
    this.supabaseBridge.throwIfError(result);
    return ((result.data as unknown[] | null) ?? []).length > 0;
  }

  public async invalidateUnusedForUser(userId: string): Promise<void> {
    const supabase = await this.supabaseBridge.getAdminSupabase();
    const result = await supabase
      .from(TABLE)
      .update({ used_at: new Date().toISOString() })
      .eq('user_id', userId)
      .is('used_at', null);
    this.supabaseBridge.throwIfError(result);
  }
}
