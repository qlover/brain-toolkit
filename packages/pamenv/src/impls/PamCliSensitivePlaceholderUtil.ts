/**
 * Sensitive placeholders that PAM export puts in place of secret values.
 *
 * Each environment has one stable placeholder (`__PAM_SENSITIVE_<hex>__`,
 * from export `sensitivePlaceholder`). Pushing it back means "keep the stored
 * secret"; any other value with the prefix is a mistake (e.g. copied from
 * another environment).
 *
 * Keep the prefix in sync with apps/pam `PAMEnvSensitivePlaceholderUtil`.
 */
export class PamCliSensitivePlaceholderUtil {
  public static readonly PREFIX = '__PAM_SENSITIVE_';

  public static isPlaceholder(value: string): boolean {
    return value.startsWith(this.PREFIX);
  }
}
