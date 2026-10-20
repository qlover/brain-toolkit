import { i18nConfig, type LocaleType } from '@config/i18n';

const LOCALE_COOKIE_MAX_AGE_SEC = 60 * 60 * 24 * 365;

/** Persistent locale preference cookie (next-intl `localeCookie`). */
export const localeCookieConfig = {
  name: i18nConfig.storageKey,
  sameSite: 'lax' as const,
  path: '/',
  maxAge: LOCALE_COOKIE_MAX_AGE_SEC
};

/** Query keys that can force locale (SSO / shared links). */
export const LOCALE_PREFERENCE_QUERY_KEYS = ['ui_locales', 'locale'] as const;

/**
 * Persist locale for subsequent requests (Pages soft nav does not hit middleware).
 * Safe to call from client components only.
 */
export function persistLocaleCookie(locale: LocaleType): void {
  if (typeof document === 'undefined') {
    return;
  }
  const { name, path, maxAge, sameSite } = localeCookieConfig;
  document.cookie = [
    `${name}=${encodeURIComponent(locale)}`,
    `path=${path}`,
    `max-age=${maxAge}`,
    `samesite=${sameSite}`
  ].join('; ');
}
