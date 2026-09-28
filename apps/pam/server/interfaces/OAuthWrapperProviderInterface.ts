import type { OAuthConsentDeviceContext } from '@server/utils/oauthConsentDevice';
import type { UserSchema } from '@qlover/next-kit/common';
import type {
  OAuthAuthorizePageData,
  OAuthConsentResult,
  OAuthProviderInterface,
  OAuthSessionPayload,
  OAuthOTPProviderInterface
} from '@qlover/oauth-wrapper';
import type { Session as SupabaseSession } from '@supabase/supabase-js';

export interface OAuthWrapperProviderInterface
  extends OAuthProviderInterface<UserSchema, OAuthSessionPayload>,
    OAuthOTPProviderInterface {
  /**
   * OAuthWrapper 用户信息交换
   *
   * OAuthWrapper 包裹的登陆信息转换为 UserSchema 对象
   *
   * @param session
   */
  getUserSchema(session?: OAuthSessionPayload): Promise<UserSchema | null>;

  /**
   * Reads `user` embedded in the app session cookie only (no upstream refresh).
   */
  getEmbeddedUser(): Promise<UserSchema | null>;

  /**
   * /oauth/authorize 页面是否需要登录
   *
   * - 如果是包装某个 旧登录接口一版需要返回 true
   * - 如果使用supabase这样有auth server则返回false
   */
  hasNeedLogged(): boolean;

  clearSession(): Promise<void>;

  /**
   * Establish app session from an external provider session (e.g. Supabase magic link callback).
   * Providers that do not support this flow should throw.
   */
  loginWithSession?(session: SupabaseSession): Promise<void>;

  /**
   * Ensure `pam_oauth_user_credentials.provider_session_token` exists for
   * the current app session before issuing an authorization code. Phone-OTP
   * (and similar) users may have a browseable cookie without credentials.
   */
  ensureProviderCredentials?(): Promise<void>;

  /**
   * `device` enables "trust this app" on this device when the body has
   * `trust: true`.
   */
  processConsent(
    requestBody: unknown,
    device?: OAuthConsentDeviceContext
  ): Promise<OAuthConsentResult>;

  /**
   * Skip consent when the user trusted this client on this device for all
   * requested scopes and the trust has not expired. Returns `null` when the
   * consent page must be shown.
   */
  tryAutoConsent?(
    data: OAuthAuthorizePageData,
    device?: OAuthConsentDeviceContext
  ): Promise<OAuthConsentResult | null>;
}
