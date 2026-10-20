import { constants } from 'node:os';
import crossSpawn from 'cross-spawn';
import { PamCliI18n } from '../i18n/PamCliI18n';
import {
  PAMENV_CLI_ONLY_MISSING,
  PAMENV_CLI_RUN_COMMAND_REQUIRED,
  PAMENV_CLI_RUN_DEBUG_KEYS,
  PAMENV_CLI_RUN_DEBUG_PRIORITY,
  PAMENV_CLI_RUN_DEBUG_SENSITIVE_KEYS,
  PAMENV_CLI_RUN_DEBUG_SUMMARY,
  PAMENV_CLI_RUN_INJECTED,
  PAMENV_CLI_RUN_SPAWN_FAILED,
  PAMENV_CLI_WARN_ORPHAN_PLACEHOLDER,
  PAMENV_CLI_WARN_REMOTE_SENSITIVE_LOCAL_PLAINTEXT
} from '../i18n/identifier/pamenv_cli';
import type { PamCliApiClientInterface } from '../interfaces/PamCliApiClientInterface';
import type { PamCliAuthStoreInterface } from '../interfaces/PamCliAuthStoreInterface';
import type { PamCliResolvedVarType } from '../interfaces/PamCliTypes';
import { PamCliApiError } from '../impls/PamCliApiError';
import {
  PamCliEnvMergeUtil,
  type PamCliEnvMergeWarningType,
  type PamCliEnvPriorityType
} from '../impls/PamCliEnvMergeUtil';
import { PamCliEnvironmentSelectUtil } from '../impls/PamCliEnvironmentSelectUtil';
import { PamCliSecurityGate } from '../impls/PamCliSecurityGate';
import { PamCliRunWarningUtil } from '../impls/PamCliRunWarningUtil';

export type { PamCliEnvPriorityType };

export type PamCliRunOptionsType = {
  readonly envName?: string;
  /** Only inject these keys. */
  readonly only?: readonly string[];
  /** Keep these keys from the current shell when already set. */
  readonly keepEnv?: readonly string[];
  /** Pre-run bypass warnings (default true). */
  readonly warn?: boolean;
  /**
   * Verbose stderr for config path / inject summary / key names (never values).
   * CLI `run` defaults to true; `injectPamenvProcessEnv` / `@pamenv/next` default false.
   */
  readonly debug?: boolean;
  /**
   * Overlap priority. `remote` (default): PAM wins.
   * `local`: process → on-disk `.env*` → PAM (for temporary local overrides).
   */
  readonly envPriority?: PamCliEnvPriorityType;
};

const FORWARDED_SIGNALS = ['SIGINT', 'SIGTERM'] as const;

/** Server error id (`API_PAM_ENV_PROTECTED` in apps/pam). */
const PAM_API_ENV_PROTECTED = 'api:pam_env_protected';

/**
 * `pamenv run` — inject decrypted variables into a child process.
 *
 * Values only live in this process and the child's environment: nothing is
 * written to disk or printed.
 *
 * @example
 * const code = await new RunCommand(api).run('my-app', ['pnpm', 'dev'], { envName: 'local' });
 */
export class RunCommand {
  constructor(
    protected readonly apiClient: PamCliApiClientInterface,
    protected readonly authStore?: PamCliAuthStoreInterface
  ) {}

  /**
   * @param projectRef - Project slug or id
   * @param command - Command and arguments
   * @param options - Environment and filters
   * @returns Child exit code
   */
  public async run(
    projectRef: string,
    command: readonly string[],
    options: PamCliRunOptionsType = {}
  ): Promise<number> {
    if (command.length === 0) {
      throw new Error(
        PamCliI18n.t(PAMENV_CLI_RUN_COMMAND_REQUIRED, { slug: projectRef })
      );
    }

    const prepared = await this.prepare(projectRef, options);
    return this.spawnChild(command, prepared.env);
  }

  /**
   * Resolves PAM variables and merges them onto `baseEnv` without spawning.
   * Used by `run` and by framework plugins (`@pamenv/next`).
   *
   * @param projectRef - Project slug or id
   * @param options - Environment and filters
   * @param cwd - Directory for warnings and the active `.pam` root
   * @param baseEnv - Env to merge onto (defaults to `process.env`)
   */
  public async prepare(
    projectRef: string,
    options: PamCliRunOptionsType = {},
    cwd: string = process.cwd(),
    baseEnv: NodeJS.ProcessEnv = process.env
  ): Promise<{
    readonly variables: readonly PamCliResolvedVarType[];
    readonly projectSlug: string;
    readonly envName: string;
    readonly env: NodeJS.ProcessEnv;
  }> {
    // CLI run keeps historical verbosity; plugins pass `debug: false` by default.
    const debug = options.debug !== false;

    if (this.authStore) {
      await PamCliSecurityGate.assertIdentity(this.authStore, { debug });
    }

    const { variables, projectSlug, envName } = await this.resolveVariables(
      projectRef,
      options
    );

    if (options.only && options.only.length > 0) {
      const returned = new Set(variables.map((variable) => variable.key));
      const missing = options.only.filter((key) => !returned.has(key));
      if (missing.length > 0) {
        console.error(
          PamCliI18n.t(PAMENV_CLI_ONLY_MISSING, { keys: missing.join(', ') })
        );
      }
    }

    // Security / bypass warnings stay on unless explicitly disabled.
    if (options.warn !== false) {
      for (const line of await PamCliRunWarningUtil.collect(cwd, variables)) {
        console.error(line);
      }
    }

    const priority = options.envPriority === 'local' ? 'local' : 'remote';
    const fileLayer =
      priority === 'local'
        ? await PamCliEnvMergeUtil.loadFileLayer(cwd)
        : undefined;
    const merged = PamCliEnvMergeUtil.merge(baseEnv, variables, {
      priority,
      keepEnv: options.keepEnv,
      fileLayer
    });

    if (options.warn !== false) {
      for (const line of RunCommand.formatMergeWarnings(merged.warnings)) {
        console.error(line);
      }
    }

    if (debug) {
      console.error(
        PamCliI18n.t(PAMENV_CLI_RUN_INJECTED, {
          count: String(variables.length),
          slug: projectSlug,
          env: envName
        })
      );
      await this.printDebugDetails(variables, projectSlug, envName);
      console.error(
        PamCliI18n.t(PAMENV_CLI_RUN_DEBUG_PRIORITY, {
          process: merged.picks.process.join(', ') || '-',
          file: merged.picks.file.join(', ') || '-',
          remote: merged.picks.remote.join(', ') || '-',
          placeholder: merged.picks.placeholder.join(', ') || '-'
        })
      );
    }

    return { variables, projectSlug, envName, env: merged.env };
  }

  protected static formatMergeWarnings(
    warnings: readonly PamCliEnvMergeWarningType[]
  ): string[] {
    const lines: string[] = [];
    for (const warning of warnings) {
      const keys = warning.keys.join(', ');
      if (warning.kind === 'remote_sensitive_local_plaintext') {
        lines.push(
          PamCliI18n.t(PAMENV_CLI_WARN_REMOTE_SENSITIVE_LOCAL_PLAINTEXT, {
            count: String(warning.keys.length),
            keys
          })
        );
      } else {
        lines.push(
          PamCliI18n.t(PAMENV_CLI_WARN_ORPHAN_PLACEHOLDER, {
            count: String(warning.keys.length),
            keys
          })
        );
      }
    }
    return lines;
  }

  /**
   * Debug-only lines: counts, baseUrl, pam root, key names — never values.
   */
  protected async printDebugDetails(
    variables: readonly PamCliResolvedVarType[],
    projectSlug: string,
    envName: string
  ): Promise<void> {
    const sensitiveKeys = variables
      .filter((variable) => variable.sensitive)
      .map((variable) => variable.key)
      .sort((left, right) => left.localeCompare(right));
    const keys = variables
      .map((variable) => variable.key)
      .sort((left, right) => left.localeCompare(right));
    const baseUrl = this.authStore
      ? await this.authStore.getBaseUrl()
      : '(unknown)';
    const root = this.authStore?.getActivePamRoot() ?? '(unknown)';

    console.error(
      PamCliI18n.t(PAMENV_CLI_RUN_DEBUG_SUMMARY, {
        baseUrl,
        root,
        sensitive: String(sensitiveKeys.length),
        count: String(variables.length),
        slug: projectSlug,
        env: envName
      })
    );
    if (keys.length > 0) {
      console.error(
        PamCliI18n.t(PAMENV_CLI_RUN_DEBUG_KEYS, { keys: keys.join(', ') })
      );
    }
    if (sensitiveKeys.length > 0) {
      console.error(
        PamCliI18n.t(PAMENV_CLI_RUN_DEBUG_SENSITIVE_KEYS, {
          keys: sensitiveKeys.join(', ')
        })
      );
    }
  }

  /**
   * With `-e`: one request by project ref + env name. Auth denials (401/403)
   * never fall back to search. Only 404 / older servers may fall back.
   */
  protected async resolveVariables(
    projectRef: string,
    options: PamCliRunOptionsType
  ): Promise<{
    variables: readonly PamCliResolvedVarType[];
    projectSlug: string;
    envName: string;
  }> {
    const wantedEnv = options.envName?.trim();
    if (wantedEnv && projectRef.trim()) {
      try {
        const result = await this.apiClient.resolveEnvironmentByName(
          projectRef.trim(),
          wantedEnv,
          options.only
        );
        PamCliSecurityGate.assertResolvedProjectMatches(
          projectRef,
          result.projectSlug,
          result.projectId
        );
        return {
          variables: result.variables,
          projectSlug: result.projectSlug,
          envName: result.environmentName
        };
      } catch (error) {
        if (
          !(error instanceof PamCliApiError) ||
          error.id === PAM_API_ENV_PROTECTED ||
          PamCliSecurityGate.isAuthDenied(error) ||
          error.httpStatus !== 404
        ) {
          throw error;
        }
        // 404 only: older servers without resolve-by-name fall back to search.
      }
    }

    const project = await PamCliSecurityGate.resolveProjectExact(
      this.apiClient,
      projectRef
    );
    PamCliSecurityGate.assertCanInject(project);

    const env = PamCliEnvironmentSelectUtil.select(
      project.environments,
      options.envName,
      project.slug
    );
    const { variables } = await this.apiClient.resolveEnvironment(
      project.id,
      env.id,
      options.only
    );
    return { variables, projectSlug: project.slug, envName: env.name };
  }

  /**
   * Current env < PAM variables; `keepEnv` keys already set in the shell win.
   * Equivalent to `envPriority: 'remote'`.
   *
   * @param base - Current process env
   * @param variables - Resolved variables
   * @param keepEnv - Keys to keep from `base`
   */
  public static mergeEnv(
    base: NodeJS.ProcessEnv,
    variables: readonly PamCliResolvedVarType[],
    keepEnv: readonly string[] = []
  ): NodeJS.ProcessEnv {
    return PamCliEnvMergeUtil.merge(base, variables, {
      priority: 'remote',
      keepEnv
    }).env;
  }

  protected spawnChild(
    command: readonly string[],
    env: NodeJS.ProcessEnv
  ): Promise<number> {
    const [file, ...args] = command as [string, ...string[]];

    return new Promise<number>((resolve, reject) => {
      const child = crossSpawn(file, args, { stdio: 'inherit', env });

      const forwarders = FORWARDED_SIGNALS.map((signal) => {
        const forward = (): void => {
          if (child.exitCode === null && child.signalCode === null) {
            child.kill(signal);
          }
        };
        process.on(signal, forward);
        return { signal, forward };
      });
      const cleanup = (): void => {
        for (const { signal, forward } of forwarders) {
          process.off(signal, forward);
        }
      };

      child.once('error', (error) => {
        cleanup();
        reject(
          new Error(
            PamCliI18n.t(PAMENV_CLI_RUN_SPAWN_FAILED, {
              command: file,
              message: error.message
            })
          )
        );
      });

      child.once('exit', (code, signal) => {
        cleanup();
        if (code !== null) {
          resolve(code);
          return;
        }
        const signalNumber = signal ? constants.signals[signal] : undefined;
        resolve(signalNumber ? 128 + signalNumber : 1);
      });
    });
  }
}
