import type {
  PAMEnvCreate,
  PAMEnvReplaceVariables,
  PAMEnvWriteable
} from '@shared/schemas/PAMEnvironmentSchema';
import type {
  SearchPAMProject,
  PAMProjectDetail,
  PAMProjectCreate,
  PAMProjectUpdate
} from '@shared/schemas/PAMProjectSchema';
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
  ): Promise<ResourceSearchResult<SearchPAMProject>>;

  /**
   * 获取一个 pam 项目, 同时会带上 enverionments
   *
   * 当传递 withEnvironments 参数时，会返回带 environments 的项目详情
   *
   * @param id
   */
  getProjectDetail(
    params: ProjectDetailParams
  ): Promise<PAMProjectDetail | null>;

  /**
   * 更新 project， 可携带 env 更新
   * @param id
   * @param params
   */
  updateProject(
    params: PAMProjectUpdate,
    extra?: {
      /**
       * 提供 RPC 调用， rpc 支持事务
       *
       * @default false
       */
      useRPC?: boolean;
    }
  ): Promise<PAMProjectDetail>;

  /**
   * 创建一个新的 PAM 项目
   */
  createProject(params: PAMProjectCreate): Promise<PAMProjectDetail>;

  deleteProject(id: string): Promise<void>;

  /**
   * Updates project fields without touching environments.
   *
   * @param params - Project update payload (environments are ignored)
   * @returns Updated project detail (environments omitted unless already loaded)
   */
  updateProjectBasics(
    params: Omit<PAMProjectUpdate, 'environments'>
  ): Promise<PAMProjectDetail>;

  /**
   * Lists environments for a project with sensitive values redacted.
   *
   * @param projectId - Project id
   * @returns Redacted environment list
   */
  listEnvironments(projectId: string): Promise<PAMEnvWriteable[]>;

  /**
   * Creates an environment under a project.
   *
   * @param projectId - Project id
   * @param params - Name, url, optional variables
   * @returns Created environment with redacted sensitive values
   */
  createEnvironment(
    projectId: string,
    params: PAMEnvCreate
  ): Promise<PAMEnvWriteable>;

  /**
   * Deletes an environment from a project.
   *
   * @param projectId - Project id
   * @param envId - Environment id
   */
  deleteEnvironment(projectId: string, envId: string): Promise<void>;

  /**
   * Replaces the full variable list for one environment.
   *
   * Sensitive flag is immutable for existing variables; new plaintext secrets
   * are encrypted before persist.
   *
   * @param projectId - Project id
   * @param envId - Environment id
   * @param params - Full variables payload
   * @returns Updated environment with redacted sensitive values
   */
  replaceEnvironmentVariables(
    projectId: string,
    envId: string,
    params: PAMEnvReplaceVariables
  ): Promise<PAMEnvWriteable>;

  /**
   * Owner-only export of one environment as decrypted dotenv text.
   *
   * @param projectId - Project id
   * @param envId - Environment id
   */
  exportEnvironment(
    projectId: string,
    envId: string
  ): Promise<{
    projectId: string;
    projectSlug: string;
    environmentId: string;
    environmentName: string;
    content: string;
    sensitiveKeys: string[];
    /** Decrypted variables including raw `comments` lines (preferred by CLI). */
    variables: Array<{
      key: string;
      value: string;
      sensitive: boolean;
      comments?: string[];
    }>;
  }>;
}
