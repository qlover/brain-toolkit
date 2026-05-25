import { inject, injectable } from '@shared/container';
import { OAuthConsentService } from '../services/OAuthConsentService';
import type { OAuthConsentResult } from '../services/OAuthConsentService';

/**
 * HTTP entry for OAuth user consent (`POST /api/oauth/consent`).
 */
@injectable()
export class OAuthConsentController {
  constructor(
    @inject(OAuthConsentService)
    protected consentService: OAuthConsentService
  ) {}

  public async submitConsent(
    requestBody: unknown
  ): Promise<OAuthConsentResult> {
    return await this.consentService.processConsent(requestBody);
  }
}
