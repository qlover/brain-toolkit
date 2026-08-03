/**
 * Serializes PAM variables to dotenv text for CLI export.
 *
 * Significance: Produces standard KEY=VALUE files for local use.
 * Core idea: Quote values that need escaping; write stored comment lines as-is.
 * Main function: Convert variable arrays to dotenv strings.
 * Main purpose: Owner-only export without browser involvement.
 *
 * @example
 * const text = PAMEnvDotenvSerializeUtil.serialize(variables);
 */
export class PAMEnvDotenvSerializeUtil {
  /**
   * @param variables - Decrypted / plaintext variables
   * @returns Dotenv body
   */
  public static serialize(
    variables: ReadonlyArray<{
      readonly key: string;
      readonly value: string;
      readonly comments?: readonly string[];
    }>
  ): string {
    return variables
      .map((variable) => {
        const line = `${variable.key}=${this.escapeValue(variable.value)}`;
        const comments = variable.comments?.filter(
          (item) => typeof item === 'string'
        );
        if (!comments || comments.length === 0) {
          return line;
        }
        return `${comments.join('\n')}\n${line}`;
      })
      .join('\n');
  }

  /**
   * @param value - Raw value
   * @returns Escaped dotenv value fragment
   */
  public static escapeValue(value: string): string {
    if (value === '') {
      return '""';
    }
    if (/[\s#"']/.test(value) || value.includes('\\') || value.includes('\n')) {
      return `"${value
        .replace(/\\/g, '\\\\')
        .replace(/"/g, '\\"')
        .replace(/\n/g, '\\n')}"`;
    }
    return value;
  }
}
