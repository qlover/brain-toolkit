import { z } from 'zod';

export const pamPhoneOtpProviderSchema = z.enum(['memory', 'aliyun']);
export type PamPhoneOtpProvider = z.infer<typeof pamPhoneOtpProviderSchema>;

export const pamPhoneOtpStatusSchema = z.enum([
  'pending',
  'verified',
  'expired',
  'revoked'
]);
export type PamPhoneOtpStatus = z.infer<typeof pamPhoneOtpStatusSchema>;

export const pamPhoneOtpRowSchema = z.object({
  id: z.string().uuid(),
  phone: z.string(),
  code_hash: z.string(),
  code_plain: z.string().nullable(),
  provider: pamPhoneOtpProviderSchema,
  status: pamPhoneOtpStatusSchema,
  attempts: z.number().int(),
  max_attempts: z.number().int(),
  expires_at: z.string(),
  verified_at: z.string().nullable().optional(),
  created_ip: z.string().nullable().optional(),
  created_at: z.string()
});

export type PamPhoneOtpRow = z.infer<typeof pamPhoneOtpRowSchema>;

/** Admin list item (may include plaintext code for memory). */
export const pamPhoneOtpAdminItemSchema = z.object({
  id: z.string().uuid(),
  phone: z.string(),
  code: z.string().nullable(),
  provider: pamPhoneOtpProviderSchema,
  status: pamPhoneOtpStatusSchema,
  attempts: z.number().int(),
  maxAttempts: z.number().int(),
  expiresAt: z.string(),
  verifiedAt: z.string().nullable(),
  createdIp: z.string().nullable(),
  createdAt: z.string()
});

export type PamPhoneOtpAdminItem = z.infer<typeof pamPhoneOtpAdminItemSchema>;
