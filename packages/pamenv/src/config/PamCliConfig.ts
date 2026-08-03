/**
 * Shared config and path constants for pamenv.
 *
 * Significance: Centralizes local CLI state paths and defaults.
 * Core idea: Auth config lives under `~/.pam`.
 * Main function: Resolve home and config paths.
 * Main purpose: Keep file layout consistent across commands.
 *
 * @example
 * const root = PamCliConfig.getHomeRoot();
 */
export class PamCliConfig {
  public static readonly CONFIG_FILE_NAME = 'config.json' as const;
  public static readonly SYNC_DIR_NAME = 'sync' as const;
  public static readonly DEFAULT_BASE_URL = 'https://pam.qlover.top' as const;

  /**
   * @returns Absolute path to `~/.pam`
   */
  public static getHomeRoot(): string {
    const home = process.env.HOME || process.env.USERPROFILE || '.';
    return `${home}/.pam`;
  }

  /**
   * @returns Absolute path to `~/.pam/config.json`
   */
  public static getConfigPath(): string {
    return `${this.getHomeRoot()}/${this.CONFIG_FILE_NAME}`;
  }

  /**
   * @returns Absolute path to `~/.pam/sync`
   */
  public static getSyncRoot(): string {
    return `${this.getHomeRoot()}/${this.SYNC_DIR_NAME}`;
  }

  /**
   * @param projectId - Project uuid
   * @param envName - Environment name
   * @returns Absolute snapshot JSON path
   */
  public static getSyncSnapshotPath(projectId: string, envName: string): string {
    const safeEnv = envName.trim().replace(/[^a-zA-Z0-9._-]+/g, '_');
    return `${this.getSyncRoot()}/${projectId}/${safeEnv}.json`;
  }
}
