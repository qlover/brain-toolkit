import { afterEach, describe, expect, it, vi } from 'vitest';
import { PamCliConfig } from '../src/config/PamCliConfig';
import { PamCiOidcBootstrap } from '../src/impls/PamCiOidcBootstrap';
import { PamCiOidcTokenSourceRegistry } from '../src/impls/PamCiOidcTokenSourceRegistry';
import type { PamCliApiClientInterface } from '../src/interfaces/PamCliApiClientInterface';
import type { PamCliAuthStoreInterface } from '../src/interfaces/PamCliAuthStoreInterface';
import type { PamCiOidcTokenSourceInterface } from '../src/interfaces/PamCiOidcTokenSourceInterface';

describe('PamCiOidcBootstrap', () => {
  const previousToken = process.env[PamCliConfig.ENV_TOKEN];
  const previousAud = process.env[PamCliConfig.ENV_OIDC_AUD];

  afterEach(() => {
    if (previousToken === undefined) {
      delete process.env[PamCliConfig.ENV_TOKEN];
    } else {
      process.env[PamCliConfig.ENV_TOKEN] = previousToken;
    }
    if (previousAud === undefined) {
      delete process.env[PamCliConfig.ENV_OIDC_AUD];
    } else {
      process.env[PamCliConfig.ENV_OIDC_AUD] = previousAud;
    }
  });

  it('exchanges via token source and sets PAMENV_TOKEN', async () => {
    delete process.env[PamCliConfig.ENV_TOKEN];
    process.env[PamCliConfig.ENV_OIDC_AUD] = 'https://pam.example';

    const source: PamCiOidcTokenSourceInterface = {
      getIdToken: vi.fn(async (audience: string) => {
        expect(audience).toBe('https://pam.example');
        return 'platform-id-token';
      })
    };
    const apiClient = {
      exchangeOidc: vi.fn(async (provider, idToken, baseUrl) => {
        expect(provider).toBe('vercel');
        expect(idToken).toBe('platform-id-token');
        expect(baseUrl).toBe('https://pam.example');
        return { token: 'pam-ci-token', expiresAt: '2099-01-01T00:00:00.000Z' };
      })
    } as unknown as PamCliApiClientInterface;
    const authStore = {
      getBaseUrl: vi.fn(async () => 'https://pam.example')
    } as unknown as PamCliAuthStoreInterface;

    const bootstrap = new PamCiOidcBootstrap(
      apiClient,
      authStore,
      new PamCiOidcTokenSourceRegistry({ vercel: source })
    );
    const issued = await bootstrap.ensurePamenvToken('vercel', false);
    expect(issued.token).toBe('pam-ci-token');
    expect(process.env[PamCliConfig.ENV_TOKEN]).toBe('pam-ci-token');
    expect(source.getIdToken).toHaveBeenCalledOnce();
    expect(apiClient.exchangeOidc).toHaveBeenCalledOnce();
  });

  it('parseProvider accepts vercel', () => {
    expect(PamCiOidcBootstrap.parseProvider('vercel')).toBe('vercel');
    expect(() => PamCiOidcBootstrap.parseProvider('gitlab')).toThrow();
  });
});
