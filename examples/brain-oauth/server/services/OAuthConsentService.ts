import { randomBytes } from 'crypto';
import { ExecutorError } from '@qlover/fe-corekit';
import { inject, injectable } from '@shared/container';
import { OAuthConsentBodyValidator } from '@shared/validators/OAuthAuthorizeValidator';
import type { OAuthConsentBody } from '@schemas/oauth/OAuthAuthorizeSchema';
import { BrainSessionService } from './BrainSessionService';
import { OAuthAuthorizeService } from './OAuthAuthorizeService';
import { OAuthAuthorizationCodesRepository } from '../repositorys/OAuthAuthorizationCodesRepository';
import { buildOAuthRedirectUrl } from '../utils/oauthRedirectUtils';

export type OAuthConsentResult = {
  redirectUrl: string;
};

/**
 * Handles user consent (allow/deny) on the OAuth authorize page.
 *
 * Significance: Bridges the consent UI to authorization code issuance.
 * Main purpose: Issue one-time codes or redirect with OAuth error parameters.
 *
 * @example
 * const result = await service.processConsent(body);
 * // redirect browser to result.redirectUrl
 */
@injectable()
export class OAuthConsentService {
  protected static AUTH_CODE_TTL_MS = 5 * 60 * 1000;

  constructor(
    @inject(OAuthAuthorizeService)
    protected authorizeService: OAuthAuthorizeService,
    @inject(OAuthAuthorizationCodesRepository)
    protected authCodesRepo: OAuthAuthorizationCodesRepository,
    @inject(BrainSessionService)
    protected brainSession: BrainSessionService,
    @inject(OAuthConsentBodyValidator)
    protected consentValidator: OAuthConsentBodyValidator
  ) {}

  public async processConsent(
    requestBody: unknown
  ): Promise<OAuthConsentResult> {
    let body: OAuthConsentBody;
    try {
      body = await this.consentValidator.getThrow(requestBody);
    } catch {
      throw new ExecutorError(
        'invalid_request',
        'Invalid consent request body'
      );
    }

    const session = await this.brainSession.getSession();
    if (!session) {
      throw new ExecutorError(
        'access_denied',
        'User session expired. Please sign in again.'
      );
    }

    const pageResult = await this.authorizeService.resolveAuthorizePage({
      response_type: 'code',
      client_id: body.client_id,
      redirect_uri: body.redirect_uri,
      scope: body.scope,
      state: body.state
    });

    if (!pageResult.ok) {
      throw new ExecutorError(
        pageResult.error.errorKey,
        pageResult.error.message
      );
    }

    const { data } = pageResult;

    if (body.action === 'deny') {
      return {
        redirectUrl: buildOAuthRedirectUrl(data.redirectUri, {
          error: 'access_denied',
          error_description: 'The resource owner denied the request',
          state: data.state
        })
      };
    }

    const code = randomBytes(32).toString('base64url');
    const expiresAt = new Date(
      Date.now() + OAuthConsentService.AUTH_CODE_TTL_MS
    ).toISOString();

    await this.authCodesRepo.create({
      code,
      client_id: data.clientId,
      user_id: session.userId,
      redirect_uri: data.redirectUri,
      scope: data.scopes.join(' ') || null,
      expires_at: expiresAt
    });

    // trust flag reserved for future auto-consent storage
    void body.trust;

    return {
      redirectUrl: buildOAuthRedirectUrl(data.redirectUri, {
        code,
        state: data.state
      })
    };
  }
}
