import { ExecutorError } from '@qlover/fe-corekit/executor';
import { createRemoteJWKSet, decodeJwt, jwtVerify } from 'jose';
import { injectable } from '@shared/container';
import { API_NOT_AUTHORIZED } from '@config/i18n-identifier/api';
import type {
  PamCiOidcClaimsType,
  PamCiOidcVerifierInterface
} from '@server/interfaces/PamCiOidcVerifierInterface';

/** GitHub Actions OIDC issuer。 */
export const PAM_GITHUB_OIDC_ISSUER =
  'https://token.actions.githubusercontent.com' as const;

const JWKS = createRemoteJWKSet(
  new URL(`${PAM_GITHUB_OIDC_ISSUER}/.well-known/jwks`)
);

/**
 * 基于 jose 远程 JWKS 的 GitHub Actions OIDC 校验。
 *
 * `repository` claim → `resourceKey`。
 */
@injectable()
export class PamGithubOidcVerifier implements PamCiOidcVerifierInterface {
  /**
   * @override
   */
  public peekResourceKey(idToken: string): string | null {
    try {
      return this.resourceKeyFromPayload(decodeJwt(idToken));
    } catch {
      return null;
    }
  }

  /**
   * @override
   */
  public async verify(
    idToken: string,
    audience: string
  ): Promise<PamCiOidcClaimsType> {
    let payload: Record<string, unknown>;
    try {
      const verified = await jwtVerify(idToken, JWKS, {
        issuer: PAM_GITHUB_OIDC_ISSUER,
        audience
      });
      payload = verified.payload as Record<string, unknown>;
    } catch {
      throw new ExecutorError(API_NOT_AUTHORIZED);
    }

    const resourceKey = this.resourceKeyFromPayload(payload);
    if (!resourceKey) {
      throw new ExecutorError(API_NOT_AUTHORIZED);
    }

    const aud = payload.aud;
    const audValue =
      typeof aud === 'string'
        ? aud
        : Array.isArray(aud)
          ? aud.map(String)
          : audience;

    return {
      iss: String(payload.iss ?? PAM_GITHUB_OIDC_ISSUER),
      aud: audValue,
      sub: String(payload.sub ?? ''),
      resourceKey,
      exp: typeof payload.exp === 'number' ? payload.exp : 0
    };
  }

  protected resourceKeyFromPayload(
    payload: Record<string, unknown>
  ): string | null {
    const repository =
      typeof payload.repository === 'string' ? payload.repository.trim() : '';
    if (!repository || !repository.includes('/')) {
      return null;
    }
    return repository;
  }
}
