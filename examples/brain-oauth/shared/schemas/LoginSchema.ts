import { z } from 'zod';
import {
  V_EMAIL_INVALID,
  V_PASSWORD_MIN_LENGTH,
  V_PASSWORD_MAX_LENGTH,
  V_PASSWORD_SPECIAL_CHARS,
  V_PHONE_INVALID
} from '@config/i18n-identifier/common/validators';

export const loginEmailSchema = z.email({ message: V_EMAIL_INVALID });

export const loginPasswordSchema = z
  .string()
  .min(6, { message: V_PASSWORD_MIN_LENGTH })
  .max(50, { message: V_PASSWORD_MAX_LENGTH })
  .regex(/^\S+$/, { message: V_PASSWORD_SPECIAL_CHARS });

export const loginSchema = z.object({
  email: loginEmailSchema,
  password: loginPasswordSchema
});

export const loginPhoneOtpSchema = z.object({
  /**
   * 登陆时的手机号
   */
  phone: z.string({
    error: V_PHONE_INVALID
  }),
  /**
   * 登陆时的验证码
   */
  otp: z.string().optional()
});

export type LoginSchema = z.infer<typeof loginSchema>;
export type LoginPhoneOtpSchema = z.infer<typeof loginPhoneOtpSchema>;
