import type {
  PamCliApiClientInterface,
  PamCliDeviceCodeType,
  PamCliDevicePollResultType
} from '../interfaces/PamCliApiClientInterface';
import type { PamCliAuthStoreInterface } from '../interfaces/PamCliAuthStoreInterface';
import type {
  PamCliCreateEnvironmentInputType,
  PamCliCreateProjectInputType,
  PamCliExportResultType,
  PamCliForkProjectInputType,
  PamCliProjectType,
  PamCliRemoteEnvironmentType,
  PamCliVariableInputType
} from '../interfaces/PamCliTypes';
import { PamCliConfig } from '../config/PamCliConfig';
import { PamCliApiError } from './PamCliApiError';

type ApiEnvelopeType<T> = {
  readonly success: boolean;
  readonly data?: T;
  readonly message?: string;
  readonly id?: string;
  readonly requestId?: string;
};

/**
 * Fetch-based PAM API client for the CLI.
 *
 * Significance: Talks to PAM over HTTP with Bearer CLI tokens.
 * Core idea: JSON envelope `{ success, id, data }` matching NextKit APIs.
 * Main function: Token create, device login, project search, env export.
 * Main purpose: Drive authenticated pull/push from the terminal.
 *
 * @example
 * const client = new PamCliApiClient(authStore);
 * const projects = await client.listProjects('my-app');
 */
export class PamCliApiClient implements PamCliApiClientInterface {
  constructor(protected readonly authStore: PamCliAuthStoreInterface) {}

  /**
   * @override
   */
  public async createCliToken(
    baseUrl: string,
    email: string,
    password: string
  ): Promise<{ token: string; expiresAt: string; email: string }> {
    const result = await this.requestJson<{
      token: string;
      expiresAt: string;
      user: { email?: string };
    }>(`${PamCliConfig.normalizeOrigin(baseUrl)}/api/pam/cli/token`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });

    return {
      token: result.token,
      expiresAt: result.expiresAt,
      email: result.user?.email || email
    };
  }

  /**
   * @override
   */
  public async createDeviceCode(baseUrl: string): Promise<PamCliDeviceCodeType> {
    return this.requestJson<PamCliDeviceCodeType>(
      `${PamCliConfig.normalizeOrigin(baseUrl)}/api/pam/cli/device/code`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: '{}'
      }
    );
  }

  /**
   * @override
   */
  public async pollDeviceToken(
    baseUrl: string,
    deviceCode: string
  ): Promise<PamCliDevicePollResultType> {
    const response = await fetch(
      `${PamCliConfig.normalizeOrigin(baseUrl)}/api/pam/cli/device/token`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ device_code: deviceCode })
      }
    );

    let body: ApiEnvelopeType<{
      token: string;
      expiresAt: string;
      user: { email?: string };
    }>;
    try {
      body = (await response.json()) as typeof body;
    } catch {
      throw new PamCliApiError({
        id: 'pamenv:non_json_response',
        message: `PAM API returned non-JSON (HTTP ${response.status}) while polling device token`,
        httpStatus: response.status
      });
    }

    if (body.success && body.data) {
      return {
        status: 'approved',
        token: body.data.token,
        expiresAt: body.data.expiresAt,
        email: body.data.user?.email || 'unknown'
      };
    }

    const id = body.id || '';
    if (id.includes('authorization_pending') || id === 'authorization_pending') {
      return { status: 'pending' };
    }
    if (id.includes('access_denied') || id === 'access_denied') {
      return { status: 'denied' };
    }
    if (id.includes('expired_token') || id === 'expired_token') {
      return { status: 'expired' };
    }

    if (
      body.message?.includes('authorization_pending') ||
      id.endsWith('authorization_pending')
    ) {
      return { status: 'pending' };
    }

    throw new PamCliApiError({
      id: body.id || 'pamenv:device_poll_failed',
      message: body.message,
      requestId: body.requestId,
      data: body.data,
      httpStatus: response.status
    });
  }

  /**
   * @override
   */
  public async listProjects(keyword?: string): Promise<PamCliProjectType[]> {
    const baseUrl = await this.authStore.getBaseUrl();
    const token = await this.requireToken();
    const params = new URLSearchParams({
      page: '1',
      pageSize: '100'
    });
    if (keyword?.trim()) {
      params.set('keyword', keyword.trim());
    }

    const result = await this.requestJson<{
      items: PamCliProjectType[];
    }>(`${baseUrl}/api/pam/search?${params.toString()}`, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${token}`
      }
    });

    return result.items || [];
  }

  /**
   * @override
   */
  public async createProject(
    payload: PamCliCreateProjectInputType
  ): Promise<PamCliProjectType> {
    const baseUrl = await this.authStore.getBaseUrl();
    const token = await this.requireToken();

    const created = await this.requestJson<PamCliProjectType>(
      `${baseUrl}/api/pam/create`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      }
    );

    return created;
  }

  /**
   * @override
   */
  public async forkProject(
    sourceProjectId: string,
    options?: PamCliForkProjectInputType
  ): Promise<PamCliProjectType> {
    const baseUrl = await this.authStore.getBaseUrl();
    const token = await this.requireToken();
    const body: PamCliForkProjectInputType = {
      ...(options?.slug?.trim() ? { slug: options.slug.trim() } : {}),
      ...(options?.name?.trim() ? { name: options.name.trim() } : {})
    };

    return this.requestJson<PamCliProjectType>(
      `${baseUrl}/api/pam/fork/${sourceProjectId}`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(body)
      }
    );
  }

  /**
   * @override
   */
  public async listEnvironments(
    projectId: string
  ): Promise<PamCliRemoteEnvironmentType[]> {
    const baseUrl = await this.authStore.getBaseUrl();
    const token = await this.requireToken();

    const result = await this.requestJson<PamCliRemoteEnvironmentType[]>(
      `${baseUrl}/api/pam/${projectId}/environments`,
      {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${token}`
        }
      }
    );

    return result || [];
  }

  /**
   * @override
   */
  public async createEnvironment(
    projectId: string,
    payload: PamCliCreateEnvironmentInputType
  ): Promise<PamCliRemoteEnvironmentType> {
    const baseUrl = await this.authStore.getBaseUrl();
    const token = await this.requireToken();

    return this.requestJson<PamCliRemoteEnvironmentType>(
      `${baseUrl}/api/pam/${projectId}/environments`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          name: payload.name,
          url: payload.url,
          ...(payload.variables ? { variables: payload.variables } : {})
        })
      }
    );
  }

  /**
   * @override
   */
  public async exportEnvironment(
    projectId: string,
    envId: string
  ): Promise<PamCliExportResultType> {
    const baseUrl = await this.authStore.getBaseUrl();
    const token = await this.requireToken();

    return this.requestJson<PamCliExportResultType>(
      `${baseUrl}/api/pam/${projectId}/environments/${envId}/export`,
      {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${token}`
        }
      }
    );
  }

  /**
   * @override
   */
  public async replaceEnvironmentVariables(
    projectId: string,
    envId: string,
    variables: readonly PamCliVariableInputType[]
  ): Promise<void> {
    const baseUrl = await this.authStore.getBaseUrl();
    const token = await this.requireToken();

    await this.requestJson<unknown>(
      `${baseUrl}/api/pam/${projectId}/environments/${envId}/variables`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ variables })
      }
    );
  }

  /**
   * @override
   */
  public async deleteEnvironment(
    projectId: string,
    envId: string
  ): Promise<void> {
    const baseUrl = await this.authStore.getBaseUrl();
    const token = await this.requireToken();

    await this.requestJson<unknown>(
      `${baseUrl}/api/pam/${projectId}/environments/${envId}/delete`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({})
      }
    );
  }

  /**
   * @override
   */
  public async revokeCliToken(): Promise<void> {
    const baseUrl = await this.authStore.getBaseUrl();
    const token = await this.authStore.getToken();
    if (!token) {
      return;
    }

    await this.requestJson<{ revoked: boolean }>(
      `${baseUrl}/api/pam/cli/logout`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: '{}'
      }
    );
  }

  protected async requireToken(): Promise<string> {
    const token = await this.authStore.getToken();
    if (!token) {
      throw new PamCliApiError({
        id: 'pamenv:not_logged_in',
        message: 'Not logged in. Run `pamenv login` first.',
        httpStatus: 401
      });
    }
    return token;
  }

  protected async requestJson<T>(url: string, init: RequestInit): Promise<T> {
    const response = await fetch(url, init);
    let body: ApiEnvelopeType<T>;
    try {
      body = (await response.json()) as ApiEnvelopeType<T>;
    } catch {
      throw new PamCliApiError({
        id: 'pamenv:non_json_response',
        message: `PAM API returned non-JSON (HTTP ${response.status}) for ${url}`,
        httpStatus: response.status
      });
    }

    if (!response.ok || body.success !== true) {
      throw new PamCliApiError({
        id: body.id || 'pamenv:api_failed',
        message: body.message,
        requestId: body.requestId,
        data: body.data,
        httpStatus: response.status
      });
    }

    return body.data as T;
  }
}
