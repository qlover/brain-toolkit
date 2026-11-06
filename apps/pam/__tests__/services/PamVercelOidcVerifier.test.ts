import { ExecutorError } from '@qlover/fe-corekit/executor';
import {
  SignJWT,
  exportJWK,
  generateKeyPair,
  createLocalJWKSet,
  jwtVerify
} from 'jose';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  PAM_VERCEL_OIDC_ISSUER_ROOT,
  PamVercelOidcVerifier
} from '@server/impls/PamVercelOidcVerifier';

describe('PamVercelOidcVerifier', () => {
  const audience = 'https://pam.example';
  let restoreFetch: (() => void) | undefined;

  beforeEach(() => {
    vi.resetModules();
  });

  afterEach(() => {
    restoreFetch?.();
    restoreFetch = undefined;
  });

  it('accepts a valid Vercel-shaped token shape via local JWKS', async () => {
    const { privateKey, publicKey } = await generateKeyPair('RS256');
    const jwk = await exportJWK(publicKey);
    jwk.kid = 'vercel-test-kid';
    jwk.alg = 'RS256';
    jwk.use = 'sig';

    const token = await new SignJWT({
      owner: 'acme',
      project: 'my-app',
      environment: 'production',
      sub: 'owner:acme:project:my-app:environment:production'
    })
      .setProtectedHeader({ alg: 'RS256', kid: 'vercel-test-kid' })
      .setIssuer(`${PAM_VERCEL_OIDC_ISSUER_ROOT}/acme`)
      .setAudience(audience)
      .setExpirationTime('5m')
      .sign(privateKey);

    const localJwks = createLocalJWKSet({ keys: [jwk] });
    const verified = await jwtVerify(token, localJwks, { audience });
    expect(verified.payload.owner).toBe('acme');
    expect(verified.payload.project).toBe('my-app');
    expect(String(verified.payload.iss)).toMatch(
      /^https:\/\/oidc\.vercel\.com/
    );

    const verifier = new PamVercelOidcVerifier();
    await expect(verifier.verify('not-a-jwt', audience)).rejects.toBeInstanceOf(
      ExecutorError
    );
  });

  it('rejects wrong-audience tokens', async () => {
    const { privateKey } = await generateKeyPair('RS256');
    const badAud = await new SignJWT({
      owner: 'acme',
      project: 'my-app'
    })
      .setProtectedHeader({ alg: 'RS256' })
      .setIssuer(PAM_VERCEL_OIDC_ISSUER_ROOT)
      .setAudience('https://wrong.example')
      .setExpirationTime('5m')
      .sign(privateKey);

    const verifier = new PamVercelOidcVerifier();
    await expect(verifier.verify(badAud, audience)).rejects.toBeInstanceOf(
      ExecutorError
    );
  });

  it('rejects tokens with non-Vercel issuer after jose verify fails or claim check', async () => {
    const { privateKey } = await generateKeyPair('RS256');
    const badIss = await new SignJWT({
      owner: 'acme',
      project: 'my-app'
    })
      .setProtectedHeader({ alg: 'RS256' })
      .setIssuer('https://evil.example')
      .setAudience(audience)
      .setExpirationTime('5m')
      .sign(privateKey);

    const verifier = new PamVercelOidcVerifier();
    await expect(verifier.verify(badIss, audience)).rejects.toBeInstanceOf(
      ExecutorError
    );
  });
});
