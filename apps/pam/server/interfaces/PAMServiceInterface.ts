import type {
  PAMEnvAccessContext,
  PAMEnvAccessLog,
  PAMEnvCreate,
  PAMEnvReplaceVariables,
  PAMEnvResolve,
  PAMEnvResolveByName,
  PAMEnvResolvedEnvironment,
  PAMEnvResolvedVariable,
  PAMEnvSettings,
  PAMEnvWriteable
} from '@shared/schemas/PAMEnvironmentSchema';
import type {
  SearchPAMProject,
  PAMProjectDetail,
  PAMProjectCreate,
  PAMProjectFork,
  PAMProjectUpdate,
  PAMProjectTransfer,
  PAMCreateSource,
  PAMAuthUserSummary
} from '@shared/schemas/PAMProjectSchema';
import type { FetchedSiteLogo } from '@server/utils/PAMSiteLogoFetchUtil';
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
   * Project UUID or slug (detail lookup accepts both).
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
   * Lists distinct project categories visible to the caller (public + owned).
   */
  listCategories(): Promise<string[]>;

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
   *
   * @param params - Create payload
   * @param options - Persistence options
   * @param options.allowEmptySensitive - When true, sensitive placeholders
   *   may be stored with empty values (used by fork)
   */
  createProject(
    params: PAMProjectCreate,
    options?: {
      allowEmptySensitive?: boolean;
      createSource?: PAMCreateSource;
    }
  ): Promise<PAMProjectDetail>;

  /**
   * Forks a readable project into a private copy owned by the current user.
   * Sensitive variable values are cleared; keys and non-sensitive values copy.
   *
   * @param sourceId - Source project id
   * @param options - Optional slug / name overrides
   * @returns New project detail (redacted)
   */
  forkProject(
    sourceId: string,
    options?: PAMProjectFork
  ): Promise<PAMProjectDetail>;

  /**
   * Transfers ownership to another PAM user (email or user id).
   *
   * @param id - Project id
   * @param params - Recipient email and/or user_id
   */
  transferProject(id: string, params: PAMProjectTransfer): Promise<void>;

  /**
   * Lists Auth users for transfer recipient picker (excludes current user).
   *
   * @param query - Optional email substring
   */
  searchUsersForTransfer(query?: string): Promise<PAMAuthUserSummary[]>;

  /**
   * Captures primary env/repo URL screenshot, stores in Storage, updates cover.
   *
   * @param id - Project id
   */
  refreshPreviewImage(id: string): Promise<PAMProjectDetail>;

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
   * Metadata only (`variables` empty); load one env via {@link getEnvironment}.
   *
   * @param projectId - Project id
   * @returns Redacted environment list
   */
  listEnvironments(projectId: string): Promise<PAMEnvWriteable[]>;

  /**
   * One environment with redacted variables (web lazy load).
   *
   * @param projectId - Project id
   * @param envId - Environment id
   */
  getEnvironment(projectId: string, envId: string): Promise<PAMEnvWriteable>;

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
   * Replaces or patches variables for one environment.
   *
   * - `{ variables }` — full replace (CLI push)
   * - `{ upsert?, deleteIds? }` — patch only changed rows (web)
   *
   * An existing sensitive variable cannot be downgraded. A non-sensitive
   * variable can be upgraded to sensitive. New plaintext secrets are
   * encrypted before persist.
   *
   * @param projectId - Project id
   * @param envId - Environment id
   * @param params - Full replace or incremental patch
   * @returns Updated environment with redacted sensitive values
   */
  replaceEnvironmentVariables(
    projectId: string,
    envId: string,
    params: PAMEnvReplaceVariables
  ): Promise<PAMEnvWriteable>;

  /**
   * Decrypted variables for process injection (`pamenv run`).
   * Requires `pam_environments_inject`; protected environments also require
   * `pam_environments_export`. Each call is audited.
   *
   * @param projectId - Project id
   * @param envId - Environment id
   * @param params - Optional key filter
   * @param context - Request origin for the audit log
   */
  resolveEnvironment(
    projectId: string,
    envId: string,
    params: PAMEnvResolve,
    context: PAMEnvAccessContext
  ): Promise<{ variables: PAMEnvResolvedVariable[] }>;

  /**
   * Same as {@link resolveEnvironment}, addressed by project slug/id and
   * environment name (one request for `pamenv run -e`).
   *
   * @param projectRef - Project slug or id
   * @param params - Environment name and optional key filter
   * @param context - Request origin for the audit log
   */
  resolveEnvironmentByName(
    projectRef: string,
    params: PAMEnvResolveByName,
    context: PAMEnvAccessContext
  ): Promise<PAMEnvResolvedEnvironment>;

  /**
   * Updates environment settings (protected flag). Requires export permission.
   *
   * @param projectId - Project id
   * @param envId - Environment id
   * @param params - New settings
   * @returns Updated environment (redacted)
   */
  updateEnvironmentSettings(
    projectId: string,
    envId: string,
    params: PAMEnvSettings
  ): Promise<PAMEnvWriteable>;

  /**
   * Recent resolve / export records for one environment (export permission).
   *
   * @param projectId - Project id
   * @param envId - Environment id
   */
  listEnvironmentAccessLogs(
    projectId: string,
    envId: string
  ): Promise<PAMEnvAccessLog[]>;

  /**
   * Export of one environment as dotenv text with sensitive values replaced by
   * the environment's placeholder (`pam_environments_export`, admin / owner).
   * Each call is audited.
   *
   * @param projectId - Project id
   * @param envId - Environment id
   * @param context - Request origin for the audit log
   */
  exportEnvironment(
    projectId: string,
    envId: string,
    context?: PAMEnvAccessContext
  ): Promise<{
    projectId: string;
    projectSlug: string;
    environmentId: string;
    environmentName: string;
    content: string;
    sensitiveKeys: string[];
    /** Writing this value back for a sensitive key keeps the stored secret. */
    sensitivePlaceholder: string;
    /** Variables including raw `comments` lines (preferred by CLI). */
    variables: Array<{
      key: string;
      value: string;
      sensitive: boolean;
      comments?: string[];
    }>;
  }>;

  /**
   * Proxies favicon/logo for a public site page URL (`null` when not found).
   */
  fetchSiteLogo(siteUrl: string): Promise<FetchedSiteLogo | null>;
}
