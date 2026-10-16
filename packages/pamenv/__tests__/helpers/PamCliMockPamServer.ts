import {
  createServer,
  type IncomingMessage,
  type Server,
  type ServerResponse
} from 'node:http';
import type { PamCliProjectType } from '../../src/interfaces/PamCliTypes';

export type PamCliMockExportPayloadType = {
  readonly projectId: string;
  readonly projectSlug: string;
  readonly environmentId: string;
  readonly environmentName: string;
  readonly content: string;
  readonly sensitiveKeys: readonly string[];
  readonly sensitivePlaceholder: string;
  readonly variables: readonly {
    readonly key: string;
    readonly value: string;
    readonly sensitive?: boolean;
    readonly comments?: readonly string[];
  }[];
};

export type PamCliMockResolvePayloadType = {
  readonly projectId?: string;
  readonly projectSlug?: string;
  readonly environmentId?: string;
  readonly environmentName?: string;
  readonly variables: readonly {
    readonly key: string;
    readonly value: string;
    readonly sensitive: boolean;
  }[];
};

export type PamCliMockErrorType = { status: number; id: string; message?: string };

export type PamCliMockPamHandlersType = {
  readonly projects?: readonly PamCliProjectType[];
  readonly requireAuth?: boolean;
  readonly exportByEnvId?: Record<
    string,
    PamCliMockExportPayloadType | PamCliMockErrorType
  >;
  readonly resolveByEnvId?: Record<
    string,
    PamCliMockResolvePayloadType | PamCliMockErrorType
  >;
  readonly resolveByName?: Record<
    string,
    PamCliMockResolvePayloadType | PamCliMockErrorType
  >;
  readonly deleteByEnvId?: Record<string, true | PamCliMockErrorType>;
  readonly createEnvironment?: (
    projectId: string,
    body: { name?: string; url?: string; variables?: unknown }
  ) =>
    | { id: string; name: string; url?: string }
    | PamCliMockErrorType;
  onReplaceVariables?: (
    projectId: string,
    envId: string,
    body: unknown
  ) => void | PamCliMockErrorType;
};

/**
 * Minimal in-process PAM HTTP stub for pamenv contract tests.
 * Speaks the same `{ success, id, data }` envelope as NextKit.
 */
export class PamCliMockPamServer {
  protected server: Server | null = null;
  protected handlers: PamCliMockPamHandlersType = {};
  public readonly requests: Array<{
    method: string;
    url: string;
    authorization?: string;
  }> = [];
  public readonly deletedEnvIds: string[] = [];
  public readonly replacedBodies: Array<{
    projectId: string;
    envId: string;
    body: unknown;
  }> = [];

  public setHandlers(handlers: PamCliMockPamHandlersType): void {
    this.handlers = handlers;
    this.requests.length = 0;
    this.deletedEnvIds.length = 0;
    this.replacedBodies.length = 0;
  }

  public async start(): Promise<string> {
    if (this.server) {
      throw new Error('Mock PAM server already started');
    }
    this.server = createServer((req, res) => {
      void this.handle(req, res);
    });
    await new Promise<void>((resolve, reject) => {
      this.server!.once('error', reject);
      this.server!.listen(0, '127.0.0.1', () => resolve());
    });
    const address = this.server.address();
    if (!address || typeof address === 'string') {
      throw new Error('Mock PAM server has no address');
    }
    return `http://127.0.0.1:${address.port}`;
  }

  public async stop(): Promise<void> {
    const server = this.server;
    this.server = null;
    if (!server) {
      return;
    }
    await new Promise<void>((resolve, reject) => {
      server.close((error) => (error ? reject(error) : resolve()));
    });
  }

  public searchCount(): number {
    return this.requests.filter((item) =>
      item.url.startsWith('/api/pam/search')
    ).length;
  }

  protected async handle(
    req: IncomingMessage,
    res: ServerResponse
  ): Promise<void> {
    const method = (req.method || 'GET').toUpperCase();
    const url = new URL(req.url || '/', 'http://127.0.0.1');
    const authorization = req.headers.authorization;
    this.requests.push({
      method,
      url: `${url.pathname}${url.search}`,
      ...(authorization ? { authorization } : {})
    });

    try {
      if (this.handlers.requireAuth !== false) {
        if (!authorization?.startsWith('Bearer ')) {
          this.json(res, 401, {
            success: false,
            id: 'api:not_authorized',
            message: 'missing bearer'
          });
          return;
        }
      }

      if (method === 'GET' && url.pathname === '/api/pam/search') {
        const keyword = url.searchParams.get('keyword')?.trim() || '';
        const view = url.searchParams.get('view')?.trim() || 'full';
        let filters: {
          category?: string;
          visibility?: string;
          mine?: boolean | string;
          writable?: boolean | string;
        } = {};
        const filtersRaw = url.searchParams.get('filters');
        if (filtersRaw) {
          try {
            filters = JSON.parse(filtersRaw) as typeof filters;
          } catch {
            filters = {};
          }
        }
        const page = Math.max(
          1,
          Number(url.searchParams.get('page') || '1') || 1
        );
        const pageSize = Math.min(
          100,
          Math.max(1, Number(url.searchParams.get('pageSize') || '100') || 100)
        );
        const mine = filters.mine === true || filters.mine === 'true';
        const writable =
          filters.writable === true || filters.writable === 'true';
        let items = [...(this.handlers.projects || [])];
        if (keyword) {
          items = items.filter(
            (project) =>
              project.slug.includes(keyword) ||
              project.name.includes(keyword) ||
              project.id === keyword
          );
        }
        if (filters.category) {
          items = items.filter(
            (project) =>
              (project as { category?: string }).category === filters.category
          );
        }
        if (filters.visibility === 'public') {
          items = items.filter(
            (project) => (project as { is_public?: boolean }).is_public === true
          );
        } else if (filters.visibility === 'private') {
          items = items.filter(
            (project) =>
              (project as { is_public?: boolean }).is_public !== true ||
              project.is_owner === true ||
              project.my_role === 'owner' ||
              project.my_role === 'admin' ||
              project.my_role === 'member'
          );
        }
        if (mine) {
          items = items.filter(
            (project) =>
              project.is_owner === true || project.my_role === 'owner'
          );
        }
        if (writable) {
          items = items.filter(
            (project) =>
              project.is_owner === true ||
              project.my_role === 'owner' ||
              project.can_edit === true ||
              project.my_role === 'admin' ||
              project.my_role === 'member'
          );
        }
        const total = items.length;
        const start = (page - 1) * pageSize;
        let slice = items.slice(start, start + pageSize);
        if (view === 'compact') {
          // Keep access flags (CLI still needs them); drop card-only fields.
          slice = slice.map((project) => ({
            id: project.id,
            slug: project.slug,
            name: project.name,
            is_owner: project.is_owner,
            my_role: project.my_role,
            can_edit: project.can_edit,
            permissions: project.permissions,
            org_permissions: project.org_permissions,
            environments: project.environments?.map((env) => ({
              id: env.id,
              name: env.name
            }))
          }));
        }
        this.json(res, 200, {
          success: true,
          data: {
            items: slice,
            page,
            pageSize,
            total,
            hasMore: start + slice.length < total
          }
        });
        return;
      }

      const listEnvs = url.pathname.match(/^\/api\/pam\/([^/]+)\/environments$/);
      if (method === 'GET' && listEnvs) {
        const projectId = decodeURIComponent(listEnvs[1]!);
        const project = (this.handlers.projects || []).find(
          (item) => item.id === projectId || item.slug === projectId
        );
        this.json(res, 200, {
          success: true,
          data: project?.environments || []
        });
        return;
      }

      if (method === 'POST' && listEnvs) {
        const projectId = decodeURIComponent(listEnvs[1]!);
        const body = (await this.readJson(req)) as {
          name?: string;
          url?: string;
          variables?: unknown;
        };
        const created = this.handlers.createEnvironment?.(projectId, body);
        if (!created) {
          this.json(res, 404, { success: false, id: 'pamenv:mock_no_create' });
          return;
        }
        if ('status' in created) {
          this.json(res, created.status, {
            success: false,
            id: created.id,
            message: created.message
          });
          return;
        }
        this.json(res, 200, { success: true, data: created });
        return;
      }

      const exportMatch = url.pathname.match(
        /^\/api\/pam\/([^/]+)\/environments\/([^/]+)\/export$/
      );
      if (method === 'GET' && exportMatch) {
        const envId = decodeURIComponent(exportMatch[2]!);
        const payload = this.handlers.exportByEnvId?.[envId];
        if (!payload) {
          this.json(res, 404, { success: false, id: 'api:pam_env_not_found' });
          return;
        }
        if ('status' in payload) {
          this.json(res, payload.status, {
            success: false,
            id: payload.id,
            message: payload.message
          });
          return;
        }
        this.json(res, 200, { success: true, data: payload });
        return;
      }

      const resolveMatch = url.pathname.match(
        /^\/api\/pam\/([^/]+)\/environments\/([^/]+)\/resolve$/
      );
      if (method === 'POST' && resolveMatch) {
        const envId = decodeURIComponent(resolveMatch[2]!);
        const body = (await this.readJson(req)) as { keys?: string[] };
        const payload = this.handlers.resolveByEnvId?.[envId];
        if (!payload) {
          this.json(res, 404, { success: false, id: 'api:pam_env_not_found' });
          return;
        }
        if ('status' in payload) {
          this.json(res, payload.status, {
            success: false,
            id: payload.id,
            message: payload.message
          });
          return;
        }
        this.json(res, 200, {
          success: true,
          data: {
            variables: this.filterResolveVariables(payload.variables, body.keys)
          }
        });
        return;
      }

      const resolveByNameMatch = url.pathname.match(
        /^\/api\/pam\/([^/]+)\/resolve$/
      );
      if (method === 'POST' && resolveByNameMatch) {
        const projectRef = decodeURIComponent(resolveByNameMatch[1]!);
        const body = (await this.readJson(req)) as {
          env?: string;
          keys?: string[];
        };
        const envName = body.env?.trim() || '';
        const key = `${projectRef}:${envName}`;
        const payload = this.handlers.resolveByName?.[key];
        if (!payload) {
          this.json(res, 404, { success: false, id: 'api:pam_env_not_found' });
          return;
        }
        if ('status' in payload) {
          this.json(res, payload.status, {
            success: false,
            id: payload.id,
            message: payload.message
          });
          return;
        }
        this.json(res, 200, {
          success: true,
          data: {
            projectId: payload.projectId || 'unknown',
            projectSlug: payload.projectSlug || projectRef,
            environmentId: payload.environmentId || 'e-unknown',
            environmentName: payload.environmentName || envName,
            variables: this.filterResolveVariables(payload.variables, body.keys)
          }
        });
        return;
      }

      const variablesMatch = url.pathname.match(
        /^\/api\/pam\/([^/]+)\/environments\/([^/]+)\/variables$/
      );
      if (method === 'POST' && variablesMatch) {
        const projectId = decodeURIComponent(variablesMatch[1]!);
        const envId = decodeURIComponent(variablesMatch[2]!);
        const body = await this.readJson(req);
        const err = this.handlers.onReplaceVariables?.(projectId, envId, body);
        if (err && typeof err === 'object' && 'status' in err) {
          this.json(res, err.status, {
            success: false,
            id: err.id,
            message: err.message
          });
          return;
        }
        this.replacedBodies.push({ projectId, envId, body });
        this.json(res, 200, { success: true, data: {} });
        return;
      }

      const deleteMatch = url.pathname.match(
        /^\/api\/pam\/([^/]+)\/environments\/([^/]+)\/delete$/
      );
      if (method === 'POST' && deleteMatch) {
        const envId = decodeURIComponent(deleteMatch[2]!);
        const payload = this.handlers.deleteByEnvId?.[envId];
        if (!payload) {
          this.json(res, 404, { success: false, id: 'api:pam_env_not_found' });
          return;
        }
        if (payload !== true && 'status' in payload) {
          this.json(res, payload.status, {
            success: false,
            id: payload.id,
            message: payload.message
          });
          return;
        }
        this.deletedEnvIds.push(envId);
        this.json(res, 200, { success: true, data: {} });
        return;
      }

      this.json(res, 404, {
        success: false,
        id: 'pamenv:mock_not_found',
        message: `${method} ${url.pathname}`
      });
    } catch (error) {
      this.json(res, 500, {
        success: false,
        id: 'pamenv:mock_error',
        message: error instanceof Error ? error.message : String(error)
      });
    }
  }

  protected json(
    res: ServerResponse,
    status: number,
    body: Record<string, unknown>
  ): void {
    const text = JSON.stringify(body);
    res.writeHead(status, {
      'Content-Type': 'application/json',
      'Content-Length': Buffer.byteLength(text)
    });
    res.end(text);
  }

  protected async readJson(req: IncomingMessage): Promise<unknown> {
    const chunks: Buffer[] = [];
    for await (const chunk of req) {
      chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
    }
    const raw = Buffer.concat(chunks).toString('utf8').trim();
    if (!raw) {
      return {};
    }
    return JSON.parse(raw) as unknown;
  }

  protected filterResolveVariables<
    T extends { readonly key: string }
  >(variables: readonly T[], keys: readonly string[] | undefined): T[] {
    if (!keys || keys.length === 0) {
      return [...variables];
    }
    const wanted = new Set(keys);
    return variables.filter((item) => wanted.has(item.key));
  }
}
