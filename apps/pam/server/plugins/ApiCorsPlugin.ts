import {
  apiCorsPreflightResponse,
  buildApiCorsHeaders
} from '@qlover/next-kit/server';
import { I } from '@config/ioc-identifiter';
import type { PamServerIocMap } from '@server/BootstrapServer';
import { ServerConfig } from '@server/ServerConfig';
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

  /**
   * 独立 OPTIONS（不经 NextApiServer）。
   * 只读进程级 MemoryKv；未命中则用 env，不创建 IOC（对齐 brain-oauth 轻量 preflight）。
   * DB 规则由后续 POST/GET 经 IOC 加载并写穿缓存。
   */
  public async preflight(req: NextRequest): Promise<NextResponse> {
    const config = await this.loadConfigForPreflight();
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

  /** OPTIONS：MemoryKv → env，绝不 createServerIoc。 */
  protected async loadConfigForPreflight(): Promise<RuntimeCorsConfig> {
    const kv = new MemoryKvCacheService();
    const cached = await kv.getItem<RuntimeCorsConfig>(
      PAM_RUNTIME_CORS_CACHE_KEY
    );
    if (cached) {
      return cached;
    }
    return ApiCorsPlugin.envFallbackConfig();
  }

  /**
   * 优先 SiteSettingsService（MemoryKv 写穿）。
   * 无 IOC 时仅读缓存，未命中回退 env（不建 throwaway IOC）。
   */
  protected async loadConfig(
    IOC?: BootstrapServerContext<PamServerIocMap>['parameters']['IOC']
  ): Promise<RuntimeCorsConfig> {
    if (IOC) {
      return IOC(SiteSettingsService).getCorsConfig();
    }

    return this.loadConfigForPreflight();
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
