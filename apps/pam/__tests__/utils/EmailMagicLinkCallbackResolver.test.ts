import { describe, expect, it } from 'vitest';
import { EmailMagicLinkCallbackResolver } from '@/app/[locale]/callback/email-login/EmailMagicLinkCallbackResolver';

describe('EmailMagicLinkCallbackResolver', () => {
  const resolver = new EmailMagicLinkCallbackResolver();

  it('从 hash 读取 implicit 会话', () => {
    expect(
      resolver.resolve(
        '',
        '#access_token=access&refresh_token=refresh&expires_in=1200&token_type=bearer&type=magiclink'
      )
    ).toEqual({
      kind: 'session',
      accessToken: 'access',
      refreshToken: 'refresh',
      expiresIn: '1200',
      tokenType: 'bearer'
    });
  });

  it('query 里的会话同样可用', () => {
    expect(
      resolver.resolve('?access_token=access&refresh_token=refresh', '')
    ).toEqual({
      kind: 'session',
      accessToken: 'access',
      refreshToken: 'refresh',
      expiresIn: '3600',
      tokenType: 'bearer'
    });
  });

  it('保留旧 PKCE code', () => {
    expect(resolver.resolve('?code=auth-code', '')).toEqual({
      kind: 'code',
      code: 'auth-code'
    });
  });

  it('error 优先于令牌', () => {
    expect(
      resolver.resolve(
        '?error=access_denied&error_description=otp+expired',
        '#access_token=access&refresh_token=refresh'
      )
    ).toEqual({
      kind: 'error',
      message: 'access_denied otp expired'
    });
  });

  it('没有登录材料时返回 missing', () => {
    expect(resolver.resolve('', '')).toEqual({ kind: 'missing' });
  });

  it('清掉地址栏里的令牌和授权码', () => {
    expect(
      resolver.clearCredentials(
        'https://pam.qlover.top/zh/callback/email-login?next=/projects&code=secret#access_token=access&refresh_token=refresh'
      )
    ).toBe('/zh/callback/email-login?next=%2Fprojects');
  });
});
