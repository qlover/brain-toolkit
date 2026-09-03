import { z } from 'zod';
import { V_REQUIRED } from '@config/i18n-identifier/common/validators';

export const PAM_PROJECT_COLLABORATOR_ROLES = ['admin', 'member'] as const;

export type PAMProjectCollaboratorRole =
  (typeof PAM_PROJECT_COLLABORATOR_ROLES)[number];

/** Effective access role including project owner (not stored in collaborators). */
export const PAM_PROJECT_ACCESS_ROLES = [
  'owner',
  'admin',
  'member',
  'none'
] as const;

export type PAMProjectAccessRole = (typeof PAM_PROJECT_ACCESS_ROLES)[number];

export const PAMProjectCollaboratorRoleSchema = z.enum(
  PAM_PROJECT_COLLABORATOR_ROLES
);

export const PAMProjectCollaboratorRowSchema = z.object({
  id: z.uuid(),
  project_id: z.uuid(),
  user_id: z.uuid(),
  role: PAMProjectCollaboratorRoleSchema,
  status: z.literal('active'),
  invited_by: z.uuid().nullable(),
  created_at: z.string(),
  updated_at: z.string()
});

export type PAMProjectCollaboratorRow = z.infer<
  typeof PAMProjectCollaboratorRowSchema
>;

export const PAMProjectCollaboratorItemSchema =
  PAMProjectCollaboratorRowSchema.extend({
    email: z.string().email().or(z.literal('')),
    display_name: z.string().nullable().optional()
  });

export type PAMProjectCollaboratorItem = z.infer<
  typeof PAMProjectCollaboratorItemSchema
>;

export const PAMProjectCollaboratorAddSchema = z.object({
  user_id: z.uuid({ message: V_REQUIRED }),
  role: PAMProjectCollaboratorRoleSchema.optional().default('member')
});

export type PAMProjectCollaboratorAdd = z.infer<
  typeof PAMProjectCollaboratorAddSchema
>;

export const PAMProjectCollaboratorUpdateSchema = z.object({
  role: PAMProjectCollaboratorRoleSchema
});

export type PAMProjectCollaboratorUpdate = z.infer<
  typeof PAMProjectCollaboratorUpdateSchema
>;
