import type { OAuthConsentDeviceContext } from '@server/utils/oauthConsentDevice';
import type { UserSchema } from '@qlover/next-kit/common';
import type {
  OAuthAuthorizePageData,
  OAuthConsentResult,
  OAuthProviderInterface,
  OAuthSessionPayload,
  OAuthOTPProviderInterface
} from '@qlover/oauth-wrapper';
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
   * Signed-in user embedded in the app session cookie (no upstream call).
   * Used by the consent page to show which account is authorizing.
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
   * Issues the consent result and, for a trusted allow with a device id,
   * remembers the grant for that device.
   */
  processConsent(
    requestBody: unknown,
    device?: OAuthConsentDeviceContext
  ): Promise<OAuthConsentResult>;

  /**
   * Issues a code without the consent page when this device holds an active
   * grant covering every requested scope; otherwise `null`.
   */
  tryAutoConsent(
    data: OAuthAuthorizePageData,
    device?: OAuthConsentDeviceContext
  ): Promise<OAuthConsentResult | null>;
}
