import type { Plugin } from 'vite';
import type { Ts2LocalesValue } from '../lib/Ts2Locales';
import { Ts2Locales } from '../lib/Ts2Locales';

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
    name: 'vite-ts2locales',
    async configResolved() {
      const ts2Locale = new Ts2Locales(locales);
      for (const value of options) {
        await ts2Locale.generate(value);
      }
    }
  };
};
