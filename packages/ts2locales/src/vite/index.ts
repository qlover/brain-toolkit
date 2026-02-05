import type { Plugin } from 'vite';
import type { Ts2LocalesValue } from '../lib/Ts2Locales';
import { Ts2Locales } from '../lib/Ts2Locales';

/**
 * Option item: source path only (uses common target/resolveNs/resolveKeyInFile) or full overridable object
 */
export type Ts2LocalesOptionItem =
  | string
  | (Partial<Omit<Ts2LocalesValue, 'source'>> &
      Pick<Ts2LocalesValue, 'source'>);

/**
 * Common pattern applied to every generate call when not overridden by option item
 */
export type Ts2LocalesPluginOptions = {
  /**
   * @default `['en', 'zh']`
   */
  locales?: string[];
  /**
   * Common target template (required when any option is a string)
   */
  target?: string;
  /**
   * Common resolveNs (used when option item does not set resolveNs)
   */
  resolveNs?: Ts2LocalesValue['resolveNs'];
  /**
   * Common resolveKeyInFile (used when option item does not set resolveKeyInFile)
   */
  resolveKeyInFile?: Ts2LocalesValue['resolveKeyInFile'];
  /**
   * Each item: source path (string) or object with source + optional target/resolveNs/resolveKeyInFile.
   * Strings use common target/resolveNs/resolveKeyInFile. Objects merge with common (item overrides).
   * @default `[]`
   */
  options?: Ts2LocalesOptionItem[];
};

function normalizeOptions(opts: Ts2LocalesPluginOptions): Ts2LocalesValue[] {
  const {
    target: commonTarget,
    resolveNs: commonResolveNs,
    resolveKeyInFile: commonResolveKeyInFile
  } = opts;
  const options = opts.options ?? [];

  return options.map((item): Ts2LocalesValue => {
    if (typeof item === 'string') {
      if (commonTarget == null || commonTarget === '') {
        throw new Error(
          'vite-ts2locales: target is required when options include a string (source-only item)'
        );
      }
      return {
        source: item,
        target: commonTarget,
        resolveNs: commonResolveNs,
        resolveKeyInFile: commonResolveKeyInFile
      };
    }
    const merged: Ts2LocalesValue = {
      source: item.source,
      target: item.target ?? commonTarget ?? '',
      resolveNs: item.resolveNs ?? commonResolveNs,
      resolveKeyInFile: item.resolveKeyInFile ?? commonResolveKeyInFile
    };
    if (!merged.target) {
      throw new Error(
        'vite-ts2locales: target is required (set plugin target or per-option target)'
      );
    }
    return merged;
  });
}

export default (opts: Ts2LocalesPluginOptions = {}): Plugin => {
  const { locales = ['en', 'zh'] } = opts;
  const normalized = normalizeOptions(opts);

  return {
    name: 'vite-ts2locales',
    async configResolved() {
      const ts2Locale = new Ts2Locales(locales);
      for (const value of normalized) {
        await ts2Locale.generate(value);
      }
    }
  };
};
