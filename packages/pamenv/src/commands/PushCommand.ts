import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import type { PamCliApiClientInterface } from '../interfaces/PamCliApiClientInterface';
import type {
  PamCliLocalEnvOptionsType,
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
import { PamCliPrivateFsUtil } from '../impls/PamCliPrivateFsUtil';
import { PamCliProjectResolveUtil } from '../impls/PamCliProjectResolveUtil';
import { PamCliSensitivePromptUtil } from '../impls/PamCliSensitivePromptUtil';
import {
  PamCliSyncConflictKind,
  PamCliSyncConflictUtil
} from '../impls/PamCliSyncConflictUtil';
import { PamCliSyncStore } from '../impls/PamCliSyncStore';

/**
 * `pamenv push` — upload one local dotenv file back to a PAM environment.
 *
 * Significance: Lets local edits sync to PAM without the web UI.
 * Core idea: Three-way compare against ~/.pam/sync baseline, then replace.
 * Main function: Resolve conflicts, review diff, POST variables, save baseline.
 * Main purpose: Safer round-trip with `pamenv pull` from the working directory.
 *
 * @example
 * await new PushCommand(api).run('my-app', { envName: 'staging' });
 */
export class PushCommand {
  protected readonly syncStore = new PamCliSyncStore();

  constructor(protected readonly apiClient: PamCliApiClientInterface) {}

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
        `You are not the owner of project "${project.slug}". Push requires ownership.`
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

    let localDoc: PamCliDotenvDocumentType;
    try {
      localDoc = PamCliDotenvUtil.parseDocument(await readFile(target, 'utf8'));
    } catch {
      throw new Error(
        `Local file not found: ${target}. Run \`pamenv pull ${project.slug} -e ${env.name}\` first.`
      );
    }

    let localVars: PamCliParsedVarType[] = [...localDoc.variables];
    const localMap = PamCliDotenvUtil.toValueMap(localVars);

    const remoteExport = await this.apiClient.exportEnvironment(
      project.id,
      env.id
    );
    const remoteMap = PamCliDotenvUtil.toValueMap(
      PamCliDotenvUtil.parse(remoteExport.content)
    );
    const remoteSensitiveKeys = new Set(remoteExport.sensitiveKeys || []);

    const baseline = await this.syncStore.readSnapshot(project.id, env.name);
    const kind = PamCliSyncConflictUtil.classify(
      baseline?.variables || null,
      localMap,
      remoteMap
    );

    if (kind === PamCliSyncConflictKind.Noop) {
      await this.syncStore.saveBaseline(
        project.id,
        project.slug,
        env.name,
        localMap
      );
      console.log(`Already in sync: ${project.slug}/${env.name}`);
      return;
    }

    if (kind === PamCliSyncConflictKind.RemoteOnly) {
      console.log(
        `Remote changed since last sync. Run \`pamenv pull ${project.slug} -e ${env.name}\` first.`
      );
      return;
    }

    if (kind === PamCliSyncConflictKind.Conflict) {
      const keys = PamCliSyncConflictUtil.conflictingKeys(
        baseline!.variables,
        localMap,
        remoteMap
      );
      console.log(
        `Push conflict: both local and remote changed since last sync.`
      );
      if (keys.length > 0) {
        console.log(`Conflicting keys: ${keys.join(', ')}`);
      }
      if (!options.force) {
        const overwrite = await PamCliSyncConflictUtil.askOverwriteOrAbort(
          'Overwrite remote with local values anyway?'
        );
        if (!overwrite) {
          console.log('Cancelled.');
          return;
        }
      }
    }

    if (kind === PamCliSyncConflictKind.NoBase && !options.yes) {
      const ok = await PamCliConfirmUtil.ask(
        'No sync baseline found (never pulled/pushed here). Push local over remote anyway?'
      );
      if (!ok) {
        console.log('Cancelled.');
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

    const diff = PamCliEnvDiffUtil.diff(
      new Map(Object.entries(remoteMap)),
      localVars,
      remoteSensitiveKeys
    );
    const reviewOptions = { showValues: options.showValues === true };

    console.log(`Push review: ${project.slug}/${env.name}`);
    console.log(`Local file: ${target}`);
    console.log(PamCliEnvDiffUtil.formatReview(diff, reviewOptions));

    if (diff.isLargeKeyChange) {
      console.log(
        `Warning: large variable name changes (added ${diff.addedKeyCount}, removed ${diff.removedKeyCount}; remote had ${diff.remoteKeyCount} keys).`
      );
    }

    if (!options.yes) {
      const message = diff.isLargeKeyChange
        ? 'Large changes detected. Push these variables to PAM anyway?'
        : `Push ${localVars.length} variable(s) to ${project.slug}/${env.name}?`;
      const ok = await PamCliConfirmUtil.ask(message);
      if (!ok) {
        console.log('Cancelled.');
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

    await this.apiClient.replaceEnvironmentVariables(
      project.id,
      env.id,
      payload
    );
    await this.syncStore.saveBaseline(
      project.id,
      project.slug,
      env.name,
      PamCliDotenvUtil.toValueMap(localVars)
    );
    console.log(
      `Pushed ${target} → ${project.slug}/${env.name} (${localVars.length} vars)`
    );
  }
}
