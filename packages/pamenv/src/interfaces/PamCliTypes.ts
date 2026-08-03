/**
 * Persisted CLI configuration under `~/.pam/config.json`.
 */
export type PamCliConfigFileType = {
  readonly baseUrl: string;
  readonly token: string | null;
  readonly email: string | null;
  readonly updatedAt: string;
};

/**
 * Project summary returned by PAM search.
 */
export type PamCliProjectType = {
  readonly id: string;
  readonly slug: string;
  readonly name: string;
  readonly is_owner?: boolean;
  readonly environments?: readonly PamCliEnvironmentSummaryType[];
};

/**
 * Environment summary (no secret values).
 */
export type PamCliEnvironmentSummaryType = {
  readonly id: string;
  readonly name: string;
  readonly url?: string;
};

/**
 * Decrypted export payload from PAM.
 */
export type PamCliExportResultType = {
  readonly projectId: string;
  readonly projectSlug: string;
  readonly environmentId: string;
  readonly environmentName: string;
  readonly content: string;
  readonly sensitiveKeys?: readonly string[];
  /**
   * Preferred source for pull: decrypted variables with raw comment lines.
   * Older servers may omit this; CLI falls back to parsing `content`.
   */
  readonly variables?: readonly PamCliExportVariableType[];
};

/**
 * One decrypted variable from export (may include comments).
 */
export type PamCliExportVariableType = {
  readonly key: string;
  readonly value: string;
  readonly sensitive?: boolean;
  readonly comments?: readonly string[];
};

/**
 * Variable payload for environment replace / push.
 */
export type PamCliVariableInputType = {
  readonly key: string;
  readonly value: string;
  readonly sensitive?: boolean;
  /** Raw dotenv comment lines (including `#`), matching PAM JSONB shape. */
  readonly comments?: readonly string[];
};

/**
 * Environment detail from list API (variables may be redacted).
 */
export type PamCliRemoteEnvironmentType = {
  readonly id: string;
  readonly name: string;
  readonly url?: string;
  readonly variables?: readonly PamCliVariableInputType[];
};

/**
 * Options shared by pull / push.
 */
export type PamCliLocalEnvOptionsType = {
  readonly envName?: string;
  readonly outDir?: string;
  /** Skip ordinary confirmation prompts (not sync-conflict overwrite). */
  readonly yes?: boolean;
  /** Skip only sync/file conflict overwrite prompts. */
  readonly force?: boolean;
  /** Print non-sensitive values in diff review (default: mask all). */
  readonly showValues?: boolean;
};
