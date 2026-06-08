import type { LoginPhoneOtpSchema } from '@schemas/LoginSchema';
import type { UserSchema } from '@schemas/UserSchema';
import type {
  OAuthServiceInterface,
  OAuthSessionPayload,
  OAuthUserCredentials
} from '@qlover/oauth-wrapper';

export type LoginWithPhoneOTPResult = OAuthUserCredentials & {
  OTP_EXP?: number;
  existing?: boolean;
};

export interface OAuthWrapperProviderInterface
  extends OAuthServiceInterface<OAuthSessionPayload> {
  /**
   * OAuthWrapper 用户信息交换
   *
   * OAuthWrapper 包裹的登陆信息转换为 UserSchema 对象
   *
   * @param session
   */
  getUserSchema(session?: OAuthSessionPayload): Promise<UserSchema>;

  loginWithPhoneOTP(
    params: LoginPhoneOtpSchema
  ): Promise<LoginWithPhoneOTPResult>;
}
