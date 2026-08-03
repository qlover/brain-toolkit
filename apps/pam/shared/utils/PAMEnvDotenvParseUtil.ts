/**
 * Parsed dotenv entry.
 */
export type PAMEnvParsedVarType = {
  readonly key: string;
  readonly value: string;
  readonly sensitive: boolean;
  /**
   * Raw comment lines above the key (and trailing `# …` as its own line), as-is.
   */
  readonly comments?: readonly string[];
};

/**
 * Parses `.env` text into key/value pairs for import.
 *
 * Significance: Lets users bulk-add variables by pasting dotenv content.
 * Core idea: Line-oriented KEY=VALUE with optional `# pam:sensitive` markers.
 * Main function: Convert pasted text into a unique key/value list.
 * Main purpose: Client-side import without a dedicated upload API.
 *
 * @example
 * const vars = PAMEnvDotenvParseUtil.parse(
 *   '# pam:sensitive\nAPI_KEY="secret"\nFOO=bar'
 * );
 */
export class PAMEnvDotenvParseUtil {
  public static readonly SENSITIVE_MARKER = '# pam:sensitive' as const;

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
   * - `# pam:sensitive` marks the next KEY=VALUE (comments may sit between)
   * - Other `#` lines (and blank lines between them) attach as raw `comments[]`
   * - Support `KEY=VALUE`, optional single/double quotes
   * - Unquoted trailing ` # …` becomes an extra comments entry (raw `# …`)
   * - Duplicate keys keep the first occurrence
   * - Empty values are skipped
   *
   * @param text - Pasted dotenv content
   * @returns Parsed unique key/value pairs
   */
  public static parse(text: string): PAMEnvParsedVarType[] {
    const result: PAMEnvParsedVarType[] = [];
    const seen = new Set<string>();
    let nextSensitive = false;
    let pendingComments: string[] = [];

    for (const rawLine of text.split(/\r?\n/)) {
      const line = rawLine.trim();
      if (line === this.SENSITIVE_MARKER) {
        nextSensitive = true;
        continue;
      }

      if (line === '' || line.startsWith('#')) {
        pendingComments.push(rawLine);
        continue;
      }

      const separatorIndex = line.indexOf('=');
      if (separatorIndex <= 0) {
        nextSensitive = false;
        pendingComments = [];
        continue;
      }

      const key = line.slice(0, separatorIndex).trim();
      if (key === '' || key.includes(' ')) {
        nextSensitive = false;
        pendingComments = [];
        continue;
      }

      let value = line.slice(separatorIndex + 1).trim();
      let trailingCommentLine: string | undefined;

      if (
        (value.startsWith('"') && value.endsWith('"') && value.length >= 2) ||
        (value.startsWith("'") && value.endsWith("'") && value.length >= 2)
      ) {
        value = value.slice(1, -1);
      } else {
        const commentIndex = value.indexOf(' #');
        if (commentIndex >= 0) {
          trailingCommentLine = value.slice(commentIndex).trimStart();
          value = value.slice(0, commentIndex).trimEnd();
        }
      }

      const sensitive = nextSensitive;
      nextSensitive = false;

      if (value.trim() === '') {
        pendingComments = [];
        continue;
      }

      if (seen.has(key)) {
        pendingComments = [];
        continue;
      }
      seen.add(key);

      if (trailingCommentLine !== undefined && trailingCommentLine !== '') {
        pendingComments.push(trailingCommentLine);
      }

      const comments = this.finalizeComments(pendingComments);
      pendingComments = [];

      result.push(
        comments === undefined
          ? { key, value, sensitive }
          : { key, value, sensitive, comments }
      );
    }

    return result;
  }

  /**
   * Drops leading/trailing blank lines; keeps inner blanks and `#` lines as-is.
   */
  private static finalizeComments(
    lines: readonly string[]
  ): readonly string[] | undefined {
    let start = 0;
    let end = lines.length;
    while (start < end && lines[start]!.trim() === '') {
      start += 1;
    }
    while (end > start && lines[end - 1]!.trim() === '') {
      end -= 1;
    }
    if (start >= end) {
      return undefined;
    }
    return lines.slice(start, end);
  }
}
