import { mkdtemp, readFile, rm, writeFile, mkdir } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { PamCliAuthStore } from '../src/impls/PamCliAuthStore';
import { PamCliTokenVault } from '../src/impls/PamCliTokenVault';

describe('PamCliTokenVault', () => {
  let dir: string;

  beforeEach(async () => {
    dir = await mkdtemp(join(tmpdir(), 'pamenv-vault-'));
    PamCliTokenVault.resetMemoryCache();
  });

  afterEach(async () => {
    PamCliTokenVault.resetMemoryCache();
    await rm(dir, { recursive: true, force: true });
  });

  it('round-trips token through the OS-bound vault', async () => {
    const pamRoot = join(dir, '.pam');
    await mkdir(pamRoot, { recursive: true });

    await PamCliTokenVault.write(pamRoot, {
      token: 'secret-tok',
      email: 'a@b.c'
    });
    PamCliTokenVault.resetMemoryCache();

    const entry = await PamCliTokenVault.read(pamRoot);
    expect(entry).toEqual({ token: 'secret-tok', email: 'a@b.c' });

    if (process.platform === 'win32') {
      const encPath = PamCliTokenVault.credentialsPath(pamRoot);
      const raw = await readFile(encPath, 'utf8');
      expect(raw).not.toContain('secret-tok');
    }
  });

  it('migrates legacy config.json token into the vault', async () => {
    const pamRoot = join(dir, '.pam');
    await mkdir(pamRoot, { recursive: true });
    await writeFile(
      join(pamRoot, 'config.json'),
      `${JSON.stringify(
        {
          baseUrl: 'http://pam.localhost:3400',
          token: 'legacy-tok',
          email: 'old@ex.com',
          updatedAt: new Date().toISOString(),
          locale: 'en',
          localeLocked: false,
          localeSource: 'default'
        },
        null,
        2
      )}\n`,
      'utf8'
    );

    const store = new PamCliAuthStore({
      preferLocal: true,
      workingDir: dir
    });
    expect(await store.getToken()).toBe('legacy-tok');

    const configRaw = await readFile(join(pamRoot, 'config.json'), 'utf8');
    const parsed = JSON.parse(configRaw) as { token: string | null };
    expect(parsed.token).toBeNull();

    PamCliTokenVault.resetMemoryCache();
    const again = new PamCliAuthStore({
      preferLocal: true,
      workingDir: dir
    });
    expect(await again.getToken()).toBe('legacy-tok');
  });

  it('clearToken removes vault entry', async () => {
    const store = new PamCliAuthStore({
      preferLocal: true,
      workingDir: dir
    });
    await store.setToken('tok', 'a@b.c');
    expect(await store.getToken()).toBe('tok');

    await store.clearToken();
    PamCliTokenVault.resetMemoryCache();
    expect(await store.getToken()).toBeNull();
  });
});
