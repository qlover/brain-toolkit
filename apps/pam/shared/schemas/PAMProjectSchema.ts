import { z } from 'zod';
import type { ResourceSearchParams } from '@qlover/corekit-bridge';

export const PAMPublicType = {
  public: 1,
  private: 0
} as const;

export const PAMProjectTableName = 'pam_projects' as const;
export const PAMEnvironmentsTableName = 'pam_environments' as const;

export const PAMProjectEnvKey = 'environments' as const;

/**
 * 数据库中用于 tsvector 列名字
 * @see {@link makes/sql/003-pam-base.sql}
 */
export const PAMPROJECT_TSVECTOR_KEY = 'search_vector' as const;

/**
 * 更新项目时的事务 sql 函数名
 *
 * 在 supabase 中使用 rpc 调用
 *
 * @see {@link makes/sql/004-update_project_with_environments.sql}
 */
export const PAMUpdateSQLFunctionName =
  'update_project_with_environments' as const;

export const PAMProjectSchema = z.object({
  id: z.uuid(),
  slug: z.string(),
  name: z.string(),
  description: z.string().optional(),
  stack: z.string().optional(),
  repo_url: z.url().optional(),
  category: z.string(),
  /**
   * 0: private, 1: public
   */
  is_public: z.enum(PAMPublicType),
  owner_id: z.uuid(),
  created_at: z.union([z.string(), z.number()]), // Support both string (TIMESTAMPTZ) and number (Unix timestamp)
  updated_at: z.union([z.string(), z.number()]) // Support both string (TIMESTAMPTZ) and number (Unix timestamp)
});

export const PAMEnvironmentsSchema = z.object({
  id: z.uuid(),
  project_id: z.uuid(),
  name: z.string(),
  url: z.url(),
  variables: z.json().optional(),
  created_at: z.union([z.string(), z.number()]), // Support both string (TIMESTAMPTZ) and number (Unix timestamp)
  updated_at: z.union([z.string(), z.number()]) // Support both string (TIMESTAMPTZ) and number (Unix timestamp)
});

export const PAMProjectSafeSchema = PAMProjectSchema.omit({
  owner_id: true
});

export const PAMProjectSafeFields = Object.keys(
  PAMProjectSafeSchema.shape
) as (keyof PAMProjectSchemaType)[];

export const PAMProjectWithEnvironmentsSchema = PAMProjectSafeSchema.extend({
  /**
   * 变成可选是为了保证数据完整性
   *
   * - 如果为空则表示没有环境，仅保存了项目信息
   * - 有则表示项目信息，以及环境信息
   */
  [PAMProjectEnvKey]: z.array(PAMEnvironmentsSchema).optional()
});

// 更新环境：id 必填，其他字段可选（支持部分更新）
export const PAMEnvironmentEditSchema = PAMEnvironmentsSchema.pick({
  id: true,
  name: true,
  url: true,
  variables: true
})
  .partial() // 所有字段变为可选
  .required({ id: true }); // 强制 id 必填

/**
 * 新增环境不能要id，否则就是更新
 */
export const PAMEnvironmentCreateSchema = PAMEnvironmentsSchema.pick({
  name: true,
  url: true,
  variables: true
});

/**
 * 修改的时候只允许修改部分属性
 */
export const PAMProjectUpdateSchema = PAMProjectSchema.pick({
  slug: true,
  name: true,
  description: true,
  stack: true,
  repo_url: true,
  category: true,
  is_public: true
})
  .partial()
  .extend({
    [PAMProjectEnvKey]: PAMEnvironmentEditSchema.array().optional()
  });

export const PAMProjectCreateWithEnvSchema = PAMProjectSafeSchema.omit({
  id: true,
  created_at: true,
  updated_at: true
}).extend({
  [PAMProjectEnvKey]: PAMEnvironmentCreateSchema.array().optional()
});

export type PAMProjectUpdateSchemaType = z.infer<typeof PAMProjectUpdateSchema>;
export type PAMProjectWithEnvironmentsSchemaType = z.infer<
  typeof PAMProjectWithEnvironmentsSchema
>;
export type PAMEnvironmentEditSchemaType = z.infer<
  typeof PAMEnvironmentEditSchema
>;
export type PAMEnvironmentsSchemaType = z.infer<typeof PAMEnvironmentsSchema>;
export type PAMProjectSchemaType = z.infer<typeof PAMProjectSchema>;
export type PAMProjectSafeSchemaType = z.infer<typeof PAMProjectSafeSchema>;
export type PAMProjectCreateWithEnvSchemaType = z.infer<
  typeof PAMProjectCreateWithEnvSchema
>;

/**
 * 搜索参数
 *
 * FIXME: 目前 controller 使用 SearchParamsValidator 直接校验
 */
export interface PAMSearchParams extends ResourceSearchParams {}
