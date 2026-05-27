import { NextRequest } from 'next/server';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { POST } from '@/app/oauth/token/route';
import {
  API_OAUTH_INVALID_CLIENT,
  API_OAUTH_INVALID_REQUEST
} from '@config/i18n-identifier/api';

const exchangeToken = vi.fn();

vi.mock('@server/BootstrapServer', () => ({
  BootstrapServer: class MockBootstrapServer {
    public requestId = 'test-request-id';

    public getIOC(): unknown {
      return () => ({
        exchangeToken,
        insertEvent: vi.fn().mockResolvedValue(undefined)
      });
    }
  }
}));

describe('POST /oauth/token route', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns 200 with token payload on success', async () => {
    exchangeToken.mockResolvedValue({
      access_token: 'at',
      token_type: 'Bearer',
      expires_in: 3600
    });

    const req = new NextRequest('http://localhost/oauth/token', {
      method: 'POST',
      headers: { 'content-type': 'application/x-www-form-urlencoded' },
      body: 'grant_type=refresh_token&refresh_token=rt&client_id=c1&client_secret=s1'
    });

    const res = await POST(req);
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.access_token).toBe('at');
    expect(res.headers.get('Cache-Control')).toBe('no-store');
  });

  it('returns invalid_request when grant_type is missing', async () => {
    const req = new NextRequest('http://localhost/oauth/token', {
      method: 'POST',
      headers: { 'content-type': 'application/x-www-form-urlencoded' },
      body: 'client_id=c1'
    });

    const res = await POST(req);
    const body = await res.json();

    expect(res.status).toBe(400);
    expect(body.error).toBe('invalid_request');
    expect(body.error_id).toBe(API_OAUTH_INVALID_REQUEST);
    expect(exchangeToken).not.toHaveBeenCalled();
  });

  it('returns OAuth token error from service', async () => {
    const { OAuthTokenError } = await import(
      '@server/oauth/utils/oauthTokenError'
    );
    exchangeToken.mockRejectedValue(
      new OAuthTokenError(API_OAUTH_INVALID_CLIENT, 401)
    );

    const req = new NextRequest('http://localhost/oauth/token', {
      method: 'POST',
      headers: { 'content-type': 'application/x-www-form-urlencoded' },
      body: 'grant_type=refresh_token&refresh_token=rt&client_id=c1&client_secret=bad'
    });

    const res = await POST(req);
    const body = await res.json();

    expect(res.status).toBe(401);
    expect(body.error).toBe('invalid_client');
    expect(body.error_id).toBe(API_OAUTH_INVALID_CLIENT);
  });
});
