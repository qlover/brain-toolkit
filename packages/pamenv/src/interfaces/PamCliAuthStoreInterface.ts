import type {
  PamCliConfigFileType,
  PamCliLocaleSourceType,
  PamCliLocaleType
} from './PamCliTypes';

/**
 * Options when writing locale to config.
 */
export type PamCliSetLocaleOptionsType = {
  /** When true, later browser logins will not change locale. */
  readonly locked?: boolean;
  readonly source?: PamCliLocaleSourceType;
};

/**
 * Local auth / config persistence for pamenv.
 *
 * Significance: Stores base URL, locale, locale messages, and CLI bearer token.
 * Core idea: Everything lives in the active `.pam/config.json`.
 * Main function: Read/write CLI credentials and error-message catalog.
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
   * @param options - Lock / source metadata
   */
  setLocale(
    locale: PamCliLocaleType,
    options?: PamCliSetLocaleOptionsType
  ): Promise<void>;

  /**
   * @returns Configured CLI locale
   */
  getLocale(): Promise<PamCliLocaleType>;

  /**
   * Persists pulled locale messages for the current locale.
   *
   * @param messages - Filtered `api:` map
   */
  setLocaleMessages(messages: Readonly<Record<string, string>>): Promise<void>;

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
}
