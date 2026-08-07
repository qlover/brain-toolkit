import { describe, expect, it } from 'vitest';
import { mkdtemp, readFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { PamCliConfig } from '../src/config/PamCliConfig';
import { PamCliAuthStore } from '../src/impls/PamCliAuthStore';
import { PamCliApiError } from '../src/impls/PamCliApiError';
import { PamCliSyncStore } from '../src/impls/PamCliSyncStore';

describe('PamCliConfig.normalizeOrigin', () => {
  it('keeps https origins and strips trailing slashes', () => {
    expect(PamCliConfig.normalizeOrigin('https://pam.qlover.top/')).toBe(
      'https://pam.qlover.top'
    );
  });

  it('maps localhost bare hosts to http', () => {
    expect(PamCliConfig.normalizeOrigin('pam.localhost:3400')).toBe(
      'http://pam.localhost:3400'
    );
    expect(PamCliConfig.normalizeOrigin('localhost:3112')).toBe(
      'http://localhost:3112'
    );
  });

  it('maps public hosts to https', () => {
    expect(PamCliConfig.normalizeOrigin('pam.example.com')).toBe(
      'https://pam.example.com'
    );
  });
});

describe('PamCliConfig.buildProjectGeneralUrl', () => {
  it('joins baseUrl, locale, and slug into the general tab URL', () => {
    expect(
      PamCliConfig.buildProjectGeneralUrl(
        'http://pam.localhost:3400/',
        'zh',
        'brain-oauth'
      )
    ).toBe('http://pam.localhost:3400/zh/projects/brain-oauth/general');
  });

  it('falls back to default locale when invalid', () => {
    expect(
      PamCliConfig.buildProjectGeneralUrl(
        'https://pam.qlover.top',
        'fr',
        'my app'
      )
    ).toBe('https://pam.qlover.top/en/projects/my%20app/general');
  });
});

describe('PamCliAuthStore --local isolation', () => {
  it('reads and writes under cwd/.pam without using home', async () => {
    const dir = await mkdtemp(join(tmpdir(), 'pamenv-local-'));
    try {
      const store = new PamCliAuthStore({
        preferLocal: true,
        workingDir: dir
      });
      expect(store.getActiveConfigPath()).toBe(
        PamCliConfig.getLocalConfigPath(dir)
      );

      await store.setBaseUrl('pam.localhost:3400');
      await store.setToken('tok', 'a@b.c');

      const raw = await readFile(store.getActiveConfigPath(), 'utf8');
      const parsed = JSON.parse(raw) as {
        baseUrl: string;
        token: string;
        email: string;
      };
      expect(parsed.baseUrl).toBe('http://pam.localhost:3400');
      expect(parsed.token).toBe('tok');
      expect(parsed.email).toBe('a@b.c');

      const other = new PamCliAuthStore({
        preferLocal: true,
        workingDir: dir
      });
      expect(await other.getToken()).toBe('tok');
      expect(await other.getBaseUrl()).toBe('http://pam.localhost:3400');
    } finally {
      await rm(dir, { recursive: true, force: true });
    }
  });

  it('honors urlOverride without rewriting disk host until setBaseUrl', async () => {
    const dir = await mkdtemp(join(tmpdir(), 'pamenv-override-'));
    try {
      const store = new PamCliAuthStore({
        preferLocal: true,
        workingDir: dir,
        urlOverride: 'http://127.0.0.1:3400'
      });
      expect(await store.getBaseUrl()).toBe('http://127.0.0.1:3400');
      expect(await store.getToken()).toBeNull();
    } finally {
      await rm(dir, { recursive: true, force: true });
    }
  });
});

describe('PamCliSyncStore --local', () => {
  it('writes snapshots under local sync root', async () => {
    const dir = await mkdtemp(join(tmpdir(), 'pamenv-sync-'));
    try {
      const store = new PamCliSyncStore({
        preferLocal: true,
        workingDir: dir
      });
      await store.saveBaseline('pid', 'slug', 'local', { A: '1' });
      const path = store.getSnapshotPath('pid', 'local');
      expect(path.startsWith(PamCliConfig.getLocalSyncRoot(dir))).toBe(true);
      const snap = await store.readSnapshot('pid', 'local');
      expect(snap?.variables).toEqual({ A: '1' });
    } finally {
      await rm(dir, { recursive: true, force: true });
    }
  });
});

describe('PamCliApiError', () => {
  it('formats id and requestId for CLI output', () => {
    const err = new PamCliApiError({
      id: 'api:not_authorized',
      message: 'CLI bearer token required',
      requestId: 'req-1',
      data: { reason: 'missing' },
      httpStatus: 401
    });
    const text = err.formatForCli();
    expect(text).toContain('CLI bearer token required');
    expect(text).toContain('id: api:not_authorized');
    expect(text).toContain('requestId: req-1');
    expect(text).toContain('data:');
  });

  it('prefers translated headline when provided', () => {
    const err = new PamCliApiError({
      id: 'api:not_authorized',
      message: 'CLI bearer token required',
      httpStatus: 401
    });
    const text = err.formatForCli((id) =>
      id === 'api:not_authorized' ? '未授权' : undefined
    );
    expect(text.startsWith('未授权')).toBe(true);
    expect(text).toContain('id: api:not_authorized');
  });
});

describe('PamCliAuthStore locale', () => {
  it('persists locale and localeMessages in local config', async () => {
    const dir = await mkdtemp(join(tmpdir(), 'pamenv-locale-'));
    try {
      const store = new PamCliAuthStore({
        preferLocal: true,
        workingDir: dir
      });
      await store.setLocale('zh');
      expect(await store.getLocale()).toBe('zh');
      await store.setLocaleMessages({ 'api:not_authorized': '未授权' });
      const cfg = await store.getConfig();
      expect(cfg.locale).toBe('zh');
      expect(cfg.localeMessages['api:not_authorized']).toBe('未授权');
      expect(cfg.localePulledAt).toBeTruthy();

      await store.setLocale('en');
      const cleared = await store.getConfig();
      expect(cleared.locale).toBe('en');
      expect(cleared.localeMessages).toEqual({});
      expect(cleared.localePulledAt).toBeNull();
    } finally {
      await rm(dir, { recursive: true, force: true });
    }
  });

  it('locks locale when set with locked: true', async () => {
    const dir = await mkdtemp(join(tmpdir(), 'pamenv-locale-lock-'));
    try {
      const store = new PamCliAuthStore({
        preferLocal: true,
        workingDir: dir
      });
      await store.setLocale('zh', { locked: true, source: 'manual' });
      const cfg = await store.getConfig();
      expect(cfg.locale).toBe('zh');
      expect(cfg.localeLocked).toBe(true);
      expect(cfg.localeSource).toBe('manual');
    } finally {
      await rm(dir, { recursive: true, force: true });
    }
  });
});
