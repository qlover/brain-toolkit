import { readdir, readFile } from 'node:fs/promises';
import { dirname, join, relative } from 'node:path';
import { PamCliI18n } from '../i18n/PamCliI18n';
import {
  PAMENV_CLI_WARN_DOTENV_OVERLAP,
  PAMENV_CLI_WARN_DOTENV_PLACEHOLDER,
  PAMENV_CLI_WARN_PUBLIC_PREFIX,
  PAMENV_CLI_WARN_TURBO_STRICT
} from '../i18n/identifier/pamenv_cli';
import type { PamCliResolvedVarType } from '../interfaces/PamCliTypes';
import { PamCliDotenvUtil } from './PamCliDotenvUtil';
import { PamCliSensitivePlaceholderUtil } from './PamCliSensitivePlaceholderUtil';

/**
 * Prefixes that common frameworks embed into client bundles.
 * Bare `PUBLIC_` is omitted (too noisy, e.g. `PUBLIC_KEY`); SvelteKit's
 * `PUBLIC_` is added when the project looks like SvelteKit.
 */
const CLIENT_PUBLIC_PREFIXES = [
  'NEXT_PUBLIC_',
  'VITE_',
  'REACT_APP_',
  'NUXT_PUBLIC_',
  'EXPO_PUBLIC_',
  'GATSBY_',
  'VUE_APP_',
  'ASTRO_PUBLIC_'
] as const;

/** Example / template files are never loaded at runtime. */
const DOTENV_TEMPLATE = /\.(example|sample|template|dist)$/i;

/** Max key names listed per warning line. */
const MAX_LISTED_KEYS = 5;

type TurboConfigType = {
  readonly envMode?: string;
  readonly globalEnv?: readonly string[];
  readonly globalPassThroughEnv?: readonly string[];
  readonly tasks?: Readonly<Record<string, TurboTaskType>>;
  readonly pipeline?: Readonly<Record<string, TurboTaskType>>;
};

type TurboTaskType = {
  readonly env?: readonly string[];
  readonly passThroughEnv?: readonly string[];
};

/**
 * Pre-run checks for `pamenv run`: things that can silently override or drop
 * injected variables. Warnings only; never prints values.
 */
export class PamCliRunWarningUtil {
  /**
   * Collects all warning lines for the current directory.
   *
   * @param cwd - Working directory of the child process
   * @param variables - Variables about to be injected
   * @param options.clientPublicPrefixes - Override client-exposed prefixes;
   *   omit for defaults; `[]` disables the public-prefix warning
   */
  public static async collect(
    cwd: string,
    variables: readonly PamCliResolvedVarType[],
    options?: { readonly clientPublicPrefixes?: readonly string[] }
  ): Promise<string[]> {
    const keys = new Set(variables.map((variable) => variable.key));
    const warnings: string[] = [];

    for (const overlap of await this.findDotenvOverlaps(cwd, keys)) {
      warnings.push(
        PamCliI18n.t(PAMENV_CLI_WARN_DOTENV_OVERLAP, {
          file: overlap.file,
          count: String(overlap.keys.length),
          keys: this.listKeys(overlap.keys)
        })
      );
      if (overlap.placeholderKeys.length > 0) {
        warnings.push(
          PamCliI18n.t(PAMENV_CLI_WARN_DOTENV_PLACEHOLDER, {
            file: overlap.file,
            count: String(overlap.placeholderKeys.length),
            keys: this.listKeys(overlap.placeholderKeys)
          })
        );
      }
    }

    const publicKeys = await this.findPublicSensitiveKeys(
      cwd,
      variables,
      options?.clientPublicPrefixes
    );
    if (publicKeys.length > 0) {
      // One line for all matches — never warn per key.
      warnings.push(
        PamCliI18n.t(PAMENV_CLI_WARN_PUBLIC_PREFIX, {
          count: String(publicKeys.length),
          keys: this.listKeys(publicKeys)
        })
      );
    }

    const turbo = await this.findTurboUndeclared(cwd, [...keys]);
    if (turbo && turbo.keys.length > 0) {
      warnings.push(
        PamCliI18n.t(PAMENV_CLI_WARN_TURBO_STRICT, {
          file: turbo.file,
          count: String(turbo.keys.length),
          keys: this.listKeys(turbo.keys)
        })
      );
    }

    return warnings;
  }

  /**
   * `.env*` files in `cwd` that define any injected key; `placeholderKeys`
   * are the overlapping keys whose file value is a sensitive placeholder.
   */
  public static async findDotenvOverlaps(
    cwd: string,
    keys: ReadonlySet<string>
  ): Promise<Array<{ file: string; keys: string[]; placeholderKeys: string[] }>> {
    let names: string[];
    try {
      names = await readdir(cwd);
    } catch {
      return [];
    }

    const result: Array<{
      file: string;
      keys: string[];
      placeholderKeys: string[];
    }> = [];
    for (const name of names.sort()) {
      if (!name.startsWith('.env') || DOTENV_TEMPLATE.test(name)) {
        continue;
      }
      let text: string;
      try {
        text = await readFile(join(cwd, name), 'utf8');
      } catch {
        continue;
      }
      const overlap = PamCliDotenvUtil.parse(text).filter((variable) =>
        keys.has(variable.key)
      );
      if (overlap.length > 0) {
        result.push({
          file: name,
          keys: overlap.map((variable) => variable.key),
          placeholderKeys: overlap
            .filter((variable) =>
              PamCliSensitivePlaceholderUtil.isPlaceholder(variable.value)
            )
            .map((variable) => variable.key)
        });
      }
    }
    return result;
  }

  /**
   * Sensitive keys that bundlers expose to client code (batched; caller prints once).
   *
   * @param cwd - Project root (for optional SvelteKit `PUBLIC_` detection)
   * @param variables - Variables about to be injected
   * @param clientPublicPrefixes - When set, replaces built-in prefixes (`[]` → none)
   */
  public static async findPublicSensitiveKeys(
    cwd: string,
    variables: readonly PamCliResolvedVarType[],
    clientPublicPrefixes?: readonly string[]
  ): Promise<string[]> {
    const prefixes =
      clientPublicPrefixes !== undefined
        ? this.normalizeClientPublicPrefixes(clientPublicPrefixes)
        : await this.resolveClientPublicPrefixes(cwd);
    if (prefixes.length === 0) {
      return [];
    }
    return variables
      .filter(
        (variable) =>
          variable.sensitive &&
          prefixes.some((prefix) => variable.key.startsWith(prefix))
      )
      .map((variable) => variable.key)
      .sort((left, right) => left.localeCompare(right));
  }

  /**
   * Client-exposed env prefixes for this project.
   * Always includes common framework prefixes; adds SvelteKit `PUBLIC_` when detected.
   */
  public static async resolveClientPublicPrefixes(
    cwd: string
  ): Promise<readonly string[]> {
    const prefixes: string[] = [...CLIENT_PUBLIC_PREFIXES];
    if (await this.looksLikeSvelteKit(cwd)) {
      prefixes.push('PUBLIC_');
    }
    return prefixes;
  }

  /**
   * Normalizes user-supplied prefixes (`VITE` → `VITE_`).
   */
  public static normalizeClientPublicPrefixes(
    prefixes: readonly string[]
  ): readonly string[] {
    const normalized: string[] = [];
    for (const raw of prefixes) {
      const trimmed = raw.trim();
      if (!trimmed) {
        continue;
      }
      normalized.push(trimmed.endsWith('_') ? trimmed : `${trimmed}_`);
    }
    return normalized;
  }

  protected static async looksLikeSvelteKit(cwd: string): Promise<boolean> {
    const pkgPath = await this.findUp(cwd, 'package.json');
    if (!pkgPath) {
      return false;
    }
    try {
      const pkg = JSON.parse(await readFile(pkgPath, 'utf8')) as {
        readonly dependencies?: Readonly<Record<string, string>>;
        readonly devDependencies?: Readonly<Record<string, string>>;
      };
      const deps = { ...pkg.dependencies, ...pkg.devDependencies };
      return Boolean(deps['@sveltejs/kit'] || deps['svelte']);
    } catch {
      return false;
    }
  }

  /**
   * Nearest `turbo.json` (cwd upwards) in strict env mode, with injected keys
   * not declared in any env / passThroughEnv list.
   */
  public static async findTurboUndeclared(
    cwd: string,
    keys: readonly string[]
  ): Promise<{ file: string; keys: string[] } | null> {
    const found = await this.findUp(cwd, 'turbo.json');
    if (!found) {
      return null;
    }

    let config: TurboConfigType;
    try {
      config = JSON.parse(
        this.stripJsonComments(await readFile(found, 'utf8'))
      ) as TurboConfigType;
    } catch {
      return null;
    }

    if (!this.isTurboStrict(config)) {
      return null;
    }

    const patterns = this.turboDeclaredPatterns(config);
    return {
      file: relative(cwd, found) || 'turbo.json',
      keys: keys.filter((key) => !patterns.some((p) => this.matchEnv(p, key)))
    };
  }

  /**
   * Turbo 2 (`tasks`) defaults to strict; Turbo 1 (`pipeline`) to loose.
   */
  public static isTurboStrict(config: TurboConfigType): boolean {
    if (config.envMode) {
      return config.envMode === 'strict';
    }
    return config.tasks !== undefined;
  }

  public static turboDeclaredPatterns(config: TurboConfigType): string[] {
    const patterns = [
      ...(config.globalEnv ?? []),
      ...(config.globalPassThroughEnv ?? [])
    ];
    for (const task of Object.values(config.tasks ?? config.pipeline ?? {})) {
      patterns.push(...(task.env ?? []), ...(task.passThroughEnv ?? []));
    }
    return patterns.filter((pattern) => !pattern.startsWith('!'));
  }

  /**
   * Turbo env pattern match (`*` wildcard).
   */
  public static matchEnv(pattern: string, key: string): boolean {
    if (!pattern.includes('*')) {
      return pattern === key;
    }
    const source = pattern
      .split('*')
      .map((part) => part.replace(/[.+?^${}()|[\]\\]/g, '\\$&'))
      .join('.*');
    return new RegExp(`^${source}$`).test(key);
  }

  protected static async findUp(
    start: string,
    fileName: string
  ): Promise<string | null> {
    let dir = start;
    for (;;) {
      const candidate = join(dir, fileName);
      try {
        await readFile(candidate);
        return candidate;
      } catch {
        // keep walking up
      }
      const parent = dirname(dir);
      if (parent === dir) {
        return null;
      }
      dir = parent;
    }
  }

  /** turbo.json allows `//` and `/* *\/` comments. */
  protected static stripJsonComments(text: string): string {
    return text.replace(
      /("(?:\\.|[^"\\])*")|\/\/[^\n]*|\/\*[\s\S]*?\*\//g,
      (_match, quoted: string | undefined) => quoted ?? ''
    );
  }

  protected static listKeys(keys: readonly string[]): string {
    const listed = keys.slice(0, MAX_LISTED_KEYS).join(', ');
    return keys.length > MAX_LISTED_KEYS
      ? `${listed}, +${keys.length - MAX_LISTED_KEYS}`
      : listed;
  }
}
