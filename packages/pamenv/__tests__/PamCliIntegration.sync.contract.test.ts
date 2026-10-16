import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { readFile, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { PullCommand } from '../src/commands/PullCommand';
import { PushCommand } from '../src/commands/PushCommand';
import { RemoveCommand } from '../src/commands/RemoveCommand';
import { PamCliConfirmUtil } from '../src/impls/PamCliConfirmUtil';
import {
  PamCliSyncConflictUtil,
  PamCliSyncSide
} from '../src/impls/PamCliSyncConflictUtil';
import type { PamCliMockExportPayloadType } from './helpers/PamCliMockPamServer';
import type { PamCliProjectType } from '../src/interfaces/PamCliTypes';
import {
  exportFromMap,
  okExport,
  OWNER_PERMS,
  ownerProject,
  PLACEHOLDER
} from './helpers/PamCliIntegrationFixtures';
import {
  createPamCliIntegrationContext,
  fileExists,
  type PamCliIntegrationContextType
} from './helpers/PamCliIntegrationHarness';

type OwnerDevSetupType = {
  project: PamCliProjectType;
  exportByEnvId: Record<string, PamCliMockExportPayloadType>;
};

/**
 * Three-way sync / conflict / baseline contract coverage.
 * Complements PamCliIntegration.contract.test.ts (gates, binding, inject).
 */
describe('pamenv sync contract (mock PAM)', () => {
  let ctx: PamCliIntegrationContextType | undefined;
  let logSpy: ReturnType<typeof vi.spyOn>;

  function mockConsole(): void {
    vi.spyOn(console, 'error').mockImplementation(() => undefined);
    logSpy = vi.spyOn(console, 'log').mockImplementation(() => undefined);
  }

  beforeEach(() => {
    mockConsole();
  });

  afterEach(async () => {
    await ctx?.cleanup();
    ctx = undefined;
    vi.clearAllMocks();
    vi.restoreAllMocks();
  });

  async function pullOwnerDev(): Promise<OwnerDevSetupType> {
    ctx = await createPamCliIntegrationContext();
    const project = ownerProject();
    const exportByEnvId: Record<string, PamCliMockExportPayloadType> = {
      'e-dev': exportFromMap(project, 'e-dev', 'dev', {
        API_URL: 'https://x.dev',
        TOKEN: PLACEHOLDER
      })
    };
    ctx.mock.setHandlers({
      projects: [project],
      exportByEnvId
    });
    await new PullCommand(ctx.apiClient, ctx.syncStore, ctx.authStore).run(
      'fe-base',
      { envName: 'dev', outDir: ctx.cwd }
    );
    return { project, exportByEnvId };
  }

  describe('pull three-way', () => {
    it('local-only drift: keeps local value and reports kept keys', async () => {
      await pullOwnerDev();
      const target = join(ctx!.cwd, '.env.dev');
      await writeFile(
        target,
        `API_URL=https://local.dev\nTOKEN=${PLACEHOLDER}\n`,
        'utf8'
      );

      await new PullCommand(ctx!.apiClient, ctx!.syncStore, ctx!.authStore).run(
        'fe-base',
        { envName: 'dev', outDir: ctx!.cwd }
      );

      const text = await readFile(target, 'utf8');
      expect(text).toContain('API_URL=https://local.dev');
      expect(
        logSpy.mock.calls.some((call) => String(call[0]).includes('API_URL'))
      ).toBe(true);
    });

    it('remote-only new keys are merged without conflict prompt', async () => {
      const { project, exportByEnvId } = await pullOwnerDev();
      exportByEnvId['e-dev'] = exportFromMap(project, 'e-dev', 'dev', {
        API_URL: 'https://x.dev',
        TOKEN: PLACEHOLDER,
        NEW_REMOTE: 'from-server'
      });

      await new PullCommand(ctx!.apiClient, ctx!.syncStore, ctx!.authStore).run(
        'fe-base',
        { envName: 'dev', outDir: ctx!.cwd }
      );
      const text = await readFile(join(ctx!.cwd, '.env.dev'), 'utf8');
      expect(text).toContain('NEW_REMOTE=from-server');
      expect(text).toContain('API_URL=https://x.dev');
    });

    it('conflict abort leaves local file unchanged', async () => {
      const { project, exportByEnvId } = await pullOwnerDev();
      const target = join(ctx!.cwd, '.env.dev');
      await writeFile(
        target,
        `API_URL=https://local.dev\nTOKEN=${PLACEHOLDER}\n`,
        'utf8'
      );
      exportByEnvId['e-dev'] = exportFromMap(project, 'e-dev', 'dev', {
        API_URL: 'https://remote.dev',
        TOKEN: PLACEHOLDER
      });

      vi.spyOn(PamCliSyncConflictUtil, 'resolveConflicts').mockResolvedValue(
        null
      );

      await new PullCommand(ctx!.apiClient, ctx!.syncStore, ctx!.authStore).run(
        'fe-base',
        { envName: 'dev', outDir: ctx!.cwd }
      );
      expect(await readFile(target, 'utf8')).toContain(
        'API_URL=https://local.dev'
      );
    });

    it('conflict choose local keeps local value', async () => {
      const { project, exportByEnvId } = await pullOwnerDev();
      const target = join(ctx!.cwd, '.env.dev');
      await writeFile(
        target,
        `API_URL=https://local.dev\nTOKEN=${PLACEHOLDER}\n`,
        'utf8'
      );
      exportByEnvId['e-dev'] = exportFromMap(project, 'e-dev', 'dev', {
        API_URL: 'https://remote.dev',
        TOKEN: PLACEHOLDER
      });

      vi.spyOn(PamCliSyncConflictUtil, 'resolveConflicts').mockResolvedValue(
        PamCliSyncSide.Local
      );

      await new PullCommand(ctx!.apiClient, ctx!.syncStore, ctx!.authStore).run(
        'fe-base',
        { envName: 'dev', outDir: ctx!.cwd }
      );
      expect(await readFile(target, 'utf8')).toContain(
        'API_URL=https://local.dev'
      );
    });

    it('conflict --force skips prompt and takes remote default', async () => {
      const { project, exportByEnvId } = await pullOwnerDev();
      const target = join(ctx!.cwd, '.env.dev');
      await writeFile(
        target,
        `API_URL=https://local.dev\nTOKEN=${PLACEHOLDER}\n`,
        'utf8'
      );
      exportByEnvId['e-dev'] = exportFromMap(project, 'e-dev', 'dev', {
        API_URL: 'https://remote.dev',
        TOKEN: PLACEHOLDER
      });

      const resolveSpy = vi.spyOn(PamCliSyncConflictUtil, 'resolveConflicts');

      await new PullCommand(ctx!.apiClient, ctx!.syncStore, ctx!.authStore).run(
        'fe-base',
        { envName: 'dev', outDir: ctx!.cwd, force: true }
      );

      expect(resolveSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          skipPrompt: true,
          defaultSide: PamCliSyncSide.Remote
        })
      );
      expect(await readFile(target, 'utf8')).toContain(
        'API_URL=https://remote.dev'
      );
    });

    it('export without variables[] falls back to content parse', async () => {
      ctx = await createPamCliIntegrationContext();
      const project = ownerProject();
      ctx.mock.setHandlers({
        projects: [project],
        exportByEnvId: {
          'e-dev': {
            ...okExport(project, 'e-dev', 'dev'),
            variables: [],
            content: `ONLY_FROM_CONTENT=1\nTOKEN=${PLACEHOLDER}\n`,
            sensitiveKeys: ['TOKEN']
          }
        }
      });

      await new PullCommand(ctx.apiClient, ctx.syncStore, ctx.authStore).run(
        'fe-base',
        { envName: 'dev', outDir: ctx.cwd }
      );
      const text = await readFile(join(ctx.cwd, '.env.dev'), 'utf8');
      expect(text).toContain('ONLY_FROM_CONTENT=1');
    });

    it('omitted -e uses first environment', async () => {
      ctx = await createPamCliIntegrationContext();
      const project = ownerProject({
        environments: [
          { id: 'e-dev', name: 'dev' },
          { id: 'e-staging', name: 'staging' }
        ]
      });
      ctx.mock.setHandlers({
        projects: [project],
        exportByEnvId: {
          'e-dev': exportFromMap(project, 'e-dev', 'dev', { FIRST: '1' }),
          'e-staging': exportFromMap(project, 'e-staging', 'staging', {
            SECOND: '2'
          })
        }
      });

      await new PullCommand(ctx.apiClient, ctx.syncStore, ctx.authStore).run(
        'fe-base',
        { outDir: ctx.cwd }
      );
      expect(await fileExists(join(ctx.cwd, '.env.dev'))).toBe(true);
      expect(await fileExists(join(ctx.cwd, '.env.staging'))).toBe(false);
    });

    it('zero environments fails before write', async () => {
      ctx = await createPamCliIntegrationContext();
      ctx.mock.setHandlers({
        projects: [ownerProject({ environments: [] })]
      });
      await expect(
        new PullCommand(ctx.apiClient, ctx.syncStore, ctx.authStore).run(
          'fe-base',
          { outDir: ctx.cwd }
        )
      ).rejects.toThrow(/env|环境/i);
    });
  });

  describe('push three-way', () => {
    it('noop already-sync does not call replace', async () => {
      await pullOwnerDev();
      await new PushCommand(
        ctx!.apiClient,
        ctx!.syncStore,
        ctx!.authStore
      ).run('fe-base', { envName: 'dev', outDir: ctx!.cwd, yes: true });
      expect(ctx!.mock.replacedBodies).toHaveLength(0);
      expect(
        logSpy.mock.calls.some((call) =>
          /already|sync|同步|最新/i.test(String(call[0]))
        )
      ).toBe(true);
    });

    it('remote-only refuses push without replace', async () => {
      const { project, exportByEnvId } = await pullOwnerDev();
      exportByEnvId['e-dev'] = exportFromMap(project, 'e-dev', 'dev', {
        API_URL: 'https://remote-only.dev',
        TOKEN: PLACEHOLDER
      });

      await new PushCommand(
        ctx!.apiClient,
        ctx!.syncStore,
        ctx!.authStore
      ).run('fe-base', { envName: 'dev', outDir: ctx!.cwd, yes: true });
      expect(ctx!.mock.replacedBodies).toHaveLength(0);
      expect(
        logSpy.mock.calls.some((call) =>
          /remote.only|远端|REMOTE/i.test(String(call[0]))
        )
      ).toBe(true);
    });

    it('no-baseline without --yes cancelled does not replace', async () => {
      ctx = await createPamCliIntegrationContext();
      const project = ownerProject();
      ctx.mock.setHandlers({
        projects: [project],
        exportByEnvId: {
          'e-dev': exportFromMap(project, 'e-dev', 'dev', {
            API_URL: 'https://x.dev',
            TOKEN: PLACEHOLDER
          })
        }
      });
      await writeFile(
        join(ctx.cwd, '.env.dev'),
        `API_URL=https://local.dev\nTOKEN=${PLACEHOLDER}\n`,
        'utf8'
      );
      vi.spyOn(PamCliConfirmUtil, 'ask').mockResolvedValue(false);

      await new PushCommand(ctx.apiClient, ctx.syncStore, ctx.authStore).run(
        'fe-base',
        { envName: 'dev', outDir: ctx.cwd }
      );
      expect(ctx.mock.replacedBodies).toHaveLength(0);
    });

    it('conflict abort does not replace', async () => {
      const { project, exportByEnvId } = await pullOwnerDev();
      await writeFile(
        join(ctx!.cwd, '.env.dev'),
        `API_URL=https://local.dev\nTOKEN=${PLACEHOLDER}\n`,
        'utf8'
      );
      exportByEnvId['e-dev'] = exportFromMap(project, 'e-dev', 'dev', {
        API_URL: 'https://remote.dev',
        TOKEN: PLACEHOLDER
      });
      vi.spyOn(PamCliSyncConflictUtil, 'resolveConflicts').mockResolvedValue(
        null
      );

      await new PushCommand(
        ctx!.apiClient,
        ctx!.syncStore,
        ctx!.authStore
      ).run('fe-base', {
        envName: 'dev',
        outDir: ctx!.cwd,
        yes: true
      });
      expect(ctx!.mock.replacedBodies).toHaveLength(0);
    });

    it('successful push clears sensitive local values to placeholder', async () => {
      await pullOwnerDev();
      await writeFile(
        join(ctx!.cwd, '.env.dev'),
        `API_URL=https://local.dev\nTOKEN=real-local-secret\n`,
        'utf8'
      );

      await new PushCommand(
        ctx!.apiClient,
        ctx!.syncStore,
        ctx!.authStore
      ).run('fe-base', {
        envName: 'dev',
        outDir: ctx!.cwd,
        yes: true,
        force: true
      });

      expect(ctx!.mock.replacedBodies.length).toBeGreaterThan(0);
      const text = await readFile(join(ctx!.cwd, '.env.dev'), 'utf8');
      expect(text).not.toContain('real-local-secret');
      expect(text).toMatch(/TOKEN=.+/);
    });

    it('replace API 403 fails closed with no silent success', async () => {
      const project = ownerProject();
      ctx = await createPamCliIntegrationContext();
      const exportByEnvId: Record<string, PamCliMockExportPayloadType> = {
        'e-dev': exportFromMap(project, 'e-dev', 'dev', {
          API_URL: 'https://x.dev',
          TOKEN: PLACEHOLDER
        })
      };
      ctx.mock.setHandlers({
        projects: [project],
        exportByEnvId,
        onReplaceVariables: () => ({
          status: 403,
          id: 'api:not_authorized'
        })
      });
      await new PullCommand(ctx.apiClient, ctx.syncStore, ctx.authStore).run(
        'fe-base',
        { envName: 'dev', outDir: ctx.cwd }
      );
      await writeFile(
        join(ctx.cwd, '.env.dev'),
        `API_URL=https://changed.dev\nTOKEN=${PLACEHOLDER}\n`,
        'utf8'
      );

      await expect(
        new PushCommand(ctx.apiClient, ctx.syncStore, ctx.authStore).run(
          'fe-base',
          { envName: 'dev', outDir: ctx.cwd, yes: true, force: true }
        )
      ).rejects.toThrow();
    });

    it('invalid placeholder from another env is rejected before API', async () => {
      await pullOwnerDev();
      await writeFile(
        join(ctx!.cwd, '.env.dev'),
        `API_URL=https://x.dev\nTOKEN=__PAM_SENSITIVE_otherenv__\n`,
        'utf8'
      );

      await expect(
        new PushCommand(ctx!.apiClient, ctx!.syncStore, ctx!.authStore).run(
          'fe-base',
          { envName: 'dev', outDir: ctx!.cwd, yes: true, force: true }
        )
      ).rejects.toThrow(/placeholder|占位/i);
      expect(ctx!.mock.replacedBodies).toHaveLength(0);
    });

    it('push --file uses custom path', async () => {
      ctx = await createPamCliIntegrationContext();
      const project = ownerProject();
      ctx.mock.setHandlers({
        projects: [project],
        exportByEnvId: {
          'e-dev': exportFromMap(project, 'e-dev', 'dev', {
            API_URL: 'https://x.dev',
            TOKEN: PLACEHOLDER
          })
        }
      });
      await new PullCommand(ctx.apiClient, ctx.syncStore, ctx.authStore).run(
        'fe-base',
        { envName: 'dev', outDir: ctx.cwd, file: '.env.custom' }
      );
      await writeFile(
        join(ctx.cwd, '.env.custom'),
        `API_URL=https://custom.dev\nTOKEN=${PLACEHOLDER}\n`,
        'utf8'
      );

      await new PushCommand(ctx.apiClient, ctx.syncStore, ctx.authStore).run(
        'fe-base',
        {
          envName: 'dev',
          outDir: ctx.cwd,
          file: '.env.custom',
          yes: true,
          force: true
        }
      );
      expect(ctx.mock.replacedBodies.length).toBeGreaterThan(0);
    });
  });

  describe('remove + baseline', () => {
    it('remove --yes deletes remote and clears sync snapshot', async () => {
      const { project } = await pullOwnerDev();
      const before = await ctx!.syncStore.readSnapshot(project.id, 'dev');
      expect(before).not.toBeNull();

      ctx!.mock.setHandlers({
        projects: [project],
        deleteByEnvId: { 'e-dev': true }
      });

      await new RemoveCommand(ctx!.apiClient, ctx!.syncStore).run('fe-base', {
        envName: 'dev',
        yes: true
      });
      expect(ctx!.mock.deletedEnvIds).toEqual(['e-dev']);
      expect(await ctx!.syncStore.readSnapshot(project.id, 'dev')).toBeNull();
    });

    it('remove confirm cancelled does not delete', async () => {
      const { project } = await pullOwnerDev();
      ctx!.mock.setHandlers({
        projects: [project],
        deleteByEnvId: { 'e-dev': true }
      });
      vi.spyOn(PamCliConfirmUtil, 'ask').mockResolvedValue(false);

      await new RemoveCommand(ctx!.apiClient, ctx!.syncStore).run('fe-base', {
        envName: 'dev'
      });
      expect(ctx!.mock.deletedEnvIds).toHaveLength(0);
      expect(await ctx!.syncStore.readSnapshot(project.id, 'dev')).not.toBeNull();
    });

    it('owner my_role without delete key can still manage-remove', async () => {
      ctx = await createPamCliIntegrationContext();
      const project = ownerProject({
        my_role: 'owner',
        permissions: [...OWNER_PERMS].filter(
          (key) => key !== 'pam_environments_delete'
        ),
        is_owner: true
      });
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

  describe('gates extras', () => {
    it('accepts org_permissions when permissions is absent', async () => {
      ctx = await createPamCliIntegrationContext();
      const project = ownerProject({
        permissions: undefined,
        org_permissions: [...OWNER_PERMS]
      });
      ctx.mock.setHandlers({
        projects: [project],
        exportByEnvId: {
          'e-dev': exportFromMap(project, 'e-dev', 'dev', {
            OK: '1',
            TOKEN: PLACEHOLDER
          })
        }
      });

      await new PullCommand(ctx.apiClient, ctx.syncStore, ctx.authStore).run(
        'fe-base',
        { envName: 'dev', outDir: ctx.cwd }
      );
      expect(await fileExists(join(ctx.cwd, '.env.dev'))).toBe(true);
    });

    it('exact slug wins among substring search hits', async () => {
      ctx = await createPamCliIntegrationContext();
      const short = ownerProject({
        id: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
        slug: 'app',
        name: 'App'
      });
      const long = ownerProject({
        id: 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb',
        slug: 'app-extra',
        name: 'App Extra',
        environments: [{ id: 'e-extra', name: 'dev' }]
      });
      ctx.mock.setHandlers({
        projects: [long, short],
        exportByEnvId: {
          'e-dev': exportFromMap(short, 'e-dev', 'dev', { WHICH: 'short' }),
          'e-extra': exportFromMap(long, 'e-extra', 'dev', { WHICH: 'long' })
        }
      });

      await new PullCommand(ctx.apiClient, ctx.syncStore, ctx.authStore).run(
        'app',
        { envName: 'dev', outDir: ctx.cwd }
      );
      expect(await readFile(join(ctx.cwd, '.env.dev'), 'utf8')).toContain(
        'WHICH=short'
      );
    });

    it('project not found does not call export', async () => {
      ctx = await createPamCliIntegrationContext();
      ctx.mock.setHandlers({ projects: [] });
      await expect(
        new PullCommand(ctx.apiClient, ctx.syncStore, ctx.authStore).run(
          'missing',
          { envName: 'dev', outDir: ctx.cwd }
        )
      ).rejects.toThrow(/not found|找不到/i);
      expect(
        ctx.mock.requests.some((item) => item.url.includes('/export'))
      ).toBe(false);
    });
  });
});
