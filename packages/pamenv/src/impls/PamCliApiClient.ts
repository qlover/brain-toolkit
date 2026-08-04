import type {
  PamCliApiClientInterface,
  PamCliDeviceCodeType,
  PamCliDevicePollResultType
} from '../interfaces/PamCliApiClientInterface';
import type { PamCliAuthStoreInterface } from '../interfaces/PamCliAuthStoreInterface';
import type {
  PamCliCreateProjectInputType,
  PamCliExportResultType,
  PamCliProjectType,
  PamCliRemoteEnvironmentType,
  PamCliVariableInputType
} from '../interfaces/PamCliTypes';

type ApiEnvelopeType<T> = {
  readonly success: boolean;
  readonly data?: T;
  readonly message?: string;
  readonly id?: string;
};

/**
 * Fetch-based PAM API client for the CLI.
 *
 * Significance: Talks to PAM over HTTP with Bearer CLI tokens.
 * Core idea: JSON envelope `{ success, data }` matching NextKit APIs.
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
    }>(`${this.normalizeBaseUrl(baseUrl)}/api/pam/cli/token`, {
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
      `${this.normalizeBaseUrl(baseUrl)}/api/pam/cli/device/code`,
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
      `${this.normalizeBaseUrl(baseUrl)}/api/pam/cli/device/token`,
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
      throw new Error(
        `PAM API returned non-JSON (HTTP ${response.status}) while polling device token`
      );
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

    // Some stacks wrap ExecutorError ids with prefixes — treat unknown soft
    // failures while still pending as pending when message matches.
    if (
      body.message?.includes('authorization_pending') ||
      id.endsWith('authorization_pending')
    ) {
      return { status: 'pending' };
    }

    throw new Error(
      body.message || body.id || `Device token poll failed (HTTP ${response.status})`
    );
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
      throw new Error('Not logged in. Run `pamenv login` first.');
    }
    return token;
  }

  protected normalizeBaseUrl(baseUrl: string): string {
    return baseUrl.trim().replace(/\/+$/, '');
  }

  protected async requestJson<T>(
    url: string,
    init: RequestInit
  ): Promise<T> {
    const response = await fetch(url, init);
    let body: ApiEnvelopeType<T>;
    try {
      body = (await response.json()) as ApiEnvelopeType<T>;
    } catch {
      throw new Error(
        `PAM API returned non-JSON (HTTP ${response.status}) for ${url}`
      );
    }

    if (!response.ok || !body.success || body.data === undefined) {
      throw new Error(
        body.message ||
          body.id ||
          `PAM API failed (HTTP ${response.status}) for ${url}`
      );
    }

    return body.data;
  }
}
