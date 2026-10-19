import { PamCliI18n } from '../i18n/PamCliI18n';
import type { PamCliRunOptionsType } from '../commands/RunCommand';
import { RunCommand } from '../commands/RunCommand';
import { PamCliApiClient } from './PamCliApiClient';
import { PamCliAuthStore } from './PamCliAuthStore';

/**
 * Options for injecting a PAM environment into the current process.
 * Same meaning as `pamenv run <slug> -e <env>`.
 */
export type PamenvInjectOptions = PamCliRunOptionsType & {
  /** Project slug or id. */
  readonly slug: string;
  /** Environment name, for example `local`. */
  readonly env: string;
  /**
   * When false, skip the network resolve and leave `process.env` unchanged.
   * A function receives the Next.js phase (`phase-development-server`, …).
   * Default for `@pamenv/next` is development-server only.
   */
  readonly enabled?: boolean | ((phase: string) => boolean);
  /** Active `.pam` directory. Defaults to `process.cwd()`. */
  readonly cwd?: string;
  /** When true (default), use `{cwd}/.pam` and do not fall back to `~/.pam`. */
  readonly preferLocal?: boolean;
};

const injected = new Map<string, Promise<void>>();

/**
 * Writes resolved PAM variables onto `process.env`.
 * A successful call is cached for this process so Next can reload the config
 * without fetching again.
 *
 * @param options - Project, environment, and filters
 */
export async function injectPamenvProcessEnv(
  options: PamenvInjectOptions
): Promise<void> {
  if (options.enabled === false) {
    return;
  }

  const cwd = options.cwd ?? process.cwd();
  const key = [
    cwd,
    options.slug,
    options.env,
    options.preferLocal === false ? 'global' : 'local',
    (options.only ?? []).join(','),
    (options.keepEnv ?? []).join(',')
  ].join('\0');

  const pending = injected.get(key);
  if (pending) {
    await pending;
    return;
  }

  const task = applyPamenvProcessEnv(options, cwd).catch((error: unknown) => {
    injected.delete(key);
    throw error;
  });
  injected.set(key, task);
  await task;
}

/** Test helper: drop the in-process injection cache. */
export function resetPamenvInjectCache(): void {
  injected.clear();
}

async function applyPamenvProcessEnv(
  options: PamenvInjectOptions,
  cwd: string
): Promise<void> {
  const authStore = new PamCliAuthStore({
    preferLocal: options.preferLocal !== false,
    workingDir: cwd
  });
  await PamCliI18n.syncFromStore(authStore);
  await PamCliI18n.ensureLoaded(PamCliI18n.getLocale());
  await PamCliI18n.ensureLoaded('en');

  const command = new RunCommand(new PamCliApiClient(authStore), authStore);
  const prepared = await command.prepare(
    options.slug,
    {
      envName: options.env,
      only: options.only,
      keepEnv: options.keepEnv,
      warn: options.warn
    },
    cwd
  );

  for (const [name, value] of Object.entries(prepared.env)) {
    if (value === undefined) {
      delete process.env[name];
    } else {
      process.env[name] = value;
    }
  }
}
