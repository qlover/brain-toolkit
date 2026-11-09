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
 * Body for writing environment variables.
 *
 * - `{ variables }` — full replace (CLI push)
 * - `{ upsert?, deleteIds? }` — patch only changed rows (web)
 */
export const PAMEnvReplaceVariablesSchema = z
  .object({
    variables: z.array(PAMVariableSchema).optional(),
    upsert: z.array(PAMVariableSchema).optional(),
    deleteIds: z.array(z.uuid()).optional()
  })
  .refine(
    (body) =>
      body.variables !== undefined ||
      (body.upsert !== undefined && body.upsert.length > 0) ||
      (body.deleteIds !== undefined && body.deleteIds.length > 0),
    { message: 'variables, upsert, or deleteIds is required' }
  );

export type PAMEnvReplaceVariables = z.infer<
  typeof PAMEnvReplaceVariablesSchema
>;

/**
 * `POST .../resolve` 的客户端临时密封 offer。
 * 必填：响应不再包含明文 `variables`。
 */
export const PAMEnvResolveSealOfferSchema = z.object({
  alg: z.string().trim().min(1).max(64),
  publicKey: z.string().trim().min(1).max(512)
});

export type PAMEnvResolveSealOffer = z.infer<
  typeof PAMEnvResolveSealOfferSchema
>;

/**
 * resolve 响应中的密封载荷（无明文 value）。
 */
export const PAMEnvResolveSealEnvelopeSchema = z.object({
  alg: z.string().trim().min(1).max(64),
  ephemeralPublicKey: z.string().trim().min(1).max(512),
  nonce: z.string().trim().min(1).max(128),
  ciphertext: z.string().trim().min(1)
});

export type PAMEnvResolveSealEnvelope = z.infer<
  typeof PAMEnvResolveSealEnvelopeSchema
>;

/**
 * `POST .../resolve` 请求体：可选 `keys`（对应 `--only`），
 * 以及必填 seal offer，以便响应省略明文。
 */
export const PAMEnvResolveSchema = z.object({
  keys: z.array(z.string().trim().min(1)).max(500).optional(),
  seal: PAMEnvResolveSealOfferSchema
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
  /** 仅遗留 / 测试路径可能出现；生产 resolve 只返回 `seal`。 */
  variables?: PAMEnvResolvedVariable[];
  seal: PAMEnvResolveSealEnvelope;
};

export type PAMEnvResolvedSealed = {
  seal: PAMEnvResolveSealEnvelope;
};

/**
 * `POST .../cli/deploy-dek/wrap`：构建机上交 DEK（HTTPS + pam_cli），
 * 响应仅为包装密文。
 */
export const PamDeployDekWrapSchema = z.object({
  dek: z.string().trim().min(1).max(256)
});

export type PamDeployDekWrapType = z.infer<typeof PamDeployDekWrapSchema>;

/**
 * `POST .../cli/deploy-dek/unwrap`：运行时取 DEK，响应走 seal。
 */
export const PamDeployDekUnwrapSchema = z.object({
  wrappedDek: z.string().trim().min(1),
  seal: PAMEnvResolveSealOfferSchema
});

export type PamDeployDekUnwrapType = z.infer<typeof PamDeployDekUnwrapSchema>;

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
