import { z } from 'zod';
import { V_REQUIRED } from '@config/i18n-identifier/common/validators';
import { DeleteStatus } from './common';
import { PAMEnvWriteableSchema } from './PAMEnvironmentSchema';
import type { PAMEnvWriteable } from './PAMEnvironmentSchema';
import type { ResourceSearchParams } from '@qlover/corekit-bridge';

export const PAMPublicType = {
  public: 1,
  private: 0
} as const;

export const PAMProjectTableName = 'pam_projects' as const;
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
export type PAMProjectRaw = z.infer<typeof PAMProjectRawSchema>;

export const SearchPAMProjectFields = Object.keys(
  PAMProjectRawSchema.omit({ is_deleted: true }).shape
) as (keyof SearchPAMRawProject)[];

export type SearchPAMRawProject = Omit<PAMProjectRaw, 'is_deleted'>;

/**
 * 该接口用于 api/pam/search 接口返回 api 数据的扩展
 *
 * is_deleted 不能出现仅用于服务器内部
 *
 * 也就是前端应该使用该类型
 *
 * 将 owner_id 可选,原因是因为当没有权限查询时只能获取 public 的项目,此时无需返回 owner_id
 */
export type SearchPAMProject = SearchPAMRawProject & {
  /**
   * 用来判断是否属于当前用户项目
   *
   * 额外增加属性
   */
  is_owner?: boolean;
};

/**
 * 该类型主要用于查询单个 project 或需要携带 env 数据的 project
 */
export type PAMProjectDetail = SearchPAMRawProject & {
  [PAMProjectEnvKey]?: PAMEnvWriteable;
};

/**
 * 对应 api/pam/create 接口 body 数据
 */
export const PAMProjectCreateSchema = PAMProjectRawSchema.omit({
  id: true,
  is_deleted: true,
  created_at: true,
  updated_at: true,
  owner_id: true
}).extend({
  [PAMProjectEnvKey]: z
    .array(
      PAMEnvWriteableSchema.omit({
        id: true
      })
    )
    .optional()
});

/**
 * 对应 api/pam/edit 接口 body 数据
 */
export const PAMProjectUpdateSchema = PAMProjectRawSchema.omit({
  is_deleted: true,
  created_at: true,
  updated_at: true,
  owner_id: true
}).extend({
  [PAMProjectEnvKey]: z
    .array(
      PAMEnvWriteableSchema.partial({
        /**
         * 当没有id则表示删除
         *
         * 修改时必须带上id
         */
        id: true
      })
    )
    .optional()
});

export type PAMProjectCreate = z.infer<typeof PAMProjectCreateSchema>;
export type PAMProjectUpdate = z.infer<typeof PAMProjectUpdateSchema>;

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
