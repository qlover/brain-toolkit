import { access, readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { PamCliI18n } from '../i18n/PamCliI18n';
import {
  PAMENV_CLI_CANCELLED,
  PAMENV_CLI_LOCAL_FILE,
  PAMENV_CLI_PULLED,
  PAMENV_CLI_PULL_CONFLICT,
  PAMENV_CLI_PULL_LOCAL_KEPT,
  PAMENV_CLI_PULL_SENSITIVE_EMPTY,
  PAMENV_CLI_PULL_SENSITIVE_OVERWRITTEN,
  PAMENV_CLI_PULL_SENSITIVE_PLACEHOLDER,
  PAMENV_CLI_PULL_UP_TO_DATE
} from '../i18n/identifier/pamenv_cli';
import type { PamCliApiClientInterface } from '../interfaces/PamCliApiClientInterface';
import type { PamCliLocalEnvOptionsType } from '../interfaces/PamCliTypes';
import {
  PamCliDotenvUtil,
  type PamCliParsedVarType
} from '../impls/PamCliDotenvUtil';
import { PamCliEnvDiffUtil } from '../impls/PamCliEnvDiffUtil';
import { PamCliEnvironmentSelectUtil } from '../impls/PamCliEnvironmentSelectUtil';
import { PamCliEnvFileBindingUtil } from '../impls/PamCliEnvFileBindingUtil';
import { PamCliLocalEnvFileUtil } from '../impls/PamCliLocalEnvFileUtil';
import { PamCliPrivateFsUtil } from '../impls/PamCliPrivateFsUtil';
import { PamCliSecurityGate } from '../impls/PamCliSecurityGate';
import {
  PamCliSyncConflictUtil,
  PamCliSyncSide
} from '../impls/PamCliSyncConflictUtil';
import { PamCliSyncStore } from '../impls/PamCliSyncStore';
import type { PamCliAuthStoreInterface } from '../interfaces/PamCliAuthStoreInterface';

/**
 * `pamenv pull` — download one environment into the working directory.
 *
 * Significance: Sync PAM variables into a local dotenv file; PAM export never
 * returns sensitive values, so those keys get the environment's placeholder.
 * Core idea: Prefer export `variables` (with comments); conflict on value diffs.
 * Main function: Export remote, merge comments, write cwd file, save baseline.
 * Main purpose: Direct cwd pull controlled by `-e`.
 *
 * @example
 * await new PullCommand(api).run('my-app', { envName: 'staging' });
 */
export class PullCommand {
  constructor(
    protected readonly apiClient: PamCliApiClientInterface,
    protected readonly syncStore: PamCliSyncStore = new PamCliSyncStore(),
    protected readonly authStore?: PamCliAuthStoreInterface
  ) {}

  /**
   * @param projectRef - Project slug or project id
   * @param options - Env filter and optional output directory
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
    PamCliSecurityGate.assertCanExport(project);

    const env = PamCliEnvironmentSelectUtil.select(
      project.environments,
      options.envName,
      project.slug
    );
    const outDir = resolve(options.outDir || process.cwd());
    const target = PamCliLocalEnvFileUtil.resolveLocalPath(
      outDir,
      env.name,
      options.file
    );
    await PamCliEnvFileBindingUtil.assertCompatibleOrThrow({
      syncRoot: this.syncStore.getSyncRoot(),
      outDir,
      absoluteFilePath: target,
      projectId: project.id,
      projectSlug: project.slug,
      envName: env.name,
      force: options.force
    });

    const exported = await this.apiClient.exportEnvironment(project.id, env.id);
    // Never write sensitive plaintext — force placeholders even if an older
    // PAM export leaked real values (same policy as `pamenv render`).
    const redacted = PamCliSecurityGate.redactExportForLocalOutput(exported);
    const remoteVars: PamCliParsedVarType[] = redacted.variables.map(
      (item) => ({
        key: item.key,
        value: item.value,
        sensitive: item.sensitive,
        comments: item.comments ? [...item.comments] : [],
        trailingComment: ''
      })
    );
    const sensitiveKeys = redacted.sensitiveKeys;
    const remoteMap = PamCliDotenvUtil.toValueMap(remoteVars);

    if (redacted.placeholderKeys.length > 0) {
      console.error(
        PamCliI18n.t(PAMENV_CLI_PULL_SENSITIVE_PLACEHOLDER, {
          count: String(redacted.placeholderKeys.length),
          keys: redacted.placeholderKeys.join(', ')
        })
      );
    } else if (redacted.emptyKeepKeys.length > 0) {
      console.error(
        PamCliI18n.t(PAMENV_CLI_PULL_SENSITIVE_EMPTY, {
          count: String(redacted.emptyKeepKeys.length),
          keys: redacted.emptyKeepKeys.join(', ')
        })
      );
    }

    const localExists = await this.fileExists(target);
    let localDoc = null as ReturnType<typeof PamCliDotenvUtil.parseDocument> | null;
    let nextVars: PamCliParsedVarType[] = remoteVars;
    let localKeptKeys: string[] = [];
    let overwrittenSensitive: string[] = [];
    if (localExists) {
      const localText = await readFile(target, 'utf8');
      localDoc = PamCliDotenvUtil.parseDocument(localText);
      const scrubbed = this.scrubLocalSensitivePlaintext(
        localDoc.variables,
        remoteVars
      );
      overwrittenSensitive = scrubbed.keys;
      const localMap = PamCliDotenvUtil.toValueMap(scrubbed.variables);

      if (!PamCliDotenvUtil.valueMapsEqual(localMap, remoteMap)) {
        const baseline = await this.syncStore.readSnapshot(
          project.id,
          env.name
        );
        let result = PamCliSyncConflictUtil.merge(
          baseline?.variables || null,
          localMap,
          remoteMap,
          PamCliSyncSide.Remote
        );

        if (result.conflicts.length > 0) {
          const diff = PamCliEnvDiffUtil.diff(
            new Map(Object.entries(localMap)),
            remoteVars,
            sensitiveKeys
          );
          console.log(PamCliI18n.t(PAMENV_CLI_LOCAL_FILE, { path: target }));
          console.log(
            PamCliEnvDiffUtil.formatReview(diff, {
              showValues: options.showValues === true
            })
          );
          const side = await PamCliSyncConflictUtil.resolveConflicts({
            title: PamCliI18n.t(PAMENV_CLI_PULL_CONFLICT),
            conflicts: result.conflicts,
            defaultSide: PamCliSyncSide.Remote,
            skipPrompt: options.force === true,
            path: target,
            slug: project.slug,
            env: env.name
          });
          if (!side) {
            console.log(PamCliI18n.t(PAMENV_CLI_CANCELLED));
            return;
          }
          if (side === PamCliSyncSide.Local) {
            result = PamCliSyncConflictUtil.merge(
              baseline?.variables || null,
              localMap,
              remoteMap,
              PamCliSyncSide.Local
            );
          }
        }

        nextVars = PamCliDotenvUtil.pickMergedVariables(
          result.merged,
          remoteVars,
          scrubbed.variables
        );
        localKeptKeys = Object.keys({ ...result.merged, ...remoteMap })
          .filter((key) => result.merged[key] !== remoteMap[key])
          .sort((a, b) => a.localeCompare(b));
      }
    }

    // Baseline stays the remote state so kept local edits push as local-only.
    const merged = PamCliDotenvUtil.mergeRemotePreservingComments(
      localDoc,
      nextVars
    );
    const nextText = PamCliDotenvUtil.serializeDocument(merged);

    const upToDate =
      localExists && (await readFile(target, 'utf8')) === nextText;
    if (!upToDate) {
      await PamCliPrivateFsUtil.writePrivateFile(target, nextText);
    }
    await this.syncStore.saveBaseline(
      project.id,
      project.slug,
      env.name,
      remoteMap
    );
    await PamCliEnvFileBindingUtil.writeBinding({
      syncRoot: this.syncStore.getSyncRoot(),
      outDir,
      absoluteFilePath: target,
      projectId: project.id,
      projectSlug: project.slug,
      envName: env.name
    });
    console.log(
      upToDate
        ? PamCliI18n.t(PAMENV_CLI_PULL_UP_TO_DATE, {
            slug: project.slug,
            env: env.name,
            path: target
          })
        : PamCliI18n.t(PAMENV_CLI_PULLED, {
            slug: project.slug,
            env: exported.environmentName,
            path: target
          })
    );
    if (localKeptKeys.length > 0) {
      console.log(
        PamCliI18n.t(PAMENV_CLI_PULL_LOCAL_KEPT, {
          keys: localKeptKeys.join(', '),
          slug: project.slug,
          env: env.name
        })
      );
    }
    if (overwrittenSensitive.length > 0) {
      console.error(
        PamCliI18n.t(PAMENV_CLI_PULL_SENSITIVE_OVERWRITTEN, {
          count: String(overwrittenSensitive.length),
          keys: overwrittenSensitive.join(', ')
        })
      );
    }
  }

  /**
   * 远端已有的敏感键（含密钥式键名）用脱敏后的远端值。
   * 本地残留明文不当作未推送修改留下来。
   *
   * @param local - 本地变量
   * @param remote - 已脱敏的远端变量
   * @returns 替换后的变量，以及被盖掉明文的键
   */
  protected scrubLocalSensitivePlaintext(
    local: readonly PamCliParsedVarType[],
    remote: readonly PamCliParsedVarType[]
  ): { variables: PamCliParsedVarType[]; keys: string[] } {
    const remoteByKey = new Map(remote.map((item) => [item.key, item]));
    const keys: string[] = [];
    const variables = local.map((item) => {
      const remoteItem = remoteByKey.get(item.key);
      if (!remoteItem?.sensitive || item.value === remoteItem.value) {
        return item;
      }
      keys.push(item.key);
      return {
        ...item,
        value: remoteItem.value,
        sensitive: true
      };
    });
    return { variables, keys };
  }

  protected async fileExists(path: string): Promise<boolean> {
    try {
      await access(path);
      return true;
    } catch {
      return false;
    }
  }
}
