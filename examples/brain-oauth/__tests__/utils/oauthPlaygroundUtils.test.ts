import { describe, expect, it } from 'vitest';
import {
  buildAuthorizeSearchParams,
  parseOAuthCallbackUrl
} from '../../src/uikit/utils/oauthPlaygroundUtils';

describe('oauthPlaygroundUtils', () => {
  it('buildAuthorizeSearchParams includes real OAuth fields', () => {
    const params = buildAuthorizeSearchParams({
      clientId: 'client_abc',
      redirectUri: 'https://app.example/cb',
      scopes: ['openid', 'profile'],
      state: 's1'
    });

    expect(params.get('response_type')).toBe('code');
    expect(params.get('client_id')).toBe('client_abc');
    expect(params.get('redirect_uri')).toBe('https://app.example/cb');
    expect(params.get('scope')).toBe('openid profile');
    expect(params.get('state')).toBe('s1');
  });

  it('buildAuthorizeSearchParams includes PKCE when provided', () => {
    const params = buildAuthorizeSearchParams({
      clientId: 'client_abc',
      redirectUri: 'https://app.example/cb',
      scopes: ['openid'],
      codeChallenge: 'challenge-value',
      codeChallengeMethod: 'S256'
    });

    expect(params.get('code_challenge')).toBe('challenge-value');
    expect(params.get('code_challenge_method')).toBe('S256');
  });

  it('parseOAuthCallbackUrl extracts code and state', () => {
    const parsed = parseOAuthCallbackUrl(
      'https://app.example/cb?code=auth_code_xyz&state=s1'
    );

    expect(parsed.code).toBe('auth_code_xyz');
    expect(parsed.state).toBe('s1');
  });

  it('parseOAuthCallbackUrl extracts OAuth errors', () => {
    const parsed = parseOAuthCallbackUrl(
      'https://app.example/cb?error=access_denied&error_description=User%20denied'
    );

    expect(parsed.error).toBe('access_denied');
    expect(parsed.error_description).toBe('User denied');
  });
});
