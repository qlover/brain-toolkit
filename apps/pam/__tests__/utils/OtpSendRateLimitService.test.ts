import { ExecutorError } from '@qlover/fe-corekit/executor';
import { describe, expect, it } from 'vitest';
import { API_OTP_SEND_RATE_LIMITED } from '@config/i18n-identifier/api';
import { MemoryKvCacheService } from '@server/services/MemoryKvCacheService';
import {
  OTP_SEND_COOLDOWN_MS,
  OtpSendRateLimitService
} from '@server/services/OtpSendRateLimitService';

describe('OtpSendRateLimitService', () => {
  it('allows first send then blocks within cooldown', async () => {
    const kv = new MemoryKvCacheService();
    const limiter = new OtpSendRateLimitService(kv);
    const ip = `test-ip-${Date.now()}-a`;

    await expect(limiter.assertCanSend(ip)).resolves.toBeUndefined();

    await expect(limiter.assertCanSend(ip)).rejects.toMatchObject({
      id: API_OTP_SEND_RATE_LIMITED
    });
  });

  it('includes retryAfterSec on rate limit error', async () => {
    const kv = new MemoryKvCacheService();
    const limiter = new OtpSendRateLimitService(kv);
    const ip = `test-ip-${Date.now()}-b`;

    await limiter.assertCanSend(ip);

    try {
      await limiter.assertCanSend(ip);
      expect.fail('expected rate limit');
    } catch (error) {
      expect(error).toBeInstanceOf(ExecutorError);
      const exec = error as ExecutorError;
      expect(exec.id).toBe(API_OTP_SEND_RATE_LIMITED);
      expect(exec.cause).toMatchObject({
        retryAfterSec: expect.any(Number)
      });
      expect(
        (exec.cause as { retryAfterSec: number }).retryAfterSec
      ).toBeGreaterThan(0);
      expect(
        (exec.cause as { retryAfterSec: number }).retryAfterSec
      ).toBeLessThanOrEqual(Math.ceil(OTP_SEND_COOLDOWN_MS / 1000));
    }
  });

  it('does not block different IPs', async () => {
    const kv = new MemoryKvCacheService();
    const limiter = new OtpSendRateLimitService(kv);
    const suffix = Date.now();

    await limiter.assertCanSend(`test-ip-${suffix}-1`);
    await expect(
      limiter.assertCanSend(`test-ip-${suffix}-2`)
    ).resolves.toBeUndefined();
  });
});
