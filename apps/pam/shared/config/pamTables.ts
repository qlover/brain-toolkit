/**
 * PAM Postgres / Supabase public table names.
 * Keep in sync with makes/sql/000-pam-full-schema.sql
 *
 * Apps sharing one DB (e.g. fe-base) should use their own prefix
 * (`fe_oauth_*`, `fe_request_logs`) — distinguish by table name only.
 */
export const PamTables = {
  requestLogs: 'pam_request_logs',
  oauthClients: 'pam_oauth_clients',
  oauthAuthorizationCodes: 'pam_oauth_authorization_codes',
  oauthRefreshTokens: 'pam_oauth_refresh_tokens',
  oauthUserCredentials: 'pam_oauth_user_credentials',
  cliTokens: 'pam_cli_tokens'
} as const;
