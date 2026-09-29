import {
  ApiCorsPluginBase,
  type RuntimeCorsConfig
} from '@brain-toolkit/next-app-kit/server';
import { I } from '@config/ioc-identifiter';
import { RUNTIME_CORS_CACHE_KEY } from '@config/siteSettings';
import type { BrainOAuthServerIocMap } from '@server/BootstrapServer';
import { ServerConfig } from '@server/ServerConfig';
import { SiteSettingsService } from '@server/services/SiteSettingsService';
import { ServerContext } from '@server/utils/ServerContext';
import type { BootstrapServerContext } from '@qlover/next-kit/server';

type BrainOAuthIOC =
  BootstrapServerContext<BrainOAuthServerIocMap>['parameters']['IOC'];

/**
 * CORS from Admin → Site settings (falls back to `API_CORS_ALLOWED_ORIGINS`).
 *
 * - OPTIONS: `new ApiCorsPlugin(opts).preflight(req)`
 * - Handlers: `.use(new ApiCorsPlugin({ ...opts, request: req }))`
 */
export class ApiCorsPlugin extends ApiCorsPluginBase<BrainOAuthServerIocMap> {
  /**
   * @override
   */
  protected get corsCacheKey(): string {
    return RUNTIME_CORS_CACHE_KEY;
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
  protected loadCorsConfig(IOC: BrainOAuthIOC): Promise<RuntimeCorsConfig> {
    return IOC(SiteSettingsService).getCorsConfig();
  }

  /**
   * @override
   */
  protected applyResponseHeaders(
    IOC: BrainOAuthIOC,
    headers: HeadersInit | undefined
  ): void {
    const serverContext = IOC(I.ServerContextInterface);
    if (serverContext instanceof ServerContext) {
      serverContext.setResponseHeaders(headers);
    }
  }
}
