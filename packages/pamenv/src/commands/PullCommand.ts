import { access, readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { PamCliI18n } from '../i18n/PamCliI18n';
import {
  PAMENV_CLI_CANCELLED,
  PAMENV_CLI_LOCAL_FILE,
  PAMENV_CLI_NOT_OWNER_EXPORT,
  PAMENV_CLI_PULLED,
  PAMENV_CLI_PULL_CONFLICT,
  PAMENV_CLI_PULL_LOCAL_KEPT,
  PAMENV_CLI_PULL_UP_TO_DATE
} from '../i18n/identifier/pamenv_cli';
import type { PamCliApiClientInterface } from '../interfaces/PamCliApiClientInterface';
import type {
  PamCliExportResultType,
  PamCliLocalEnvOptionsType
} from '../interfaces/PamCliTypes';
import {
  PamCliDotenvUtil,
  type PamCliParsedVarType
} from '../impls/PamCliDotenvUtil';
import { PamCliEnvDiffUtil } from '../impls/PamCliEnvDiffUtil';
import { PamCliEnvironmentSelectUtil } from '../impls/PamCliEnvironmentSelectUtil';
import { PamCliLocalEnvFileUtil } from '../impls/PamCliLocalEnvFileUtil';
import { PamCliPrivateFsUtil } from '../impls/PamCliPrivateFsUtil';
import { PamCliProjectAccessUtil } from '../impls/PamCliProjectAccessUtil';
import { PamCliProjectResolveUtil } from '../impls/PamCliProjectResolveUtil';
import {
  PamCliSyncConflictUtil,
  PamCliSyncSide
} from '../impls/PamCliSyncConflictUtil';
import { PamCliSyncStore } from '../impls/PamCliSyncStore';

/**
 * `pamenv pull` — download one decrypted environment into the working directory.
 *
 * Significance: Sync PAM secrets into a local dotenv file for development.
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
    protected readonly syncStore: PamCliSyncStore = new PamCliSyncStore()
  ) {}

  /**
   * @param projectRef - Project slug or project id
   * @param options - Env filter and optional output directory
   */
  public async run(
    projectRef: string,
    options: PamCliLocalEnvOptionsType = {}
  ): Promise<void> {
    const project = await PamCliProjectResolveUtil.resolve(
      this.apiClient,
      projectRef
    );

    if (!PamCliProjectAccessUtil.canEdit(project)) {
      throw new Error(
        PamCliI18n.t(PAMENV_CLI_NOT_OWNER_EXPORT, { slug: project.slug })
      );
    }

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

    const exported = await this.apiClient.exportEnvironment(project.id, env.id);
    const remoteVars = this.toRemoteVariables(exported);
    const sensitiveKeys = new Set(
      exported.sensitiveKeys ||
        remoteVars.filter((item) => item.sensitive).map((item) => item.key)
    );
    const remoteMap = PamCliDotenvUtil.toValueMap(remoteVars);

    const localExists = await this.fileExists(target);
    let localDoc = null as ReturnType<typeof PamCliDotenvUtil.parseDocument> | null;
    let nextVars: PamCliParsedVarType[] = remoteVars;
    let localKeptKeys: string[] = [];
    if (localExists) {
      const localText = await readFile(target, 'utf8');
      localDoc = PamCliDotenvUtil.parseDocument(localText);
      const localMap = PamCliDotenvUtil.toValueMap(localDoc.variables);

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
          localDoc.variables
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
  }

  /**
   * Prefer structured export variables (includes DB comments); fall back to content.
   */
  protected toRemoteVariables(exported: PamCliExportResultType): Array<{
    key: string;
    value: string;
    sensitive: boolean;
    comments: readonly string[];
    trailingComment: string;
  }> {
    const sensitiveKeys = new Set(exported.sensitiveKeys || []);

    if (exported.variables && exported.variables.length > 0) {
      return exported.variables.map((item) => ({
        key: item.key,
        value: item.value,
        sensitive: item.sensitive === true || sensitiveKeys.has(item.key),
        comments: item.comments ? [...item.comments] : [],
        trailingComment: ''
      }));
    }

    return PamCliDotenvUtil.parseDocument(exported.content).variables.map(
      (item) => ({
        key: item.key,
        value: item.value,
        sensitive: sensitiveKeys.has(item.key) || item.sensitive,
        comments: item.comments,
        trailingComment: item.trailingComment
      })
    );
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
