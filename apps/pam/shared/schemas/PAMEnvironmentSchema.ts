import { z } from 'zod';
import { V_PAM_ENV_VAR_KEY_REQUIRED } from '@config/i18n-identifier/common/validators';

export const PAMEnvTableName = 'pam_environments' as const;

/** One row per environment variable key (replaces JSONB `variables`). */
export const PAMEnvVariableTableName = 'pam_env_variables' as const;

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
  /** Protected: `resolve` (pamenv run) also requires `pam_environments_export`. */
  is_protected: z.boolean().optional(),
  created_at: z.union([z.string().trim(), z.number()]), // Support both string (TIMESTAMPTZ) and number (Unix timestamp)
  updated_at: z.union([z.string().trim(), z.number()]) // Support both string (TIMESTAMPTZ) and number (Unix timestamp)
});

export type PAMEnvRaw = z.infer<typeof PAMEnvRawSchema>;

export const PAMEnvWriteableSchema = PAMEnvRawSchema.pick({
  id: true,
  name: true,
  url: true,
  variables: true,
  is_protected: true
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

/**
 * Body for `POST .../resolve`: optional key filter (`pamenv run --only`).
 */
export const PAMEnvResolveSchema = z.object({
  keys: z.array(z.string().trim().min(1)).max(500).optional()
});

export type PAMEnvResolve = z.infer<typeof PAMEnvResolveSchema>;

/**
 * Body for `POST /api/pam/:projectRef/resolve`: environment by name, so
 * `pamenv run -e` needs no project search first.
 */
export const PAMEnvResolveByNameSchema = PAMEnvResolveSchema.extend({
  env: z.string().trim().min(1).max(200)
});

export type PAMEnvResolveByName = z.infer<typeof PAMEnvResolveByNameSchema>;

export type PAMEnvResolvedEnvironment = {
  projectId: string;
  projectSlug: string;
  environmentId: string;
  environmentName: string;
  variables: PAMEnvResolvedVariable[];
};

/**
 * Body for `POST .../settings`.
 */
export const PAMEnvSettingsSchema = z
  .object({
    isProtected: z.boolean().optional(),
    url: z.url().optional()
  })
  .refine(
    (value) => value.isProtected !== undefined || value.url !== undefined,
    { message: 'isProtected or url is required' }
  );

export type PAMEnvSettings = z.infer<typeof PAMEnvSettingsSchema>;

export type PAMEnvResolvedVariable = {
  key: string;
  value: string;
  sensitive: boolean;
};

export type PAMEnvAccessAction = 'resolve' | 'export';

/** Request origin recorded in `pam_env_access_logs`. */
export type PAMEnvAccessContext = {
  client: string | null;
  ip: string | null;
};

export type PAMEnvAccessLog = {
  id: string;
  user_id: string | null;
  /** display_name, email or phone of the user. */
  user_label: string | null;
  environment_id: string | null;
  environment_name: string;
  action: PAMEnvAccessAction;
  key_count: number;
  client: string | null;
  ip: string | null;
  created_at: string;
};
