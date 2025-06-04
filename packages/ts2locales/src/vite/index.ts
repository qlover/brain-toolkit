import type { Plugin } from 'vite';
import { Ts2Locales, Ts2LocalesValue } from '../lib/Ts2Locales';

type Ts2LocalesOptions = {
  /**
   *
   * @default `['en', 'zh']`
   */
  locales?: string[];
  /**
   *
   * @default `[]`
   */
  options?: Ts2LocalesValue[];
};

export default (opts: Ts2LocalesOptions = {}): Plugin => {
  const { locales = ['en', 'zh'], options = [] } = opts;

  return {
    name: 'vite-env-config',
    async configResolved() {
      const ts2Locale = new Ts2Locales(locales);
      for (const value of options) {
        await ts2Locale.generate(value);
      }
    }
  };
};
