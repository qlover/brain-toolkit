import type { UserSchema } from '@qlover/next-kit/common';
import type { SignOtpResult, SignWithOtpSchema } from '@qlover/oauth-wrapper';

/** Server-only HTTP metadata for audit logs (never trust client JSON for this). */
export type UserLoginContext = {
  userAgent?: string | null;
  ipAddress?: string | null;
};

/** Email + password, or phone + SMS code (Brain OTP). */
export type UserLoginParams = {
  email?: string;
  password?: string;
  phone?: string;
  code?: string;
  authCode?: string;
  loginContext?: UserLoginContext;
};

export interface UserServiceInterface {
  login(params: UserLoginParams): Promise<UserSchema>;

  logout(context?: UserLoginContext): Promise<void>;

  refresh(): Promise<UserSchema>;
  getUser(): Promise<UserSchema>;

  signWithOtp(body: SignWithOtpSchema): Promise<SignOtpResult>;
}
