import { afterEach, describe, expect, it, vi } from 'vitest';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { PamCliConfirmUtil } from '../src/impls/PamCliConfirmUtil';
import { PamCliEnvFileBindingUtil } from '../src/impls/PamCliEnvFileBindingUtil';

describe('PamCliEnvFileBindingUtil', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('suggests a project-scoped dotenv name', () => {
    expect(
      PamCliEnvFileBindingUtil.toProjectScopedFileName('fe-base', 'dev')
    ).toBe('.env.fe-base.dev');
  });

  it('blocks a second project from reusing the same file without --force', async () => {
    const dir = await mkdtemp(join(tmpdir(), 'pamenv-bind-'));
    const syncRoot = join(dir, '.pam', 'sync');
    const outDir = dir;
    const file = resolve(outDir, '.env.dev');
    try {
      await PamCliEnvFileBindingUtil.writeBinding({
        syncRoot,
        outDir,
        absoluteFilePath: file,
        projectId: 'proj-a',
        projectSlug: 'fe-base',
        envName: 'dev'
      });

      await expect(
        PamCliEnvFileBindingUtil.assertCompatibleOrThrow({
          syncRoot,
          outDir,
          absoluteFilePath: file,
          projectId: 'proj-b',
          projectSlug: 'pam',
          envName: 'dev'
        })
      ).rejects.toThrow(/fe-base|pam|\.env\.pam\.dev/i);

      Object.defineProperty(process.stdin, 'isTTY', {
        value: false,
        configurable: true
      });
      await expect(
        PamCliEnvFileBindingUtil.assertCompatibleOrThrow({
          syncRoot,
          outDir,
          absoluteFilePath: file,
          projectId: 'proj-b',
          projectSlug: 'pam',
          envName: 'dev',
          force: true
        })
      ).rejects.toThrow(/TTY|交互|terminal/i);

      Object.defineProperty(process.stdin, 'isTTY', {
        value: true,
        configurable: true
      });
      vi.spyOn(PamCliConfirmUtil, 'ask').mockResolvedValue(true);
      await expect(
        PamCliEnvFileBindingUtil.assertCompatibleOrThrow({
          syncRoot,
          outDir,
          absoluteFilePath: file,
          projectId: 'proj-b',
          projectSlug: 'pam',
          envName: 'dev',
          force: true
        })
      ).resolves.toBeUndefined();
    } finally {
      await rm(dir, { recursive: true, force: true });
    }
  });
});
