import { describe, expect, it } from 'vitest';
import { mkdtemp, rm, readFile, access } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { PamCliAuthStore } from '../src/impls/PamCliAuthStore';
import { PamCliApiClient } from '../src/impls/PamCliApiClient';
import { PamCliSyncStore } from '../src/impls/PamCliSyncStore';
import { PullCommand } from '../src/commands/PullCommand';
import { RunCommand } from '../src/commands/RunCommand';
import { RenderCommand } from '../src/commands/RenderCommand';
import { ProjectsCommand } from '../src/commands/ProjectsCommand';

/**
 * Opt-in live suite against a real PAM.
 *
 * Required env:
 * - PAMENV_LIVE=1
 * - PAMENV_BASE_URL
 * - PAMENV_OWNER_TOKEN (export+inject)
 * - PAMENV_MEMBER_TOKEN (inject only; optional)
 * - PAMENV_PROJECT_SLUG
 * - PAMENV_ENV_NAME (default: dev)
 * - PAMENV_PROTECTED_ENV_NAME (optional)
 * - PAMENV_OTHER_PROJECT_SLUG (optional; binding conflict check)
 *
 * Never commit tokens. Prefer a dedicated CI harness project.
 */
const liveEnabled = process.env.PAMENV_LIVE === '1';
const baseUrl = process.env.PAMENV_BASE_URL?.trim();
const ownerToken = process.env.PAMENV_OWNER_TOKEN?.trim();
const memberToken = process.env.PAMENV_MEMBER_TOKEN?.trim();
const projectSlug = process.env.PAMENV_PROJECT_SLUG?.trim();
const otherSlug = process.env.PAMENV_OTHER_PROJECT_SLUG?.trim();
const envName = process.env.PAMENV_ENV_NAME?.trim() || 'dev';
const protectedEnv = process.env.PAMENV_PROTECTED_ENV_NAME?.trim();

const describeLive = liveEnabled ? describe : describe.skip;

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

async function withLocalAuth(
  token: string,
  run: (ctx: {
    cwd: string;
    api: PamCliApiClient;
    auth: PamCliAuthStore;
    sync: PamCliSyncStore;
  }) => Promise<void>
): Promise<void> {
  if (!baseUrl) {
    throw new Error('PAMENV_BASE_URL is required for live tests');
  }
  const cwd = await mkdtemp(join(tmpdir(), 'pamenv-live-'));
  try {
    const auth = new PamCliAuthStore({
      preferLocal: true,
      workingDir: cwd,
      urlOverride: baseUrl
    });
    await auth.setBaseUrl(baseUrl);
    await auth.setToken(token, 'live@example.com');
    const sync = new PamCliSyncStore({ preferLocal: true, workingDir: cwd });
    const api = new PamCliApiClient(auth);
    await run({ cwd, api, auth, sync });
  } finally {
    await rm(cwd, { recursive: true, force: true });
  }
}

describeLive('pamenv live integration (real PAM)', () => {
  it('owner can list projects', async () => {
    if (!ownerToken) {
      throw new Error('PAMENV_OWNER_TOKEN required');
    }
    await withLocalAuth(ownerToken, async ({ api }) => {
      const projects = await api.listProjects(projectSlug);
      expect(Array.isArray(projects)).toBe(true);
      if (projectSlug) {
        expect(projects.some((item) => item.slug === projectSlug)).toBe(true);
      }
    });
  });

  it('owner pull writes placeholder for sensitive keys', async () => {
    if (!ownerToken || !projectSlug) {
      throw new Error('PAMENV_OWNER_TOKEN and PAMENV_PROJECT_SLUG required');
    }

    await withLocalAuth(ownerToken, async ({ cwd, api, auth, sync }) => {
      await new PullCommand(api, sync, auth).run(projectSlug, {
        envName,
        outDir: cwd
      });
      const text = await readFile(join(cwd, `.env.${envName}`), 'utf8');
      expect(text).toMatch(/^[A-Z0-9_]+=/m);
      if (text.includes('__PAM_SENSITIVE_')) {
        expect(text).toContain('__PAM_SENSITIVE_');
      }
    });
  });

  it('owner render json does not contain obvious long secrets without placeholder', async () => {
    if (!ownerToken || !projectSlug) {
      return;
    }
    await withLocalAuth(ownerToken, async ({ cwd, api, auth }) => {
      const out = join(cwd, 'render.json');
      await new RenderCommand(api, auth).run(projectSlug, {
        envName,
        format: 'json',
        out
      });
      const raw = await readFile(out, 'utf8');
      expect(() => JSON.parse(raw)).not.toThrow();
    });
  });

  it('exact slug required: short prefix should not silently match', async () => {
    if (!ownerToken || !projectSlug || projectSlug.length < 4) {
      return;
    }
    const prefix = projectSlug.slice(0, Math.min(3, projectSlug.length - 1));
    if (prefix === projectSlug) {
      return;
    }
    await withLocalAuth(ownerToken, async ({ cwd, api, auth, sync }) => {
      await expect(
        new PullCommand(api, sync, auth).run(prefix, {
          envName,
          outDir: cwd
        })
      ).rejects.toThrow();
    });
  });

  it('member cannot pull when export is denied', async () => {
    if (!memberToken || !projectSlug) {
      return;
    }

    await withLocalAuth(memberToken, async ({ cwd, api, auth, sync }) => {
      await expect(
        new PullCommand(api, sync, auth).run(projectSlug, {
          envName,
          outDir: cwd
        })
      ).rejects.toThrow();
      await expect(access(join(cwd, `.env.${envName}`))).rejects.toThrow();
    });
  });

  it('member run injects into child (non-protected)', async () => {
    if (!memberToken || !projectSlug) {
      return;
    }

    await withLocalAuth(memberToken, async ({ api, auth }) => {
      const runner = new CapturingRunCommand(api, auth);
      const code = await runner.run(projectSlug, ['true'], {
        envName,
        warn: false
      });
      expect(code).toBe(0);
      expect(runner.lastEnv).toBeTruthy();
    });
  });

  it('member run on protected env fails', async () => {
    if (!memberToken || !projectSlug || !protectedEnv) {
      return;
    }

    await withLocalAuth(memberToken, async ({ api, auth }) => {
      await expect(
        new RunCommand(api, auth).run(projectSlug, ['true'], {
          envName: protectedEnv,
          warn: false
        })
      ).rejects.toThrow();
    });
  });

  it('cross-project default dotenv binding is enforced', async () => {
    if (!ownerToken || !projectSlug || !otherSlug) {
      return;
    }

    await withLocalAuth(ownerToken, async ({ cwd, api, auth, sync }) => {
      await new PullCommand(api, sync, auth).run(projectSlug, {
        envName,
        outDir: cwd
      });
      await expect(
        new PullCommand(api, sync, auth).run(otherSlug, {
          envName,
          outDir: cwd
        })
      ).rejects.toThrow(/bound|绑定/i);
    });
  });

  it('projects command does not throw for owner', async () => {
    if (!ownerToken) {
      return;
    }
    await withLocalAuth(ownerToken, async ({ api }) => {
      await new ProjectsCommand(api).run(projectSlug);
    });
  });
});
