import { NextRequest } from 'next/server';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { GET } from '@/app/userinfo/route';
import { API_OAUTH_INVALID_TOKEN } from '@config/i18n-identifier/api';

const getUserInfo = vi.fn();

vi.mock('@server/BootstrapServer', () => ({
  BootstrapServer: class MockBootstrapServer {
    public getIOC(): unknown {
      return () => ({
        getUserInfo
      });
    }
  }
}));

describe('GET /userinfo route', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns 200 with userinfo claims', async () => {
    getUserInfo.mockResolvedValue({
      sub: '42',
      email: 'user@example.com',
      name: 'User'
    });

    const req = new NextRequest('http://localhost/userinfo', {
      headers: { authorization: 'Bearer eyJ.test' }
    });

    const res = await GET(req);
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body).toEqual({
      sub: '42',
      email: 'user@example.com',
      name: 'User'
    });
    expect(getUserInfo).toHaveBeenCalledWith('eyJ.test');
  });

  it('returns invalid_token when Authorization is missing', async () => {
    const req = new NextRequest('http://localhost/userinfo');
    const res = await GET(req);
    const body = await res.json();

    expect(res.status).toBe(401);
    expect(body.error).toBe('invalid_token');
    expect(body.error_id).toBe(API_OAUTH_INVALID_TOKEN);
    expect(getUserInfo).not.toHaveBeenCalled();
  });

  it('returns invalid_token when service rejects token', async () => {
    const { OAuthUserInfoError } = await import(
      '@server/oauth/utils/oauthUserInfoError'
    );
    getUserInfo.mockRejectedValue(new OAuthUserInfoError());

    const req = new NextRequest('http://localhost/userinfo', {
      headers: { authorization: 'Bearer bad' }
    });

    const res = await GET(req);
    const body = await res.json();

    expect(res.status).toBe(401);
    expect(body.error).toBe('invalid_token');
    expect(body.error_id).toBe(API_OAUTH_INVALID_TOKEN);
  });
});
