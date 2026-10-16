import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { input } from '@inquirer/prompts';
import { PamCliConfig } from '../config/PamCliConfig';
import { PamCliI18n } from '../i18n/PamCliI18n';
import {
  PAMENV_CLI_CANCELLED,
  PAMENV_CLI_CREATED_ENVIRONMENT,
  PAMENV_CLI_ENV_CREATE_CONFIRM,
  PAMENV_CLI_ENV_NOT_FOUND_ON_PROJECT,
  PAMENV_CLI_ENV_NOT_FOUND_YES_HINT,
  PAMENV_CLI_ENV_URL_REQUIRED,
  PAMENV_CLI_LOCAL_FILE,
  PAMENV_CLI_LOCAL_FILE_HINT_CUSTOM,
  PAMENV_CLI_LOCAL_FILE_HINT_PULL,
  PAMENV_CLI_LOCAL_FILE_NOT_FOUND,
  PAMENV_CLI_OPEN_PROJECT_DETAIL,
  PAMENV_CLI_PROMPT_ENV_URL,
  PAMENV_CLI_PUSHED_DETAIL,
  PAMENV_CLI_PUSH_ALREADY_SYNC,
  PAMENV_CLI_PUSH_ASSIGNMENT_INVALID,
  PAMENV_CLI_PUSH_CONFIRM,
  PAMENV_CLI_PUSH_CONFIRM_CREATE,
  PAMENV_CLI_PUSH_CONFIRM_CREATE_LARGE,
  PAMENV_CLI_PUSH_CONFIRM_LARGE,
  PAMENV_CLI_PUSH_CONFLICT,
  PAMENV_CLI_PUSH_LARGE_WARNING,
  PAMENV_CLI_PUSH_MERGED_REMOTE,
  PAMENV_CLI_PUSH_NO_BASELINE,
  PAMENV_CLI_PUSH_NO_BASELINE_CREATE,
  PAMENV_CLI_PUSH_PLACEHOLDER_INVALID,
  PAMENV_CLI_PUSH_REMOTE_ONLY,
  PAMENV_CLI_PUSH_REVIEW,
  PAMENV_CLI_PUSH_SENSITIVE_CLEARED,
  PAMENV_CLI_SENSITIVE_VALUES_REQUIRED,
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
import { PamCliEnvFileBindingUtil } from '../impls/PamCliEnvFileBindingUtil';
import { PamCliLocalEnvFileUtil } from '../impls/PamCliLocalEnvFileUtil';
import { PamCliLocalProjectScanUtil } from '../impls/PamCliLocalProjectScanUtil';
import { PamCliPrivateFsUtil } from '../impls/PamCliPrivateFsUtil';
import { PamCliSecurityGate } from '../impls/PamCliSecurityGate';
import { PamCliSensitivePlaceholderUtil } from '../impls/PamCliSensitivePlaceholderUtil';
import { PamCliSensitivePromptUtil } from '../impls/PamCliSensitivePromptUtil';
import {
  PamCliSyncConflictKind,
  PamCliSyncConflictUtil,
  PamCliSyncSide
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
    if (this.authStore) {
      await PamCliSecurityGate.assertIdentity(this.authStore);
    }

    const project = await PamCliSecurityGate.resolveProjectExact(
      this.apiClient,
      projectRef
    );
    PamCliSecurityGate.assertCanEdit(project);

    const outDir = resolve(options.outDir || process.cwd());
    const targetEnv = await this.planEnvironment(project, options, outDir);
    const target = PamCliLocalEnvFileUtil.resolveLocalPath(
      outDir,
      targetEnv.name,
      options.file
    );
    await PamCliEnvFileBindingUtil.assertCompatibleOrThrow({
      syncRoot: this.syncStore.getSyncRoot(),
      outDir,
      absoluteFilePath: target,
      projectId: project.id,
      projectSlug: project.slug,
      envName: targetEnv.name,
      force: options.force
    });

    let localDoc: PamCliDotenvDocumentType;
    try {
      localDoc = PamCliDotenvUtil.parseDocument(await readFile(target, 'utf8'));
    } catch {
      const hint = options.file?.trim()
        ? PamCliI18n.t(PAMENV_CLI_LOCAL_FILE_HINT_CUSTOM, { path: target })
        : PamCliI18n.t(PAMENV_CLI_LOCAL_FILE_HINT_PULL, {
            slug: project.slug,
            env: targetEnv.name,
            fileName: PamCliLocalEnvFileUtil.toFileName(targetEnv.name)
          });
      throw new Error(
        PamCliI18n.t(PAMENV_CLI_LOCAL_FILE_NOT_FOUND, { path: target, hint })
      );
    }

    let localVars: PamCliParsedVarType[] = [...localDoc.variables];
    const overrides = options.overrides ?? {};
    const unsetKeys = new Set(
      (options.unsetKeys ?? []).map((key) => key.trim()).filter(Boolean)
    );

    let remoteMap: Record<string, string> = {};
    let remoteSensitiveKeys = new Set<string>();
    let remoteVars: PamCliParsedVarType[] = [];
    let placeholder: string | undefined;

    if (targetEnv.mode === 'existing') {
      const remoteExport = await this.apiClient.exportEnvironment(
        project.id,
        targetEnv.id
      );
      const redacted =
        PamCliSecurityGate.redactExportForLocalOutput(remoteExport);
      remoteSensitiveKeys = new Set(redacted.sensitiveKeys);
      placeholder = redacted.placeholder || undefined;
      remoteVars = redacted.variables.map((item) => ({
        key: item.key,
        value: item.value,
        sensitive: item.sensitive,
        comments: item.comments ? [...item.comments] : [],
        trailingComment: ''
      }));
      remoteMap = PamCliDotenvUtil.toValueMap(remoteVars);
    }

    // File is the full desired state; overlays then explicit deletes.
    localVars = this.applyAssignmentOverrides(
      localVars,
      overrides,
      remoteSensitiveKeys
    );
    localVars = this.removeUnsetKeys(localVars, unsetKeys);
    localDoc = {
      variables: localVars,
      trailingComments: localDoc.trailingComments
    };
    const localMap = PamCliDotenvUtil.toValueMap(localVars);

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
      await this.bindLocalEnvFile(outDir, target, project, targetEnv.name);
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
      let result = PamCliSyncConflictUtil.merge(
        baseline!.variables,
        localMap,
        remoteMap,
        PamCliSyncSide.Local
      );
      if (result.conflicts.length > 0) {
        const side = await PamCliSyncConflictUtil.resolveConflicts({
          title: PamCliI18n.t(PAMENV_CLI_PUSH_CONFLICT),
          conflicts: result.conflicts,
          defaultSide: PamCliSyncSide.Local,
          skipPrompt: options.force === true,
          path: target,
          slug: project.slug,
          env: targetEnv.name
        });
        if (!side) {
          console.log(PamCliI18n.t(PAMENV_CLI_CANCELLED));
          return;
        }
        if (side === PamCliSyncSide.Remote) {
          result = PamCliSyncConflictUtil.merge(
            baseline!.variables,
            localMap,
            remoteMap,
            PamCliSyncSide.Remote
          );
        }
      }

      // Keep remote-only edits instead of overwriting them; the local file
      // gets the merged result so it matches what is pushed.
      const takenFromRemote = Object.keys({ ...result.merged, ...localMap })
        .filter((key) => result.merged[key] !== localMap[key])
        .sort((a, b) => a.localeCompare(b));
      localVars = PamCliDotenvUtil.pickMergedVariables(
        result.merged,
        localVars,
        remoteVars
      );
      // Explicit --unset wins over merge re-adds.
      localVars = this.removeUnsetKeys(localVars, unsetKeys);
      localDoc = {
        variables: localVars,
        trailingComments: localDoc.trailingComments
      };
      if (takenFromRemote.length > 0) {
        await PamCliPrivateFsUtil.writePrivateFile(
          target,
          PamCliDotenvUtil.serializeDocument(localDoc)
        );
        console.log(
          PamCliI18n.t(PAMENV_CLI_PUSH_MERGED_REMOTE, {
            keys: takenFromRemote.join(', ')
          })
        );
      }
      if (PamCliDotenvUtil.valueMapsEqual(result.merged, remoteMap)) {
        await this.syncStore.saveBaseline(
          project.id,
          project.slug,
          targetEnv.name,
          remoteMap
        );
        await this.bindLocalEnvFile(outDir, target, project, targetEnv.name);
        console.log(
          PamCliI18n.t(PAMENV_CLI_PUSH_ALREADY_SYNC, {
            slug: project.slug,
            env: targetEnv.name
          })
        );
        return;
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

    this.assertPlaceholdersValid(
      localVars,
      targetEnv.name,
      remoteSensitiveKeys,
      placeholder
    );
    this.assertSensitiveValuesPresent(
      localVars,
      targetEnv.name,
      remoteSensitiveKeys
    );

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
        // Empty keeps the stored secret on every server version.
        value: placeholder && item.value === placeholder ? '' : item.value,
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
      if (localVars.some((item) => item.sensitive)) {
        placeholder = (
          await this.apiClient.exportEnvironment(project.id, created.id)
        ).sensitivePlaceholder;
      }
    } else {
      await this.apiClient.replaceEnvironmentVariables(
        project.id,
        targetEnv.id,
        payload
      );
    }

    const cleared = this.clearSensitiveValues(
      localVars,
      remoteSensitiveKeys,
      placeholder
    );
    const shouldRewriteLocal =
      cleared.keys.length > 0 ||
      Object.keys(overrides).length > 0 ||
      unsetKeys.size > 0;
    if (shouldRewriteLocal) {
      await PamCliPrivateFsUtil.writePrivateFile(
        target,
        PamCliDotenvUtil.serializeDocument({
          variables: cleared.variables,
          trailingComments: localDoc.trailingComments
        })
      );
    }
    if (cleared.keys.length > 0) {
      console.log(
        PamCliI18n.t(PAMENV_CLI_PUSH_SENSITIVE_CLEARED, {
          path: target,
          count: String(cleared.keys.length),
          keys: cleared.keys.join(', ')
        })
      );
    }

    // Baseline mirrors export, which never carries sensitive values.
    await this.syncStore.saveBaseline(
      project.id,
      project.slug,
      targetEnv.name,
      PamCliDotenvUtil.toValueMap(cleared.variables)
    );
    await this.bindLocalEnvFile(outDir, target, project, targetEnv.name);
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
   * Records which project owns a local dotenv path (cross-project guard).
   */
  protected async bindLocalEnvFile(
    outDir: string,
    absoluteFilePath: string,
    project: Pick<PamCliProjectType, 'id' | 'slug'>,
    envName: string
  ): Promise<void> {
    await PamCliEnvFileBindingUtil.writeBinding({
      syncRoot: this.syncStore.getSyncRoot(),
      outDir,
      absoluteFilePath,
      projectId: project.id,
      projectSlug: project.slug,
      envName
    });
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
      PamCliI18n.t(PAMENV_CLI_ENV_NOT_FOUND_ON_PROJECT, {
        env: envName,
        slug: project.slug
      })
    );

    if (!options.yes) {
      const ok = await PamCliConfirmUtil.ask(
        PamCliI18n.t(PAMENV_CLI_ENV_CREATE_CONFIRM, { env: envName })
      );
      if (!ok) {
        throw new Error(
          PamCliI18n.t(PAMENV_CLI_ENV_NOT_FOUND_ON_PROJECT, {
            env: envName,
            slug: project.slug
          })
        );
      }
    }

    const scan = await PamCliLocalProjectScanUtil.scan(cwd);
    const defaultUrl = PamCliLocalProjectScanUtil.defaultEnvUrl(scan);

    let url: string;
    if (options.yes) {
      if (!defaultUrl) {
        throw new Error(
          PamCliI18n.t(PAMENV_CLI_ENV_NOT_FOUND_YES_HINT, { env: envName })
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
   * Parses CLI `KEY=value` arguments into a map.
   *
   * @param assignments - Raw assignment strings from argv
   */
  public static parseAssignments(
    assignments: readonly string[]
  ): Record<string, string> {
    const result: Record<string, string> = {};
    for (const raw of assignments) {
      const separatorIndex = raw.indexOf('=');
      if (separatorIndex <= 0) {
        throw new Error(
          PamCliI18n.t(PAMENV_CLI_PUSH_ASSIGNMENT_INVALID, { raw })
        );
      }
      const key = raw.slice(0, separatorIndex).trim();
      if (key === '' || /\s/.test(key)) {
        throw new Error(
          PamCliI18n.t(PAMENV_CLI_PUSH_ASSIGNMENT_INVALID, { raw })
        );
      }
      result[key] = raw.slice(separatorIndex + 1);
    }
    return result;
  }

  /**
   * Applies inline KEY=value overlays onto the file snapshot.
   * Keys already sensitive on PAM stay marked sensitive.
   */
  protected applyAssignmentOverrides(
    variables: readonly PamCliParsedVarType[],
    overrides: Readonly<Record<string, string>>,
    remoteSensitiveKeys: ReadonlySet<string>
  ): PamCliParsedVarType[] {
    const entries = Object.entries(overrides);
    if (entries.length === 0) {
      return [...variables];
    }

    const byKey = new Map(
      variables.map((item) => [item.key, { ...item } as PamCliParsedVarType])
    );
    for (const [key, value] of entries) {
      const existing = byKey.get(key);
      if (existing) {
        byKey.set(key, {
          ...existing,
          value,
          sensitive: existing.sensitive || remoteSensitiveKeys.has(key)
        });
      } else {
        byKey.set(key, {
          key,
          value,
          sensitive: remoteSensitiveKeys.has(key),
          comments: [],
          trailingComment: ''
        });
      }
    }

    const result: PamCliParsedVarType[] = [];
    const seen = new Set<string>();
    for (const item of variables) {
      result.push(byKey.get(item.key)!);
      seen.add(item.key);
    }
    for (const [key, item] of byKey) {
      if (!seen.has(key)) {
        result.push(item);
      }
    }
    return result;
  }

  /**
   * Drops keys listed in `--unset` from the final push set.
   */
  protected removeUnsetKeys(
    variables: readonly PamCliParsedVarType[],
    unsetKeys: ReadonlySet<string>
  ): PamCliParsedVarType[] {
    if (unsetKeys.size === 0) {
      return [...variables];
    }
    return variables.filter((item) => !unsetKeys.has(item.key));
  }

  /**
   * Replaces sensitive values with the env placeholder (empty on older
   * servers) after a successful push, so no plaintext stays in the local file
   * or sync baseline.
   *
   * @param variables - Pushed local variables
   * @param remoteSensitiveKeys - Keys already sensitive on PAM
   * @param placeholder - Env placeholder from export
   * @returns Variables with sensitive values replaced, plus the keys that changed
   */
  protected clearSensitiveValues(
    variables: readonly PamCliParsedVarType[],
    remoteSensitiveKeys: ReadonlySet<string>,
    placeholder = ''
  ): { variables: PamCliParsedVarType[]; keys: string[] } {
    const keys: string[] = [];
    const next = variables.map((item) => {
      if (!item.sensitive && !remoteSensitiveKeys.has(item.key)) {
        return item;
      }
      if (item.value !== placeholder && item.value !== '') {
        keys.push(item.key);
      }
      return { ...item, value: placeholder, sensitive: true };
    });
    return { variables: next, keys };
  }

  /**
   * A placeholder is only valid as this env's placeholder on a key that is
   * already sensitive on PAM (it means "keep"); anything else would store the
   * placeholder text as the secret.
   *
   * @param variables - Local variables
   * @param envName - Environment name for the error message
   * @param remoteSensitiveKeys - Keys already sensitive on PAM
   * @param placeholder - Env placeholder from export (none for new envs)
   */
  protected assertPlaceholdersValid(
    variables: readonly PamCliParsedVarType[],
    envName: string,
    remoteSensitiveKeys: ReadonlySet<string>,
    placeholder: string | undefined
  ): void {
    const invalid = variables
      .filter(
        (item) =>
          PamCliSensitivePlaceholderUtil.isPlaceholder(item.value) &&
          !(item.value === placeholder && remoteSensitiveKeys.has(item.key))
      )
      .map((item) => item.key);

    if (invalid.length === 0) {
      return;
    }

    throw new Error(
      PamCliI18n.t(PAMENV_CLI_PUSH_PLACEHOLDER_INVALID, {
        env: envName,
        keys: invalid.join(', ')
      })
    );
  }

  /**
   * Fails fast when a new sensitive key has an empty value (same rule as PAM API).
   * Empty values for keys already sensitive on PAM keep the stored secret.
   *
   * @param variables - Local variables after sensitive marking
   * @param envName - Environment name for the error message
   * @param remoteSensitiveKeys - Keys already sensitive on PAM
   */
  protected assertSensitiveValuesPresent(
    variables: readonly PamCliParsedVarType[],
    envName: string,
    remoteSensitiveKeys: ReadonlySet<string>
  ): void {
    const missing = variables
      .filter(
        (item) =>
          item.sensitive &&
          item.value.trim() === '' &&
          !remoteSensitiveKeys.has(item.key)
      )
      .map((item) => item.key);

    if (missing.length === 0) {
      return;
    }

    throw new Error(
      PamCliI18n.t(PAMENV_CLI_SENSITIVE_VALUES_REQUIRED, {
        env: envName,
        keys: missing.join(', ')
      })
    );
  }
}
