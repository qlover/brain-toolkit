import {
  BrainUserGateway,
  createAdapter,
  defaultBrainUserOptions,
  GATEWAY_BRAIN_USERLY_ENDPOINTS
} from '@brain-toolkit/brain-user';
import { inject, injectable } from '@shared/container';
import { I } from '@config/ioc-identifiter';
import type { SeedServerConfigInterface } from '@interfaces/SeedConfigInterface';
import { ProxyFetchAdapter } from '@server/adapters/ProxyFetchAdapter';
import {
  extractBrainSessionToken,
  formatBrainLoginError
} from './brainLoginResponse';
import type {
  OAuthProviderAccessToken,
  OAuthUserAdapterInterface,
  OAuthUserCredentials,
  OAuthUserProfile
} from '../../oauth-wrapper/interfaces/OAuthUserAdapterInterface';

/**
 * Server-side Brain API adapter for OAuth token and userinfo flows.
 *
 * Significance: Centralizes Brain API calls for the OAuth middleware.
 * Core idea: Wrap `@brain-toolkit/brain-user` with project config.
 * Main function: login, exchange tokens, fetch user profile.
 * Main purpose: Bridge OAuth endpoints to Brain user system APIs.
 *
 * @example
 * const tokens = await adapter.exchangeAccessToken({ token: brainSessionToken });
 * const profile = await adapter.getUserInfo({ token: accessToken });
 */
@injectable()
export class BrainUserAdapter implements OAuthUserAdapterInterface {
  protected gateway: BrainUserGateway;

  constructor(@inject(I.AppConfig) config: SeedServerConfigInterface) {
    const { endpoints: _defaultEndpoints, ...brainFetchDefaults } =
      defaultBrainUserOptions;

    const adapter = createAdapter(
      new ProxyFetchAdapter({
        ...brainFetchDefaults,
        baseURL: config.brainApiBase,
        timeout: config.brainApiTimeout,
        // BRAIN_API_BASE already ends with .../method/api - use paths relative to that root.
        endpoints: {
          login: 'POST /auth/token.json',
          register: 'POST /users/signup.json',
          getUserInfo: 'GET /users/me.json',
          loginWithGoogle: 'POST /auth/google/imagica/token',
          logout: 'POST /users/signout',
          accessToken: GATEWAY_BRAIN_USERLY_ENDPOINTS.accessToken
        }
      })
    );
    this.gateway = new BrainUserGateway(adapter);
  }

  /**
   * @override
   */
  public async login(
    email: string,
    password: string
  ): Promise<OAuthUserCredentials> {
    const result = await this.gateway.login({ email, password });
    const token = extractBrainSessionToken(result);
    if (!token) {
      throw new Error(formatBrainLoginError(result));
    }
    return { ...result, token };
  }

  /**
   * @override
   */
  public async exchangeAccessToken(params: {
    token: string;
    lang?: string;
  }): Promise<OAuthProviderAccessToken> {
    const access = await this.gateway.getAccessToken({
      token: params.token,
      lang: params.lang ?? 'en'
    });
    return { ...access };
  }

  /**
   * @override
   */
  public async getUserInfo(token: string): Promise<OAuthUserProfile> {
    const profile = await this.gateway.getUserInfo({ token });
    return { ...profile };
  }

  /**
   * Fetches user profile using an OAuth access_token (userly JWT, Bearer scheme).
   *
   * @override
   */
  public async getUserInfoByAccessToken(
    accessToken: string
  ): Promise<OAuthUserProfile> {
    const profile = await this.gateway.getUserInfo(
      { token: accessToken },
      { tokenPrefix: 'Bearer' }
    );
    return { ...profile };
  }
}
