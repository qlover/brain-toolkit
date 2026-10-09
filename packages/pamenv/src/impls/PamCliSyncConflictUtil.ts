import { select } from '@inquirer/prompts';
import { PamCliI18n } from '../i18n/PamCliI18n';
import {
  PAMENV_CLI_CONFLICT_ABORT,
  PAMENV_CLI_CONFLICT_MANUAL_HINT,
  PAMENV_CLI_CONFLICT_RESOLVE_PROMPT,
  PAMENV_CLI_CONFLICT_USE_LOCAL,
  PAMENV_CLI_CONFLICT_USE_REMOTE,
  PAMENV_CLI_PUSH_CONFLICT_KEYS,
  PAMENV_CLI_SIDE_LOCAL,
  PAMENV_CLI_SIDE_REMOTE
} from '../i18n/identifier/pamenv_cli';
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

export const PamCliSyncSide = {
  Local: 'local',
  Remote: 'remote'
} as const;

export type PamCliSyncSideType =
  (typeof PamCliSyncSide)[keyof typeof PamCliSyncSide];

export type PamCliSyncMergeResultType = {
  /** Merged key → value (absent keys are deleted). */
  readonly merged: Record<string, string>;
  /** Keys changed on both sides, resolved with the preferred side. */
  readonly conflicts: string[];
};

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
   * Per-key three-way merge. Keys changed on one side only take that side;
   * keys changed on both sides (or every differing key without a baseline)
   * are conflicts resolved with `prefer`.
   *
   * @param base - Last sync map (null when missing)
   * @param local - Local file map
   * @param remote - Current remote map
   * @param prefer - Side that wins conflicting keys
   */
  public static merge(
    base: Readonly<Record<string, string>> | null,
    local: Readonly<Record<string, string>>,
    remote: Readonly<Record<string, string>>,
    prefer: PamCliSyncSideType
  ): PamCliSyncMergeResultType {
    const merged: Record<string, string> = {};
    const conflicts: string[] = [];
    const keys = new Set([...Object.keys(local), ...Object.keys(remote)]);
    for (const key of keys) {
      const localValue = local[key];
      const remoteValue = remote[key];
      let value: string | undefined;
      if (localValue === remoteValue) {
        value = localValue;
      } else if (base && localValue === base[key]) {
        value = remoteValue;
      } else if (base && remoteValue === base[key]) {
        value = localValue;
      } else {
        conflicts.push(key);
        value = prefer === PamCliSyncSide.Local ? localValue : remoteValue;
      }
      if (value !== undefined) {
        merged[key] = value;
      }
    }
    return { merged, conflicts: conflicts.sort((a, b) => a.localeCompare(b)) };
  }

  /**
   * Prints conflicting keys, picks the winning side (`skipPrompt` takes
   * `defaultSide`) and tells the user how to adjust manually.
   *
   * @returns Chosen side, or null when aborted
   */
  public static async resolveConflicts(params: {
    readonly title: string;
    readonly conflicts: readonly string[];
    readonly defaultSide: PamCliSyncSideType;
    readonly skipPrompt: boolean;
    readonly path: string;
    readonly slug: string;
    readonly env: string;
  }): Promise<PamCliSyncSideType | null> {
    console.log(params.title);
    console.log(
      PamCliI18n.t(PAMENV_CLI_PUSH_CONFLICT_KEYS, {
        keys: params.conflicts.join(', ')
      })
    );
    const side = params.skipPrompt
      ? params.defaultSide
      : await this.askConflictSide(
          PamCliI18n.t(PAMENV_CLI_CONFLICT_RESOLVE_PROMPT),
          params.defaultSide,
          {
            remote: PamCliI18n.t(PAMENV_CLI_CONFLICT_USE_REMOTE),
            local: PamCliI18n.t(PAMENV_CLI_CONFLICT_USE_LOCAL),
            abort: PamCliI18n.t(PAMENV_CLI_CONFLICT_ABORT)
          }
        );
    if (side) {
      console.log(
        PamCliI18n.t(PAMENV_CLI_CONFLICT_MANUAL_HINT, {
          side: PamCliI18n.t(
            side === PamCliSyncSide.Remote
              ? PAMENV_CLI_SIDE_REMOTE
              : PAMENV_CLI_SIDE_LOCAL
          ),
          path: params.path,
          slug: params.slug,
          env: params.env
        })
      );
    }
    return side;
  }

  /**
   * Asks which side wins conflicting keys; `defaultSide` is preselected.
   *
   * @param message - Prompt message
   * @param defaultSide - Preselected side
   * @param labels - Choice labels
   * @returns Chosen side, or null when aborted
   */
  public static async askConflictSide(
    message: string,
    defaultSide: PamCliSyncSideType,
    labels: { remote: string; local: string; abort: string }
  ): Promise<PamCliSyncSideType | null> {
    const remoteChoice = { name: labels.remote, value: PamCliSyncSide.Remote };
    const localChoice = { name: labels.local, value: PamCliSyncSide.Local };
    const choice = await select<PamCliSyncSideType | 'abort'>({
      message,
      choices: [
        ...(defaultSide === PamCliSyncSide.Remote
          ? [remoteChoice, localChoice]
          : [localChoice, remoteChoice]),
        { name: labels.abort, value: 'abort' }
      ],
      default: defaultSide
    });
    return choice === 'abort' ? null : choice;
  }
}
