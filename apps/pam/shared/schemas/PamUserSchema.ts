import { z } from 'zod';

export const pamUserRowSchema = z.object({
  id: z.string().uuid(),
  email: z.string(),
  display_name: z.string().nullable().optional(),
  is_platform_admin: z.boolean(),
  status: z.enum(['active', 'suspended']),
  created_at: z.string(),
  updated_at: z.string()
});

export type PamUserRow = z.infer<typeof pamUserRowSchema>;

export const pamAdminUserListItemSchema = z.object({
  id: z.string().uuid(),
  email: z.string(),
  displayName: z.string().nullable(),
  isPlatformAdmin: z.boolean(),
  status: z.enum(['active', 'suspended']),
  createdAt: z.string()
});

export type PamAdminUserListItem = z.infer<typeof pamAdminUserListItemSchema>;

export const pamSessionCapabilitiesSchema = z.object({
  platformAdmin: z.boolean()
});

export type PamSessionCapabilities = z.infer<
  typeof pamSessionCapabilitiesSchema
>;

export const pamSessionResponseSchema = z.object({
  user: z
    .object({
      id: z.string(),
      email: z.string(),
      role: z.number(),
      credential_token: z.string().optional(),
      created_at: z.string().optional()
    })
    .nullable(),
  capabilities: pamSessionCapabilitiesSchema
});

export type PamSessionResponse = z.infer<typeof pamSessionResponseSchema>;

export const pamPlatformAdminPatchSchema = z.object({
  enabled: z.boolean()
});
