/**
 * Defaults for syncing upstream IdP users into the local users table.
 * Copy to fe-base next-oauth and change `provider` / tables / domain only.
 */
export const oauthLocalUserConfig = {
  /** Upstream IdP key stored in links.provider */
  provider: 'brain',
  /** Local users table; its `id` is the session / owner id */
  usersTable: 'brain_oauth_users',
  /** Public table mapping users.id ↔ external id */
  linksTable: 'brain_oauth_user_links',
  /** Server-only request / auth log table */
  requestLogsTable: 'brain_oauth_request_logs',
  /**
   * Domain for synthetic emails when upstream has no email.
   * Final address: `{externalUserId}@{provider}.{syntheticEmailDomain}`
   */
  syntheticEmailDomain: 'users.local'
} as const;

export type OAuthLocalUserConfig = typeof oauthLocalUserConfig;
