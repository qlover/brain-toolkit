import type {
  OAuthAuthorizationCodeRow,
  OAuthClientRow
} from '@schemas/oauth/OAuthAuthorizeSchema';
import type { OAuthRefreshTokenRow } from '@schemas/oauth/OAuthClientSchema';
import type { SeedServerConfigInterface } from '@interfaces/SeedConfigInterface';

/** Base64-encoded 32-byte key for {@link TokenEncryption} in tests. */
export const testEncryptionKey = Buffer.alloc(32, 7).toString('base64');

export const testOAuthClient: OAuthClientRow = {
  id: 1,
  client_id: 'client_test',
  client_secret_hash: 'scrypt$mock',
  client_name: 'Test App',
  redirect_uris: ['https://app.example/callback'],
  grant_types: ['authorization_code', 'refresh_token'],
  scopes: ['openid', 'profile', 'email'],
  confidential: true,
  owner_user_id: 1,
  created_at: '2026-01-01T00:00:00.000Z',
  updated_at: '2026-01-01T00:00:00.000Z'
};

export const testAuthCode: OAuthAuthorizationCodeRow = {
  code: 'auth_code_1',
  client_id: 'client_test',
  user_id: 42,
  redirect_uri: 'https://app.example/callback',
  scope: 'openid profile',
  expires_at: '2099-01-01T00:00:00.000Z',
  used: false,
  created_at: '2026-01-01T00:00:00.000Z'
};

export const testRefreshTokenRow = (
  overrides?: Partial<OAuthRefreshTokenRow>
): OAuthRefreshTokenRow => ({
  id: 1,
  refresh_token: 'hashed_refresh',
  client_id: 'client_test',
  user_id: 42,
  expires_at: '2099-01-01T00:00:00.000Z',
  revoked: false,
  created_at: '2026-01-01T00:00:00.000Z',
  ...overrides
});

export const testServerConfig = {
  encryptionKey: testEncryptionKey
} as SeedServerConfigInterface;
