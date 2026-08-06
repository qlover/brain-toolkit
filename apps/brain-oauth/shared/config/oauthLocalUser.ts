/**
 * Defaults for syncing upstream IdP users into local auth.users.
 * Copy to fe-base next-oauth and change `provider` / `linksTable` / domain only.
 */
export const oauthLocalUserConfig = {
  /** Upstream IdP key stored in app_metadata.provider and links.provider */
  provider: 'brain',
  /** Public table mapping auth.users.id ↔ external id */
  linksTable: 'brain_oauth_user_links',
  /**
   * Domain for synthetic emails when upstream has no email.
   * Final address: `{externalUserId}@{provider}.{syntheticEmailDomain}`
   */
  syntheticEmailDomain: 'users.local'
} as const;

export type OAuthLocalUserConfig = typeof oauthLocalUserConfig;
