import {
  apiCorsPreflightResponse,
  buildApiCorsHeaders
} from '@qlover/next-kit/server';
import { MemoryKvCacheService } from '../services/MemoryKvCacheService';
import {
  buildRuntimeCorsConfig,
  DEFAULT_CORS_METHODS,
  envCorsRules,
  type RuntimeCorsConfig
} from './runtimeCors';
import type {
  BootstrapServerContext,
  BootstrapServerPlugin
} from '@qlover/next-kit/server';
import type { NextRequest, NextResponse } from 'next/server';

export type ApiCorsPluginOptions = {
  /** Pathname used for rule matching (defaults to the request pathname). */
  readonly path?: string;
  readonly credentials?: boolean;
  /** Request used by `onBefore` when mounted on an API server. */
  readonly request?: NextRequest;
};

type PluginIOC<IocMap extends Record<PropertyKey, unknown>> = BootstrapServerContext<IocMap>['parameters']['IOC'];

/**
 * CORS for API routes, driven by site settings.
 *
 * - Standalone OPTIONS: `new Plugin(opts).preflight(req)` — reads only the
 *   process-wide cache (then env), never builds an IOC.
 * - Pipeline: `.use(new Plugin({ ...opts, request: req }))` — loads rules via
 *   IOC (write-through cache) and hands headers to the server context.
 */
export abstract class ApiCorsPluginBase<
  IocMap extends Record<PropertyKey, unknown>
>
  implements BootstrapServerPlugin<IocMap>
{
  public readonly pluginName = 'ApiCorsPlugin';

  constructor(protected readonly options: ApiCorsPluginOptions = {}) {}

  /** Same key as the site settings service `corsCacheKey`. */
  protected abstract get corsCacheKey(): string;

  protected abstract getEnvCors(): {
    origins: readonly string[];
    methods: readonly string[];
  };

  protected abstract loadCorsConfig(
    IOC: PluginIOC<IocMap>
  ): Promise<RuntimeCorsConfig>;

  protected abstract applyResponseHeaders(
    IOC: PluginIOC<IocMap>,
    headers: HeadersInit | undefined
  ): void;

  public async preflight(req: NextRequest): Promise<NextResponse> {
    const config = await this.loadCachedConfig();
    return apiCorsPreflightResponse(req, config, {
      path: this.options.path,
      credentials: this.options.credentials
    });
  }

  public async resolveHeaders(
    req: NextRequest,
    IOC?: PluginIOC<IocMap>
  ): Promise<HeadersInit | undefined> {
    const config = IOC
      ? await this.loadCorsConfig(IOC)
      : await this.loadCachedConfig();
    return buildApiCorsHeaders(req, config, {
      path: this.options.path,
      credentials: this.options.credentials
    });
  }

  /**
   * @override
   */
  public async onBefore({
    parameters: { IOC }
  }: BootstrapServerContext<IocMap>): Promise<void> {
    const req = this.options.request;
    if (!req) {
      return;
    }
    this.applyResponseHeaders(IOC, await this.resolveHeaders(req, IOC));
  }

  protected async loadCachedConfig(): Promise<RuntimeCorsConfig> {
    const cached = await new MemoryKvCacheService().getItem<RuntimeCorsConfig>(
      this.corsCacheKey
    );
    return cached ?? this.envFallbackConfig();
  }

  protected envFallbackConfig(): RuntimeCorsConfig {
    const { origins, methods } = this.getEnvCors();
    return buildRuntimeCorsConfig(
      envCorsRules(origins),
      methods.length > 0 ? methods : DEFAULT_CORS_METHODS
    );
  }
}
