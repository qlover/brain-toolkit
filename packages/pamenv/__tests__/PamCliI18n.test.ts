import { afterEach, describe, expect, it } from 'vitest';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { PamCliI18n } from '../src/i18n/PamCliI18n';
import { PAMENV_CLI_LOGIN_WAITING } from '../src/i18n/identifier/pamenv_cli';
import { PamCliAuthStore } from '../src/impls/PamCliAuthStore';
import { PamCliLocaleCatalog } from '../src/impls/PamCliLocaleCatalog';

describe('PamCliI18n', () => {
  afterEach(() => {
    PamCliI18n.reset();
  });

  it('loads dist/locales and translates by constant key', async () => {
    PamCliI18n.setLocale('zh');
    await PamCliI18n.ensureLoaded('zh');
    await PamCliI18n.ensureLoaded('en');
    expect(PamCliI18n.t(PAMENV_CLI_LOGIN_WAITING)).toContain('授权');
    PamCliI18n.setLocale('en');
    expect(PamCliI18n.t(PAMENV_CLI_LOGIN_WAITING)).toBe(
      'Waiting for authorization...'
    );
  });

  it('hydrates api:* from PAM without overriding CLI copy or persisting', async () => {
    const dir = await mkdtemp(join(tmpdir(), 'pamenv-i18n-'));
    const originalFetch = globalThis.fetch;
    const urls: string[] = [];
    globalThis.fetch = (async (input: RequestInfo | URL) => {
      urls.push(String(input));
      return {
        ok: true,
        json: async () => ({
          'pamenv_cli:login_waiting': '来自 PAM 的覆盖文案',
          'api:not_authorized': '未授权',
          'common:save': '保存'
        })
      } as Response;
    }) as typeof fetch;

    try {
      const store = new PamCliAuthStore({
        preferLocal: true,
        workingDir: dir
      });
      await store.setLocale('zh');
      await store.setBaseUrl('http://pam.localhost:3400');

      PamCliI18n.reset();
      PamCliI18n.setLocale('zh');
      await PamCliI18n.ensureLoaded('zh');
      const count = await PamCliI18n.hydrateFromApi(store);
      expect(count).toBe(1);
      expect(PamCliI18n.t(PAMENV_CLI_LOGIN_WAITING)).toContain('授权');
      expect(PamCliI18n.t(PAMENV_CLI_LOGIN_WAITING)).not.toContain('覆盖');
      expect(PamCliI18n.lookup('api:not_authorized')).toBe('未授权');
      expect(PamCliI18n.lookup('common:save')).toBeUndefined();
      expect(urls.some((url) => url.includes('/api/locales/json'))).toBe(true);
      expect(urls.some((url) => url.includes('namespaces=api'))).toBe(true);
      expect(urls.some((url) => url.includes('pamenv_cli'))).toBe(false);

      const cfg = await store.getConfig();
      expect(
        (cfg as { localeMessages?: unknown }).localeMessages
      ).toBeUndefined();
    } finally {
      globalThis.fetch = originalFetch;
      await rm(dir, { recursive: true, force: true });
    }
  });
});

describe('PamCliLocaleCatalog', () => {
  it('keeps only api keys', async () => {
    const dir = await mkdtemp(join(tmpdir(), 'pamenv-catalog-'));
    const originalFetch = globalThis.fetch;
    globalThis.fetch = (async () =>
      ({
        ok: true,
        json: async () => ({
          'pamenv_cli:cancelled': '已取消。',
          'api:not_authorized': '未授权',
          'page_home:title': 'Home'
        })
      }) as Response) as typeof fetch;

    try {
      const store = new PamCliAuthStore({
        preferLocal: true,
        workingDir: dir
      });
      await store.setBaseUrl('http://pam.localhost:3400');
      const catalog = new PamCliLocaleCatalog(store);
      const messages = await catalog.fetch('zh');
      expect(messages['api:not_authorized']).toBe('未授权');
      expect(messages['pamenv_cli:cancelled']).toBeUndefined();
      expect(messages['page_home:title']).toBeUndefined();
    } finally {
      globalThis.fetch = originalFetch;
      await rm(dir, { recursive: true, force: true });
    }
  });
});
