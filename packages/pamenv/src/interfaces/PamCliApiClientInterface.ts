import type {
  PamCliCreateEnvironmentInputType,
  PamCliCreateProjectInputType,
  PamCliExportResultType,
  PamCliForkProjectInputType,
  PamCliProjectType,
  PamCliRemoteEnvironmentType,
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
   */
  createDeviceCode(baseUrl: string): Promise<PamCliDeviceCodeType>;

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
   * Lists projects visible to the authenticated user.
   *
   * @param keyword - Optional search keyword / slug fragment
   */
  listProjects(keyword?: string): Promise<PamCliProjectType[]>;

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
   * Exports one environment as decrypted dotenv text (owner only).
   *
   * @param projectId - Project uuid
   * @param envId - Environment uuid
   */
  exportEnvironment(
    projectId: string,
    envId: string
  ): Promise<PamCliExportResultType>;

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
}
