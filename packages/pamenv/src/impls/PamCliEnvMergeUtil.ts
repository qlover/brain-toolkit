import { access, readFile } from 'node:fs/promises';
import { join } from 'node:path';
import type { PamCliResolvedVarType } from '../interfaces/PamCliTypes';
import { PamCliDotenvUtil } from './PamCliDotenvUtil';
import { PamCliSensitivePlaceholderUtil } from './PamCliSensitivePlaceholderUtil';

/** Where overlapping keys come from when merging for `run` / inject. */
export type PamCliEnvPriorityType = 'remote' | 'local';

/** Which layer won for a key (debug only; never includes values). */
export type PamCliEnvMergePickSourceType =
  | 'process'
  | 'file'
  | 'remote'
  | 'placeholder';

export type PamCliEnvMergeWarningType =
  | {
      readonly kind: 'remote_sensitive_local_plaintext';
      readonly keys: readonly string[];
    }
  | {
      readonly kind: 'orphan_placeholder';
      readonly keys: readonly string[];
    };

export type PamCliEnvMergeResultType = {
  readonly env: NodeJS.ProcessEnv;
  readonly warnings: readonly PamCliEnvMergeWarningType[];
  readonly picks: Readonly<
    Record<PamCliEnvMergePickSourceType, readonly string[]>
  >;
};

export type PamCliEnvMergeOptionsType = {
  readonly priority?: PamCliEnvPriorityType;
  readonly keepEnv?: readonly string[];
  /** Disk `.env*` layer (Next-style). Empty when unused. */
  readonly fileLayer?: Readonly<Record<string, string>>;
};

/** Example / template files are never loaded. */
const DOTENV_TEMPLATE = /\.(example|sample|template|dist)$/i;

/**
 * Merges process / file / PAM layers for `pamenv run` and inject plugins.
 *
 * - `remote` (default): PAM wins; `keepEnv` keeps already-set process keys.
 * - `local`: process → file → remote (first defined wins), with placeholder
 *   resolution to PAM plaintext.
 *
 * Never logs values.
 */
export class PamCliEnvMergeUtil {
  /**
   * Loads cwd `.env*` in Next-like order (later files override earlier).
   *
   * @param cwd - Project directory
   * @param nodeEnv - `NODE_ENV`; defaults to `development`
   */
  public static async loadFileLayer(
    cwd: string,
    nodeEnv: string = process.env.NODE_ENV || 'development'
  ): Promise<Record<string, string>> {
    const envName = nodeEnv.trim() || 'development';
    const names = [
      '.env',
      '.env.local',
      `.env.${envName}`,
      `.env.${envName}.local`
    ];
    const layer: Record<string, string> = {};
    for (const name of names) {
      if (DOTENV_TEMPLATE.test(name)) {
        continue;
      }
      const path = join(cwd, name);
      try {
        await access(path);
      } catch {
        continue;
      }
      let text: string;
      try {
        text = await readFile(path, 'utf8');
      } catch {
        continue;
      }
      for (const variable of PamCliDotenvUtil.parse(text)) {
        layer[variable.key] = variable.value;
      }
    }
    return layer;
  }

  /**
   * Merges layers onto a copy of `baseEnv`.
   *
   * @param baseEnv - Current process / shell env
   * @param variables - PAM resolve plaintext
   * @param options - Priority and optional file layer
   */
  public static merge(
    baseEnv: NodeJS.ProcessEnv,
    variables: readonly PamCliResolvedVarType[],
    options: PamCliEnvMergeOptionsType = {}
  ): PamCliEnvMergeResultType {
    const priority = options.priority === 'local' ? 'local' : 'remote';
    const keep = new Set(options.keepEnv ?? []);
    const fileLayer = options.fileLayer ?? {};
    const remoteByKey = new Map(
      variables.map((variable) => [variable.key, variable] as const)
    );

    const picks: Record<PamCliEnvMergePickSourceType, string[]> = {
      process: [],
      file: [],
      remote: [],
      placeholder: []
    };
    const sensitivePlaintextKeys = new Set<string>();
    const orphanPlaceholderKeys = new Set<string>();

    const env: NodeJS.ProcessEnv = { ...baseEnv };

    if (priority === 'remote') {
      for (const variable of variables) {
        if (keep.has(variable.key) && baseEnv[variable.key] !== undefined) {
          picks.process.push(variable.key);
          this.noteSensitivePlaintext(
            variable,
            baseEnv[variable.key],
            sensitivePlaintextKeys
          );
          continue;
        }
        env[variable.key] = variable.value;
        picks.remote.push(variable.key);
      }
      return {
        env,
        warnings: this.buildWarnings(
          sensitivePlaintextKeys,
          orphanPlaceholderKeys
        ),
        picks: this.freezePicks(picks)
      };
    }

    // local: process → file → remote
    const allKeys = new Set<string>([
      ...Object.keys(fileLayer),
      ...variables.map((variable) => variable.key)
    ]);
    // Placeholders only in process (not in PAM) must still be stripped.
    for (const [key, value] of Object.entries(baseEnv)) {
      if (
        value !== undefined &&
        PamCliSensitivePlaceholderUtil.isPlaceholder(value)
      ) {
        allKeys.add(key);
      }
    }

    for (const key of allKeys) {
      const processValue = baseEnv[key];
      const fileValue = Object.prototype.hasOwnProperty.call(fileLayer, key)
        ? fileLayer[key]
        : undefined;
      const remote = remoteByKey.get(key);

      const localChoice =
        processValue !== undefined
          ? ({ source: 'process' as const, value: processValue })
          : fileValue !== undefined
            ? ({ source: 'file' as const, value: fileValue })
            : undefined;

      if (!localChoice) {
        if (remote) {
          env[key] = remote.value;
          picks.remote.push(key);
        }
        continue;
      }

      if (PamCliSensitivePlaceholderUtil.isPlaceholder(localChoice.value)) {
        if (remote) {
          env[key] = remote.value;
          picks.placeholder.push(key);
          continue;
        }
        orphanPlaceholderKeys.add(key);
        // Do not inject a placeholder string into the process.
        if (env[key] === localChoice.value) {
          delete env[key];
        }
        continue;
      }

      if (remote?.sensitive) {
        this.noteSensitivePlaintext(
          remote,
          localChoice.value,
          sensitivePlaintextKeys
        );
      }

      env[key] = localChoice.value;
      picks[localChoice.source].push(key);
    }

    return {
      env,
      warnings: this.buildWarnings(
        sensitivePlaintextKeys,
        orphanPlaceholderKeys
      ),
      picks: this.freezePicks(picks)
    };
  }

  protected static noteSensitivePlaintext(
    remote: PamCliResolvedVarType,
    localValue: string | undefined,
    sink: Set<string>
  ): void {
    if (
      remote.sensitive &&
      localValue !== undefined &&
      !PamCliSensitivePlaceholderUtil.isPlaceholder(localValue)
    ) {
      sink.add(remote.key);
    }
  }

  protected static buildWarnings(
    sensitivePlaintextKeys: ReadonlySet<string>,
    orphanPlaceholderKeys: ReadonlySet<string>
  ): PamCliEnvMergeWarningType[] {
    const warnings: PamCliEnvMergeWarningType[] = [];
    if (sensitivePlaintextKeys.size > 0) {
      warnings.push({
        kind: 'remote_sensitive_local_plaintext',
        keys: [...sensitivePlaintextKeys].sort((a, b) => a.localeCompare(b))
      });
    }
    if (orphanPlaceholderKeys.size > 0) {
      warnings.push({
        kind: 'orphan_placeholder',
        keys: [...orphanPlaceholderKeys].sort((a, b) => a.localeCompare(b))
      });
    }
    return warnings;
  }

  protected static freezePicks(
    picks: Record<PamCliEnvMergePickSourceType, string[]>
  ): Readonly<Record<PamCliEnvMergePickSourceType, readonly string[]>> {
    return {
      process: picks.process.sort((a, b) => a.localeCompare(b)),
      file: picks.file.sort((a, b) => a.localeCompare(b)),
      remote: picks.remote.sort((a, b) => a.localeCompare(b)),
      placeholder: picks.placeholder.sort((a, b) => a.localeCompare(b))
    };
  }
}
