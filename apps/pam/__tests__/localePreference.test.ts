import { describe, expect, it } from 'vitest';
import {
  getPathLocale,
  parsePreferredLocaleParam,
  stripLocalePrefix,
  withLocalePrefix
} from '@shared/utils/localePreference';

describe('localePreference', () => {
  it('parses ui_locales and locale query', () => {
    expect(
      parsePreferredLocaleParam(new URLSearchParams('ui_locales=zh'))
    ).toBe('zh');
    expect(
      parsePreferredLocaleParam(new URLSearchParams('ui_locales=zh-CN en'))
    ).toBe('zh');
    expect(parsePreferredLocaleParam(new URLSearchParams('locale=en'))).toBe(
      'en'
    );
    expect(parsePreferredLocaleParam(new URLSearchParams(''))).toBeNull();
  });

  it('rewrites path with locale prefix', () => {
    expect(getPathLocale('/en/oauth/authorize')).toBe('en');
    expect(getPathLocale('/oauth/authorize')).toBeNull();
    expect(stripLocalePrefix('/zh/oauth/authorize')).toBe('/oauth/authorize');
    expect(withLocalePrefix('zh', '/oauth/authorize')).toBe(
      '/zh/oauth/authorize'
    );
    expect(withLocalePrefix('zh', '/en/oauth/authorize')).toBe(
      '/zh/oauth/authorize'
    );
  });
});
