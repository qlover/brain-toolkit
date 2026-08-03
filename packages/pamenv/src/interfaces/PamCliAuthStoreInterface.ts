import type { PamCliConfigFileType } from './PamCliTypes';

/**
 * Local auth / config persistence for pamenv.
 *
 * Significance: Stores base URL and CLI bearer token on disk.
 * Core idea: Token never leaves `~/.pam/config.json`.
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
}
