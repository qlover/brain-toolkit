/**
 * Immutable permission_key: sole permission identity (DB / session / UI / i18n).
 *
 * i18n key: `permission:{permission_key}`
 * UI test hook: `data-permission="{permission_key}"`
 */
export const PERMISSION_KEY_PATTERN = /^[A-Za-z_][A-Za-z0-9_]*$/;

export function isValidPermissionKey(value: unknown): value is string {
  return typeof value === 'string' && PERMISSION_KEY_PATTERN.test(value);
}

/** next-intl / ts2locales: `permission:{permission_key}` */
export function permissionI18nKey(permissionKey: string): string {
  return `permission:${permissionKey}`;
}
