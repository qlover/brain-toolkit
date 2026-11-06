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
  PamCliListProjectsOptionsType,
  PamCliProjectSearchPageType,
  PamCliProjectType,
  PamCliRemoteEnvironmentType,
  PamCliResolveByNameResultType,
  PamCliResolveResultType,
  PamCliVariableInputType
} from '../interfaces/PamCliTypes';
import { PamCliConfig } from '../config/PamCliConfig';
import { PamCliI18n } from '../i18n/PamCliI18n';
import { PAMENV_CLI_NOT_LOGGED_IN } from '../i18n/identifier/pamenv_cli';
import { PamCliApiError } from './PamCliApiError';
import { PamCliProjectSearchUtil } from './PamCliProjectSearchUtil';
import { PamResolveSealClientRegistry } from './PamResolveSealClientRegistry';
import type {
  PamResolveSealEnvelopeType,
  PamResolveSealEphemeralKeyPairType
} from '../interfaces/PamResolveSealClientInterface';
import { version } from '../../package.json';

/** Recorded in PAM env access logs. */
const CLIENT_HEADER = { 'x-pamenv-client': `pamenv-cli/${version}` } as const;

type SealedResolveWireType = {
  readonly seal: PamResolveSealEnvelopeType;
  readonly variables?: never;
};

type SealedResolveByNameWireType = SealedResolveWireType & {
  readonly projectId: string;
  readonly projectSlug: string;
  readonly environmentId: string;
  readonly environmentName: string;
};

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
  constructor(
    protected readonly authStore: PamCliAuthStoreInterface,
    protected readonly resolveSealRegistry: PamResolveSealClientRegistry = PamResolveSealClientRegistry.createDefault()
  ) {}

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
  public async createDeviceCode(
    baseUrl: string,
    locale?: 'en' | 'zh'
  ): Promise<PamCliDeviceCodeType> {
    return this.requestJson<PamCliDeviceCodeType>(
      `${PamCliConfig.normalizeOrigin(baseUrl)}/api/pam/cli/device/code`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(locale ? { locale } : {})
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
      locale?: 'en' | 'zh';
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
      const locale =
        body.data.locale === 'zh' || body.data.locale === 'en'
          ? body.data.locale
          : undefined;
      return {
        status: 'approved',
        token: body.data.token,
        expiresAt: body.data.expiresAt,
        email: body.data.user?.email || 'unknown',
        ...(locale ? { locale } : {})
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
  public async listProjects(
    keywordOrOptions?: string | PamCliListProjectsOptionsType
  ): Promise<PamCliProjectType[]> {
    const page = await this.searchProjects(
      PamCliProjectSearchUtil.normalizeOptions(keywordOrOptions)
    );
    return [...page.items];
  }

  /**
   * @override
   */
  public async searchProjects(
    options: PamCliListProjectsOptionsType = {}
  ): Promise<PamCliProjectSearchPageType> {
    const baseUrl = await this.authStore.getBaseUrl();
    const token = await this.requireToken();
    const normalized = PamCliProjectSearchUtil.normalizeOptions(options);
    const page = Math.max(1, normalized.page ?? 1);
    const pageSize = Math.min(100, Math.max(1, normalized.pageSize ?? 100));
    const params = PamCliProjectSearchUtil.buildQuery({
      ...normalized,
      page,
      pageSize
    });

    const result = await this.requestJson<{
      items?: PamCliProjectType[];
      hasMore?: boolean;
      total?: number;
      page?: number;
      pageSize?: number;
    }>(`${baseUrl}/api/pam/search?${params.toString()}`, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${token}`
      }
    });

    const items = result.items || [];
    const hasMore =
      typeof result.hasMore === 'boolean'
        ? result.hasMore
        : items.length >= pageSize;

    return {
      items,
      page: result.page ?? page,
      pageSize: result.pageSize ?? pageSize,
      hasMore,
      ...(typeof result.total === 'number' ? { total: result.total } : {})
    };
  }

  /**
   * @override
   */
  public async listCategories(): Promise<string[]> {
    const baseUrl = await this.authStore.getBaseUrl();
    const token = await this.requireToken();
    const result = await this.requestJson<string[]>(
      `${baseUrl}/api/pam/categories`,
      {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${token}`
        }
      }
    );
    return Array.isArray(result) ? result : [];
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
          Authorization: `Bearer ${token}`,
          ...CLIENT_HEADER
        }
      }
    );
  }

  /**
   * @override
   */
  public async resolveEnvironment(
    projectId: string,
    envId: string,
    keys?: readonly string[]
  ): Promise<PamCliResolveResultType> {
    const baseUrl = await this.authStore.getBaseUrl();
    const token = await this.requireToken();
    const ephemeral = this.resolveSealRegistry.createEphemeralKeyPair();

    const sealed = await this.requestJson<SealedResolveWireType>(
      `${baseUrl}/api/pam/${projectId}/environments/${envId}/resolve`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
          ...CLIENT_HEADER
        },
        body: JSON.stringify(this.buildResolveBody(ephemeral, keys))
      }
    );

    return { variables: this.openResolveVariables(sealed, ephemeral) };
  }

  /**
   * @override
   */
  public async resolveEnvironmentByName(
    projectRef: string,
    envName: string,
    keys?: readonly string[]
  ): Promise<PamCliResolveByNameResultType> {
    const baseUrl = await this.authStore.getBaseUrl();
    const token = await this.requireToken();
    const ephemeral = this.resolveSealRegistry.createEphemeralKeyPair();

    const sealed = await this.requestJson<SealedResolveByNameWireType>(
      `${baseUrl}/api/pam/${encodeURIComponent(projectRef)}/resolve`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
          ...CLIENT_HEADER
        },
        body: JSON.stringify({
          env: envName,
          ...this.buildResolveBody(ephemeral, keys)
        })
      }
    );

    return {
      projectId: sealed.projectId,
      projectSlug: sealed.projectSlug,
      environmentId: sealed.environmentId,
      environmentName: sealed.environmentName,
      variables: this.openResolveVariables(sealed, ephemeral)
    };
  }

  /**
   * 组装带必填 seal offer 的 resolve 请求体。
   */
  protected buildResolveBody(
    ephemeral: PamResolveSealEphemeralKeyPairType,
    keys?: readonly string[]
  ): { seal: PamResolveSealEphemeralKeyPairType['offer']; keys?: string[] } {
    return {
      seal: ephemeral.offer,
      ...(keys && keys.length > 0 ? { keys: [...keys] } : {})
    };
  }

  /**
   * 解开密封变量；线上若仍带明文 `variables` 则拒绝。
   */
  protected openResolveVariables(
    sealed: SealedResolveWireType,
    ephemeral: PamResolveSealEphemeralKeyPairType
  ): PamCliResolveResultType['variables'] {
    if (!sealed.seal) {
      throw new Error('Resolve response missing seal envelope');
    }
    const opened = this.resolveSealRegistry.open(
      sealed.seal,
      ephemeral.privateKey
    );
    const parsed = JSON.parse(Buffer.from(opened).toString('utf8')) as unknown;
    if (!Array.isArray(parsed)) {
      throw new Error('Resolve seal payload is not a variables array');
    }
    return parsed as PamCliResolveResultType['variables'];
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
        id: PAMENV_CLI_NOT_LOGGED_IN,
        message: PamCliI18n.t(PAMENV_CLI_NOT_LOGGED_IN),
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
