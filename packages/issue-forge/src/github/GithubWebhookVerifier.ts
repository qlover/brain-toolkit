import { createHmac, timingSafeEqual } from 'crypto';
import type { IssueWebhookVerifierInterface } from '../interfaces/IssueWebhookVerifierInterface';
import type { IssueWebhookVerifyResultType } from '../types/IssueForgeTypes';

const SIGNATURE_PREFIX = 'sha256=';

/**
 * GitHub Webhook HMAC-SHA256 验签（形态 B：构造时绑定 secret）。
 */
export class GithubWebhookVerifier implements IssueWebhookVerifierInterface {
  constructor(protected readonly secret: string) {}

  /**
   * @override
   */
  public async verify(
    rawBody: string,
    signatureHeader: string | null
  ): Promise<IssueWebhookVerifyResultType> {
    if (signatureHeader == null || signatureHeader.trim() === '') {
      return { ok: false, reason: 'signature_header_missing' };
    }
    if (!signatureHeader.startsWith(SIGNATURE_PREFIX)) {
      return { ok: false, reason: 'signature_header_invalid' };
    }
    const secret = this.secret.trim();
    if (!secret) {
      return { ok: false, reason: 'secret_not_configured' };
    }

    const expected = Buffer.from(
      SIGNATURE_PREFIX +
        createHmac('sha256', secret).update(rawBody, 'utf8').digest('hex'),
      'utf8'
    );
    const received = Buffer.from(signatureHeader, 'utf8');
    if (
      expected.length !== received.length ||
      !timingSafeEqual(expected, received)
    ) {
      return { ok: false, reason: 'digest_mismatch' };
    }
    return { ok: true };
  }
}
