import { ExecutorError } from '@qlover/fe-corekit/executor';
import { inject, injectable } from '@shared/container';
import { API_OTP_SEND_RATE_LIMITED } from '@config/i18n-identifier/api';
import { MemoryKvCacheService } from './MemoryKvCacheService';

/** Must match frontend resend cooldown. */
export const OTP_SEND_COOLDOWN_MS = 60_000;

type OtpSendRateLimitEntry = {
  readonly blockedUntilMs: number;
};

@injectable()
export class OtpSendRateLimitService {
  constructor(
    @inject(MemoryKvCacheService)
    protected readonly kv: MemoryKvCacheService
  ) {}

  /**
   * Throws when this IP sent OTP within the cooldown window.
   * Reserves the slot before calling Supabase to avoid concurrent bursts.
   */
  public async assertCanSend(clientIp: string): Promise<void> {
    const ip = clientIp.trim() || 'unknown';
    const key = this.buildKey(ip);
    const entry = await this.kv.getItem<OtpSendRateLimitEntry>(key);
    const now = Date.now();

    if (entry && now < entry.blockedUntilMs) {
      const retryAfterSec = Math.max(
        1,
        Math.ceil((entry.blockedUntilMs - now) / 1000)
      );
      throw new ExecutorError(API_OTP_SEND_RATE_LIMITED, { retryAfterSec });
    }

    await this.kv.setItem<OtpSendRateLimitEntry>(
      key,
      { blockedUntilMs: now + OTP_SEND_COOLDOWN_MS },
      { ttlMs: OTP_SEND_COOLDOWN_MS }
    );
  }

  protected buildKey(clientIp: string): string {
    return `pam:otp:send:ip:${clientIp}`;
  }
}
