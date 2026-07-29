/**
 * Parsed dotenv entry.
 */
export type PAMEnvParsedVarType = {
  readonly key: string;
  readonly value: string;
};

/**
 * Parses `.env` text into key/value pairs for import.
 *
 * Significance: Lets users bulk-add variables by pasting dotenv content.
 * Core idea: Line-oriented KEY=VALUE parsing with comments and quotes.
 * Main function: Convert pasted text into a unique key/value list.
 * Main purpose: Client-side import without a dedicated upload API.
 *
 * @example
 * const vars = PAMEnvDotenvParseUtil.parse('API_KEY="secret"\n# skip\nFOO=bar');
 */
export class PAMEnvDotenvParseUtil {
  /**
   * Checks whether a filename is allowed for dotenv file import.
   *
   * @param fileName - Original file name from the picker
   * @returns True when the file looks like `.env` / `.txt`
   */
  public static isAllowedImportFileName(fileName: string): boolean {
    const name = fileName.trim().toLowerCase();
    if (name === '.env' || name.startsWith('.env.')) {
      return true;
    }
    if (name.endsWith('.env') || name.endsWith('.txt')) {
      return true;
    }
    return false;
  }

  /**
   * Parses dotenv-like text.
   *
   * Rules:
   * - Skip empty lines and `#` comment lines
   * - Support `KEY=VALUE`, optional single/double quotes
   * - Unquoted values strip trailing `# comment`
   * - Duplicate keys keep the first occurrence
   * - Empty values are skipped
   *
   * @param text - Pasted dotenv content
   * @returns Parsed unique key/value pairs
   */
  public static parse(text: string): PAMEnvParsedVarType[] {
    const result: PAMEnvParsedVarType[] = [];
    const seen = new Set<string>();

    for (const rawLine of text.split(/\r?\n/)) {
      const line = rawLine.trim();
      if (line === '' || line.startsWith('#')) {
        continue;
      }

      const separatorIndex = line.indexOf('=');
      if (separatorIndex <= 0) {
        continue;
      }

      const key = line.slice(0, separatorIndex).trim();
      if (key === '' || key.includes(' ')) {
        continue;
      }

      let value = line.slice(separatorIndex + 1).trim();

      if (
        (value.startsWith('"') && value.endsWith('"') && value.length >= 2) ||
        (value.startsWith("'") && value.endsWith("'") && value.length >= 2)
      ) {
        value = value.slice(1, -1);
      } else {
        const commentIndex = value.indexOf(' #');
        if (commentIndex >= 0) {
          value = value.slice(0, commentIndex).trimEnd();
        }
      }

      if (value.trim() === '') {
        continue;
      }

      if (seen.has(key)) {
        continue;
      }
      seen.add(key);
      result.push({ key, value });
    }

    return result;
  }
}
