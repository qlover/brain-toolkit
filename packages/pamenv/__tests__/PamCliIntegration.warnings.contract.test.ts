import { afterEach, describe, expect, it, vi } from 'vitest';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { RenderCommand } from '../src/commands/RenderCommand';
import { RunCommand } from '../src/commands/RunCommand';
import {
  exportFromMap,
  okExport,
  ownerProject,
  PLACEHOLDER
} from './helpers/PamCliIntegrationFixtures';
import {
  createPamCliIntegrationContext,
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

/**
 * Run preflight warnings + render format / filter contract coverage.
 */
describe('pamenv warnings & render contract (mock PAM)', () => {
  let ctx: PamCliIntegrationContextType | undefined;
  let errorSpy: ReturnType<typeof vi.spyOn>;
  let stdoutChunks: string[];

  afterEach(async () => {
    await ctx?.cleanup();
    ctx = undefined;
    vi.clearAllMocks();
    vi.restoreAllMocks();
  });

  function mockConsole(): void {
    errorSpy = vi
      .spyOn(console, 'error')
      .mockImplementation(() => undefined);
    vi.spyOn(console, 'log').mockImplementation(() => undefined);
    stdoutChunks = [];
    vi.spyOn(process.stdout, 'write').mockImplementation(((chunk: unknown) => {
      stdoutChunks.push(String(chunk));
      return true;
    }) as typeof process.stdout.write);
  }

  async function withCwd<T>(dir: string, fn: () => Promise<T>): Promise<T> {
    const prev = process.cwd();
    process.chdir(dir);
    try {
      return await fn();
    } finally {
      process.chdir(prev);
    }
  }

  describe('run warnings', () => {
    it('warns when .env overlaps injected keys', async () => {
      mockConsole();
      ctx = await createPamCliIntegrationContext();
      const project = ownerProject();
      ctx.mock.setHandlers({
        projects: [project],
        resolveByName: {
          'fe-base:dev': {
            projectId: project.id,
            projectSlug: project.slug,
            environmentId: 'e-dev',
            environmentName: 'dev',
            variables: [
              { key: 'API_URL', value: 'https://injected.dev', sensitive: false },
              { key: 'TOKEN', value: 'secret', sensitive: true }
            ]
          }
        }
      });
      await writeFile(
        join(ctx.cwd, '.env'),
        `API_URL=https://file.dev\nTOKEN=${PLACEHOLDER}\n`,
        'utf8'
      );

      const runner = new CapturingRunCommand(ctx.apiClient, ctx.authStore);
      await withCwd(ctx.cwd, () =>
        runner.run('fe-base', ['true'], { envName: 'dev', warn: true })
      );

      const errors = errorSpy.mock.calls.map((call) => String(call[0]));
      expect(errors.some((line) => /API_URL|\.env|overlap|重叠|覆盖/i.test(line))).toBe(
        true
      );
      expect(
        errors.some((line) => /placeholder|占位|TOKEN/i.test(line))
      ).toBe(true);
      expect(runner.lastEnv?.TOKEN).toBe('secret');
    });

    it('warn:false suppresses dotenv overlap warnings', async () => {
      mockConsole();
      ctx = await createPamCliIntegrationContext();
      const project = ownerProject();
      ctx.mock.setHandlers({
        projects: [project],
        resolveByName: {
          'fe-base:dev': {
            projectId: project.id,
            projectSlug: project.slug,
            environmentId: 'e-dev',
            environmentName: 'dev',
            variables: [
              { key: 'API_URL', value: 'https://injected.dev', sensitive: false }
            ]
          }
        }
      });
      await writeFile(join(ctx.cwd, '.env'), 'API_URL=from-file\n', 'utf8');

      const runner = new CapturingRunCommand(ctx.apiClient, ctx.authStore);
      await withCwd(ctx.cwd, () =>
        runner.run('fe-base', ['true'], { envName: 'dev', warn: false })
      );

      const errors = errorSpy.mock.calls.map((call) => String(call[0]));
      expect(errors.some((line) => /\.env/i.test(line) && /API_URL/i.test(line))).toBe(
        false
      );
    });

    it('warns on NEXT_PUBLIC_ sensitive inject keys', async () => {
      mockConsole();
      ctx = await createPamCliIntegrationContext();
      const project = ownerProject();
      ctx.mock.setHandlers({
        projects: [project],
        resolveByName: {
          'fe-base:dev': {
            projectId: project.id,
            projectSlug: project.slug,
            environmentId: 'e-dev',
            environmentName: 'dev',
            variables: [
              {
                key: 'NEXT_PUBLIC_SECRET',
                value: 'leak-risk',
                sensitive: true
              }
            ]
          }
        }
      });

      const runner = new CapturingRunCommand(ctx.apiClient, ctx.authStore);
      await withCwd(ctx.cwd, () =>
        runner.run('fe-base', ['true'], { envName: 'dev', warn: true })
      );

      const errors = errorSpy.mock.calls.map((call) => String(call[0]));
      expect(
        errors.some((line) => /NEXT_PUBLIC_SECRET|public|公开/i.test(line))
      ).toBe(true);
    });

    it('warns when turbo.json strict mode omits injected keys', async () => {
      mockConsole();
      ctx = await createPamCliIntegrationContext();
      const project = ownerProject();
      ctx.mock.setHandlers({
        projects: [project],
        resolveByName: {
          'fe-base:dev': {
            projectId: project.id,
            projectSlug: project.slug,
            environmentId: 'e-dev',
            environmentName: 'dev',
            variables: [
              { key: 'API_URL', value: 'https://x', sensitive: false },
              { key: 'TOKEN', value: 's', sensitive: true }
            ]
          }
        }
      });
      await writeFile(
        join(ctx.cwd, 'turbo.json'),
        JSON.stringify({
          envMode: 'strict',
          globalEnv: ['API_URL'],
          tasks: { build: {} }
        }),
        'utf8'
      );

      const runner = new CapturingRunCommand(ctx.apiClient, ctx.authStore);
      await withCwd(ctx.cwd, () =>
        runner.run('fe-base', ['true'], { envName: 'dev', warn: true })
      );

      const errors = errorSpy.mock.calls.map((call) => String(call[0]));
      expect(
        errors.some((line) => /turbo|TOKEN|strict/i.test(line))
      ).toBe(true);
    });

    it('run --only filters inject keys and reports missing', async () => {
      mockConsole();
      ctx = await createPamCliIntegrationContext();
      const project = ownerProject();
      ctx.mock.setHandlers({
        projects: [project],
        resolveByName: {
          'fe-base:dev': {
            projectId: project.id,
            projectSlug: project.slug,
            environmentId: 'e-dev',
            environmentName: 'dev',
            variables: [
              { key: 'API_URL', value: 'https://x', sensitive: false },
              { key: 'TOKEN', value: 's', sensitive: true }
            ]
          }
        }
      });

      const runner = new CapturingRunCommand(ctx.apiClient, ctx.authStore);
      await runner.run('fe-base', ['true'], {
        envName: 'dev',
        warn: false,
        only: ['API_URL', 'MISSING_KEY']
      });

      expect(runner.lastEnv?.API_URL).toBe('https://x');
      expect(
        errorSpy.mock.calls.some((call) =>
          String(call[0]).includes('MISSING_KEY')
        )
      ).toBe(true);
    });
  });

  describe('render formats', () => {
    it('yaml format writes quoted values with placeholders', async () => {
      mockConsole();
      ctx = await createPamCliIntegrationContext();
      const project = ownerProject();
      const out = join(ctx.cwd, 'out.yaml');
      ctx.mock.setHandlers({
        projects: [project],
        exportByEnvId: {
          'e-dev': okExport(project, 'e-dev', 'dev')
        }
      });

      await new RenderCommand(ctx.apiClient, ctx.authStore).run('fe-base', {
        envName: 'dev',
        format: 'yaml',
        out
      });

      const text = await readFile(out, 'utf8');
      expect(text).toContain('API_URL:');
      expect(text).toContain(`TOKEN: ${JSON.stringify(PLACEHOLDER)}`);
      expect(text).not.toContain('leaked');
    });

    it('toml format writes sensitive as placeholder', async () => {
      mockConsole();
      ctx = await createPamCliIntegrationContext();
      const project = ownerProject();
      const out = join(ctx.cwd, 'out.toml');
      ctx.mock.setHandlers({
        projects: [project],
        exportByEnvId: {
          'e-dev': okExport(project, 'e-dev', 'dev')
        }
      });

      await new RenderCommand(ctx.apiClient, ctx.authStore).run('fe-base', {
        envName: 'dev',
        format: 'toml',
        out
      });

      const text = await readFile(out, 'utf8');
      expect(text).toContain('API_URL');
      expect(text).toContain(PLACEHOLDER);
    });

    it('stdout (-) prints without creating a file', async () => {
      mockConsole();
      ctx = await createPamCliIntegrationContext();
      const project = ownerProject();
      ctx.mock.setHandlers({
        projects: [project],
        exportByEnvId: {
          'e-dev': exportFromMap(project, 'e-dev', 'dev', {
            HELLO: 'world',
            TOKEN: PLACEHOLDER
          })
        }
      });

      await new RenderCommand(ctx.apiClient, ctx.authStore).run('fe-base', {
        envName: 'dev',
        format: 'dotenv',
        out: '-'
      });

      const printed = stdoutChunks.join('');
      expect(printed).toContain('HELLO=world');
      expect(printed).toContain(PLACEHOLDER);
    });

    it('--only keeps requested keys and reports missing', async () => {
      mockConsole();
      ctx = await createPamCliIntegrationContext();
      const project = ownerProject();
      const out = join(ctx.cwd, 'only.env');
      ctx.mock.setHandlers({
        projects: [project],
        exportByEnvId: {
          'e-dev': okExport(project, 'e-dev', 'dev')
        }
      });

      await new RenderCommand(ctx.apiClient, ctx.authStore).run('fe-base', {
        envName: 'dev',
        out,
        only: ['API_URL', 'NOPE']
      });

      const text = await readFile(out, 'utf8');
      expect(text).toContain('API_URL=');
      expect(text).not.toContain('TOKEN=');
      expect(
        errorSpy.mock.calls.some((call) => String(call[0]).includes('NOPE'))
      ).toBe(true);
    });

    it('omits sensitive keys when server sends no placeholder', async () => {
      mockConsole();
      ctx = await createPamCliIntegrationContext();
      const project = ownerProject();
      const out = join(ctx.cwd, 'omit.env');
      ctx.mock.setHandlers({
        projects: [project],
        exportByEnvId: {
          'e-dev': {
            ...okExport(project, 'e-dev', 'dev'),
            sensitivePlaceholder: '',
            variables: [
              { key: 'API_URL', value: 'https://x.dev', sensitive: false },
              { key: 'TOKEN', value: '', sensitive: true }
            ],
            content: 'API_URL=https://x.dev\nTOKEN=\n',
            sensitiveKeys: ['TOKEN']
          }
        }
      });

      await new RenderCommand(ctx.apiClient, ctx.authStore).run('fe-base', {
        envName: 'dev',
        out
      });

      const text = await readFile(out, 'utf8');
      expect(text).toContain('API_URL=https://x.dev');
      expect(text).not.toContain('TOKEN=');
    });
  });

  describe('nested cwd dotenv discovery', () => {
    it('finds .env in run cwd even under a subdirectory layout', async () => {
      mockConsole();
      ctx = await createPamCliIntegrationContext();
      const project = ownerProject();
      const appDir = join(ctx.cwd, 'apps', 'web');
      await mkdir(appDir, { recursive: true });
      ctx.mock.setHandlers({
        projects: [project],
        resolveByName: {
          'fe-base:dev': {
            projectId: project.id,
            projectSlug: project.slug,
            environmentId: 'e-dev',
            environmentName: 'dev',
            variables: [
              { key: 'API_URL', value: 'injected', sensitive: false }
            ]
          }
        }
      });
      await writeFile(join(appDir, '.env.local'), 'API_URL=local-file\n', 'utf8');

      const runner = new CapturingRunCommand(ctx.apiClient, ctx.authStore);
      await withCwd(appDir, () =>
        runner.run('fe-base', ['true'], { envName: 'dev', warn: true })
      );

      expect(
        errorSpy.mock.calls.some((call) =>
          /\.env\.local|API_URL/i.test(String(call[0]))
        )
      ).toBe(true);
    });
  });
});
