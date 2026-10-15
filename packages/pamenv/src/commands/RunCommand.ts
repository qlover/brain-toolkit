import { constants } from 'node:os';
import crossSpawn from 'cross-spawn';
import { PamCliI18n } from '../i18n/PamCliI18n';
import {
  PAMENV_CLI_NO_INJECT_PERMISSION,
  PAMENV_CLI_ONLY_MISSING,
  PAMENV_CLI_RUN_COMMAND_REQUIRED,
  PAMENV_CLI_RUN_INJECTED,
  PAMENV_CLI_RUN_SPAWN_FAILED
} from '../i18n/identifier/pamenv_cli';
import type { PamCliApiClientInterface } from '../interfaces/PamCliApiClientInterface';
import type { PamCliResolvedVarType } from '../interfaces/PamCliTypes';
import { PamCliApiError } from '../impls/PamCliApiError';
import { PamCliEnvironmentSelectUtil } from '../impls/PamCliEnvironmentSelectUtil';
import { PamCliProjectAccessUtil } from '../impls/PamCliProjectAccessUtil';
import { PamCliProjectResolveUtil } from '../impls/PamCliProjectResolveUtil';
import { PamCliRunWarningUtil } from '../impls/PamCliRunWarningUtil';

export type PamCliRunOptionsType = {
  readonly envName?: string;
  /** Only inject these keys. */
  readonly only?: readonly string[];
  /** Keep these keys from the current shell when already set. */
  readonly keepEnv?: readonly string[];
  /** Pre-run bypass warnings (default true). */
  readonly warn?: boolean;
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
  constructor(protected readonly apiClient: PamCliApiClientInterface) {}

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

    if (options.warn !== false) {
      for (const line of await PamCliRunWarningUtil.collect(
        process.cwd(),
        variables
      )) {
        console.error(line);
      }
    }

    const childEnv = RunCommand.mergeEnv(
      process.env,
      variables,
      options.keepEnv
    );
    console.error(
      PamCliI18n.t(PAMENV_CLI_RUN_INJECTED, {
        count: String(variables.length),
        slug: projectSlug,
        env: envName
      })
    );

    return this.spawnChild(command, childEnv);
  }

  /**
   * With `-e`: one request by project ref + env name. Any API error (older
   * server, slug substring, missing permission) falls back to search + resolve
   * for the usual CLI messages; a protected env fails the same either way.
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
        return {
          variables: result.variables,
          projectSlug: result.projectSlug,
          envName: result.environmentName
        };
      } catch (error) {
        if (
          !(error instanceof PamCliApiError) ||
          error.id === PAM_API_ENV_PROTECTED
        ) {
          throw error;
        }
      }
    }

    const project = await PamCliProjectResolveUtil.resolve(
      this.apiClient,
      projectRef
    );
    if (!PamCliProjectAccessUtil.canInject(project)) {
      throw new Error(
        PamCliI18n.t(PAMENV_CLI_NO_INJECT_PERMISSION, { slug: project.slug })
      );
    }

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
    const keep = new Set(keepEnv);
    const merged: NodeJS.ProcessEnv = { ...base };
    for (const variable of variables) {
      if (keep.has(variable.key) && base[variable.key] !== undefined) {
        continue;
      }
      merged[variable.key] = variable.value;
    }
    return merged;
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
