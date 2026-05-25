import { inject, injectable } from '@shared/container';
import type { OAuthTokenResponse } from '@schemas/oauth/OAuthClientSchema';
import { OAuthTokenService } from '../services/OAuthTokenService';

/**
 * HTTP entry for OAuth token exchange (`POST /oauth/token`).
 */
@injectable()
export class OAuthTokenController {
  constructor(
    @inject(OAuthTokenService) protected tokenService: OAuthTokenService
  ) {}

  public async exchangeToken(
    fields: Record<string, string>
  ): Promise<OAuthTokenResponse> {
    return await this.tokenService.exchangeToken(fields);
  }
}
