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
import type { PamCiOidcProviderType } from '../interfaces/PamCiOidcTokenSourceInterface';
import type { PamCliResolvedVarType } from '../interfaces/PamCliTypes';
import { PamCiOidcBootstrap } from '../impls/PamCiOidcBootstrap';
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

/** 键名单：单个字符串或数组（入口 normalize）。 */
export type PamCliKeyListType = string | readonly string[];

/**
 * 将 `only` / `omit` / `keepEnv` 规范为去重、去空后的键数组。
 */
export function normalizePamCliKeyList(
  input?: PamCliKeyListType
): string[] {
  if (input === undefined) {
    return [];
  }
  const raw = typeof input === 'string' ? [input] : input;
  const out: string[] = [];
  const seen = new Set<string>();
  for (const item of raw) {
    const key = item.trim();
    if (!key || seen.has(key)) {
      continue;
    }
    seen.add(key);
    out.push(key);
  }
  return out;
}

/**
 * `only` 与 `omit` 不可同时非空。
 */
export function assertOnlyOmitExclusive(
  only: readonly string[],
  omit: readonly string[]
): void {
  if (only.length > 0 && omit.length > 0) {
    throw new Error('pamenv: `only` and `omit` cannot both be set');
  }
}

export type PamCliRunOptionsType = {
  readonly envName?: string;
  /** 白名单：只注入这些键；不传 = 全部。 */
  readonly only?: PamCliKeyListType;
  /** 黑名单：排除这些键；与 `only` 互斥。 */
  readonly omit?: PamCliKeyListType;
  /** 进程里已有则不覆盖。 */
  readonly keepEnv?: PamCliKeyListType;
  /**
   * 是否使用进程内注入缓存。默认 true；false 强制本趟重做。
   * 开启时：命中复用明文；过期重拉失败则 stale-on-error（保留旧值）。
   * CLI 子进程场景通常无关；inject / ensure 运行时使用。
   */
  readonly cache?: boolean;
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
  /**
   * Prefixes treated as client-bundled for the sensitive-key warning.
   * Omit to use built-in defaults (VITE_, NEXT_PUBLIC_, …).
   * Pass `[]` to disable that warning.
   */
  readonly clientPublicPrefixes?: readonly string[];
  /**
   * CI OIDC：先换短票写入 `PAMENV_TOKEN`，再 resolve。
   * 例：`vercel`（需 `@vercel/oidc` + `PAMENV_BASE_URL`）。
   */
  readonly oidc?: PamCiOidcProviderType;
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
    /** OIDC 短票过期时间（ISO）；未走 OIDC 时为 undefined。 */
    readonly oidcExpiresAt?: string;
  }> {
    // CLI run keeps historical verbosity; plugins pass `debug: false` by default.
    const debug = options.debug !== false;
    const only = normalizePamCliKeyList(options.only);
    const omit = normalizePamCliKeyList(options.omit);
    assertOnlyOmitExclusive(only, omit);
    const keepEnv = normalizePamCliKeyList(options.keepEnv);

    let oidcExpiresAt: string | undefined;
    if (options.oidc) {
      if (!this.authStore) {
        throw new Error('OIDC bootstrap requires an auth store (base URL)');
      }
      const issued = await new PamCiOidcBootstrap(
        this.apiClient,
        this.authStore
      ).ensurePamenvToken(options.oidc, debug);
      oidcExpiresAt = issued.expiresAt;
    }

    if (this.authStore) {
      await PamCliSecurityGate.assertIdentity(this.authStore, { debug });
    }

    const resolved = await this.resolveVariables(projectRef, {
      ...options,
      only: only.length > 0 ? only : undefined,
      omit: undefined,
      keepEnv
    });
    let variables = resolved.variables;
    const { projectSlug, envName } = resolved;

    if (omit.length > 0) {
      const omitSet = new Set(omit);
      variables = variables.filter((variable) => !omitSet.has(variable.key));
    }

    if (only.length > 0) {
      const returned = new Set(variables.map((variable) => variable.key));
      const missing = only.filter((key) => !returned.has(key));
      if (missing.length > 0) {
        console.error(
          PamCliI18n.t(PAMENV_CLI_ONLY_MISSING, { keys: missing.join(', ') })
        );
      }
    }

    // Security / bypass warnings stay on unless explicitly disabled.
    if (options.warn !== false) {
      for (const line of await PamCliRunWarningUtil.collect(cwd, variables, {
        clientPublicPrefixes: options.clientPublicPrefixes
      })) {
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
      keepEnv,
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

    return {
      variables,
      projectSlug,
      envName,
      env: merged.env,
      ...(oidcExpiresAt ? { oidcExpiresAt } : {})
    };
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
        const onlyKeys = normalizePamCliKeyList(options.only);
        const result = await this.apiClient.resolveEnvironmentByName(
          projectRef.trim(),
          wantedEnv,
          onlyKeys.length > 0 ? onlyKeys : undefined
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
    const onlyKeys = normalizePamCliKeyList(options.only);
    const { variables } = await this.apiClient.resolveEnvironment(
      project.id,
      env.id,
      onlyKeys.length > 0 ? onlyKeys : undefined
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
