import type {
  PamCliCreateEnvironmentInputType,
  PamCliCreateProjectInputType,
  PamCliExportResultType,
  PamCliForkProjectInputType,
  PamCliListProjectsOptionsType,
  PamCliProjectSearchPageType,
  PamCliProjectType,
  PamCliRemoteEnvironmentType,
  PamCliResolveByNameResultType,
  PamCliResolveResultType,
  PamCliVariableInputType
} from './PamCliTypes';

export type PamCliDeviceCodeType = {
  readonly device_code: string;
  readonly user_code: string;
  readonly verification_uri: string;
  readonly verification_uri_complete: string;
  readonly expires_in: number;
  readonly interval: number;
};

export type PamCliDevicePollResultType =
  | {
      readonly status: 'pending' | 'denied' | 'expired';
    }
  | {
      readonly status: 'approved';
      readonly token: string;
      readonly expiresAt: string;
      readonly email: string;
      /** Browser page locale when present. */
      readonly locale?: 'en' | 'zh';
    };

/**
 * HTTP client for pamenv APIs.
 *
 * Significance: Isolates network I/O from command orchestration.
 * Core idea: Bearer-authenticated JSON calls against PAM base URL.
 * Main function: Login, list projects, export/import dotenv.
 * Main purpose: Drive pull/push/login without depending on browser cookies.
 */
export interface PamCliApiClientInterface {
  /**
   * Exchanges email/password for a CLI bearer token.
   *
   * @param baseUrl - PAM origin
   * @param email - Account email
   * @param password - Account password (plaintext)
   */
  createCliToken(
    baseUrl: string,
    email: string,
    password: string
  ): Promise<{ token: string; expiresAt: string; email: string }>;

  /**
   * Starts browser device authorization.
   *
   * @param baseUrl - PAM origin
   * @param locale - Optional CLI UI locale for verification_uri prefix
   */
  createDeviceCode(
    baseUrl: string,
    locale?: 'en' | 'zh'
  ): Promise<PamCliDeviceCodeType>;

  /**
   * Polls device authorization until approved / denied / expired.
   *
   * @param baseUrl - PAM origin
   * @param deviceCode - Opaque device code
   */
  pollDeviceToken(
    baseUrl: string,
    deviceCode: string
  ): Promise<PamCliDevicePollResultType>;

  /**
   * Lists projects visible to the authenticated user (one page of items).
   *
   * @param keywordOrOptions - Keyword string or web-aligned search options
   */
  listProjects(
    keywordOrOptions?: string | PamCliListProjectsOptionsType
  ): Promise<PamCliProjectType[]>;

  /**
   * One page of PAM project search (`items` + `hasMore`), same query as web.
   *
   * @param options - Web-aligned search options
   */
  searchProjects(
    options?: PamCliListProjectsOptionsType
  ): Promise<PamCliProjectSearchPageType>;

  /**
   * Lists distinct categories from visible PAM projects.
   */
  listCategories(): Promise<string[]>;

  /**
   * Creates a new PAM project (optionally with environments).
   *
   * @param payload - Create body matching PAM create schema
   */
  createProject(payload: PamCliCreateProjectInputType): Promise<PamCliProjectType>;

  /**
   * Forks a readable project into a private owned copy (sensitive values cleared).
   *
   * @param sourceProjectId - Source project uuid
   * @param options - Optional slug / name overrides
   */
  forkProject(
    sourceProjectId: string,
    options?: PamCliForkProjectInputType
  ): Promise<PamCliProjectType>;

  /**
   * Lists environments for a project (variables redacted; sensitive flags kept).
   *
   * @param projectId - Project uuid
   */
  listEnvironments(projectId: string): Promise<PamCliRemoteEnvironmentType[]>;

  /**
   * Creates one environment on an owned project.
   *
   * @param projectId - Project uuid
   * @param payload - Name, url, and optional variables
   */
  createEnvironment(
    projectId: string,
    payload: PamCliCreateEnvironmentInputType
  ): Promise<PamCliRemoteEnvironmentType>;

  /**
   * Exports one environment as dotenv text with sensitive values replaced by
   * the env placeholder (`pam_environments_export`: project admin / owner).
   *
   * @param projectId - Project uuid
   * @param envId - Environment uuid
   */
  exportEnvironment(
    projectId: string,
    envId: string
  ): Promise<PamCliExportResultType>;

  /**
   * Decrypted key/values for process injection (`pam_environments_inject`).
   * Values must stay in memory.
   *
   * @param projectId - Project uuid
   * @param envId - Environment uuid
   * @param keys - Optional key filter (`--only`)
   */
  resolveEnvironment(
    projectId: string,
    envId: string,
    keys?: readonly string[]
  ): Promise<PamCliResolveResultType>;

  /**
   * Same as {@link resolveEnvironment}, by project slug/id + environment name
   * (one request, no project search).
   *
   * @param projectRef - Exact project slug or uuid
   * @param envName - Environment name
   * @param keys - Optional key filter (`--only`)
   */
  resolveEnvironmentByName(
    projectRef: string,
    envName: string,
    keys?: readonly string[]
  ): Promise<PamCliResolveByNameResultType>;

  /**
   * Replaces the full variable list for one environment (owner only).
   *
   * @param projectId - Project uuid
   * @param envId - Environment uuid
   * @param variables - Full variables payload from local dotenv
   */
  replaceEnvironmentVariables(
    projectId: string,
    envId: string,
    variables: readonly PamCliVariableInputType[]
  ): Promise<void>;

  /**
   * Deletes one environment from an owned project.
   *
   * @param projectId - Project uuid
   * @param envId - Environment uuid
   */
  deleteEnvironment(projectId: string, envId: string): Promise<void>;

  /**
   * Revokes the current CLI bearer token on the server (best-effort).
   */
  revokeCliToken(): Promise<void>;

  /**
   * 公开换票：平台 OIDC id_token → 15m pam_cli（无需既有登录）。
   *
   * @param provider - github | vercel
   * @param idToken - 平台 JWT
   * @param baseUrl - PAM 源站（可覆盖 authStore）
   */
  exchangeOidc(
    provider: 'github' | 'vercel',
    idToken: string,
    baseUrl?: string
  ): Promise<{ token: string; expiresAt: string }>;

  /**
   * 构建部署快照：将 DEK 交 PAM 包装为 `wrappedDek`（响应无业务明文）。
   *
   * @param projectRef - 项目 slug 或 id
   * @param dekBase64 - 32 字节 DEK 的 base64
   */
  wrapDeployDek(projectRef: string, dekBase64: string): Promise<string>;

  /**
   * 运行时解封：请求带 seal offer，本地 open 得到 DEK（响应无明文）。
   *
   * @param projectRef - 项目 slug 或 id
   * @param wrappedDek - 快照中的包装 DEK
   */
  unwrapDeployDek(projectRef: string, wrappedDek: string): Promise<string>;
}
