import { describe, expect, it } from 'vitest';
import { mkdtemp, readFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
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

describe('PamCliConfig.resolvePreferLocal', () => {
  it('auto-isolates when cwd/.pam exists, without falling back to home', async () => {
    const { mkdir } = await import('node:fs/promises');
    const dir = await mkdtemp(join(tmpdir(), 'pamenv-auto-local-'));
    try {
      expect(PamCliConfig.resolvePreferLocal({ workingDir: dir })).toBe(false);

      await mkdir(PamCliConfig.getLocalRoot(dir));
      expect(PamCliConfig.resolvePreferLocal({ workingDir: dir })).toBe(true);
      expect(
        PamCliConfig.resolvePreferLocal({
          workingDir: dir,
          global: true
        })
      ).toBe(false);
      expect(
        PamCliConfig.resolvePreferLocal({
          workingDir: dir,
          local: true
        })
      ).toBe(true);

      const store = new PamCliAuthStore({
        preferLocal: true,
        workingDir: dir
      });
      // Empty local config: no token — must not inherit ~/.pam.
      expect(await store.getToken()).toBeNull();
    } finally {
      await rm(dir, { recursive: true, force: true });
    }
  });

  it('walks up to monorepo root .pam for nested cwd', async () => {
    const { mkdir } = await import('node:fs/promises');
    const root = await mkdtemp(join(tmpdir(), 'pamenv-mono-'));
    const nested = join(root, 'apps', 'web');
    try {
      await mkdir(PamCliConfig.getLocalRoot(root));
      await mkdir(nested, { recursive: true });

      expect(PamCliConfig.findNearestPamRoot(nested)).toBe(
        PamCliConfig.getLocalRoot(root)
      );
      expect(PamCliConfig.resolveLocalWorkingDir(nested)).toBe(resolve(root));
      expect(PamCliConfig.resolvePreferLocal({ workingDir: nested })).toBe(
        true
      );
      expect(PamCliConfig.resolveAuthWorkingDir({ workingDir: nested })).toBe(
        resolve(root)
      );
      // Explicit --local stays at nested cwd (create apps/web/.pam).
      expect(
        PamCliConfig.resolveAuthWorkingDir({
          workingDir: nested,
          local: true
        })
      ).toBe(resolve(nested));

      // Nested own .pam shadows monorepo root (independent login).
      await mkdir(PamCliConfig.getLocalRoot(nested));
      expect(PamCliConfig.findNearestPamRoot(nested)).toBe(
        PamCliConfig.getLocalRoot(nested)
      );
      expect(PamCliConfig.resolveAuthWorkingDir({ workingDir: nested })).toBe(
        resolve(nested)
      );
    } finally {
      await rm(root, { recursive: true, force: true });
    }
  });

  it('does not treat ~/.pam as a monorepo-local root when walking up', async () => {
    // tmpdir() on Windows often uses 8.3 short paths (ADMINI~1); walk-up must
    // still recognize ~/.pam via realpath, not string equality.
    const underTemp = await mkdtemp(join(tmpdir(), 'pamenv-home-skip-'));
    try {
      expect(PamCliConfig.findNearestPamRoot(underTemp)).toBeNull();
      expect(PamCliConfig.resolvePreferLocal({ workingDir: underTemp })).toBe(
        false
      );
    } finally {
      await rm(underTemp, { recursive: true, force: true });
    }
  });

  it('stops at .git and does not use .pam above the work tree', async () => {
    const { mkdir, writeFile } = await import('node:fs/promises');
    const outer = await mkdtemp(join(tmpdir(), 'pamenv-gitbound-'));
    const repo = join(outer, 'repo');
    const nested = join(repo, 'apps', 'web');
    try {
      await mkdir(PamCliConfig.getLocalRoot(outer));
      await mkdir(nested, { recursive: true });
      await writeFile(join(repo, '.git'), 'gitdir: /tmp/fake\n');

      // Root of git work tree has no .pam; outer/.pam must not leak in.
      expect(PamCliConfig.findNearestPamRoot(nested)).toBeNull();

      await mkdir(PamCliConfig.getLocalRoot(repo));
      expect(PamCliConfig.findNearestPamRoot(nested)).toBe(
        PamCliConfig.getLocalRoot(repo)
      );
    } finally {
      await rm(outer, { recursive: true, force: true });
    }
  });

  it('respects MAX_PAM_WALK_UP_DEPTH', async () => {
    const { mkdir } = await import('node:fs/promises');
    const base = await mkdtemp(join(tmpdir(), 'pamenv-depth-'));
    try {
      // Build: base/.pam + base/d0/d1/.../d{MAX+1}
      await mkdir(PamCliConfig.getLocalRoot(base));
      let deep = base;
      for (let i = 0; i <= PamCliConfig.MAX_PAM_WALK_UP_DEPTH + 1; i++) {
        deep = join(deep, `d${i}`);
      }
      await mkdir(deep, { recursive: true });

      expect(PamCliConfig.findNearestPamRoot(deep)).toBeNull();

      // One hop inside the limit still finds base/.pam.
      let within = base;
      for (let i = 0; i < PamCliConfig.MAX_PAM_WALK_UP_DEPTH; i++) {
        within = join(within, `w${i}`);
      }
      await mkdir(within, { recursive: true });
      expect(PamCliConfig.findNearestPamRoot(within)).toBe(
        PamCliConfig.getLocalRoot(base)
      );
    } finally {
      await rm(base, { recursive: true, force: true });
    }
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
        token?: string;
        email: string;
      };
      expect(parsed.baseUrl).toBe('http://pam.localhost:3400');
      expect(parsed.token).toBeNull();
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
  it('persists locale in local config without storing messages', async () => {
    const dir = await mkdtemp(join(tmpdir(), 'pamenv-locale-'));
    try {
      const store = new PamCliAuthStore({
        preferLocal: true,
        workingDir: dir
      });
      await store.setLocale('zh');
      expect(await store.getLocale()).toBe('zh');
      const cfg = await store.getConfig();
      expect(cfg.locale).toBe('zh');
      expect(
        (cfg as { localeMessages?: unknown }).localeMessages
      ).toBeUndefined();

      await store.setLocale('en');
      const switched = await store.getConfig();
      expect(switched.locale).toBe('en');
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
