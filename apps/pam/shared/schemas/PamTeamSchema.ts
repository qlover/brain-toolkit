import { z } from 'zod';
import { V_REQUIRED } from '@config/i18n-identifier/common/validators';

export const PAM_TEAM_ROLES = ['owner', 'admin', 'member'] as const;
export type PamTeamRole = (typeof PAM_TEAM_ROLES)[number];

export const PamTeamRoleSchema = z.enum(PAM_TEAM_ROLES);

export const PamTeamRowSchema = z.object({
  id: z.uuid(),
  name: z.string().trim().min(1),
  slug: z.string().trim().min(1),
  owner_id: z.uuid(),
  is_deleted: z.number().int(),
  created_at: z.string(),
  updated_at: z.string()
});

export type PamTeamRow = z.infer<typeof PamTeamRowSchema>;

export const PamTeamMemberRowSchema = z.object({
  id: z.uuid(),
  team_id: z.uuid(),
  user_id: z.uuid(),
  role: PamTeamRoleSchema,
  status: z.literal('active'),
  invited_by: z.uuid().nullable(),
  created_at: z.string(),
  updated_at: z.string()
});

export type PamTeamMemberRow = z.infer<typeof PamTeamMemberRowSchema>;

export const PamTeamMemberItemSchema = PamTeamMemberRowSchema.extend({
  email: z.string().email().or(z.literal('')).optional(),
  phone: z.string().nullable().optional(),
  display_name: z.string().nullable().optional()
});

export type PamTeamMemberItem = z.infer<typeof PamTeamMemberItemSchema>;

export const PamTeamCreateSchema = z.object({
  name: z.string().trim().min(1, { message: V_REQUIRED }),
  slug: z
    .string()
    .trim()
    .min(1, { message: V_REQUIRED })
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/i, {
      message: V_REQUIRED
    })
    .optional()
});

export type PamTeamCreate = z.infer<typeof PamTeamCreateSchema>;

export const PamTeamMemberAddSchema = z.object({
  user_id: z.uuid({ message: V_REQUIRED }),
  role: z.enum(['admin', 'member'], { message: V_REQUIRED })
});

export type PamTeamMemberAdd = z.infer<typeof PamTeamMemberAddSchema>;

export const PamTeamMemberUpdateSchema = z.object({
  role: z.enum(['admin', 'member'], { message: V_REQUIRED })
});

export type PamTeamMemberUpdate = z.infer<typeof PamTeamMemberUpdateSchema>;

export const PamTeamAttachProjectSchema = z.object({
  project_id: z.uuid({ message: V_REQUIRED })
});

export type PamTeamAttachProject = z.infer<typeof PamTeamAttachProjectSchema>;

export type PamTeamDetail = PamTeamRow & {
  my_role: PamTeamRole | 'none';
  members?: PamTeamMemberItem[];
  permissions: string[];
};
