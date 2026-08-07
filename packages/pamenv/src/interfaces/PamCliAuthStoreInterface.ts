import type {
  PamCliConfigFileType,
  PamCliLocaleType
} from './PamCliTypes';

/**
 * Local auth / config persistence for pamenv.
 *
 * Significance: Stores base URL, locale, and CLI bearer token on disk.
 * Core idea: Token never leaves the active `.pam/config.json`.
 * Main function: Read/write CLI credentials.
 * Main purpose: Support interactive login and authenticated API calls.
 */
export interface PamCliAuthStoreInterface {
  /**
   * @returns Current config (creates defaults when missing)
   */
  getConfig(): Promise<PamCliConfigFileType>;

  /**
   * @param baseUrl - PAM site origin, e.g. https://pam.example.com
   */
  setBaseUrl(baseUrl: string): Promise<void>;

  /**
   * @param locale - CLI locale (`en` | `zh`)
   */
  setLocale(locale: PamCliLocaleType): Promise<void>;

  /**
   * @returns Configured CLI locale
   */
  getLocale(): Promise<PamCliLocaleType>;

  /**
   * @param token - CLI bearer token
   * @param email - Logged-in email for display
   */
  setToken(token: string, email: string): Promise<void>;

  /**
   * Clears stored token while keeping baseUrl.
   */
  clearToken(): Promise<void>;

  /**
   * @returns Stored token or null
   */
  getToken(): Promise<string | null>;

  /**
   * @returns Configured PAM base URL
   */
  getBaseUrl(): Promise<string>;

  /**
   * @returns Absolute path of the config file currently in use
   */
  getActiveConfigPath(): string;

  /**
   * @returns Absolute `.pam` root currently in use
   */
  getActivePamRoot(): string;

  /**
   * @param locale - Locale code
   * @returns Absolute cached locale JSON path
   */
  getLocaleCachePath(locale: PamCliLocaleType): string;
}
