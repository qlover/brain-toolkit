import { z } from 'zod';
import {
  V_PAM_ENV_VAR_KEY_REQUIRED,
  V_PAM_ENV_VAR_VALUE_REQUIRED
} from '@config/i18n-identifier/common/validators';

export const PAMEnvTableName = 'pam_environments' as const;

export const PAMVariableSchema = z
  .object({
    id: z.uuid().optional(),
    key: z.string().trim().min(1, V_PAM_ENV_VAR_KEY_REQUIRED),
    /**
     * Sensitive variables may send an empty value on update to keep the stored secret.
     */
    value: z.string(),
    sensitive: z.boolean().optional()
  })
  .superRefine((variable, ctx) => {
    if (!variable.sensitive && variable.value.trim() === '') {
      ctx.addIssue({
        code: 'custom',
        message: V_PAM_ENV_VAR_VALUE_REQUIRED,
        path: ['value']
      });
    }
  });
export type PAMVariable = z.infer<typeof PAMVariableSchema>;

export const PAMEnvRawSchema = z.object({
  id: z.uuid(),
  project_id: z.uuid(),
  name: z.string().trim().min(1),
  url: z.url(),
  variables: z.array(PAMVariableSchema).optional(),
  created_at: z.union([z.string().trim(), z.number()]), // Support both string (TIMESTAMPTZ) and number (Unix timestamp)
  updated_at: z.union([z.string().trim(), z.number()]) // Support both string (TIMESTAMPTZ) and number (Unix timestamp)
});

export type PAMEnvRaw = z.infer<typeof PAMEnvRawSchema>;

export const PAMEnvWriteableSchema = PAMEnvRawSchema.pick({
  id: true,
  name: true,
  url: true,
  variables: true
});

export type PAMEnvWriteable = z.infer<typeof PAMEnvWriteableSchema>;

/**
 * Body for creating a project environment.
 */
export const PAMEnvCreateSchema = z.object({
  name: z.string().trim().min(1),
  url: z.url(),
  variables: z.array(PAMVariableSchema).optional()
});

export type PAMEnvCreate = z.infer<typeof PAMEnvCreateSchema>;

/**
 * Body for replacing the full variable list of one environment.
 */
export const PAMEnvReplaceVariablesSchema = z.object({
  variables: z.array(PAMVariableSchema)
});

export type PAMEnvReplaceVariables = z.infer<
  typeof PAMEnvReplaceVariablesSchema
>;
