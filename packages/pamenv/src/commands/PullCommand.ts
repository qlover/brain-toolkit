import { access, readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import type { PamCliApiClientInterface } from '../interfaces/PamCliApiClientInterface';
import type {
  PamCliExportResultType,
  PamCliLocalEnvOptionsType
} from '../interfaces/PamCliTypes';
import { PamCliDotenvUtil } from '../impls/PamCliDotenvUtil';
import { PamCliEnvDiffUtil } from '../impls/PamCliEnvDiffUtil';
import { PamCliEnvironmentSelectUtil } from '../impls/PamCliEnvironmentSelectUtil';
import { PamCliLocalEnvFileUtil } from '../impls/PamCliLocalEnvFileUtil';
import { PamCliPrivateFsUtil } from '../impls/PamCliPrivateFsUtil';
import { PamCliProjectResolveUtil } from '../impls/PamCliProjectResolveUtil';
import { PamCliSyncConflictUtil } from '../impls/PamCliSyncConflictUtil';
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

    if (!project.is_owner) {
      throw new Error(
        `You are not the owner of project "${project.slug}". Export requires ownership.`
      );
    }

    const env = PamCliEnvironmentSelectUtil.select(
      project.environments,
      options.envName,
      project.slug
    );
    const outDir = resolve(options.outDir || process.cwd());
    const fileName = PamCliLocalEnvFileUtil.toFileName(env.name);
    const target = resolve(outDir, fileName);

    const exported = await this.apiClient.exportEnvironment(project.id, env.id);
    const remoteVars = this.toRemoteVariables(exported);
    const sensitiveKeys = new Set(
      exported.sensitiveKeys ||
        remoteVars.filter((item) => item.sensitive).map((item) => item.key)
    );
    const remoteMap = PamCliDotenvUtil.toValueMap(remoteVars);

    const localExists = await this.fileExists(target);
    let localDoc = null as ReturnType<typeof PamCliDotenvUtil.parseDocument> | null;
    if (localExists) {
      const localText = await readFile(target, 'utf8');
      localDoc = PamCliDotenvUtil.parseDocument(localText);
      const localMap = PamCliDotenvUtil.toValueMap(localDoc.variables);

      if (!PamCliDotenvUtil.valueMapsEqual(localMap, remoteMap)) {
        const diff = PamCliEnvDiffUtil.diff(
          new Map(Object.entries(localMap)),
          remoteVars,
          sensitiveKeys
        );
        console.log(`Pull conflict: local file differs from remote`);
        console.log(`Local file: ${target}`);
        console.log(PamCliEnvDiffUtil.formatReview(diff, {
          showValues: options.showValues === true
        }));

        if (!options.force) {
          const overwrite = await PamCliSyncConflictUtil.askOverwriteOrAbort(
            'Overwrite local file with remote values (remote comments win when present)?'
          );
          if (!overwrite) {
            console.log('Cancelled.');
            return;
          }
        }
      }
    }

    const merged = PamCliDotenvUtil.mergeRemotePreservingComments(
      localDoc,
      remoteVars
    );
    const nextText = PamCliDotenvUtil.serializeDocument(merged);

    if (localExists) {
      const localText = await readFile(target, 'utf8');
      if (localText === nextText) {
        await this.syncStore.saveBaseline(
          project.id,
          project.slug,
          env.name,
          remoteMap
        );
        console.log(
          `Already up to date: ${project.slug}/${env.name} (${target})`
        );
        return;
      }
    }

    await PamCliPrivateFsUtil.writePrivateFile(target, nextText);
    await this.syncStore.saveBaseline(
      project.id,
      project.slug,
      env.name,
      remoteMap
    );
    console.log(
      `Pulled ${project.slug}/${exported.environmentName} → ${target}`
    );
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
