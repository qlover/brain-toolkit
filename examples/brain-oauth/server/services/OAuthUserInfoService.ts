import { inject, injectable } from '@shared/container';
import type { OAuthUserInfoResponse } from '@schemas/oauth/OAuthUserInfoSchema';
import { BrainUserAdapter } from '../adapters/BrainUserAdapter';
import { OAuthUserInfoError } from '../utils/oauthUserInfoError';
import type { BrainUser } from '@brain-toolkit/brain-user';

/**
 * OAuth 2.0 / OIDC userinfo endpoint (`GET /userinfo`).
 *
 * Significance: Exposes authenticated user profile to OAuth clients.
 * Core idea: Validate Bearer access_token and proxy Brain `/users/me.json`.
 * Main function: Map Brain user profile to standard userinfo claims.
 * Main purpose: Complete authorization-code flow for third-party apps.
 *
 * @example
 * const profile = await service.getUserInfo('eyJ...');
 */
@injectable()
export class OAuthUserInfoService {
  constructor(
    @inject(BrainUserAdapter) protected brainAdapter: BrainUserAdapter
  ) {}

  public async getUserInfo(
    accessToken: string
  ): Promise<OAuthUserInfoResponse> {
    try {
      const profile =
        await this.brainAdapter.getUserInfoByAccessToken(accessToken);
      return this.toUserInfoResponse(profile);
    } catch {
      throw new OAuthUserInfoError();
    }
  }

  protected toUserInfoResponse(profile: BrainUser): OAuthUserInfoResponse {
    const sub = String(profile.id);
    if (!sub || sub === 'NaN') {
      throw new OAuthUserInfoError();
    }

    const email = profile.email?.trim();
    if (!email) {
      throw new OAuthUserInfoError();
    }

    const nameFromParts = [profile.first_name, profile.last_name]
      .filter(Boolean)
      .join(' ');
    const name = profile.name?.trim() || nameFromParts || email;

    return {
      sub,
      email,
      name,
      ...(profile.roles?.length ? { roles: profile.roles } : {})
    };
  }
}
