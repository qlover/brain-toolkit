/**
 * Shared config and path constants for pamenv.
 *
 * Significance: Centralizes local CLI state paths and defaults.
 * Core idea: Auth config lives under `~/.pam`, or `cwd/.pam` with `--local`.
 * Main function: Resolve home/local paths and normalize PAM origins.
 * Main purpose: Keep file layout consistent across commands.
 *
 * @example
 * const root = PamCliConfig.getHomeRoot();
 */
export class PamCliConfig {
  public static readonly CONFIG_FILE_NAME = 'config.json' as const;
  public static readonly SYNC_DIR_NAME = 'sync' as const;
  public static readonly PAM_DIR_NAME = '.pam' as const;
  public static readonly DEFAULT_BASE_URL = 'https://pam.qlover.top' as const;
  public static readonly DEFAULT_LOCALE = 'en' as const;
  public static readonly SUPPORTED_LOCALES = ['en', 'zh'] as const;

  /**
   * @returns Absolute path to `~/.pam`
   */
  public static getHomeRoot(): string {
    const home = process.env.HOME || process.env.USERPROFILE || '.';
    return `${home}/${this.PAM_DIR_NAME}`;
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
   * @returns Absolute snapshot JSON path under home
   */
  public static getSyncSnapshotPath(projectId: string, envName: string): string {
    const safeEnv = envName.trim().replace(/[^a-zA-Z0-9._-]+/g, '_');
    return `${this.getSyncRoot()}/${projectId}/${safeEnv}.json`;
  }

  /**
   * @param cwd - Working directory (usually process.cwd() or `-o`)
   * @returns Absolute path to `{cwd}/.pam`
   */
  public static getLocalRoot(cwd: string): string {
    return `${cwd.replace(/[/\\]+$/, '')}/${this.PAM_DIR_NAME}`;
  }

  /**
   * @param cwd - Working directory
   * @returns Absolute path to `{cwd}/.pam/config.json`
   */
  public static getLocalConfigPath(cwd: string): string {
    return `${this.getLocalRoot(cwd)}/${this.CONFIG_FILE_NAME}`;
  }

  /**
   * @param cwd - Working directory
   * @returns Absolute path to `{cwd}/.pam/sync`
   */
  public static getLocalSyncRoot(cwd: string): string {
    return `${this.getLocalRoot(cwd)}/${this.SYNC_DIR_NAME}`;
  }

  /**
   * @param cwd - Working directory
   * @param projectId - Project uuid
   * @param envName - Environment name
   * @returns Absolute local snapshot path
   */
  public static getLocalSyncSnapshotPath(
    cwd: string,
    projectId: string,
    envName: string
  ): string {
    const safeEnv = envName.trim().replace(/[^a-zA-Z0-9._-]+/g, '_');
    return `${this.getLocalSyncRoot(cwd)}/${projectId}/${safeEnv}.json`;
  }

  /**
   * @param input - Raw locale string
   * @returns Normalized locale or null when unsupported
   */
  public static parseLocale(input: string): 'en' | 'zh' | null {
    const normalized = input.trim().toLowerCase();
    if (
      (this.SUPPORTED_LOCALES as readonly string[]).includes(normalized)
    ) {
      return normalized as 'en' | 'zh';
    }
    return null;
  }

  /**
   * Normalizes PAM host / URL to an origin without trailing slash.
   *
   * Bare hosts (`pam.localhost:3400`) get `http://` for localhost / private
   * IPs and `https://` otherwise. Values that already include a scheme are
   * only trimmed of trailing slashes.
   *
   * @param input - Full URL or bare host[:port]
   */
  public static normalizeOrigin(input: string): string {
    const trimmed = input.trim().replace(/\/+$/, '');
    if (!trimmed) {
      return this.DEFAULT_BASE_URL;
    }

    if (/^https?:\/\//i.test(trimmed)) {
      return trimmed.replace(/\/+$/, '');
    }

    const host = trimmed.split('/')[0] || trimmed;
    const scheme = this.shouldUseHttp(host) ? 'http' : 'https';
    return `${scheme}://${host}`;
  }

  /**
   * Builds a browser URL for the project general tab.
   *
   * @param baseUrl - PAM origin (domain)
   * @param locale - UI locale segment (`en` | `zh`)
   * @param slug - Project slug
   * @returns Absolute URL like `{baseUrl}/{locale}/projects/{slug}/general`
   */
  public static buildProjectGeneralUrl(
    baseUrl: string,
    locale: string,
    slug: string
  ): string {
    const origin = this.normalizeOrigin(baseUrl);
    const lang = this.parseLocale(locale) || this.DEFAULT_LOCALE;
    return `${origin}/${lang}/projects/${encodeURIComponent(slug)}/general`;
  }

  protected static shouldUseHttp(host: string): boolean {
    const hostname = host.replace(/^\[|\]$/g, '').split(':')[0]?.toLowerCase();
    if (!hostname) {
      return false;
    }
    if (hostname === 'localhost' || hostname.endsWith('.localhost')) {
      return true;
    }
    if (hostname === '127.0.0.1' || hostname === '::1') {
      return true;
    }
    // RFC1918-ish private IPv4
    if (/^10\.\d{1,3}\.\d{1,3}\.\d{1,3}$/.test(hostname)) {
      return true;
    }
    if (/^192\.168\.\d{1,3}\.\d{1,3}$/.test(hostname)) {
      return true;
    }
    if (/^172\.(1[6-9]|2\d|3[0-1])\.\d{1,3}\.\d{1,3}$/.test(hostname)) {
      return true;
    }
    return false;
  }
}
