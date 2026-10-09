import {
  ApiCorsPluginBase,
  type RuntimeCorsConfig
} from '@brain-toolkit/next-app-kit/server';
import { I } from '@config/ioc-identifiter';
import type { PamServerIocMap } from '@server/BootstrapServer';
import { ServerConfig } from '@server/ServerConfig';
import {
  PAM_RUNTIME_CORS_CACHE_KEY,
  SiteSettingsService
} from '@server/services/SiteSettingsService';
import { ServerContext } from '@server/utils/ServerContext';
import type { BootstrapServerContext } from '@qlover/next-kit/server';

export type { ApiCorsPluginOptions } from '@brain-toolkit/next-app-kit/server';

type PamIOC = BootstrapServerContext<PamServerIocMap>['parameters']['IOC'];

/**
 * CORS 单元：可独立使用，也可作为 NextApiServer 插件。
 *
 * - 独立：`new ApiCorsPlugin(opts).preflight(req)`
 * - 管道：`.use(new ApiCorsPlugin({ ...opts, request: req }))`
 */
export class ApiCorsPlugin extends ApiCorsPluginBase<PamServerIocMap> {
  /**
   * @override
   */
  protected get corsCacheKey(): string {
    return PAM_RUNTIME_CORS_CACHE_KEY;
  }

  /**
   * @override
   */
  protected getEnvCors(): {
    origins: readonly string[];
    methods: readonly string[];
  } {
    const config = new ServerConfig();
    return {
      origins: config.apiCorsAllowedOrigins,
      methods: config.apiCorsAllowedMethods
    };
  }

  /**
   * @override
   */
  protected loadCorsConfig(IOC: PamIOC): Promise<RuntimeCorsConfig> {
    return IOC(SiteSettingsService).getCorsConfig();
  }

  /**
   * @override
   */
  protected applyResponseHeaders(
    IOC: PamIOC,
    headers: HeadersInit | undefined
  ): void {
    const serverContext = IOC(I.ServerContextInterface);
    if (serverContext instanceof ServerContext) {
      serverContext.setResponseHeaders(headers);
    }
  }
}
