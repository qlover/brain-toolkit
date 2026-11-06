import { ExecutorError } from '@qlover/fe-corekit/executor';
import { createRemoteJWKSet, jwtVerify } from 'jose';
import { injectable } from '@shared/container';
import { API_NOT_AUTHORIZED } from '@config/i18n-identifier/api';
import type {
  PamCiOidcClaimsType,
  PamCiOidcVerifierInterface
} from '@server/interfaces/PamCiOidcVerifierInterface';

/** Vercel OIDC issuer 根（Team 模式为 `…/{teamSlug}`）。 */
export const PAM_VERCEL_OIDC_ISSUER_ROOT = 'https://oidc.vercel.com' as const;

const JWKS = createRemoteJWKSet(
  new URL(`${PAM_VERCEL_OIDC_ISSUER_ROOT}/.well-known/jwks`)
);

function isVercelIssuer(iss: string): boolean {
  if (iss === PAM_VERCEL_OIDC_ISSUER_ROOT) {
    return true;
  }
  return iss.startsWith(`${PAM_VERCEL_OIDC_ISSUER_ROOT}/`);
}

/**
 * 基于 jose 远程 JWKS 的 Vercel OIDC 校验。
 *
 * claim `owner` + `project` → `resourceKey`。
 */
@injectable()
export class PamVercelOidcVerifier implements PamCiOidcVerifierInterface {
  /**
   * @override
   */
  public async verify(
    idToken: string,
    audience: string
  ): Promise<PamCiOidcClaimsType> {
    let payload: Record<string, unknown>;
    try {
      // iss 可能是根或 `…/{teamSlug}`，不在此传 issuer，下方手工校验
      const verified = await jwtVerify(idToken, JWKS, {
        audience
      });
      payload = verified.payload as Record<string, unknown>;
    } catch {
      throw new ExecutorError(API_NOT_AUTHORIZED);
    }

    const iss = typeof payload.iss === 'string' ? payload.iss.trim() : '';
    if (!iss || !isVercelIssuer(iss)) {
      throw new ExecutorError(API_NOT_AUTHORIZED);
    }

    const owner = typeof payload.owner === 'string' ? payload.owner.trim() : '';
    const project =
      typeof payload.project === 'string' ? payload.project.trim() : '';
    if (!owner || !project) {
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
      iss,
      aud: audValue,
      sub: String(payload.sub ?? ''),
      resourceKey: `${owner}/${project}`,
      exp: typeof payload.exp === 'number' ? payload.exp : 0
    };
  }
}
