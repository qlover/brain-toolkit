import type {
  PAMProjectSchemaType,
  PAMProjectUpdateSchemaType,
  PAMProjectWithEnvironmentsSchemaType
} from '@schemas/PAMProjectSchema';
import type {
  ResourceSearchParams,
  ResourceSearchResult
} from '@qlover/corekit-bridge';

// 查询过滤参数
export interface ProjectFilter {
  is_public?: 0 | 1;
  ownerId?: string;
  category?: string;
  search?: string; // 搜索 name, description, stack
  limit?: number;
  offset?: number;
}

export interface ProjectDetailParams {
  /**
   * project_id
   */
  id: string;

  /**
   * 是否查询带环境的项目详情
   */
  withEnvironments?: boolean;
}

/**
 * PAM Service 统一接口
 *
 * 管理项目、环境及环境变量。
 * 所有方法均遵循 RLS 权限，当前用户只能操作自己的项目或公开项目。
 * 环境变量存储在 JSONB 字段中，通过更新环境来实现变量修改。
 */
export interface PAMServiceInterface {
  /**
   * 查找项目
   *
   * - 可支持包含公开的
   * @param params
   */
  searchProjects(
    params: ResourceSearchParams
  ): Promise<ResourceSearchResult<PAMProjectSchemaType>>;

  /**
   * 获取一个 pam 项目, 同时会带上 enverionments
   *
   * 当传递 withEnvironments 参数时，会返回带 environments 的项目详情
   *
   * @param id
   */
  getProjectDetail(
    params: ProjectDetailParams
  ): Promise<PAMProjectWithEnvironmentsSchemaType | null>;

  /**
   * 更新 project， 可携带 env 更新
   * @param id
   * @param params
   */
  updateProject(
    id: string,
    params: PAMProjectUpdateSchemaType
  ): Promise<PAMProjectUpdateSchemaType>;
}
