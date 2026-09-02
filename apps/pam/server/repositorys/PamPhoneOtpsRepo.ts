import { createHash, randomInt, timingSafeEqual } from 'node:crypto';
import { SupabaseRepo } from '@qlover/next-kit/server';
import { inject, injectable } from '@shared/container';
import { I } from '@config/ioc-identifiter';
import type {
  PamPhoneOtpAdminItem,
  PamPhoneOtpProvider,
  PamPhoneOtpRow,
  PamPhoneOtpStatus
} from '@schemas/PamPhoneOtpSchema';
import type { LoggerInterface } from '@qlover/logger';

const TABLE = 'pam_phone_otps';

export function hashPhoneOtpCode(code: string): string {
  return createHash('sha256').update(code.trim()).digest('hex');
}

export function generatePhoneOtpCode(length = 6): string {
  const max = 10 ** length;
  return String(randomInt(0, max)).padStart(length, '0');
}

export function safeEqualOtp(a: string, b: string): boolean {
  const left = Buffer.from(a.trim());
  const right = Buffer.from(b.trim());
  if (left.length !== right.length) {
    return false;
  }
  return timingSafeEqual(left, right);
}

function mapAdminItem(row: PamPhoneOtpRow): PamPhoneOtpAdminItem {
  return {
    id: row.id,
    phone: row.phone,
    code: row.code_plain,
    provider: row.provider,
    status: row.status,
    attempts: row.attempts,
    maxAttempts: row.max_attempts,
    expiresAt: row.expires_at,
    verifiedAt: row.verified_at ?? null,
    createdIp: row.created_ip ?? null,
    createdAt: row.created_at
  };
}

@injectable()
export class PamPhoneOtpsRepo {
  constructor(
    @inject(SupabaseRepo)
    protected readonly supabaseBridge: SupabaseRepo<unknown>,
    @inject(I.Logger)
    protected readonly logger: LoggerInterface
  ) {}

  public async insert(input: {
    phone: string;
    codeHash: string;
    codePlain: string | null;
    provider: PamPhoneOtpProvider;
    expiresAt: string;
    createdIp?: string | null;
    maxAttempts?: number;
  }): Promise<PamPhoneOtpRow> {
    const supabase = await this.supabaseBridge.getAdminSupabase();
    const { data, error } = await supabase
      .from(TABLE)
      .insert({
        phone: input.phone,
        code_hash: input.codeHash,
        code_plain: input.codePlain,
        provider: input.provider,
        status: 'pending',
        expires_at: input.expiresAt,
        created_ip: input.createdIp ?? null,
        max_attempts: input.maxAttempts ?? 5
      })
      .select('*')
      .single();

    if (error) {
      this.logger.error('PamPhoneOtpsRepo.insert failed', { error });
      throw new Error(error.message);
    }

    return data as PamPhoneOtpRow;
  }

  public async revokePendingByPhone(phone: string): Promise<void> {
    const supabase = await this.supabaseBridge.getAdminSupabase();
    const { error } = await supabase
      .from(TABLE)
      .update({ status: 'revoked' satisfies PamPhoneOtpStatus })
      .eq('phone', phone)
      .eq('status', 'pending');

    if (error) {
      this.logger.error('PamPhoneOtpsRepo.revokePendingByPhone failed', {
        error,
        phone
      });
      throw new Error(error.message);
    }
  }

  public async findLatestPending(
    phone: string
  ): Promise<PamPhoneOtpRow | null> {
    const supabase = await this.supabaseBridge.getAdminSupabase();
    const { data, error } = await supabase
      .from(TABLE)
      .select('*')
      .eq('phone', phone)
      .eq('status', 'pending')
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error) {
      this.logger.error('PamPhoneOtpsRepo.findLatestPending failed', {
        error,
        phone
      });
      throw new Error(error.message);
    }

    return (data as PamPhoneOtpRow | null) ?? null;
  }

  public async markVerified(id: string): Promise<void> {
    const supabase = await this.supabaseBridge.getAdminSupabase();
    const { error } = await supabase
      .from(TABLE)
      .update({
        status: 'verified' satisfies PamPhoneOtpStatus,
        verified_at: new Date().toISOString()
      })
      .eq('id', id);

    if (error) {
      this.logger.error('PamPhoneOtpsRepo.markVerified failed', { error, id });
      throw new Error(error.message);
    }
  }

  public async markExpired(id: string): Promise<void> {
    const supabase = await this.supabaseBridge.getAdminSupabase();
    const { error } = await supabase
      .from(TABLE)
      .update({ status: 'expired' satisfies PamPhoneOtpStatus })
      .eq('id', id);

    if (error) {
      this.logger.error('PamPhoneOtpsRepo.markExpired failed', { error, id });
      throw new Error(error.message);
    }
  }

  public async incrementAttempts(
    id: string,
    attempts: number,
    maxAttempts = 5
  ): Promise<void> {
    const supabase = await this.supabaseBridge.getAdminSupabase();
    const nextStatus: PamPhoneOtpStatus | undefined =
      attempts >= maxAttempts ? 'revoked' : undefined;
    const { error } = await supabase
      .from(TABLE)
      .update({
        attempts,
        ...(nextStatus ? { status: nextStatus } : {})
      })
      .eq('id', id);

    if (error) {
      this.logger.error('PamPhoneOtpsRepo.incrementAttempts failed', {
        error,
        id
      });
      throw new Error(error.message);
    }
  }

  public async listRecent(params: {
    limit?: number;
    phone?: string;
  }): Promise<PamPhoneOtpAdminItem[]> {
    const limit = Math.min(Math.max(params.limit ?? 50, 1), 200);
    const supabase = await this.supabaseBridge.getAdminSupabase();
    let query = supabase
      .from(TABLE)
      .select('*')
      .order('created_at', { ascending: false })
      .limit(limit);

    const phone = params.phone?.trim();
    if (phone) {
      query = query.ilike('phone', `%${phone}%`);
    }

    const { data, error } = await query;
    if (error) {
      this.logger.error('PamPhoneOtpsRepo.listRecent failed', { error });
      throw new Error(error.message);
    }

    return ((data as PamPhoneOtpRow[]) ?? []).map(mapAdminItem);
  }

  public async findLatestSendAt(phone: string): Promise<string | null> {
    const supabase = await this.supabaseBridge.getAdminSupabase();
    const { data, error } = await supabase
      .from(TABLE)
      .select('created_at')
      .eq('phone', phone)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error) {
      this.logger.error('PamPhoneOtpsRepo.findLatestSendAt failed', {
        error,
        phone
      });
      throw new Error(error.message);
    }

    return (data as { created_at?: string } | null)?.created_at ?? null;
  }
}
