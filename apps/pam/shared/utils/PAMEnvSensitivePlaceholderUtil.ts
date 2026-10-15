/**
 * Sensitive placeholders written by `pamenv pull` / `render` instead of
 * secret values.
 *
 * Significance: An empty value can be mistaken for "really empty"; a
 * placeholder is unambiguous and cannot be confused with a real secret.
 * Core idea: One stable placeholder per environment, `__PAM_SENSITIVE_<hex>__`.
 * Writing back this environment's placeholder means "keep the stored value";
 * any other value with the prefix is rejected.
 *
 * Keep the prefix in sync with `packages/pamenv` (PamCliSensitivePlaceholderUtil).
 */
export class PAMEnvSensitivePlaceholderUtil {
  public static readonly PREFIX = '__PAM_SENSITIVE_';

  public static readonly SUFFIX = '__';

  public static isPlaceholder(value: string): boolean {
    return value.startsWith(this.PREFIX);
  }

  public static format(token: string): string {
    return `${this.PREFIX}${token}${this.SUFFIX}`;
  }
}
