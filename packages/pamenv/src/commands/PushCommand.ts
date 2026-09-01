import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { input } from '@inquirer/prompts';
import { PamCliConfig } from '../config/PamCliConfig';
import { PamCliI18n } from '../i18n/PamCliI18n';
import {
  PAMENV_CLI_CANCELLED,
  PAMENV_CLI_CREATED_ENVIRONMENT,
  PAMENV_CLI_ENV_URL_REQUIRED,
  PAMENV_CLI_LOCAL_FILE,
  PAMENV_CLI_NOT_OWNER_PUSH,
  PAMENV_CLI_OPEN_PROJECT_DETAIL,
  PAMENV_CLI_PROMPT_ENV_URL,
  PAMENV_CLI_PUSHED_DETAIL,
  PAMENV_CLI_PUSH_ALREADY_SYNC,
  PAMENV_CLI_PUSH_CONFIRM,
  PAMENV_CLI_PUSH_CONFIRM_CREATE,
  PAMENV_CLI_PUSH_CONFIRM_CREATE_LARGE,
  PAMENV_CLI_PUSH_CONFIRM_LARGE,
  PAMENV_CLI_PUSH_CONFLICT,
  PAMENV_CLI_PUSH_CONFLICT_KEYS,
  PAMENV_CLI_PUSH_LARGE_WARNING,
  PAMENV_CLI_PUSH_NO_BASELINE,
  PAMENV_CLI_PUSH_NO_BASELINE_CREATE,
  PAMENV_CLI_PUSH_OVERWRITE_REMOTE,
  PAMENV_CLI_PUSH_REMOTE_ONLY,
  PAMENV_CLI_PUSH_REVIEW,
  PAMENV_CLI_WILL_CREATE_ENV
} from '../i18n/identifier/pamenv_cli';
import type { PamCliApiClientInterface } from '../interfaces/PamCliApiClientInterface';
import type { PamCliAuthStoreInterface } from '../interfaces/PamCliAuthStoreInterface';
import type {
  PamCliLocalEnvOptionsType,
  PamCliProjectType,
  PamCliVariableInputType
} from '../interfaces/PamCliTypes';
import { PamCliConfirmUtil } from '../impls/PamCliConfirmUtil';
import {
  PamCliDotenvUtil,
  type PamCliDotenvDocumentType,
  type PamCliParsedVarType
} from '../impls/PamCliDotenvUtil';
import { PamCliEnvDiffUtil } from '../impls/PamCliEnvDiffUtil';
import { PamCliEnvironmentSelectUtil } from '../impls/PamCliEnvironmentSelectUtil';
import { PamCliLocalEnvFileUtil } from '../impls/PamCliLocalEnvFileUtil';
import { PamCliLocalProjectScanUtil } from '../impls/PamCliLocalProjectScanUtil';
import { PamCliPrivateFsUtil } from '../impls/PamCliPrivateFsUtil';
import { PamCliProjectResolveUtil } from '../impls/PamCliProjectResolveUtil';
import { PamCliSensitivePromptUtil } from '../impls/PamCliSensitivePromptUtil';
import {
  PamCliSyncConflictKind,
  PamCliSyncConflictUtil
} from '../impls/PamCliSyncConflictUtil';
import { PamCliSyncStore } from '../impls/PamCliSyncStore';

/**
 * Push target: an existing remote env, or a missing one to create after validation.
 */
type PamCliPushEnvTargetType =
  | {
      readonly mode: 'existing';
      readonly id: string;
      readonly name: string;
    }
  | {
      readonly mode: 'create';
      readonly name: string;
      readonly url: string;
    };

/**
 * `pamenv push` — upload one local dotenv file back to a PAM environment.
 *
 * Significance: Lets local edits sync to PAM without the web UI.
 * Core idea: Three-way compare against ~/.pam/sync baseline, then replace.
 * Main function: Resolve conflicts, review diff, POST variables, save baseline.
 * Main purpose: Safer round-trip with `pamenv pull` from the working directory.
 *
 * Missing `-e` environments are only created after local validation and
 * final confirmation succeed (create + variables in one request).
 *
 * @example
 * await new PushCommand(api).run('my-app', { envName: 'staging' });
 */
export class PushCommand {
  constructor(
    protected readonly apiClient: PamCliApiClientInterface,
    protected readonly syncStore: PamCliSyncStore = new PamCliSyncStore(),
    protected readonly authStore?: PamCliAuthStoreInterface
  ) {}

  /**
   * @param projectRef - Project slug or project id
   * @param options - Env filter and optional local directory
   */
  public async run(
    projectRef: string,
    options: PamCliLocalEnvOptionsType = {}
  ): Promise<void> {
    const project = await PamCliProjectResolveUtil.resolve(
      this.apiClient,
      projectRef
    );

    if (!project.is_owner) {
      throw new Error(
        PamCliI18n.t(PAMENV_CLI_NOT_OWNER_PUSH, { slug: project.slug })
      );
    }

    const outDir = resolve(options.outDir || process.cwd());
    const targetEnv = await this.planEnvironment(project, options, outDir);
    const target = PamCliLocalEnvFileUtil.resolveLocalPath(
      outDir,
      targetEnv.name,
      options.file
    );

    let localDoc: PamCliDotenvDocumentType;
    try {
      localDoc = PamCliDotenvUtil.parseDocument(await readFile(target, 'utf8'));
    } catch {
      const hint = options.file?.trim()
        ? `Create ${target} or choose another --file.`
        : `Run \`pamenv pull ${project.slug} -e ${targetEnv.name}\` first, or create ${PamCliLocalEnvFileUtil.toFileName(targetEnv.name)} (or pass --file .env).`;
      throw new Error(`Local file not found: ${target}. ${hint}`);
    }

    let localVars: PamCliParsedVarType[] = [...localDoc.variables];
    const localMap = PamCliDotenvUtil.toValueMap(localVars);

    let remoteMap: Record<string, string> = {};
    let remoteSensitiveKeys = new Set<string>();

    if (targetEnv.mode === 'existing') {
      const remoteExport = await this.apiClient.exportEnvironment(
        project.id,
        targetEnv.id
      );
      remoteMap = PamCliDotenvUtil.toValueMap(
        PamCliDotenvUtil.parse(remoteExport.content)
      );
      remoteSensitiveKeys = new Set(remoteExport.sensitiveKeys || []);
    }

    const baseline = await this.syncStore.readSnapshot(
      project.id,
      targetEnv.name
    );
    const kind = PamCliSyncConflictUtil.classify(
      baseline?.variables || null,
      localMap,
      remoteMap
    );

    if (kind === PamCliSyncConflictKind.Noop) {
      await this.syncStore.saveBaseline(
        project.id,
        project.slug,
        targetEnv.name,
        localMap
      );
      console.log(
        PamCliI18n.t(PAMENV_CLI_PUSH_ALREADY_SYNC, {
          slug: project.slug,
          env: targetEnv.name
        })
      );
      return;
    }

    if (kind === PamCliSyncConflictKind.RemoteOnly) {
      console.log(
        PamCliI18n.t(PAMENV_CLI_PUSH_REMOTE_ONLY, {
          slug: project.slug,
          env: targetEnv.name
        })
      );
      return;
    }

    if (kind === PamCliSyncConflictKind.Conflict) {
      const keys = PamCliSyncConflictUtil.conflictingKeys(
        baseline!.variables,
        localMap,
        remoteMap
      );
      console.log(PamCliI18n.t(PAMENV_CLI_PUSH_CONFLICT));
      if (keys.length > 0) {
        console.log(
          PamCliI18n.t(PAMENV_CLI_PUSH_CONFLICT_KEYS, {
            keys: keys.join(', ')
          })
        );
      }
      if (!options.force) {
        const overwrite = await PamCliSyncConflictUtil.askOverwriteOrAbort(
          PamCliI18n.t(PAMENV_CLI_PUSH_OVERWRITE_REMOTE)
        );
        if (!overwrite) {
          console.log(PamCliI18n.t(PAMENV_CLI_CANCELLED));
          return;
        }
      }
    }

    if (kind === PamCliSyncConflictKind.NoBase && !options.yes) {
      const ok = await PamCliConfirmUtil.ask(
        targetEnv.mode === 'create'
          ? PamCliI18n.t(PAMENV_CLI_PUSH_NO_BASELINE_CREATE, {
              slug: project.slug,
              env: targetEnv.name
            })
          : PamCliI18n.t(PAMENV_CLI_PUSH_NO_BASELINE)
      );
      if (!ok) {
        console.log(PamCliI18n.t(PAMENV_CLI_CANCELLED));
        return;
      }
    }

    const unmarkedNewKeys = localVars
      .filter((item) => !(item.key in remoteMap) && !item.sensitive)
      .map((item) => item.key);

    // Sensitive marking is interactive safety; `-f` alone must not skip it.
    if (!options.yes && unmarkedNewKeys.length > 0) {
      const selected =
        await PamCliSensitivePromptUtil.pickNewSensitiveKeys(unmarkedNewKeys);
      if (selected.length > 0) {
        const selectedSet = new Set(selected);
        localVars = localVars.map((item) =>
          selectedSet.has(item.key) ? { ...item, sensitive: true } : item
        );
        localDoc = {
          variables: localVars,
          trailingComments: localDoc.trailingComments
        };
        await PamCliPrivateFsUtil.writePrivateFile(
          target,
          PamCliDotenvUtil.serializeDocument(localDoc)
        );
        console.log(
          `Updated ${target} with ${PamCliDotenvUtil.SENSITIVE_MARKER} for: ${selected.join(', ')}`
        );
      }
    }

    this.assertSensitiveValuesPresent(localVars, targetEnv.name);

    const diff = PamCliEnvDiffUtil.diff(
      new Map(Object.entries(remoteMap)),
      localVars,
      remoteSensitiveKeys
    );
    const reviewOptions = { showValues: options.showValues === true };

    console.log(
      PamCliI18n.t(PAMENV_CLI_PUSH_REVIEW, {
        slug: project.slug,
        env: targetEnv.name
      })
    );
    console.log(PamCliI18n.t(PAMENV_CLI_LOCAL_FILE, { path: target }));
    console.log(PamCliEnvDiffUtil.formatReview(diff, reviewOptions));

    if (diff.isLargeKeyChange) {
      console.log(
        PamCliI18n.t(PAMENV_CLI_PUSH_LARGE_WARNING, {
          added: diff.addedKeyCount,
          removed: diff.removedKeyCount,
          remote: diff.remoteKeyCount
        })
      );
    }

    if (!options.yes) {
      const message =
        targetEnv.mode === 'create'
          ? diff.isLargeKeyChange
            ? PamCliI18n.t(PAMENV_CLI_PUSH_CONFIRM_CREATE_LARGE, {
                slug: project.slug,
                env: targetEnv.name
              })
            : PamCliI18n.t(PAMENV_CLI_PUSH_CONFIRM_CREATE, {
                slug: project.slug,
                env: targetEnv.name,
                count: localVars.length
              })
          : diff.isLargeKeyChange
            ? PamCliI18n.t(PAMENV_CLI_PUSH_CONFIRM_LARGE)
            : PamCliI18n.t(PAMENV_CLI_PUSH_CONFIRM, {
                slug: project.slug,
                env: targetEnv.name,
                count: localVars.length
              });
      const ok = await PamCliConfirmUtil.ask(message);
      if (!ok) {
        console.log(PamCliI18n.t(PAMENV_CLI_CANCELLED));
        return;
      }
    }

    const payload: PamCliVariableInputType[] = localVars.map((item) => {
      const comments = PamCliDotenvUtil.toApiComments(item);
      const isNew = !(item.key in remoteMap);
      const base: PamCliVariableInputType = {
        key: item.key,
        value: item.value,
        ...(comments !== undefined ? { comments } : {})
      };
      if (isNew && item.sensitive) {
        return { ...base, sensitive: true };
      }
      return base;
    });

    if (targetEnv.mode === 'create') {
      const created = await this.apiClient.createEnvironment(project.id, {
        name: targetEnv.name,
        url: targetEnv.url,
        variables: payload
      });
      console.log(
        PamCliI18n.t(PAMENV_CLI_CREATED_ENVIRONMENT, {
          slug: project.slug,
          name: created.name
        })
      );
    } else {
      await this.apiClient.replaceEnvironmentVariables(
        project.id,
        targetEnv.id,
        payload
      );
    }

    await this.syncStore.saveBaseline(
      project.id,
      project.slug,
      targetEnv.name,
      PamCliDotenvUtil.toValueMap(localVars)
    );
    console.log(
      PamCliI18n.t(PAMENV_CLI_PUSHED_DETAIL, {
        path: target,
        slug: project.slug,
        env: targetEnv.name,
        count: localVars.length
      })
    );
    await this.printProjectDetailHint(project.slug);
  }

  /**
   * Prints a browser URL for the project general page when auth store is available.
   *
   * @param slug - Project slug
   */
  protected async printProjectDetailHint(slug: string): Promise<void> {
    if (!this.authStore) {
      return;
    }
    const [baseUrl, locale] = await Promise.all([
      this.authStore.getBaseUrl(),
      this.authStore.getLocale()
    ]);
    const detailUrl = PamCliConfig.buildProjectGeneralUrl(
      baseUrl,
      locale,
      slug
    );
    console.log(
      PamCliI18n.t(PAMENV_CLI_OPEN_PROJECT_DETAIL, { url: detailUrl })
    );
  }

  /**
   * Plans which environment to push to. Missing named envs collect URL only;
   * remote create happens after validation in `run`.
   *
   * @param project - Resolved owned project
   * @param options - Push options (`envName`, `yes`)
   * @param cwd - Directory used for homepage / git URL defaults
   */
  protected async planEnvironment(
    project: PamCliProjectType,
    options: PamCliLocalEnvOptionsType,
    cwd: string
  ): Promise<PamCliPushEnvTargetType> {
    const wanted = options.envName?.trim();
    if (!wanted) {
      const selected = PamCliEnvironmentSelectUtil.select(
        project.environments,
        undefined,
        project.slug
      );
      return { mode: 'existing', id: selected.id, name: selected.name };
    }

    const found = (project.environments || []).find(
      (env) => env.name === wanted
    );
    if (found) {
      return { mode: 'existing', id: found.id, name: found.name };
    }

    return this.planMissingEnvironment(project, wanted, options, cwd);
  }

  /**
   * Confirms intent and collects URL for a missing environment (no API yet).
   *
   * @param project - Owned project
   * @param envName - Requested `-e` name
   * @param options - Push options
   * @param cwd - Scan directory for URL defaults
   */
  protected async planMissingEnvironment(
    project: PamCliProjectType,
    envName: string,
    options: PamCliLocalEnvOptionsType,
    cwd: string
  ): Promise<Extract<PamCliPushEnvTargetType, { mode: 'create' }>> {
    console.log(
      `Environment "${envName}" not found on project ${project.slug}.`
    );

    if (!options.yes) {
      const ok = await PamCliConfirmUtil.ask(
        `Create environment "${envName}" after validation and push local variables?`
      );
      if (!ok) {
        throw new Error(
          `Environment "${envName}" not found on project ${project.slug}`
        );
      }
    }

    const scan = await PamCliLocalProjectScanUtil.scan(cwd);
    const defaultUrl = PamCliLocalProjectScanUtil.defaultEnvUrl(scan);

    let url: string;
    if (options.yes) {
      if (!defaultUrl) {
        throw new Error(
          `Environment "${envName}" not found. Re-run without -y to create it interactively, or set package.json homepage / git origin for a default URL.`
        );
      }
      url = defaultUrl;
      console.log(
        PamCliI18n.t(PAMENV_CLI_WILL_CREATE_ENV, {
          name: envName,
          url
        })
      );
    } else {
      const rawUrl = await input({
        message: PamCliI18n.t(PAMENV_CLI_PROMPT_ENV_URL),
        ...(defaultUrl ? { default: defaultUrl } : {}),
        validate: (value: string): true | string => {
          if (!PamCliLocalProjectScanUtil.isValidEnvUrl(value)) {
            return PamCliI18n.t(PAMENV_CLI_ENV_URL_REQUIRED);
          }
          return true;
        }
      });
      url = PamCliLocalProjectScanUtil.normalizeHomepageUrl(rawUrl);
    }

    return { mode: 'create', name: envName, url };
  }

  /**
   * Fails fast when a sensitive key has an empty value (same rule as PAM API).
   *
   * @param variables - Local variables after sensitive marking
   * @param envName - Environment name for the error message
   */
  protected assertSensitiveValuesPresent(
    variables: readonly PamCliParsedVarType[],
    envName: string
  ): void {
    const missing = variables
      .filter((item) => item.sensitive && item.value.trim() === '')
      .map((item) => item.key);

    if (missing.length === 0) {
      return;
    }

    throw new Error(
      `Sensitive variable(s) in "${envName}" require a value before push: ${missing.join(', ')}`
    );
  }
}
