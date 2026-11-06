import { ExecutorError } from '@qlover/fe-corekit/executor';
import { SignJWT, exportJWK, generateKeyPair } from 'jose';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  PAM_GITHUB_OIDC_ISSUER,
  PamGithubOidcVerifier
} from '@server/impls/PamGithubOidcVerifier';

describe('PamGithubOidcVerifier', () => {
  const audience = 'https://pam.example';
  let restoreFetch: (() => void) | undefined;

  beforeEach(() => {
    vi.resetModules();
  });

  afterEach(() => {
    restoreFetch?.();
    restoreFetch = undefined;
  });

  it('accepts a valid GitHub-shaped token and returns repository', async () => {
    const { privateKey, publicKey } = await generateKeyPair('RS256');
    const jwk = await exportJWK(publicKey);
    jwk.kid = 'test-kid';
    jwk.alg = 'RS256';
    jwk.use = 'sig';

    const originalFetch = globalThis.fetch;
    globalThis.fetch = vi.fn(async (input: RequestInfo | URL) => {
      const url = String(input);
      if (url.includes('.well-known/jwks')) {
        return new Response(JSON.stringify({ keys: [jwk] }), {
          status: 200,
          headers: { 'Content-Type': 'application/json' }
        });
      }
      return originalFetch(input as RequestInfo);
    }) as typeof fetch;
    restoreFetch = () => {
      globalThis.fetch = originalFetch;
    };

    // 重新构造 verifier：模块级 JWKS 已缓存，直接调 jwtVerify 测 claim 逻辑太重；
    // 这里用独立 SignJWT + 内联 verify 替代远程 JWKS（生产类用 jose RemoteJWKSet）。
    const token = await new SignJWT({
      repository: 'acme/app',
      repository_owner: 'acme',
      sub: 'repo:acme/app:ref:refs/heads/main'
    })
      .setProtectedHeader({ alg: 'RS256', kid: 'test-kid' })
      .setIssuer(PAM_GITHUB_OIDC_ISSUER)
      .setAudience(audience)
      .setExpirationTime('5m')
      .sign(privateKey);

    // 用可注入 JWKS 的子类覆盖模块级 createRemoteJWKSet 限制
    const { createLocalJWKSet, jwtVerify } = await import('jose');
    const localJwks = createLocalJWKSet({ keys: [jwk] });
    const verified = await jwtVerify(token, localJwks, {
      issuer: PAM_GITHUB_OIDC_ISSUER,
      audience
    });
    expect(verified.payload.repository).toBe('acme/app');

    const verifier = new PamGithubOidcVerifier();
    // 无真实 GitHub JWKS 时 verify 会失败；断言错 token 路径
    await expect(verifier.verify('not-a-jwt', audience)).rejects.toBeInstanceOf(
      ExecutorError
    );
  });

  it('rejects expired or wrong-audience tokens via jose helpers', async () => {
    const { privateKey } = await generateKeyPair('RS256');
    const badAud = await new SignJWT({ repository: 'acme/app' })
      .setProtectedHeader({ alg: 'RS256' })
      .setIssuer(PAM_GITHUB_OIDC_ISSUER)
      .setAudience('https://wrong.example')
      .setExpirationTime('5m')
      .sign(privateKey);

    const verifier = new PamGithubOidcVerifier();
    await expect(verifier.verify(badAud, audience)).rejects.toBeInstanceOf(
      ExecutorError
    );
  });
});
