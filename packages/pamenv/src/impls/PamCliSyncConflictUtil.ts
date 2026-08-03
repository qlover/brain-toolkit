import { select } from '@inquirer/prompts';
import { PamCliDotenvUtil } from './PamCliDotenvUtil';

export const PamCliSyncConflictKind = {
  Noop: 'noop',
  NoBase: 'no-base',
  LocalOnly: 'local-only',
  RemoteOnly: 'remote-only',
  Conflict: 'conflict'
} as const;

export type PamCliSyncConflictKindType =
  (typeof PamCliSyncConflictKind)[keyof typeof PamCliSyncConflictKind];

/**
 * Classifies local/remote/base divergence for push.
 *
 * Significance: Turns sync snapshots into actionable conflict states.
 * Core idea: Three-way compare of key→value maps.
 * Main function: Classify and prompt overwrite/abort choices.
 * Main purpose: Safer pull/push when web or local edits diverge.
 *
 * @example
 * const kind = PamCliSyncConflictUtil.classify(base, local, remote);
 */
export class PamCliSyncConflictUtil {
  /**
   * @param base - Last sync map (null when missing)
   * @param local - Local file map
   * @param remote - Current remote map
   */
  public static classify(
    base: Readonly<Record<string, string>> | null,
    local: Readonly<Record<string, string>>,
    remote: Readonly<Record<string, string>>
  ): PamCliSyncConflictKindType {
    if (PamCliDotenvUtil.valueMapsEqual(local, remote)) {
      return PamCliSyncConflictKind.Noop;
    }
    if (!base) {
      return PamCliSyncConflictKind.NoBase;
    }
    const localChanged = !PamCliDotenvUtil.valueMapsEqual(base, local);
    const remoteChanged = !PamCliDotenvUtil.valueMapsEqual(base, remote);
    if (localChanged && remoteChanged) {
      return PamCliSyncConflictKind.Conflict;
    }
    if (remoteChanged) {
      return PamCliSyncConflictKind.RemoteOnly;
    }
    return PamCliSyncConflictKind.LocalOnly;
  }

  /**
   * Lists keys changed on both sides since base.
   *
   * @param base - Baseline map
   * @param local - Local map
   * @param remote - Remote map
   */
  public static conflictingKeys(
    base: Readonly<Record<string, string>>,
    local: Readonly<Record<string, string>>,
    remote: Readonly<Record<string, string>>
  ): string[] {
    const keys = new Set([
      ...Object.keys(base),
      ...Object.keys(local),
      ...Object.keys(remote)
    ]);
    const result: string[] = [];
    for (const key of keys) {
      const baseValue = base[key];
      const localValue = local[key];
      const remoteValue = remote[key];
      const localDiverged = localValue !== baseValue;
      const remoteDiverged = remoteValue !== baseValue;
      if (
        localDiverged &&
        remoteDiverged &&
        localValue !== remoteValue
      ) {
        result.push(key);
      }
    }
    return result.sort((a, b) => a.localeCompare(b));
  }

  /**
   * Interactive overwrite / abort choice.
   *
   * @param message - Prompt message
   * @returns True when overwrite selected
   */
  public static async askOverwriteOrAbort(message: string): Promise<boolean> {
    const choice = await select({
      message,
      choices: [
        { name: 'Overwrite', value: 'overwrite' },
        { name: 'Abort', value: 'abort' }
      ],
      default: 'abort'
    });
    return choice === 'overwrite';
  }
}
