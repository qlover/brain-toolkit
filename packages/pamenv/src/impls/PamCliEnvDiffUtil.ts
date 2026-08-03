/**
 * Diff entry for push safety review.
 */
export type PamCliEnvDiffEntryType = {
  readonly key: string;
  readonly value: string;
  readonly sensitive: boolean;
};

/**
 * Local variable input for diffing.
 */
export type PamCliEnvDiffLocalVarType = {
  readonly key: string;
  readonly value: string;
  readonly sensitive?: boolean;
};

/**
 * Diff between remote and local dotenv variable maps.
 */
export type PamCliEnvDiffType = {
  readonly created: readonly PamCliEnvDiffEntryType[];
  readonly modified: readonly PamCliEnvDiffEntryType[];
  readonly deleted: readonly PamCliEnvDiffEntryType[];
  readonly addedKeyCount: number;
  readonly removedKeyCount: number;
  readonly remoteKeyCount: number;
  readonly isLargeKeyChange: boolean;
};

/**
 * Formatting options for terminal review output.
 */
export type PamCliEnvDiffFormatOptionsType = {
  /**
   * When true, print non-sensitive values in plaintext.
   * Sensitive / secret-looking keys stay masked. Default: false (mask all).
   */
  readonly showValues?: boolean;
};

/**
 * Compares remote vs local env variables for push review.
 *
 * Significance: Surfaces create/modify/delete before overwriting PAM.
 * Core idea: Diff by key; mask values by default; optional `--show-values`.
 * Main function: Build a structured diff and format review lines.
 * Main purpose: Safer `pamenv push` / `pamenv pull` confirmations.
 *
 * @example
 * const diff = PamCliEnvDiffUtil.diff(remote, local, sensitiveKeys);
 * console.log(PamCliEnvDiffUtil.formatReview(diff));
 */
export class PamCliEnvDiffUtil {
  public static readonly SENSITIVE_PLACEHOLDER = '*****' as const;

  /**
   * Heuristic: key names that usually hold secrets.
   *
   * @param key - Variable name
   */
  public static looksSensitiveKey(key: string): boolean {
    return /(SECRET|TOKEN|PASSWORD|PASSWD|PRIVATE_KEY|API_KEY|CREDENTIAL|AUTH|_KEY$)/i.test(
      key
    );
  }

  /**
   * Large key-name change when added+removed >= max(3, ceil(remote * 30%)).
   *
   * @param addedKeyCount - Keys only in local
   * @param removedKeyCount - Keys only in remote
   * @param remoteKeyCount - Remote key total
   */
  public static isLargeKeyChange(
    addedKeyCount: number,
    removedKeyCount: number,
    remoteKeyCount: number
  ): boolean {
    const threshold = Math.max(3, Math.ceil(remoteKeyCount * 0.3));
    return addedKeyCount + removedKeyCount >= threshold;
  }

  /**
   * Builds a push diff.
   *
   * @param remote - Remote key → decrypted value
   * @param local - Local variables (may include `# pam:sensitive`)
   * @param remoteSensitiveKeys - Keys marked sensitive on remote
   */
  public static diff(
    remote: ReadonlyMap<string, string>,
    local: ReadonlyArray<PamCliEnvDiffLocalVarType>,
    remoteSensitiveKeys: ReadonlySet<string>
  ): PamCliEnvDiffType {
    const created: PamCliEnvDiffEntryType[] = [];
    const modified: PamCliEnvDiffEntryType[] = [];
    const deleted: PamCliEnvDiffEntryType[] = [];
    const localMap = new Map(
      local.map((item) => [item.key, item] as const)
    );

    for (const item of local) {
      const sensitive = this.isSensitiveEntry(
        item.key,
        item.sensitive === true,
        remoteSensitiveKeys.has(item.key)
      );
      if (!remote.has(item.key)) {
        created.push({
          key: item.key,
          value: item.value,
          sensitive
        });
        continue;
      }
      if (remote.get(item.key) !== item.value) {
        modified.push({
          key: item.key,
          value: item.value,
          sensitive
        });
      }
    }

    for (const [key, value] of remote) {
      if (!localMap.has(key)) {
        deleted.push({
          key,
          value,
          sensitive: this.isSensitiveEntry(
            key,
            false,
            remoteSensitiveKeys.has(key)
          )
        });
      }
    }

    created.sort((a, b) => a.key.localeCompare(b.key));
    modified.sort((a, b) => a.key.localeCompare(b.key));
    deleted.sort((a, b) => a.key.localeCompare(b.key));

    const addedKeyCount = created.length;
    const removedKeyCount = deleted.length;
    const remoteKeyCount = remote.size;

    return {
      created,
      modified,
      deleted,
      addedKeyCount,
      removedKeyCount,
      remoteKeyCount,
      isLargeKeyChange: this.isLargeKeyChange(
        addedKeyCount,
        removedKeyCount,
        remoteKeyCount
      )
    };
  }

  /**
   * Formats one review line. Values are masked unless `showValues` and not sensitive.
   *
   * @param entry - Diff entry
   * @param options - Format options
   */
  public static formatLine(
    entry: PamCliEnvDiffEntryType,
    options: PamCliEnvDiffFormatOptionsType = {}
  ): string {
    const showPlain =
      options.showValues === true && entry.sensitive !== true;
    const value = showPlain ? entry.value : this.SENSITIVE_PLACEHOLDER;
    return `${entry.key}=${value}`;
  }

  /**
   * Formats a multi-section review block for the terminal.
   *
   * @param diff - Computed diff
   * @param options - Format options
   */
  public static formatReview(
    diff: PamCliEnvDiffType,
    options: PamCliEnvDiffFormatOptionsType = {}
  ): string {
    const sections: string[] = [];

    if (diff.created.length > 0) {
      sections.push(
        `Created (${diff.created.length}):`,
        ...diff.created.map((entry) => `  ${this.formatLine(entry, options)}`)
      );
    }
    if (diff.modified.length > 0) {
      sections.push(
        `Modified (${diff.modified.length}):`,
        ...diff.modified.map((entry) => `  ${this.formatLine(entry, options)}`)
      );
    }
    if (diff.deleted.length > 0) {
      sections.push(
        `Deleted (${diff.deleted.length}):`,
        ...diff.deleted.map((entry) => `  ${this.formatLine(entry, options)}`)
      );
    }

    if (sections.length === 0) {
      return 'No variable changes detected.';
    }

    return sections.join('\n');
  }

  /**
   * @param key - Variable name
   * @param localSensitive - Local `# pam:sensitive` / flag
   * @param remoteSensitive - Remote sensitive flag
   */
  protected static isSensitiveEntry(
    key: string,
    localSensitive: boolean,
    remoteSensitive: boolean
  ): boolean {
    return localSensitive || remoteSensitive || this.looksSensitiveKey(key);
  }
}
