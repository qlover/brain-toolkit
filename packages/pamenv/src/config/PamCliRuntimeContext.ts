/**
 * Process-level pamenv runtime options (CLI flags).
 *
 * Significance: Selects config/sync root and optional host override.
 * Core idea: Home `~/.pam` by default; `--local` isolates under workingDir.
 */
export type PamCliRuntimeContextType = {
  /** When true, config + sync use `{workingDir}/.pam` instead of `~/.pam`. */
  readonly preferLocal: boolean;
  /** Base directory for `--local` paths (cwd or command `-o`). */
  readonly workingDir: string;
  /** Optional one-shot PAM origin from `--url` / `--domain`. */
  readonly urlOverride?: string;
};

/**
 * Builds a default runtime bound to the current working directory.
 */
export function createPamCliRuntimeContext(
  partial?: Partial<PamCliRuntimeContextType>
): PamCliRuntimeContextType {
  return {
    preferLocal: partial?.preferLocal ?? false,
    workingDir: partial?.workingDir ?? process.cwd(),
    ...(partial?.urlOverride
      ? { urlOverride: partial.urlOverride }
      : {})
  };
}
