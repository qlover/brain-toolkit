import { z } from 'zod';
import {
  V_PAM_ENV_NAME_REPEAT,
  V_REQUIRED
} from '@config/i18n-identifier/common/validators';
import { DeleteStatus } from './common';
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

/**
 * description， stack， repo_url 可能是 null 则需要使用 nullish 而不是 optional
 *
 * sql 中描述时并没有明确规定 not null, 也就是如果入库的时候没有值那么默认就是 null
 *
 * 对应数据库中原始数据类型
 */
export const PAMProjectRawSchema = z.object({
  id: z.uuid(),
  /**
   * TODO: 验证 slug 格式, 理论来按说应该是 纯英文，数字，下划线，短横线没有空白字符
   */
  slug: z.string().trim().min(1, { message: V_REQUIRED }),
  name: z.string().trim().min(1, { message: V_REQUIRED }),
  category: z.string().trim().min(1, { message: V_REQUIRED }),
  description: z.string().trim().or(z.literal('')).nullish(),
  stack: z.string().trim().or(z.literal('')).nullish(),
  repo_url: z.url().trim().or(z.literal('')).nullish(),
  /**
   * 0: private, 1: public
   */
  is_public: z.enum(PAMPublicType),
  /**
   * 是否已删除
   */
  is_deleted: z.enum(DeleteStatus),
  owner_id: z.uuid(),
  created_at: z.union([z.string().trim(), z.number()]), // Support both string (TIMESTAMPTZ) and number (Unix timestamp)
  updated_at: z.union([z.string().trim(), z.number()]) // Support both string (TIMESTAMPTZ) and number (Unix timestamp)
});

export const PAMVariableSchema = z.object({
  id: z.uuid().optional(),
  key: z.string().trim().min(1, 'Key can not be empty'),
  value: z.string().trim().min(1, 'Value can not be empty')
});

export const PAMEnvironmentsRawSchema = z.object({
  id: z.uuid(),
  project_id: z.uuid(),
  name: z.string().trim().min(1),
  url: z.url(),
  variables: z.array(PAMVariableSchema).optional(),
  created_at: z.union([z.string().trim(), z.number()]), // Support both string (TIMESTAMPTZ) and number (Unix timestamp)
  updated_at: z.union([z.string().trim(), z.number()]) // Support both string (TIMESTAMPTZ) and number (Unix timestamp)
});

/**
 * 该类型去掉了敏感数据后的项目数据
 *
 * - is_deleted 仅用于服务端
 * - owner_id 允许不返回用户的 id
 */
export const PAMProjectSchema = PAMProjectRawSchema.omit({
  is_deleted: true
}).partial({
  owner_id: true
});

/**
 * 该数组用来表示查询数据库时的字段名
 *
 * 去掉了敏感数据属性, 比如 is_deleted
 */
export const PAMProjectFields = Object.keys(
  PAMProjectSchema.shape
) as (keyof PAMProject)[];

export const PAMProjectWithEnvironmentsSchema = PAMProjectSchema.extend({
  /**
   * 变成可选是为了保证数据完整性
   *
   * - 如果为空则表示没有环境，仅保存了项目信息
   * - 有则表示项目信息，以及环境信息
   */
  [PAMProjectEnvKey]: z
    .array(PAMEnvironmentsRawSchema)
    .optional() // 添加自定义验证：环境名称不能重复
    .refine(
      (environments) => {
        if (!environments) return true;
        const names = environments
          .map((env) => env.name)
          .filter((name) => name.trim() !== '');
        return new Set(names).size === names.length;
      },
      { message: V_PAM_ENV_NAME_REPEAT }
    )
});

// 更新环境：id 必填，其他字段可选（支持部分更新）
export const PAMEnvironmentEditSchema = PAMEnvironmentsRawSchema.pick({
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
export const PAMEnvironmentCreateSchema = PAMEnvironmentsRawSchema.pick({
  name: true,
  url: true,
  variables: true
});

/**
 * 修改的时候只允许修改部分属性
 */
export const PAMProjectUpdateSchema = PAMProjectRawSchema.pick({
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

export const PAMProjectCreateWithEnvSchema = PAMProjectSchema.omit({
  id: true,
  created_at: true,
  updated_at: true,
  owner_id: true
}).extend({
  [PAMProjectEnvKey]: PAMEnvironmentCreateSchema.array().optional()
});

/**
 * 该接口用于 api/pam/search 接口返回 api 数据的扩展
 *
 * 也就是前端应该使用该类型
 *
 * 将 owner_id 可选,原因是因为当没有权限查询时只能获取 public 的项目,此时无需返回 owner_id
 */
export const SearchPAMProjectSchema = PAMProjectWithEnvironmentsSchema.extend({
  /**
   * 用来判断是否属于当前用户项目
   *
   * 额外增加属性
   */
  is_owner: z.boolean().optional()
}).partial({
  owner_id: true
});

export type PAMProjectUpdateSchemaType = z.infer<typeof PAMProjectUpdateSchema>;
export type PAMProjectWithEnvironments = z.infer<
  typeof PAMProjectWithEnvironmentsSchema
>;
export type PAMEnvironmentEdit = z.infer<typeof PAMEnvironmentEditSchema>;
export type PAMEnvironmentsRaw = z.infer<typeof PAMEnvironmentsRawSchema>;
export type PAMProjectRaw = z.infer<typeof PAMProjectRawSchema>;
export type PAMProject = z.infer<typeof PAMProjectSchema>;
export type PAMProjectCreateWithEnv = z.infer<
  typeof PAMProjectCreateWithEnvSchema
>;
export type PAMEnvironmentCreate = z.infer<typeof PAMEnvironmentCreateSchema>;

/**
 * 搜索参数
 *
 * FIXME: 目前 controller 使用 SearchParamsValidator 直接校验
 */
export interface PAMSearchParams extends Omit<ResourceSearchParams, 'sort'> {
  /**
   * 重新 sort, 现在仅仅传递一个 json 字符串
   */
  sort?: string;
}

export type SearchPAMProject = z.infer<typeof SearchPAMProjectSchema>;
