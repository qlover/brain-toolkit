import { describe, expect, it, vi } from 'vitest';
import {
  isTrustedAllow,
  OAuthConsentTrustService
} from '../src/server/oauth/OAuthConsentTrustService';
import { buildSwitchAccountHref, toSearchString } from '../src/shared';
import type {
  OAuthConsentGrantRepository,
  OAuthConsentGrantRow
} from '../src/server/oauth/OAuthConsentGrantRepository';

const DAY = 24 * 60 * 60 * 1000;

function grant(partial: Partial<OAuthConsentGrantRow>): OAuthConsentGrantRow {
  return {
    user_id: 'u1',
    client_id: 'c1',
    device_id: 'device-aaaaaaaaaaaa',
    scopes: ['openid', 'email'],
    expires_at: new Date(Date.now() + DAY).toISOString(),
    ...partial
  };
}

function createRepo(existing: OAuthConsentGrantRow | null): {
  repo: OAuthConsentGrantRepository;
  upsert: ReturnType<typeof vi.fn>;
  touch: ReturnType<typeof vi.fn>;
} {
  const upsert = vi.fn(async () => {});
  const touch = vi.fn(async () => {});
  const repo = {
    find: vi.fn(async () => existing),
    upsert,
    touch,
    revoke: vi.fn(async () => {})
  } as unknown as OAuthConsentGrantRepository;
  return { repo, upsert, touch };
}

const logger = { warn: vi.fn() };
const device = { deviceId: 'device-aaaaaaaaaaaa', userAgent: 'UA' };
const authorizeData = {
  clientId: 'c1',
  redirectUri: 'https://app/cb',
  scopes: ['openid', 'email'],
  state: 's'
};

describe('isTrustedAllow', () => {
  it('requires allow + trust + client_id', () => {
    expect(isTrustedAllow({ action: 'allow', trust: true, client_id: 'c' })).toBe(
      true
    );
    expect(isTrustedAllow({ action: 'allow', client_id: 'c' })).toBe(false);
    expect(isTrustedAllow({ action: 'deny', trust: true, client_id: 'c' })).toBe(
      false
    );
    expect(isTrustedAllow({ action: 'allow', trust: true })).toBe(false);
    expect(isTrustedAllow(null)).toBe(false);
  });
});

describe('OAuthConsentTrustService.remember', () => {
  it('merges scopes of an active grant', async () => {
    const { repo, upsert } = createRepo(grant({ scopes: ['openid', 'phone'] }));
    const service = new OAuthConsentTrustService(repo, logger);

    await service.remember(
      'u1',
      { action: 'allow', trust: true, client_id: 'c1', scope: 'openid email' },
      device
    );

    expect(upsert).toHaveBeenCalledTimes(1);
    const input = upsert.mock.calls[0][0];
    expect(input.scopes.sort()).toEqual(['email', 'openid', 'phone']);
    expect(input.user_agent).toBe('UA');
    expect(new Date(input.expires_at).getTime()).toBeGreaterThan(
      Date.now() + 89 * DAY
    );
  });

  it('drops scopes of an expired grant', async () => {
    const { repo, upsert } = createRepo(
      grant({ scopes: ['phone'], expires_at: new Date(0).toISOString() })
    );
    const service = new OAuthConsentTrustService(repo, logger);

    await service.remember(
      'u1',
      { action: 'allow', trust: true, client_id: 'c1', scope: 'openid' },
      device
    );

    expect(upsert.mock.calls[0][0].scopes).toEqual(['openid']);
  });

  it('is a no-op without trust or device', async () => {
    const { repo, upsert } = createRepo(null);
    const service = new OAuthConsentTrustService(repo, logger);

    await service.remember('u1', { action: 'allow', client_id: 'c1' }, device);
    await service.remember(
      'u1',
      { action: 'allow', trust: true, client_id: 'c1' },
      undefined
    );

    expect(upsert).not.toHaveBeenCalled();
  });

  it('logs instead of throwing on repository failure', async () => {
    const { repo, upsert } = createRepo(null);
    upsert.mockRejectedValueOnce(new Error('db down'));
    const warn = vi.fn();
    const service = new OAuthConsentTrustService(repo, { warn });

    await expect(
      service.remember(
        'u1',
        { action: 'allow', trust: true, client_id: 'c1' },
        device
      )
    ).resolves.toBeUndefined();
    expect(warn).toHaveBeenCalled();
  });
});

describe('OAuthConsentTrustService.tryAuto', () => {
  it('issues a code when the grant covers all scopes', async () => {
    const { repo, touch } = createRepo(grant({}));
    const service = new OAuthConsentTrustService(repo, logger);
    const issue = vi.fn(async () => 'https://app/cb?code=x');

    const result = await service.tryAuto('u1', authorizeData, device, issue);

    expect(result).toBe('https://app/cb?code=x');
    expect(issue).toHaveBeenCalledWith(
      expect.objectContaining({
        action: 'allow',
        client_id: 'c1',
        scope: 'openid email',
        state: 's'
      })
    );
    expect(touch).toHaveBeenCalledWith('u1', 'c1', device.deviceId);
  });

  it('returns null when a scope is not covered', async () => {
    const { repo } = createRepo(grant({ scopes: ['openid'] }));
    const service = new OAuthConsentTrustService(repo, logger);
    const issue = vi.fn();

    expect(await service.tryAuto('u1', authorizeData, device, issue)).toBeNull();
    expect(issue).not.toHaveBeenCalled();
  });

  it('returns null for expired grants or missing device', async () => {
    const { repo } = createRepo(
      grant({ expires_at: new Date(0).toISOString() })
    );
    const service = new OAuthConsentTrustService(repo, logger);
    const issue = vi.fn();

    expect(await service.tryAuto('u1', authorizeData, device, issue)).toBeNull();
    expect(
      await service.tryAuto('u1', authorizeData, undefined, issue)
    ).toBeNull();
    expect(issue).not.toHaveBeenCalled();
  });
});

describe('authorize search helpers', () => {
  it('rebuilds repeated query keys', () => {
    expect(toSearchString({ a: '1', b: ['2', '3'], c: undefined })).toBe(
      'a=1&b=2&b=3'
    );
  });

  it('builds a login link that returns to the authorize request', () => {
    expect(
      buildSwitchAccountHref('/en/login', '/en/oauth/authorize', {
        client_id: 'c1'
      })
    ).toBe(
      '/en/login?redirect=' + encodeURIComponent('/en/oauth/authorize?client_id=c1')
    );
  });
});
