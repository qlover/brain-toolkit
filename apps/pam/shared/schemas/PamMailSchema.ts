import { z } from 'zod';

/** Value stored in site setting `mail.provider`. */
export const pamMailProviderSettingSchema = z.enum([
  'disabled',
  'memory',
  'resend'
]);
export type PamMailProviderSetting = z.infer<
  typeof pamMailProviderSettingSchema
>;

/** Channels that actually handle a message (never `disabled`). */
export const pamMailProviderSchema = z.enum(['memory', 'resend']);
export type PamMailProvider = z.infer<typeof pamMailProviderSchema>;

export const pamMailTemplateSchema = z.enum([
  'test',
  'password_reset',
  'password_changed'
]);
export type PamMailTemplate = z.infer<typeof pamMailTemplateSchema>;

export const pamMailStatusSchema = z.enum(['sent', 'failed']);
export type PamMailStatus = z.infer<typeof pamMailStatusSchema>;

export const pamMailLogRowSchema = z.object({
  id: z.string().uuid(),
  to_email: z.string(),
  subject: z.string(),
  template: pamMailTemplateSchema,
  provider: pamMailProviderSchema,
  status: pamMailStatusSchema,
  provider_message_id: z.string().nullable().optional(),
  error: z.string().nullable().optional(),
  body_text: z.string().nullable().optional(),
  user_id: z.string().uuid().nullable().optional(),
  created_ip: z.string().nullable().optional(),
  created_at: z.string()
});
export type PamMailLogRow = z.infer<typeof pamMailLogRowSchema>;

/** Admin list item; `bodyText` only kept for memory provider. */
export const pamMailLogAdminItemSchema = z.object({
  id: z.string().uuid(),
  toEmail: z.string(),
  subject: z.string(),
  template: pamMailTemplateSchema,
  provider: pamMailProviderSchema,
  status: pamMailStatusSchema,
  providerMessageId: z.string().nullable(),
  error: z.string().nullable(),
  bodyText: z.string().nullable(),
  userId: z.string().nullable(),
  createdIp: z.string().nullable(),
  createdAt: z.string()
});
export type PamMailLogAdminItem = z.infer<typeof pamMailLogAdminItemSchema>;

export const pamAdminMailTestSchema = z.object({
  to: z.string().trim().email()
});
export type PamAdminMailTestInput = z.infer<typeof pamAdminMailTestSchema>;
