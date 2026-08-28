import { DeleteStatus } from '@qlover/next-kit/common';
import { z } from 'zod';
import { V_REQUIRED } from '@config/i18n-identifier/common/validators';
import { PAMEnvWriteableSchema } from './PAMEnvironmentSchema';
import type { PAMEnvWriteable } from './PAMEnvironmentSchema';
import type { ResourceSearchParams } from '@qlover/corekit-bridge';

export const PAMPublicType = {
  public: 1,
  private: 0
} as const;

/**
 * How a project row was created.
 * 0 = web/browser, 1 = CLI (pamenv), 2 = fork
 */
export const PAMCreateSourceType = {
  web: 0,
  cli: 1,
  fork: 2
} as const;

export type PAMCreateSource =
  (typeof PAMCreateSourceType)[keyof typeof PAMCreateSourceType];

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
 * Paginated project list with environments (single round-trip).
 *
 * @see {@link makes/sql/012-pam-search-projects-rpc.sql}
 */
export const PAMSearchProjectsSQLFunctionName = 'pam_search_projects' as const;

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
  preview_image_url: z.string().url().trim().or(z.literal('')).nullish(),
  /**
   * 0: private, 1: public
   */
  is_public: z.enum(PAMPublicType),
  /**
   * 0: web, 1: cli, 2: fork (server-set; not accepted on create/update body)
   */
  create_source: z.enum(PAMCreateSourceType),
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
  [PAMProjectEnvKey]?: PAMEnvWriteable[];
  /**
   * 当前登录用户是否为项目 owner（详情接口附加，与 search 一致）
   */
  is_owner?: boolean;
};

/**
 * 对应 api/pam/create 接口 body 数据
 */
export const PAMProjectCreateSchema = PAMProjectRawSchema.omit({
  id: true,
  is_deleted: true,
  created_at: true,
  updated_at: true,
  owner_id: true,
  create_source: true
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
  owner_id: true,
  create_source: true
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
 * Body for `POST /api/pam/fork/:id`.
 * Omitted fields fall back to server defaults (`{slug}-fork`, `{name} (fork)`).
 */
export const PAMProjectForkSchema = z.object({
  slug: z.string().trim().min(1, { message: V_REQUIRED }).optional(),
  name: z.string().trim().min(1, { message: V_REQUIRED }).optional()
});

export type PAMProjectFork = z.infer<typeof PAMProjectForkSchema>;

/**
 * Body for `POST /api/pam/transfer/:id`.
 * Provide either recipient email (Supabase Auth) or user UUID.
 */
export const PAMProjectTransferSchema = z
  .object({
    email: z.union([z.string().trim().email(), z.literal('')]).optional(),
    user_id: z.union([z.uuid(), z.literal('')]).optional()
  })
  .superRefine((value, ctx) => {
    const email = value.email?.trim() || '';
    const userId = value.user_id?.trim() || '';
    if (!email && !userId) {
      ctx.addIssue({
        code: 'custom',
        message: V_REQUIRED,
        path: ['email']
      });
    }
  });

export type PAMProjectTransfer = z.infer<typeof PAMProjectTransferSchema>;

/**
 * Lightweight Auth user row for transfer recipient picker.
 */
export const PAMAuthUserSummarySchema = z.object({
  id: z.uuid(),
  email: z.string().email().or(z.literal(''))
});

export type PAMAuthUserSummary = z.infer<typeof PAMAuthUserSummarySchema>;

/**
 * 搜索参数
 *
 * FIXME: 目前 controller 使用 SearchParamsValidator 直接校验
 */
export interface PAMSearchParams extends Omit<ResourceSearchParams, 'sort'> {
  /**
   * Sort clauses (store) or JSON string (query params / API).
   */
  sort?: string | ResourceSearchParams['sort'];
}
