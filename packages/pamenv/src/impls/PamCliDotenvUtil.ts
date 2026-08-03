/**
 * Parsed dotenv variable with optional comments and sensitive marker.
 */
export type PamCliParsedVarType = {
  readonly key: string;
  readonly value: string;
  readonly sensitive: boolean;
  /**
   * Raw lines above this variable (comments / blanks), excluding `# pam:sensitive`.
   */
  readonly comments: readonly string[];
  /**
   * Same-line trailing comment including leading spaces, e.g. ` # note`.
   */
  readonly trailingComment: string;
};

/**
 * Full dotenv file document (variables + trailing orphan comments).
 */
export type PamCliDotenvDocumentType = {
  readonly variables: readonly PamCliParsedVarType[];
  readonly trailingComments: readonly string[];
};

/**
 * Dotenv serialize / parse helpers for pamenv.
 *
 * Significance: Convert between PAM variable lists and `.env` text.
 * Core idea: Preserve per-variable comments and `# pam:sensitive` markers.
 * Main function: Parse/serialize dotenv documents for pull/push.
 * Main purpose: Round-trip local files with minimal formatting loss.
 *
 * @example
 * const doc = PamCliDotenvUtil.parseDocument(text);
 * const out = PamCliDotenvUtil.serializeDocument(doc);
 */
export class PamCliDotenvUtil {
  public static readonly SENSITIVE_MARKER = '# pam:sensitive' as const;

  /**
   * Parses dotenv text into a document with comments attached to variables.
   *
   * @param text - Dotenv body
   */
  public static parseDocument(text: string): PamCliDotenvDocumentType {
    const variables: PamCliParsedVarType[] = [];
    const seen = new Set<string>();
    let pendingComments: string[] = [];
    let nextSensitive = false;

    const lines = text.split(/\r?\n/);
    // Drop a single trailing empty segment from final newline so it does not
    // become a spurious trailing comment; serialize always ends with `\n`.
    if (lines.length > 0 && lines[lines.length - 1] === '') {
      lines.pop();
    }

    for (const rawLine of lines) {
      const line = rawLine.trim();

      if (line === this.SENSITIVE_MARKER) {
        nextSensitive = true;
        continue;
      }

      if (line === '' || line.startsWith('#')) {
        pendingComments.push(rawLine);
        continue;
      }

      const separatorIndex = rawLine.indexOf('=');
      if (separatorIndex <= 0) {
        pendingComments.push(rawLine);
        nextSensitive = false;
        continue;
      }

      const keyPart = rawLine.slice(0, separatorIndex);
      const key = keyPart.trim();
      if (key === '' || key.includes(' ')) {
        pendingComments.push(rawLine);
        nextSensitive = false;
        continue;
      }

      const valuePart = rawLine.slice(separatorIndex + 1);
      const { value, trailingComment } = this.splitValueAndTrailing(valuePart);
      const sensitive = nextSensitive;
      nextSensitive = false;

      const comments = pendingComments;
      pendingComments = [];

      if (seen.has(key)) {
        continue;
      }
      seen.add(key);
      variables.push({
        key,
        value,
        sensitive,
        comments,
        trailingComment
      });
    }

    return {
      variables,
      trailingComments: pendingComments
    };
  }

  /**
   * Parses dotenv text into variables (document.variables).
   *
   * @param text - Dotenv body
   */
  public static parse(text: string): PamCliParsedVarType[] {
    return [...this.parseDocument(text).variables];
  }

  /**
   * Serializes a full document, preserving comments and sensitive markers.
   *
   * @param document - Parsed document
   */
  public static serializeDocument(document: PamCliDotenvDocumentType): string {
    const chunks: string[] = [];

    for (const variable of document.variables) {
      for (const comment of variable.comments) {
        chunks.push(comment);
      }
      if (variable.sensitive) {
        chunks.push(this.SENSITIVE_MARKER);
      }
      chunks.push(
        `${variable.key}=${this.escapeValue(variable.value)}${variable.trailingComment}`
      );
    }

    for (const comment of document.trailingComments) {
      chunks.push(comment);
    }

    return `${chunks.join('\n')}\n`;
  }

  /**
   * Serializes variables (no trailing orphan comments).
   *
   * @param variables - Ordered variables
   */
  public static serialize(
    variables: ReadonlyArray<{
      readonly key: string;
      readonly value: string;
      readonly sensitive?: boolean;
      readonly comments?: readonly string[];
      readonly trailingComment?: string;
    }>
  ): string {
    return this.serializeDocument({
      variables: variables.map((variable) => ({
        key: variable.key,
        value: variable.value,
        sensitive: variable.sensitive === true,
        comments: variable.comments ? [...variable.comments] : [],
        trailingComment: variable.trailingComment || ''
      })),
      trailingComments: []
    });
  }

  /**
   * Merges remote semantic values onto local comment layout.
   *
   * Remote key order / values / sensitive win. Comments: remote wins when the
   * remote variable carries any; otherwise local comments are kept (for
   * older remotes that do not store comments yet).
   *
   * @param local - Local document (fallback comments source)
   * @param remoteVariables - Remote variables (order preserved)
   */
  public static mergeRemotePreservingComments(
    local: PamCliDotenvDocumentType | null,
    remoteVariables: ReadonlyArray<{
      readonly key: string;
      readonly value: string;
      readonly sensitive: boolean;
      readonly comments?: readonly string[];
      readonly trailingComment?: string;
    }>
  ): PamCliDotenvDocumentType {
    const localByKey = new Map(
      (local?.variables || []).map((item) => [item.key, item])
    );

    return {
      variables: remoteVariables.map((remote) => {
        const previous = localByKey.get(remote.key);
        const remoteComments = remote.comments ? [...remote.comments] : [];
        const remoteTrailing = remote.trailingComment || '';
        const hasRemoteComments =
          remoteComments.length > 0 || remoteTrailing.trim() !== '';

        return {
          key: remote.key,
          value: remote.value,
          sensitive: remote.sensitive,
          comments: hasRemoteComments
            ? remoteComments
            : previous
              ? [...previous.comments]
              : [],
          trailingComment: hasRemoteComments
            ? remoteTrailing
            : previous?.trailingComment || ''
        };
      }),
      trailingComments: local ? [...local.trailingComments] : []
    };
  }

  /**
   * Builds API `comments` from a parsed local variable (block + trailing).
   *
   * @param variable - Parsed dotenv variable
   */
  public static toApiComments(
    variable: Pick<PamCliParsedVarType, 'comments' | 'trailingComment'>
  ): string[] | undefined {
    const comments = [...variable.comments];
    const trailing = variable.trailingComment.trimStart();
    if (trailing !== '') {
      comments.push(trailing);
    }
    return comments.length > 0 ? comments : undefined;
  }

  /**
   * Builds a key → value map for semantic comparison / sync snapshots.
   *
   * @param variables - Variables
   */
  public static toValueMap(
    variables: ReadonlyArray<{ readonly key: string; readonly value: string }>
  ): Record<string, string> {
    const map: Record<string, string> = {};
    for (const variable of variables) {
      map[variable.key] = variable.value;
    }
    return map;
  }

  /**
   * Semantic equality of key/value maps (order ignored).
   *
   * @param left - Left map
   * @param right - Right map
   */
  public static valueMapsEqual(
    left: Readonly<Record<string, string>>,
    right: Readonly<Record<string, string>>
  ): boolean {
    const leftKeys = Object.keys(left).sort();
    const rightKeys = Object.keys(right).sort();
    if (leftKeys.length !== rightKeys.length) {
      return false;
    }
    for (let i = 0; i < leftKeys.length; i += 1) {
      const key = leftKeys[i]!;
      if (key !== rightKeys[i] || left[key] !== right[key]) {
        return false;
      }
    }
    return true;
  }

  /**
   * Splits a raw value segment into unquoted value + trailing comment.
   *
   * @param valuePart - Text after `=`
   */
  protected static splitValueAndTrailing(valuePart: string): {
    value: string;
    trailingComment: string;
  } {
    const trimmedStart = valuePart.replace(/^\s+/, '');

    if (
      trimmedStart.startsWith('"') ||
      trimmedStart.startsWith("'")
    ) {
      const quote = trimmedStart[0]!;
      let i = 1;
      let escaped = false;
      while (i < trimmedStart.length) {
        const ch = trimmedStart[i]!;
        if (escaped) {
          escaped = false;
          i += 1;
          continue;
        }
        if (ch === '\\' && quote === '"') {
          escaped = true;
          i += 1;
          continue;
        }
        if (ch === quote) {
          const quoted = trimmedStart.slice(0, i + 1);
          const rest = trimmedStart.slice(i + 1);
          const value = this.unquote(quoted);
          return {
            value,
            trailingComment: rest.length > 0 ? rest : ''
          };
        }
        i += 1;
      }
    }

    const commentMatch = valuePart.match(/^(.*?)(\s+#.*)$/);
    if (commentMatch) {
      return {
        value: commentMatch[1]!.trimEnd(),
        trailingComment: commentMatch[2] || ''
      };
    }

    return {
      value: valuePart.trim(),
      trailingComment: ''
    };
  }

  /**
   * @param quoted - Quoted or raw fragment
   */
  protected static unquote(quoted: string): string {
    const value = quoted.trim();
    if (
      (value.startsWith('"') && value.endsWith('"') && value.length >= 2) ||
      (value.startsWith("'") && value.endsWith("'") && value.length >= 2)
    ) {
      const inner = value.slice(1, -1);
      if (value.startsWith('"')) {
        return inner
          .replace(/\\n/g, '\n')
          .replace(/\\"/g, '"')
          .replace(/\\\\/g, '\\');
      }
      return inner;
    }
    return value;
  }

  /**
   * Escapes a dotenv value (quotes when needed).
   *
   * @param value - Raw value
   * @returns Escaped value fragment after `=`
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
