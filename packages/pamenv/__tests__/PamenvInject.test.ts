import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';
import {
  assertOnlyOmitExclusive,
  normalizePamCliKeyList
} from '../src/commands/RunCommand';
import { PamCliConfig } from '../src/config/PamCliConfig';
import {
  assertOnlyKeysPresent,
  DEFAULT_PAMENV_KEEP_ENV,
  ensurePamenvRuntimeEnv,
  injectPamenvProcessEnv,
  isPamenvGloballyDisabled,
  mergePamenvKeepEnvKeys,
  resetPamenvInjectCache,
  resolveActiveOidcProvider,
  resolveInjectPreferLocal,
  resolvePamenvEnabled,
  resolvePamenvInjectOptions,
  resolveSnapshotKeysToOpen
} from '../src/impls/PamenvInject';

describe('injectPamenvProcessEnv', () => {
  afterEach(() => {
    resetPamenvInjectCache();
    delete process.env.PAMENV_INJECT_SENTINEL;
    delete process.env.VERCEL;
    delete process.env.GITHUB_ACTIONS;
    delete process.env[PamCliConfig.ENV_PROJECT_SLUG];
    delete process.env[PamCliConfig.ENV_ENV_NAME];
    delete process.env[PamCliConfig.ENV_ENABLED];
  });

  it('does not touch process.env when disabled', async () => {
    process.env.PAMENV_INJECT_SENTINEL = 'keep';
    await injectPamenvProcessEnv({
      slug: 'brain-oauth',
      env: 'local',
      enabled: false
    });
    expect(process.env.PAMENV_INJECT_SENTINEL).toBe('keep');
  });

  it('PAMENV_ENABLED=0 时不注入', async () => {
    process.env.PAMENV_INJECT_SENTINEL = 'keep';
    process.env[PamCliConfig.ENV_ENABLED] = '0';
    await injectPamenvProcessEnv({
      slug: 'brain-oauth',
      env: 'local',
      enabled: true
    });
    expect(process.env.PAMENV_INJECT_SENTINEL).toBe('keep');
  });
});

describe('resolvePamenvEnabled / isPamenvGloballyDisabled', () => {
  afterEach(() => {
    delete process.env[PamCliConfig.ENV_ENABLED];
  });

  it('PAMENV_ENABLED=0 强制关闭', () => {
    process.env[PamCliConfig.ENV_ENABLED] = '0';
    expect(isPamenvGloballyDisabled()).toBe(true);
    expect(resolvePamenvEnabled(true)).toBe(false);
  });

  it('未设置时尊重 options.enabled', () => {
    expect(resolvePamenvEnabled(undefined)).toBe(true);
    expect(resolvePamenvEnabled(false)).toBe(false);
  });
});

describe('resolvePamenvInjectOptions', () => {
  afterEach(() => {
    delete process.env.VERCEL;
    delete process.env.GITHUB_ACTIONS;
    delete process.env[PamCliConfig.ENV_PROJECT_SLUG];
    delete process.env[PamCliConfig.ENV_ENV_NAME];
    delete process.env[PamCliConfig.ENV_PAM_ENV];
    delete process.env[PamCliConfig.ENV_ENABLED];
  });

  it('prefers PAMENV_PROJECT_SLUG / PAMENV_ENV_NAME over options', () => {
    process.env[PamCliConfig.ENV_PROJECT_SLUG] = 'from-env';
    process.env[PamCliConfig.ENV_ENV_NAME] = 'staging';
    const resolved = resolvePamenvInjectOptions({
      slug: 'from-arg',
      env: 'local',
      oidc: 'vercel'
    });
    expect(resolved.slug).toBe('from-env');
    expect(resolved.env).toBe('staging');
  });

  it('prefers PAM_ENV over options.env when PAMENV_ENV_NAME absent', () => {
    process.env[PamCliConfig.ENV_PAM_ENV] = 'dev';
    const resolved = resolvePamenvInjectOptions({
      slug: 'pam',
      env: 'local'
    });
    expect(resolved.env).toBe('dev');
  });

  it('falls back to options when env vars are absent', () => {
    const resolved = resolvePamenvInjectOptions({
      slug: 'pam',
      env: 'local',
      preferLocal: true
    });
    expect(resolved.slug).toBe('pam');
    expect(resolved.env).toBe('local');
    expect(resolved.oidc).toBeUndefined();
    expect(resolved.preferLocal).toBe(true);
  });

  it('本地无项目 .pam 时 preferLocal 默认回落全局（与 CLI 自动模式一致）', () => {
    const cwd = fs.mkdtempSync(path.join(os.tmpdir(), 'pamenv-inject-global-'));
    try {
      expect(resolveInjectPreferLocal({ cwd }, undefined)).toBe(false);
      const resolved = resolvePamenvInjectOptions({
        slug: 'pam',
        env: 'local',
        cwd
      });
      expect(resolved.preferLocal).toBe(false);
    } finally {
      fs.rmSync(cwd, { recursive: true, force: true });
    }
  });

  it('本地已有项目 .pam 时 preferLocal 默认为 true', () => {
    const cwd = fs.mkdtempSync(path.join(os.tmpdir(), 'pamenv-inject-local-'));
    try {
      fs.mkdirSync(path.join(cwd, '.pam'));
      expect(resolveInjectPreferLocal({ cwd }, undefined)).toBe(true);
      const resolved = resolvePamenvInjectOptions({
        slug: 'pam',
        env: 'local',
        cwd
      });
      expect(resolved.preferLocal).toBe(true);
    } finally {
      fs.rmSync(cwd, { recursive: true, force: true });
    }
  });

  it('keepEnv 默认含平台键，并可追加', () => {
    const base = resolvePamenvInjectOptions({
      slug: 'pam',
      env: 'local'
    });
    expect(base.keepEnvKeys).toEqual(
      expect.arrayContaining([...DEFAULT_PAMENV_KEEP_ENV])
    );
    const merged = mergePamenvKeepEnvKeys(['MY_CUSTOM']);
    expect(merged).toEqual(
      expect.arrayContaining([...DEFAULT_PAMENV_KEEP_ENV, 'MY_CUSTOM'])
    );
    const withExtra = resolvePamenvInjectOptions({
      slug: 'pam',
      env: 'local',
      keepEnv: 'MY_CUSTOM'
    });
    expect(withExtra.keepEnvKeys).toContain('MY_CUSTOM');
    expect(withExtra.keepEnvKeys).toContain(PamCliConfig.ENV_ENABLED);
  });

  it('activates vercel oidc only on Vercel', () => {
    expect(resolveActiveOidcProvider('vercel')).toBeUndefined();
    process.env.VERCEL = '1';
    expect(resolveActiveOidcProvider('vercel')).toBe('vercel');
    const resolved = resolvePamenvInjectOptions({
      slug: 'pam',
      env: 'dev',
      oidc: 'vercel'
    });
    expect(resolved.oidc).toBe('vercel');
    expect(resolved.preferLocal).toBe(false);
  });

  it('activates github oidc only on GitHub Actions', () => {
    process.env.GITHUB_ACTIONS = 'true';
    expect(resolveActiveOidcProvider('github')).toBe('github');
    expect(resolveActiveOidcProvider('vercel')).toBeUndefined();
  });

  it('normalizes only string and rejects only+omit together', () => {
    const resolved = resolvePamenvInjectOptions({
      slug: 'pam',
      env: 'local',
      only: 'SESSION_SECRET'
    });
    expect(resolved.onlyKeys).toEqual(['SESSION_SECRET']);
    expect(() =>
      resolvePamenvInjectOptions({
        slug: 'pam',
        env: 'local',
        only: ['A'],
        omit: ['B']
      })
    ).toThrow(/only.*omit/i);
  });
});

describe('normalizePamCliKeyList / resolveSnapshotKeysToOpen', () => {
  it('normalizes string or array and drops empties', () => {
    expect(normalizePamCliKeyList('A')).toEqual(['A']);
    expect(normalizePamCliKeyList([' A ', '', 'B', 'A'])).toEqual(['A', 'B']);
  });

  it('resolves only / omit / all', () => {
    const available = ['A', 'B', 'C'];
    expect(resolveSnapshotKeysToOpen(available, ['B'], [])).toEqual(['B']);
    expect(resolveSnapshotKeysToOpen(available, [], ['B'])).toEqual(['A', 'C']);
    expect(resolveSnapshotKeysToOpen(available, [], [])).toEqual([
      'A',
      'B',
      'C'
    ]);
    expect(() => assertOnlyOmitExclusive(['A'], ['B'])).toThrow(/only.*omit/i);
  });

  it('assertOnlyKeysPresent throws when missing and not already in process.env', () => {
    delete process.env.SESSION_SECRET;
    expect(() =>
      assertOnlyKeysPresent(['SESSION_SECRET'], {})
    ).toThrow(/missing required keys: SESSION_SECRET/);

    assertOnlyKeysPresent(['SESSION_SECRET'], {
      SESSION_SECRET: 'from-snap'
    });

    process.env.SESSION_SECRET = 'from-platform';
    assertOnlyKeysPresent(['SESSION_SECRET'], {});
    delete process.env.SESSION_SECRET;
  });
});

describe('ensurePamenvRuntimeEnv', () => {
  afterEach(() => {
    resetPamenvInjectCache();
    delete process.env.VERCEL;
    delete process.env.PAMENV_INJECT_SENTINEL;
    delete process.env[PamCliConfig.ENV_ENABLED];
  });

  it('PAMENV_ENABLED=0 时即使在 Vercel 也返回空 bag', async () => {
    process.env.VERCEL = '1';
    process.env[PamCliConfig.ENV_ENABLED] = '0';
    process.env.PAMENV_INJECT_SENTINEL = 'keep';
    const bag = await ensurePamenvRuntimeEnv({
      slug: 'pam',
      env: 'dev',
      oidc: 'vercel',
      snapshotPath: '.pam/deploy-snapshot.json'
    });
    expect(bag.values).toEqual({});
    expect(process.env.PAMENV_INJECT_SENTINEL).toBe('keep');
  });

  it('no-ops when not on matching CI，返回空 bag', async () => {
    delete process.env.VERCEL;
    process.env.PAMENV_INJECT_SENTINEL = 'keep';
    const bag = await ensurePamenvRuntimeEnv({
      slug: 'pam',
      env: 'dev',
      oidc: 'vercel'
    });
    expect(process.env.PAMENV_INJECT_SENTINEL).toBe('keep');
    expect(bag.values).toEqual({});
  });

  it('no-ops when enabled is false even on Vercel，返回空 bag', async () => {
    process.env.VERCEL = '1';
    process.env.PAMENV_INJECT_SENTINEL = 'keep';
    const bag = await ensurePamenvRuntimeEnv({
      slug: 'pam',
      env: 'dev',
      oidc: 'vercel',
      enabled: false
    });
    expect(process.env.PAMENV_INJECT_SENTINEL).toBe('keep');
    expect(bag.values).toEqual({});
  });

  it('snapshot 路径不强制 slug/env（缺文件则抛读错误而非 inject requires env）', async () => {
    process.env.VERCEL = '1';
    await expect(
      ensurePamenvRuntimeEnv({
        snapshotPath: '/tmp/pamenv-missing-deploy-snapshot.json',
        oidc: 'vercel'
      })
    ).rejects.toThrow(/ENOENT|no such file|not found|deploy snapshot/i);
  });
});
