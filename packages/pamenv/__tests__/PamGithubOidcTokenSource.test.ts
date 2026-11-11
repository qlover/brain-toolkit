import { afterEach, beforeAll, describe, expect, it, vi } from 'vitest';
import { PamGithubOidcTokenSource } from '../src/impls/PamGithubOidcTokenSource';
import { PamCliI18n } from '../src/i18n/PamCliI18n';
import {
  PAMENV_CLI_OIDC_GITHUB_ACTIONS_ENV_MISSING,
  PAMENV_CLI_OIDC_GITHUB_TOKEN_EMPTY,
  PAMENV_CLI_OIDC_GITHUB_TOKEN_HTTP_ERROR
} from '../src/i18n/identifier/pamenv_cli';

describe('PamGithubOidcTokenSource', () => {
  const previousUrl = process.env.ACTIONS_ID_TOKEN_REQUEST_URL;
  const previousToken = process.env.ACTIONS_ID_TOKEN_REQUEST_TOKEN;

  beforeAll(async () => {
    PamCliI18n.reset();
    PamCliI18n.setLocale('en');
    await PamCliI18n.ensureLoaded('en');
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    if (previousUrl === undefined) {
      delete process.env.ACTIONS_ID_TOKEN_REQUEST_URL;
    } else {
      process.env.ACTIONS_ID_TOKEN_REQUEST_URL = previousUrl;
    }
    if (previousToken === undefined) {
      delete process.env.ACTIONS_ID_TOKEN_REQUEST_TOKEN;
    } else {
      process.env.ACTIONS_ID_TOKEN_REQUEST_TOKEN = previousToken;
    }
  });

  it('fetches id_token with audience query and bearer header', async () => {
    process.env.ACTIONS_ID_TOKEN_REQUEST_URL =
      'https://token.actions.example/request?existing=1';
    process.env.ACTIONS_ID_TOKEN_REQUEST_TOKEN = 'request-token';

    const fetchMock = vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
      const url = new URL(String(input));
      expect(url.searchParams.get('existing')).toBe('1');
      expect(url.searchParams.get('audience')).toBe('https://pam.example');
      expect(init?.headers).toMatchObject({
        Authorization: 'bearer request-token',
        Accept: 'application/json'
      });
      return new Response(JSON.stringify({ value: ' github-id-token ' }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      });
    });
    vi.stubGlobal('fetch', fetchMock);

    const source = new PamGithubOidcTokenSource();
    await expect(source.getIdToken('https://pam.example')).resolves.toBe(
      'github-id-token'
    );
    expect(fetchMock).toHaveBeenCalledOnce();
  });

  it('throws when Actions request env is missing', async () => {
    delete process.env.ACTIONS_ID_TOKEN_REQUEST_URL;
    delete process.env.ACTIONS_ID_TOKEN_REQUEST_TOKEN;
    const source = new PamGithubOidcTokenSource();
    await expect(source.getIdToken('https://pam.example')).rejects.toThrow(
      PamCliI18n.t(PAMENV_CLI_OIDC_GITHUB_ACTIONS_ENV_MISSING)
    );
  });

  it('throws when token value is empty', async () => {
    process.env.ACTIONS_ID_TOKEN_REQUEST_URL =
      'https://token.actions.example/request';
    process.env.ACTIONS_ID_TOKEN_REQUEST_TOKEN = 'request-token';
    vi.stubGlobal(
      'fetch',
      vi.fn(async () =>
        new Response(JSON.stringify({ value: '   ' }), {
          status: 200,
          headers: { 'Content-Type': 'application/json' }
        })
      )
    );

    const source = new PamGithubOidcTokenSource();
    await expect(source.getIdToken('https://pam.example')).rejects.toThrow(
      PamCliI18n.t(PAMENV_CLI_OIDC_GITHUB_TOKEN_EMPTY)
    );
  });

  it('throws on non-OK HTTP status', async () => {
    process.env.ACTIONS_ID_TOKEN_REQUEST_URL =
      'https://token.actions.example/request';
    process.env.ACTIONS_ID_TOKEN_REQUEST_TOKEN = 'request-token';
    vi.stubGlobal(
      'fetch',
      vi.fn(
        async () =>
          new Response('nope', {
            status: 403,
            statusText: 'Forbidden'
          })
      )
    );

    const source = new PamGithubOidcTokenSource();
    await expect(source.getIdToken('https://pam.example')).rejects.toThrow(
      PamCliI18n.t(PAMENV_CLI_OIDC_GITHUB_TOKEN_HTTP_ERROR, {
        status: '403'
      })
    );
  });
});
