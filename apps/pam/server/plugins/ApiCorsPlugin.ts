import {
  apiCorsPreflightResponse,
  buildApiCorsHeaders,
  createLogger
} from '@qlover/next-kit/server';
import { I } from '@config/ioc-identifiter';
import type { PamServerIocMap } from '@server/BootstrapServer';
import { ServerConfig } from '@server/ServerConfig';
import { createServerIoc } from '@server/serverIoc';
import { MemoryKvCacheService } from '@server/services/MemoryKvCacheService';
import {
  PAM_RUNTIME_CORS_CACHE_KEY,
  SiteSettingsService
} from '@server/services/SiteSettingsService';
import {
  buildRuntimeCorsConfig,
  type RuntimeCorsConfig
} from '@server/utils/resolveRuntimeCorsConfig';
import { ServerContext } from '@server/utils/ServerContext';
import type {
  BootstrapServerContext,
  BootstrapServerPlugin
} from '@qlover/next-kit/server';
import type { NextRequest } from 'next/server';
import type { NextResponse } from 'next/server';

export type ApiCorsPluginOptions = {
  /** 规则匹配用 pathname（默认取请求 URL pathname）。 */
  readonly path?: string;
  readonly credentials?: boolean;
  /**
   * 挂到 NextApiServer 时（onBefore）使用的请求。
   * 独立 {@link preflight} / {@link resolveHeaders} 时把 req 当参数传入。
   */
  readonly request?: NextRequest;
};

/**
 * CORS 单元：可独立使用，也可作为 NextApiServer 插件。
 *
 * - 独立：`new ApiCorsPlugin(opts).preflight(req)`
 * - 管道：`.use(new ApiCorsPlugin({ ...opts, request: req }))`
 */
export class ApiCorsPlugin implements BootstrapServerPlugin<PamServerIocMap> {
  public readonly pluginName = 'ApiCorsPlugin';

  constructor(private readonly options: ApiCorsPluginOptions = {}) {}

  /** 独立 OPTIONS（不经 NextApiServer）。 */
  public async preflight(req: NextRequest): Promise<NextResponse> {
    const config = await this.loadConfig();
    return apiCorsPreflightResponse(req, config, {
      path: this.options.path,
      credentials: this.options.credentials
    });
  }

  /** 独立：解析某次请求的 Allow-* 头。 */
  public async resolveHeaders(
    req: NextRequest
  ): Promise<HeadersInit | undefined> {
    const config = await this.loadConfig();
    return buildApiCorsHeaders(req, config, {
      path: this.options.path,
      credentials: this.options.credentials
    });
  }

  /**
   * NextApiServer onBefore：经 IOC 加载配置，并把头写入 ServerContext。
   *
   * @override
   */
  public async onBefore({
    parameters: { IOC }
  }: BootstrapServerContext<PamServerIocMap>): Promise<void> {
    const req = this.options.request;
    if (!req) {
      return;
    }

    const config = await this.loadConfig(IOC);
    const headers = buildApiCorsHeaders(req, config, {
      path: this.options.path,
      credentials: this.options.credentials
    });

    const serverContext = IOC(I.ServerContextInterface);
    if (serverContext instanceof ServerContext) {
      serverContext.setResponseHeaders(headers);
    }
  }

  /**
   * 优先 SiteSettingsService（MemoryKv 写穿）。
   * 独立调用（OPTIONS）先读进程级 CORS 缓存，命中则不创建 IOC。
   */
  protected async loadConfig(
    IOC?: BootstrapServerContext<PamServerIocMap>['parameters']['IOC']
  ): Promise<RuntimeCorsConfig> {
    if (IOC) {
      return IOC(SiteSettingsService).getCorsConfig();
    }

    const kv = new MemoryKvCacheService();
    const cached = await kv.getItem<RuntimeCorsConfig>(
      PAM_RUNTIME_CORS_CACHE_KEY
    );
    if (cached) {
      return cached;
    }

    try {
      const serverConfig = new ServerConfig();
      const logger = createLogger('api-cors', serverConfig);
      const ioc = createServerIoc(logger, serverConfig);
      return await ioc(SiteSettingsService).getCorsConfig();
    } catch {
      // ignore and fall back to env
    }

    const fallback = ApiCorsPlugin.envFallbackConfig();
    await kv.setItem(PAM_RUNTIME_CORS_CACHE_KEY, fallback);
    return fallback;
  }

  protected static envFallbackConfig(): RuntimeCorsConfig {
    const config = new ServerConfig();
    const methods =
      config.apiCorsAllowedMethods.length > 0
        ? config.apiCorsAllowedMethods
        : ['GET', 'POST', 'OPTIONS'];
    const rules = config.apiCorsAllowedOrigins.map((origin) => ({
      origin,
      path: '*',
      methods: ['*'] as string[]
    }));
    return buildRuntimeCorsConfig(rules, methods);
  }
}
