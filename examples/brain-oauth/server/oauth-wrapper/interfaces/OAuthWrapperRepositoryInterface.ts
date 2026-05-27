import type { OAuthAuthorizationCodeRow } from '@schemas/oauth/OAuthAuthorizeSchema';
import type {
  OAuthUserCredentialsRow,
  OAuthRefreshTokenRow
} from '@schemas/oauth/OAuthClientSchema';
import type { CreateAuthorizationCodeInput } from '../repositorys/OAuthAuthorizationCodesRepository';
import type { CreateOAuthRefreshTokenInput } from '../repositorys/OAuthRefreshTokensRepository';

export interface OAuthWrapperRepositoryInterface {
  create(input: CreateAuthorizationCodeInput): Promise<void>;
  consumeCode(code: string): Promise<OAuthAuthorizationCodeRow | null>;

  getUserCredentials(userId: number): Promise<OAuthUserCredentialsRow | null>;
  upsertUserCredentials(
    userId: number,
    fields: {
      brain_refresh_token?: string | null;
      brain_session_token?: string | null;
    }
  ): Promise<void>;
  findRefreshToken(tokenHash: string): Promise<OAuthRefreshTokenRow | null>;

  upsertRefreshToken(input: {
    refresh_token: string;
    client_id: string;
    user_id: number;
    expires_at: string;
  }): Promise<void>;

  revokeRefreshToken(tokenHash: string): Promise<void>;

  findByTokenHash(tokenHash: string): Promise<OAuthRefreshTokenRow | null>;

  createRefreshToken(input: CreateOAuthRefreshTokenInput): Promise<void>;

  revokeByTokenHash(tokenHash: string): Promise<void>;
}
