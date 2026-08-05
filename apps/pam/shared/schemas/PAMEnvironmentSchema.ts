import { z } from 'zod';
import { V_PAM_ENV_VAR_KEY_REQUIRED } from '@config/i18n-identifier/common/validators';

export const PAMEnvTableName = 'pam_environments' as const;

export const PAMVariableSchema = z.object({
  id: z.uuid().optional(),
  key: z.string().trim().min(1, V_PAM_ENV_VAR_KEY_REQUIRED),
  /**
   * Empty string is allowed (dotenv `KEY=`). Sensitive empties on update
   * mean "keep stored secret" and are merged server-side before persist.
   */
  value: z.string(),
  sensitive: z.boolean().optional(),
  /** Raw dotenv comment lines (including `#`), stored as-is in JSONB. */
  comments: z.array(z.string()).optional()
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
