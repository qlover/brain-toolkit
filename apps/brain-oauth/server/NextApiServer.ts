import { createPamenv } from '@pamenv/next';
import {
  ApiServer,
  createLogger,
  isApiServerContext,
  type ApiServerContext,
  type BootstrapServerContextOptions,
  type BootstrapServerPlugin
} from '@qlover/next-kit/server';
import { RequestLogsRepository } from '@qlover/next-kit/server';
import { type NextRequest, NextResponse } from 'next/server';
import { I } from '@config/ioc-identifiter';
import { oauthI18nIdToRfc } from '@config/oauthErrors';
import { nextApiServerBackstop } from './plugins/nextApiServerBackstop';
import { ServerConfig } from './ServerConfig';
import { createServerIoc } from './serverIoc';
import { NextApiHandler } from './utils/NextApiHandler';
import { ServerContext } from './utils/ServerContext';
import type { BrainOAuthServerIocMap } from './BootstrapServer';
import type { SeedConfigInterface } from '@qlover/corekit-bridge/bootstrap';
import type { ExecutorAsyncTask } from '@qlover/fe-corekit';
import type { NextKitApiResult } from '@qlover/next-kit/common';
import type { ServerContextInterface } from '@qlover/next-kit/server';

export type NextApiServerContext = ApiServerContext;

function setServerTiming(response: NextResponse, started: number): void {
  response.headers.set(
    'Server-Timing',
    `app;dur=${Math.round(performance.now() - started)}`
  );
}

type RunWithInit = {
  successHeaders?: HeadersInit;
  errorHeaders?: HeadersInit;
  httpStatus?: number;
};

type RunWithTask<Result> = ExecutorAsyncTask<
  Result | NextKitApiResult<Result>,
  BootstrapServerContextOptions<BrainOAuthServerIocMap>
>;

/**
 * App Next.js API server：`run` 内先 `createPamenv` 再 bind。
 * 密钥消费方须惰性读 config（构造期不 snapshot）。
 */
export class NextApiServer extends ApiServer<BrainOAuthServerIocMap> {
  /**
   * 与 IOC 中 `I.AppConfig` 同一实例；`run` 内解封后 {@link ServerConfig.bindPamenvBag}。
   */
  protected readonly serverConfig: ServerConfig;

  constructor(name?: string, nextRequest?: NextRequest);
  constructor(context?: Partial<NextApiServerContext>);

  constructor(
    nameOrContext?: string | Partial<NextApiServerContext>,
    nextRequest?: NextRequest
  ) {
    const serverConfig = new ServerConfig();

    if (isApiServerContext(nameOrContext)) {
      const name = nameOrContext.name ?? serverConfig.name;
      const logger = createLogger(name, serverConfig);
      const ioc = createServerIoc(logger, serverConfig);
      const serverContext = ioc(I.ServerContextInterface);

      super({
        name,
        logger,
        ioc,
        nextRequest: nameOrContext.nextRequest,
        event_type: nameOrContext.event_type ?? 'http.request',
        serverContext,
        resultHandler: new NextApiHandler(logger, serverContext)
      });
      this.serverConfig = serverConfig;
      return;
    }

    const name = nameOrContext ?? serverConfig.name;
    const logger = createLogger(name, serverConfig);
    const ioc = createServerIoc(logger, serverConfig);
    const serverContext = ioc(I.ServerContextInterface);

    super({
      name,
      logger,
      ioc,
      nextRequest,
      event_type: 'http.request',
      serverContext,
      resultHandler: new NextApiHandler(logger, serverContext)
    });
    this.serverConfig = serverConfig;
  }

  /**
   * @override
   */
  protected resolveServerContext(): ServerContextInterface {
    return this.IOC(I.ServerContextInterface);
  }

  /**
   * @override
   */
  public override async run<Result>(
    task?: RunWithTask<Result>
  ): Promise<NextKitApiResult<Result>> {
    const bag = await createPamenv();
    this.serverConfig.bindPamenvBag(bag);
    return super.run(task);
  }

  /** Response headers written by plugins in `onBefore` (e.g. ApiCorsPlugin). */
  protected mergeResponseInit(init?: RunWithInit): RunWithInit | undefined {
    const pluginHeaders =
      this.serverContext instanceof ServerContext
        ? this.serverContext.getResponseHeaders()
        : undefined;
    if (!pluginHeaders) {
      return init;
    }
    return {
      ...init,
      successHeaders: { ...pluginHeaders, ...init?.successHeaders },
      errorHeaders: { ...pluginHeaders, ...init?.errorHeaders }
    };
  }

  /**
   * @override
   */
  public override async runWithJson<Result>(
    task?: RunWithTask<Result>,
    init?: RunWithInit
  ): Promise<NextResponse> {
    const started = performance.now();
    const response = await super.runWithJson(
      task,
      this.mergeResponseInit(init)
    );
    setServerTiming(response, started);
    return response;
  }

  /**
   * @override
   *
   * Persist failed API envelopes only — successful calls used to flood
   * `brain_oauth_request_logs`. Auth login/logout still use `insertWithAuth`.
   */
  protected override afterApiResult<Result>(
    envelope: NextKitApiResult<Result>,
    request?: NextRequest
  ): void {
    if (!request) {
      return;
    }

    if (envelope.success) {
      return;
    }

    this.IOC(RequestLogsRepository)
      .insertWithApiResult(envelope, { request })
      .catch((error: unknown) => {
        this.IOC(I.Logger).warn('Failed to write request log', error);
      });
  }

  /**
   * Machine OAuth endpoints (token / userinfo / revoke) for RFC clients
   * such as Supabase Custom OAuth providers.
   *
   * Success: return the payload itself (no `{ success, data }` envelope).
   * Error: `{ error, error_description }` per RFC 6749 §5.2.
   */
  public async runWithOAuthJson<Result>(
    task?: RunWithTask<Result>,
    init?: RunWithInit
  ): Promise<NextResponse> {
    const started = performance.now();
    const response = await this.buildOAuthJsonResponse(task, init);
    setServerTiming(response, started);
    return response;
  }

  protected async buildOAuthJsonResponse<Result>(
    task?: RunWithTask<Result>,
    init?: RunWithInit
  ): Promise<NextResponse> {
    const result = await this.run(task);
    const merged = this.mergeResponseInit(init);
    const contextHttpStatus = this.serverContext.getState('httpStatus');
    const noStoreHeaders = {
      'Cache-Control': 'no-store',
      Pragma: 'no-cache'
    };

    if (!result.success) {
      return NextResponse.json(
        {
          error: oauthI18nIdToRfc(result.id ?? 'server_error'),
          error_description:
            result.message?.trim() || result.id || 'OAuth error'
        },
        {
          status: contextHttpStatus ?? 400,
          headers: {
            ...noStoreHeaders,
            ...merged?.errorHeaders
          }
        }
      );
    }

    const body =
      result.data === undefined || result.data === null ? {} : result.data;

    return NextResponse.json(body as object, {
      status: contextHttpStatus ?? 200,
      headers: {
        ...noStoreHeaders,
        ...merged?.successHeaders
      }
    });
  }

  public getPlugins(
    _seedConfig: SeedConfigInterface
  ): BootstrapServerPlugin<BrainOAuthServerIocMap>[] {
    const plugins = super.getPlugins(_seedConfig);
    return [...plugins, nextApiServerBackstop];
  }
}
