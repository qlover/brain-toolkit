import { afterEach, describe, expect, it, vi } from 'vitest';
import { mkdir, readFile, writeFile, chmod } from 'node:fs/promises';
import { join } from 'node:path';
import { PullCommand } from '../src/commands/PullCommand';
import { PushCommand } from '../src/commands/PushCommand';
import { RemoveCommand } from '../src/commands/RemoveCommand';
import { RenderCommand } from '../src/commands/RenderCommand';
import { RunCommand } from '../src/commands/RunCommand';
import { PamCliApiError } from '../src/impls/PamCliApiError';
import { PamCliConfirmUtil } from '../src/impls/PamCliConfirmUtil';
import { PamCliEnvDiffUtil } from '../src/impls/PamCliEnvDiffUtil';
import { PamCliEnvFileBindingUtil } from '../src/impls/PamCliEnvFileBindingUtil';
import { PamCliSecurityGate } from '../src/impls/PamCliSecurityGate';
import { PamCliConfig } from '../src/config/PamCliConfig';
import {
  ambiguousProjects,
  INJECT_ONLY_PERMS,
  leakedExport,
  MEMBER_PERMS,
  memberProject,
  okExport,
  OWNER_PERMS,
  ownerProject,
  PLACEHOLDER,
  projectWithoutPermissions
} from './helpers/PamCliIntegrationFixtures';
import {
  createPamCliIntegrationContext,
  fileExists,
  writeWorldReadable,
  type PamCliIntegrationContextType
} from './helpers/PamCliIntegrationHarness';

class CapturingRunCommand extends RunCommand {
  public lastEnv: NodeJS.ProcessEnv | null = null;
  protected override spawnChild(
    _command: readonly string[],
    env: NodeJS.ProcessEnv
  ): Promise<number> {
    this.lastEnv = env;
    return Promise.resolve(0);
  }
}

describe('pamenv contract integration (mock PAM)', () => {
  let ctx: PamCliIntegrationContextType | undefined;
  vi.spyOn(console, 'error').mockImplementation(() => undefined);
  vi.spyOn(console, 'log').mockImplementation(() => undefined);

  afterEach(async () => {
    await ctx?.cleanup();
    ctx = undefined;
    vi.clearAllMocks();
    vi.restoreAllMocks();
    vi.spyOn(console, 'error').mockImplementation(() => undefined);
    vi.spyOn(console, 'log').mockImplementation(() => undefined);
  });

  describe('identity & resolve', () => {
    it('fails closed when local .pam has no token', async () => {
      ctx = await createPamCliIntegrationContext({ token: null });
      ctx.mock.setHandlers({ projects: [ownerProject()] });

      await expect(
        new PullCommand(ctx.apiClient, ctx.syncStore, ctx.authStore).run(
          'fe-base',
          { envName: 'dev', outDir: ctx.cwd }
        )
      ).rejects.toThrow(/not_logged_in|login|登录/i);
      expect(ctx.mock.searchCount()).toBe(0);
    });

    it('rejects substring project match (pam must not hit pamenv-…)', async () => {
      ctx = await createPamCliIntegrationContext();
      ctx.mock.setHandlers({
        projects: ambiguousProjects().filter((item) => item.slug !== 'pam')
      });

      await expect(
        new PullCommand(ctx.apiClient, ctx.syncStore, ctx.authStore).run(
          'pam',
          { envName: 'dev', outDir: ctx.cwd }
        )
      ).rejects.toThrow(/not found|找不到|project/i);
    });

    it('resolves by exact project uuid', async () => {
      ctx = await createPamCliIntegrationContext();
      const project = ownerProject();
      ctx.mock.setHandlers({
        projects: [project, ...ambiguousProjects()],
        exportByEnvId: { 'e-dev': okExport(project, 'e-dev', 'dev') }
      });

      await new PullCommand(ctx.apiClient, ctx.syncStore, ctx.authStore).run(
        project.id,
        { envName: 'dev', outDir: ctx.cwd }
      );
      expect(await fileExists(join(ctx.cwd, '.env.dev'))).toBe(true);
    });

    it('rejects empty project ref', async () => {
      ctx = await createPamCliIntegrationContext();
      ctx.mock.setHandlers({ projects: [ownerProject()] });
      await expect(
        PamCliSecurityGate.resolveProjectExact(ctx.apiClient, '   ')
      ).rejects.toThrow();
    });

    it('fails when search returns project without permissions[]', async () => {
      ctx = await createPamCliIntegrationContext();
      const project = projectWithoutPermissions();
      ctx.mock.setHandlers({
        projects: [project],
        exportByEnvId: {
          'e-legacy': okExport(project, 'e-legacy', 'dev')
        }
      });

      await expect(
        new PullCommand(ctx.apiClient, ctx.syncStore, ctx.authStore).run(
          'legacy-app',
          { envName: 'dev', outDir: ctx.cwd }
        )
      ).rejects.toThrow(/permissions_missing|权限|missing a permissions/i);
      expect(await fileExists(join(ctx.cwd, '.env.dev'))).toBe(false);
    });

    it('-o preferLocal aligns to outDir/.pam when present', async () => {
      ctx = await createPamCliIntegrationContext();
      const outDir = join(ctx.cwd, 'nested');
      await mkdir(join(outDir, '.pam'), { recursive: true });
      const preferLocal = PamCliConfig.resolvePreferLocal({
        workingDir: outDir
      });
      expect(preferLocal).toBe(true);
      ctx.authStore.setWorkingDir(outDir);
      ctx.authStore.setPreferLocal(true);
      ctx.syncStore.setWorkingDir(outDir);
      ctx.syncStore.setPreferLocal(true);
      await ctx.authStore.setToken('test-token', 'ci@example.com');
      await ctx.authStore.setBaseUrl(ctx.baseUrl);

      const project = ownerProject();
      ctx.mock.setHandlers({
        projects: [project],
        exportByEnvId: { 'e-dev': okExport(project, 'e-dev', 'dev') }
      });

      await new PullCommand(ctx.apiClient, ctx.syncStore, ctx.authStore).run(
        'fe-base',
        { envName: 'dev', outDir }
      );
      expect(await fileExists(join(outDir, '.env.dev'))).toBe(true);
      expect(ctx.syncStore.getSyncRoot().replace(/\\/g, '/')).toMatch(
        /\/.pam\/sync$/
      );
    });
  });

  describe('pull / export', () => {
    it('owner pull writes redacted dotenv and binding', async () => {
      ctx = await createPamCliIntegrationContext();
      const project = ownerProject();
      ctx.mock.setHandlers({
        projects: [project],
        exportByEnvId: { 'e-dev': okExport(project, 'e-dev', 'dev') }
      });

      await new PullCommand(ctx.apiClient, ctx.syncStore, ctx.authStore).run(
        'fe-base',
        { envName: 'dev', outDir: ctx.cwd }
      );

      const target = join(ctx.cwd, '.env.dev');
      const text = await readFile(target, 'utf8');
      expect(text).toContain('API_URL=https://x.dev');
      expect(text).toContain(PLACEHOLDER);
      expect(text).not.toContain('leaked-secret');

      const binding = await PamCliEnvFileBindingUtil.readBinding(
        ctx.syncStore.getSyncRoot(),
        ctx.cwd,
        target
      );
      expect(binding?.projectSlug).toBe('fe-base');
      expect(binding?.envName).toBe('dev');
    });

    it('pull --file writes custom path and binds it', async () => {
      ctx = await createPamCliIntegrationContext();
      const project = ownerProject();
      ctx.mock.setHandlers({
        projects: [project],
        exportByEnvId: { 'e-dev': okExport(project, 'e-dev', 'dev') }
      });

      await new PullCommand(ctx.apiClient, ctx.syncStore, ctx.authStore).run(
        'fe-base',
        { envName: 'dev', outDir: ctx.cwd, file: '.env.custom' }
      );
      expect(await fileExists(join(ctx.cwd, '.env.custom'))).toBe(true);
      expect(await fileExists(join(ctx.cwd, '.env.dev'))).toBe(false);
    });

    it('pull selects staging when -e staging', async () => {
      ctx = await createPamCliIntegrationContext();
      const project = ownerProject();
      ctx.mock.setHandlers({
        projects: [project],
        exportByEnvId: {
          'e-staging': okExport(project, 'e-staging', 'staging')
        }
      });

      await new PullCommand(ctx.apiClient, ctx.syncStore, ctx.authStore).run(
        'fe-base',
        { envName: 'staging', outDir: ctx.cwd }
      );
      expect(await fileExists(join(ctx.cwd, '.env.staging'))).toBe(true);
    });

    it('member without export cannot pull (client gate) and leaves no file', async () => {
      ctx = await createPamCliIntegrationContext();
      ctx.mock.setHandlers({
        projects: [memberProject()],
        exportByEnvId: {
          'e-pam-dev': { status: 403, id: 'api:not_authorized' }
        }
      });

      await expect(
        new PullCommand(ctx.apiClient, ctx.syncStore, ctx.authStore).run(
          'pam',
          { envName: 'dev', outDir: ctx.cwd }
        )
      ).rejects.toThrow(/export|导出|owner|管理员/i);
      expect(await fileExists(join(ctx.cwd, '.env.dev'))).toBe(false);
      expect(
        ctx.mock.requests.some((item) => item.url.includes('/export'))
      ).toBe(false);
    });

    it('owner still fails closed on API 403 with zero write', async () => {
      ctx = await createPamCliIntegrationContext();
      const project = ownerProject();
      ctx.mock.setHandlers({
        projects: [project],
        exportByEnvId: {
          'e-dev': { status: 403, id: 'api:not_authorized' }
        }
      });

      await expect(
        new PullCommand(ctx.apiClient, ctx.syncStore, ctx.authStore).run(
          'fe-base',
          { envName: 'dev', outDir: ctx.cwd }
        )
      ).rejects.toBeInstanceOf(PamCliApiError);
      expect(await fileExists(join(ctx.cwd, '.env.dev'))).toBe(false);
    });

    it('owner fails closed on API 401 with zero write', async () => {
      ctx = await createPamCliIntegrationContext();
      const project = ownerProject();
      ctx.mock.setHandlers({
        projects: [project],
        exportByEnvId: {
          'e-dev': { status: 401, id: 'api:not_authorized' }
        }
      });

      await expect(
        new PullCommand(ctx.apiClient, ctx.syncStore, ctx.authStore).run(
          'fe-base',
          { envName: 'dev', outDir: ctx.cwd }
        )
      ).rejects.toBeInstanceOf(PamCliApiError);
      expect(await fileExists(join(ctx.cwd, '.env.dev'))).toBe(false);
    });

    it('refuses write when export returns plaintext for sensitive keys', async () => {
      ctx = await createPamCliIntegrationContext();
      const project = ownerProject();
      ctx.mock.setHandlers({
        projects: [project],
        exportByEnvId: {
          'e-dev': leakedExport(project, 'e-dev', 'dev')
        }
      });

      await expect(
        new PullCommand(ctx.apiClient, ctx.syncStore, ctx.authStore).run(
          'fe-base',
          { envName: 'dev', outDir: ctx.cwd }
        )
      ).rejects.toThrow(/export_sensitive_leak|TOKEN|plaintext|明文|拒绝/i);
      expect(await fileExists(join(ctx.cwd, '.env.dev'))).toBe(false);
    });

    it('second pull that matches remote is up-to-date (file stays)', async () => {
      ctx = await createPamCliIntegrationContext();
      const project = ownerProject();
      ctx.mock.setHandlers({
        projects: [project],
        exportByEnvId: { 'e-dev': okExport(project, 'e-dev', 'dev') }
      });

      const pull = new PullCommand(ctx.apiClient, ctx.syncStore, ctx.authStore);
      await pull.run('fe-base', { envName: 'dev', outDir: ctx.cwd });
      const first = await readFile(join(ctx.cwd, '.env.dev'), 'utf8');
      await pull.run('fe-base', { envName: 'dev', outDir: ctx.cwd });
      const second = await readFile(join(ctx.cwd, '.env.dev'), 'utf8');
      expect(second).toBe(first);
    });

    it('unknown env name fails before write', async () => {
      ctx = await createPamCliIntegrationContext();
      ctx.mock.setHandlers({ projects: [ownerProject()] });
      await expect(
        new PullCommand(ctx.apiClient, ctx.syncStore, ctx.authStore).run(
          'fe-base',
          { envName: 'nope', outDir: ctx.cwd }
        )
      ).rejects.toThrow();
      expect(await fileExists(join(ctx.cwd, '.env.nope'))).toBe(false);
    });
  });

  describe('env file binding', () => {
    it('blocks second project from reusing .env.dev; --file works', async () => {
      ctx = await createPamCliIntegrationContext();
      const fe = ownerProject();
      const pam = {
        ...memberProject(),
        permissions: [...OWNER_PERMS],
        my_role: 'owner' as const
      };
      ctx.mock.setHandlers({
        projects: [fe, pam],
        exportByEnvId: {
          'e-dev': okExport(fe, 'e-dev', 'dev'),
          'e-pam-dev': okExport(pam, 'e-pam-dev', 'dev')
        }
      });

      await new PullCommand(ctx.apiClient, ctx.syncStore, ctx.authStore).run(
        'fe-base',
        { envName: 'dev', outDir: ctx.cwd }
      );
      await expect(
        new PullCommand(ctx.apiClient, ctx.syncStore, ctx.authStore).run(
          'pam',
          { envName: 'dev', outDir: ctx.cwd }
        )
      ).rejects.toThrow(/fe-base|bound|\.env\.pam\.dev/i);

      await new PullCommand(ctx.apiClient, ctx.syncStore, ctx.authStore).run(
        'pam',
        { envName: 'dev', outDir: ctx.cwd, file: '.env.pam.dev' }
      );
      expect(await fileExists(join(ctx.cwd, '.env.pam.dev'))).toBe(true);
    });

    it('--force rebind without TTY is rejected', async () => {
      ctx = await createPamCliIntegrationContext();
      const fe = ownerProject();
      const pam = {
        ...memberProject(),
        permissions: [...OWNER_PERMS],
        my_role: 'owner' as const
      };
      ctx.mock.setHandlers({
        projects: [fe, pam],
        exportByEnvId: {
          'e-dev': okExport(fe, 'e-dev', 'dev'),
          'e-pam-dev': okExport(pam, 'e-pam-dev', 'dev')
        }
      });
      await new PullCommand(ctx.apiClient, ctx.syncStore, ctx.authStore).run(
        'fe-base',
        { envName: 'dev', outDir: ctx.cwd }
      );

      Object.defineProperty(process.stdin, 'isTTY', {
        value: false,
        configurable: true
      });
      await expect(
        new PullCommand(ctx.apiClient, ctx.syncStore, ctx.authStore).run(
          'pam',
          { envName: 'dev', outDir: ctx.cwd, force: true }
        )
      ).rejects.toThrow(/TTY|交互|terminal/i);
    });

    it('--force rebind with TTY + confirm overwrites binding', async () => {
      ctx = await createPamCliIntegrationContext();
      const fe = ownerProject();
      const pam = {
        ...memberProject(),
        permissions: [...OWNER_PERMS],
        my_role: 'owner' as const
      };
      ctx.mock.setHandlers({
        projects: [fe, pam],
        exportByEnvId: {
          'e-dev': okExport(fe, 'e-dev', 'dev'),
          'e-pam-dev': okExport(pam, 'e-pam-dev', 'dev')
        }
      });
      await new PullCommand(ctx.apiClient, ctx.syncStore, ctx.authStore).run(
        'fe-base',
        { envName: 'dev', outDir: ctx.cwd }
      );

      Object.defineProperty(process.stdin, 'isTTY', {
        value: true,
        configurable: true
      });
      vi.spyOn(PamCliConfirmUtil, 'ask').mockResolvedValue(true);

      await new PullCommand(ctx.apiClient, ctx.syncStore, ctx.authStore).run(
        'pam',
        { envName: 'dev', outDir: ctx.cwd, force: true }
      );
      const binding = await PamCliEnvFileBindingUtil.readBinding(
        ctx.syncStore.getSyncRoot(),
        ctx.cwd,
        join(ctx.cwd, '.env.dev')
      );
      expect(binding?.projectSlug).toBe('pam');
    });

    it('--force rebind cancelled leaves original binding', async () => {
      ctx = await createPamCliIntegrationContext();
      const fe = ownerProject();
      const pam = {
        ...memberProject(),
        permissions: [...OWNER_PERMS],
        my_role: 'owner' as const
      };
      ctx.mock.setHandlers({
        projects: [fe, pam],
        exportByEnvId: {
          'e-dev': okExport(fe, 'e-dev', 'dev'),
          'e-pam-dev': okExport(pam, 'e-pam-dev', 'dev')
        }
      });
      await new PullCommand(ctx.apiClient, ctx.syncStore, ctx.authStore).run(
        'fe-base',
        { envName: 'dev', outDir: ctx.cwd }
      );

      Object.defineProperty(process.stdin, 'isTTY', {
        value: true,
        configurable: true
      });
      vi.spyOn(PamCliConfirmUtil, 'ask').mockResolvedValue(false);

      await expect(
        new PullCommand(ctx.apiClient, ctx.syncStore, ctx.authStore).run(
          'pam',
          { envName: 'dev', outDir: ctx.cwd, force: true }
        )
      ).rejects.toThrow(/cancel|取消/i);

      const binding = await PamCliEnvFileBindingUtil.readBinding(
        ctx.syncStore.getSyncRoot(),
        ctx.cwd,
        join(ctx.cwd, '.env.dev')
      );
      expect(binding?.projectSlug).toBe('fe-base');
    });
  });

  describe('run / inject', () => {
    it('by-name injects secrets and does not write dotenv', async () => {
      ctx = await createPamCliIntegrationContext();
      const project = memberProject();
      ctx.mock.setHandlers({
        projects: [project],
        resolveByName: {
          'pam:dev': {
            projectId: project.id,
            projectSlug: 'pam',
            environmentId: 'e-pam-dev',
            environmentName: 'dev',
            variables: [
              { key: 'TOKEN', value: 'injected-secret', sensitive: true }
            ]
          }
        }
      });

      const runner = new CapturingRunCommand(ctx.apiClient, ctx.authStore);
      const code = await runner.run('pam', ['node', '-e', '0'], {
        envName: 'dev',
        warn: false
      });
      expect(code).toBe(0);
      expect(runner.lastEnv?.TOKEN).toBe('injected-secret');
      expect(await fileExists(join(ctx.cwd, '.env.dev'))).toBe(false);
    });

    it('does not fall back to search on 403', async () => {
      ctx = await createPamCliIntegrationContext();
      ctx.mock.setHandlers({
        projects: [memberProject()],
        resolveByName: {
          'pam:dev': { status: 403, id: 'forbidden' }
        }
      });

      await expect(
        new RunCommand(ctx.apiClient, ctx.authStore).run('pam', ['true'], {
          envName: 'dev',
          warn: false
        })
      ).rejects.toBeInstanceOf(PamCliApiError);
      expect(ctx.mock.searchCount()).toBe(0);
    });

    it('does not fall back on protected env 403', async () => {
      ctx = await createPamCliIntegrationContext();
      ctx.mock.setHandlers({
        projects: [memberProject()],
        resolveByName: {
          'pam:secret': {
            status: 403,
            id: 'api:pam_env_protected'
          }
        },
        resolveByEnvId: {
          'e-pam-secret': {
            variables: [{ key: 'X', value: 'should-not', sensitive: true }]
          }
        }
      });

      await expect(
        new RunCommand(ctx.apiClient, ctx.authStore).run('pam', ['true'], {
          envName: 'secret',
          warn: false
        })
      ).rejects.toBeInstanceOf(PamCliApiError);
      expect(ctx.mock.searchCount()).toBe(0);
      expect(
        ctx.mock.requests.some((item) =>
          item.url.includes('/environments/e-pam-secret/resolve')
        )
      ).toBe(false);
    });

    it('falls back to search + resolve on 404 by-name', async () => {
      ctx = await createPamCliIntegrationContext();
      const project = memberProject();
      ctx.mock.setHandlers({
        projects: [project],
        resolveByName: {
          'pam:dev': { status: 404, id: 'api:pam_env_not_found' }
        },
        resolveByEnvId: {
          'e-pam-dev': {
            variables: [
              { key: 'FALLBACK', value: 'from-search', sensitive: false }
            ]
          }
        }
      });

      const runner = new CapturingRunCommand(ctx.apiClient, ctx.authStore);
      await runner.run('pam', ['true'], { envName: 'dev', warn: false });
      expect(runner.lastEnv?.FALLBACK).toBe('from-search');
      expect(ctx.mock.searchCount()).toBeGreaterThan(0);
    });

    it('rejects by-name slug mismatch', async () => {
      ctx = await createPamCliIntegrationContext();
      ctx.mock.setHandlers({
        resolveByName: {
          'pam:dev': {
            projectId: 'x',
            projectSlug: 'other-project',
            environmentId: 'e1',
            environmentName: 'dev',
            variables: [{ key: 'A', value: '1', sensitive: false }]
          }
        }
      });

      await expect(
        new RunCommand(ctx.apiClient, ctx.authStore).run('pam', ['true'], {
          envName: 'dev',
          warn: false
        })
      ).rejects.toThrow(/mismatch|拒绝|other-project/i);
    });

    it('rejects by-name uuid mismatch', async () => {
      ctx = await createPamCliIntegrationContext();
      const id = '22222222-2222-4222-8222-222222222222';
      ctx.mock.setHandlers({
        resolveByName: {
          [`${id}:dev`]: {
            projectId: '99999999-9999-4999-8999-999999999999',
            projectSlug: 'pam',
            environmentId: 'e1',
            environmentName: 'dev',
            variables: [{ key: 'A', value: '1', sensitive: false }]
          }
        }
      });

      await expect(
        new RunCommand(ctx.apiClient, ctx.authStore).run(id, ['true'], {
          envName: 'dev',
          warn: false
        })
      ).rejects.toThrow(/mismatch|拒绝|Refusing to inject/i);
    });

    it('without -e uses search path and inject permission', async () => {
      ctx = await createPamCliIntegrationContext();
      const project = memberProject({
        environments: [{ id: 'e-pam-dev', name: 'dev' }]
      });
      ctx.mock.setHandlers({
        projects: [project],
        resolveByEnvId: {
          'e-pam-dev': {
            variables: [{ key: 'NO_E', value: '1', sensitive: false }]
          }
        }
      });

      const runner = new CapturingRunCommand(ctx.apiClient, ctx.authStore);
      await runner.run('pam', ['true'], { warn: false });
      expect(runner.lastEnv?.NO_E).toBe('1');
    });

    it('denies inject when permissions lack inject key', async () => {
      ctx = await createPamCliIntegrationContext();
      const project = memberProject({
        permissions: ['pam_project_edit']
      });
      ctx.mock.setHandlers({
        projects: [project],
        resolveByName: {
          'pam:dev': { status: 404, id: 'not_found' }
        }
      });

      await expect(
        new RunCommand(ctx.apiClient, ctx.authStore).run('pam', ['true'], {
          envName: 'dev',
          warn: false
        })
      ).rejects.toThrow(/inject|注入/i);
    });

    it('keepEnv preserves shell values already set', async () => {
      ctx = await createPamCliIntegrationContext();
      const project = memberProject();
      ctx.mock.setHandlers({
        resolveByName: {
          'pam:dev': {
            projectId: project.id,
            projectSlug: 'pam',
            environmentId: 'e-pam-dev',
            environmentName: 'dev',
            variables: [
              { key: 'TOKEN', value: 'from-pam', sensitive: true },
              { key: 'OTHER', value: 'pam-other', sensitive: false }
            ]
          }
        }
      });

      const prev = process.env.TOKEN;
      process.env.TOKEN = 'from-shell';
      try {
        const runner = new CapturingRunCommand(ctx.apiClient, ctx.authStore);
        await runner.run('pam', ['true'], {
          envName: 'dev',
          warn: false,
          keepEnv: ['TOKEN']
        });
        expect(runner.lastEnv?.TOKEN).toBe('from-shell');
        expect(runner.lastEnv?.OTHER).toBe('pam-other');
      } finally {
        if (prev === undefined) {
          delete process.env.TOKEN;
        } else {
          process.env.TOKEN = prev;
        }
      }
    });

    it('requires a command after --', async () => {
      ctx = await createPamCliIntegrationContext();
      await expect(
        new RunCommand(ctx.apiClient, ctx.authStore).run('pam', [], {
          envName: 'dev'
        })
      ).rejects.toThrow(/command|命令/i);
    });
  });

  describe('push', () => {
    it('member without export-gated edit still needs edit permission', async () => {
      ctx = await createPamCliIntegrationContext();
      const project = memberProject({
        permissions: [...INJECT_ONLY_PERMS]
      });
      ctx.mock.setHandlers({ projects: [project] });
      await writeFile(join(ctx.cwd, '.env.dev'), 'A=1\n', 'utf8');

      await expect(
        new PushCommand(ctx.apiClient, ctx.syncStore, ctx.authStore).run(
          'pam',
          { envName: 'dev', outDir: ctx.cwd, yes: true }
        )
      ).rejects.toThrow(/push|编辑|edit|权限|write access/i);
    });

    it('fails when local dotenv is missing', async () => {
      ctx = await createPamCliIntegrationContext();
      const project = ownerProject();
      ctx.mock.setHandlers({
        projects: [project],
        exportByEnvId: { 'e-dev': okExport(project, 'e-dev', 'dev') }
      });

      await expect(
        new PushCommand(ctx.apiClient, ctx.syncStore, ctx.authStore).run(
          'fe-base',
          { envName: 'dev', outDir: ctx.cwd, yes: true }
        )
      ).rejects.toThrow(/local_file_not_found|not found|找不到|不存在/i);
    });

    it('push after pull with local edit replaces remote variables', async () => {
      ctx = await createPamCliIntegrationContext();
      const project = ownerProject();
      ctx.mock.setHandlers({
        projects: [project],
        exportByEnvId: { 'e-dev': okExport(project, 'e-dev', 'dev') }
      });

      await new PullCommand(ctx.apiClient, ctx.syncStore, ctx.authStore).run(
        'fe-base',
        { envName: 'dev', outDir: ctx.cwd }
      );
      await writeFile(
        join(ctx.cwd, '.env.dev'),
        `API_URL=https://local.dev\nTOKEN=${PLACEHOLDER}\nNEW_KEY=hello\n`,
        'utf8'
      );

      await new PushCommand(ctx.apiClient, ctx.syncStore, ctx.authStore).run(
        'fe-base',
        { envName: 'dev', outDir: ctx.cwd, yes: true, force: true }
      );

      expect(ctx.mock.replacedBodies.length).toBe(1);
      expect(ctx.mock.replacedBodies[0]?.envId).toBe('e-dev');
      const body = ctx.mock.replacedBodies[0]?.body as {
        variables: Array<{ key: string; value: string }>;
      };
      const keys = body.variables.map((item) => item.key).sort();
      expect(keys).toContain('API_URL');
      expect(keys).toContain('NEW_KEY');
    });

    it('push respects env-file binding conflict', async () => {
      ctx = await createPamCliIntegrationContext();
      const fe = ownerProject();
      const pam = {
        ...memberProject(),
        permissions: [...OWNER_PERMS],
        my_role: 'owner' as const
      };
      ctx.mock.setHandlers({
        projects: [fe, pam],
        exportByEnvId: {
          'e-dev': okExport(fe, 'e-dev', 'dev'),
          'e-pam-dev': okExport(pam, 'e-pam-dev', 'dev')
        }
      });

      await new PullCommand(ctx.apiClient, ctx.syncStore, ctx.authStore).run(
        'fe-base',
        { envName: 'dev', outDir: ctx.cwd }
      );

      await expect(
        new PushCommand(ctx.apiClient, ctx.syncStore, ctx.authStore).run(
          'pam',
          { envName: 'dev', outDir: ctx.cwd, yes: true }
        )
      ).rejects.toThrow(/bound|fe-base/i);
    });
  });

  describe('render', () => {
    it('writes dotenv with placeholder for sensitive keys', async () => {
      ctx = await createPamCliIntegrationContext();
      const project = ownerProject();
      ctx.mock.setHandlers({
        projects: [project],
        exportByEnvId: { 'e-dev': okExport(project, 'e-dev', 'dev') }
      });

      const out = join(ctx.cwd, 'out.env');
      await new RenderCommand(ctx.apiClient, ctx.authStore).run('fe-base', {
        envName: 'dev',
        format: 'dotenv',
        out
      });
      const text = await readFile(out, 'utf8');
      expect(text).toContain(PLACEHOLDER);
      expect(text).not.toContain('leaked-secret');
    });

    it('rejects bad format', async () => {
      ctx = await createPamCliIntegrationContext();
      await expect(
        new RenderCommand(ctx.apiClient, ctx.authStore).run('fe-base', {
          format: 'xml'
        })
      ).rejects.toThrow(/format|格式/i);
    });

    it('member cannot render', async () => {
      ctx = await createPamCliIntegrationContext();
      ctx.mock.setHandlers({ projects: [memberProject()] });
      await expect(
        new RenderCommand(ctx.apiClient, ctx.authStore).run('pam', {
          envName: 'dev',
          out: join(ctx.cwd, 'x.env')
        })
      ).rejects.toThrow(/export|导出/i);
    });

    it('refuses render --out when export leaks sensitive plaintext', async () => {
      ctx = await createPamCliIntegrationContext();
      const project = ownerProject();
      ctx.mock.setHandlers({
        projects: [project],
        exportByEnvId: {
          'e-dev': leakedExport(project, 'e-dev', 'dev')
        }
      });

      await expect(
        new RenderCommand(ctx.apiClient, ctx.authStore).run('fe-base', {
          envName: 'dev',
          out: join(ctx.cwd, 'leak.env')
        })
      ).rejects.toThrow(/export_sensitive_leak|TOKEN|明文|拒绝/i);
      expect(await fileExists(join(ctx.cwd, 'leak.env'))).toBe(false);
    });

    it('json format omits comments but keeps values', async () => {
      ctx = await createPamCliIntegrationContext();
      const project = ownerProject();
      ctx.mock.setHandlers({
        projects: [project],
        exportByEnvId: { 'e-dev': okExport(project, 'e-dev', 'dev') }
      });
      const out = join(ctx.cwd, 'out.json');
      await new RenderCommand(ctx.apiClient, ctx.authStore).run('fe-base', {
        envName: 'dev',
        format: 'json',
        out
      });
      const parsed = JSON.parse(await readFile(out, 'utf8')) as Record<
        string,
        string
      >;
      expect(parsed.API_URL).toBe('https://x.dev');
      expect(parsed.TOKEN).toBe(PLACEHOLDER);
    });
  });

  describe('remove', () => {
    it('requires -e', async () => {
      ctx = await createPamCliIntegrationContext();
      await expect(
        new RemoveCommand(ctx.apiClient, ctx.syncStore).run('fe-base', {})
      ).rejects.toThrow(/-e|env|环境/i);
    });

    it('member without delete cannot remove', async () => {
      ctx = await createPamCliIntegrationContext();
      ctx.mock.setHandlers({
        projects: [memberProject({ permissions: [...MEMBER_PERMS] })]
      });
      await expect(
        new RemoveCommand(ctx.apiClient, ctx.syncStore).run('pam', {
          envName: 'dev',
          yes: true
        })
      ).rejects.toThrow(/admin|管理员|delete|删除/i);
    });

    it('owner remove with --yes deletes remote env', async () => {
      ctx = await createPamCliIntegrationContext();
      const project = ownerProject();
      ctx.mock.setHandlers({
        projects: [project],
        deleteByEnvId: { 'e-dev': true }
      });

      await new RemoveCommand(ctx.apiClient, ctx.syncStore).run('fe-base', {
        envName: 'dev',
        yes: true
      });
      expect(ctx.mock.deletedEnvIds).toEqual(['e-dev']);
    });
  });

  describe('security helpers', () => {
    it('assertCanExport / inject / edit fail-closed without permissions', () => {
      const bare = { id: '1', slug: 's', name: 'n', my_role: 'admin' as const };
      expect(() => PamCliSecurityGate.assertCanExport(bare)).toThrow(
        /permissions_missing|权限|missing a permissions/
      );
      expect(() => PamCliSecurityGate.assertCanInject(bare)).toThrow(
        /permissions_missing|权限|missing a permissions/
      );
      expect(() => PamCliSecurityGate.assertCanEdit(bare)).toThrow(
        /permissions_missing|权限|missing a permissions/
      );
    });

    it('--show-values never prints sensitive or secret-looking keys', () => {
      const diff = PamCliEnvDiffUtil.diff(
        new Map([['API_URL', 'old']]),
        [
          { key: 'API_URL', value: 'https://new', sensitive: false },
          { key: 'TOKEN', value: 'super-secret', sensitive: true },
          { key: 'DB_PASSWORD', value: 'pwd', sensitive: false }
        ],
        new Set(['TOKEN'])
      );
      const text = PamCliEnvDiffUtil.formatReview(diff, { showValues: true });
      expect(text).toContain('API_URL=https://new');
      expect(text).not.toContain('super-secret');
      expect(text).not.toContain('pwd');
      expect(text).toContain('TOKEN=*****');
      expect(text).toContain('DB_PASSWORD=*****');
    });

    it.runIf(process.platform !== 'win32')(
      'refuses overwrite when existing dotenv is world-readable',
      async () => {
        ctx = await createPamCliIntegrationContext();
        const project = ownerProject();
        ctx.mock.setHandlers({
          projects: [project],
          exportByEnvId: { 'e-dev': okExport(project, 'e-dev', 'dev') }
        });

        const target = join(ctx.cwd, '.env.dev');
        await writeWorldReadable(target, 'OLD=1\n');
        await chmod(target, 0o644);

        await expect(
          new PullCommand(ctx.apiClient, ctx.syncStore, ctx.authStore).run(
            'fe-base',
            // force skips conflict prompt so we reach writePrivateFile permission check
            { envName: 'dev', outDir: ctx.cwd, force: true }
          )
        ).rejects.toThrow(/too_permissive|可读|chmod/i);
        expect(await readFile(target, 'utf8')).toBe('OLD=1\n');
      }
    );

    it.runIf(process.platform !== 'win32')(
      'allows overwrite after chmod 600',
      async () => {
        ctx = await createPamCliIntegrationContext();
        const project = ownerProject();
        ctx.mock.setHandlers({
          projects: [project],
          exportByEnvId: { 'e-dev': okExport(project, 'e-dev', 'dev') }
        });

        const target = join(ctx.cwd, '.env.dev');
        await writeFile(target, 'OLD=1\n', 'utf8');
        await chmod(target, 0o600);

        await new PullCommand(ctx.apiClient, ctx.syncStore, ctx.authStore).run(
          'fe-base',
          { envName: 'dev', outDir: ctx.cwd, force: true }
        );
        const text = await readFile(target, 'utf8');
        expect(text).toContain('API_URL=');
        expect(text).not.toContain('OLD=1');
      }
    );
  });
});
