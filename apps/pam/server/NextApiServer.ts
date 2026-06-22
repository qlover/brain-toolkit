import { isPlainObject, pick } from 'lodash';
import { NextResponse, type NextRequest } from 'next/server';
import type {
  AppApiResult,
  AppApiSuccessInterface
} from '@interfaces/AppApiInterface';
import { BootstrapServer } from '@server/BootstrapServer';
import { RequestLogsRepository } from '@server/repositorys/RequestLogsRepository';
import { nextApiServerBackstop } from './plugins/nextApiServerBackstop';
import { NextApiHandler } from './utils/NextApiHandler';
import type {
  BootstrapServerContextOptions,
  BootstrapServerPlugin
} from './interfaces/ServerInterface';
import type {
  ResultHandlerInterface,
  ResultHandlerOptions
} from './utils/NextApiHandler';
import type { SeedConfigInterface } from '@qlover/corekit-bridge/bootstrap';
import type { ExecutorAsyncTask } from '@qlover/fe-corekit';

export type NextApiServerContext = {
  name?: string;
  nextRequest?: NextRequest;
  /**
   * @default 'api'
   */
  event_category: string;
  /**
   * @default 'http.request'
   */
  event_type: string;

  record_type?: string;
};

export type RunWithInit = {
  successHeaders?: HeadersInit;
  errorHeaders?: HeadersInit;
  httpStatus?: number;
};
export type RunWithTask<Result> = ExecutorAsyncTask<
  Result | AppApiResult<Result>,
  BootstrapServerContextOptions
>;

function isNextApiServerContext(
  value: unknown
): value is Partial<NextApiServerContext> {
  return isPlainObject(value);
}
export class NextApiServer extends BootstrapServer {
  protected resultHandler: ResultHandlerInterface;
  protected context: NextApiServerContext;

  constructor(name?: string, nextRequest?: NextRequest);
  constructor(context?: Partial<NextApiServerContext>);

  constructor(
    nameOrContext?: string | Partial<NextApiServerContext>,
    nextRequest?: NextRequest
  ) {
    if (isNextApiServerContext(nameOrContext)) {
      const { name } = nameOrContext ?? {};

      super(name);
      this.context = {
        ...nameOrContext,
        event_category: 'api',
        event_type: 'http.request'
      };
    } else {
      super(nameOrContext);
      this.context = {
        name: nameOrContext,
        nextRequest,
        event_category: 'api',
        event_type: 'http.request'
      };
    }
    this.resultHandler = new NextApiHandler();
  }

  public async run<Result>(
    task?: ExecutorAsyncTask<
      Result | AppApiResult<Result>,
      BootstrapServerContextOptions
    >
  ): Promise<AppApiResult<Result>> {
    const serverState = this.IOC('ServerStateInterface');

    if (this.context.nextRequest) {
      await serverState.handler(this.context.nextRequest);
    }

    const result = await this.execNoError(task);

    // FIXME: 是否移动到 ServerStateInterface 中更合理？
    const options: ResultHandlerOptions = {
      started: performance.now(),
      logger: this.logger,
      config: this.IOC('SeedConfigInterface'),
      requestId: this.root.uuid
    };

    const envelope = this.resultHandler.handler<Result>(result, options);

    if (this.context.nextRequest) {
      this.IOC(RequestLogsRepository).insertWithApiResult(envelope, {
        request: this.context.nextRequest,
        started: options.started,
        event_category: this.context.event_category,
        event_type: this.context.event_type
      });
    }

    return envelope;
  }

  protected returnJson<Result>(
    result: AppApiResult<Result>,
    init?: RunWithInit
  ): NextResponse {
    const contextHttpStatus = this.resultHandler.getContext('httpStatus');

    if (!result.success) {
      return NextResponse.json(this.getSafeAppApiResult(result), {
        status: contextHttpStatus ?? 400,
        headers: init?.errorHeaders
      });
    }

    return NextResponse.json(this.getSafeAppApiResult(result), {
      headers: init?.successHeaders
    });
  }

  public async runWithJson<Result>(
    task?: RunWithTask<Result>,
    init?: RunWithInit
  ): Promise<NextResponse> {
    const result = await this.run(task);
    return this.returnJson(result, init);
  }

  /**
   * 支持在运行时重定向接口
   *
   * 如果没有发生重定向，则会默认返回 json
   *
   * @param task
   * @param init
   * @returns
   */
  public async runWithRedirect<Result>(
    task?: RunWithTask<Result>,
    init?: RunWithInit
  ): Promise<NextResponse> {
    const result = await this.run(task);

    const contextHttpStatus = this.resultHandler.getContext('httpStatus');

    const redirectUrl = this.resultHandler.getContext('redirectUrl');
    if (redirectUrl) {
      return NextResponse.redirect(redirectUrl, {
        status: contextHttpStatus ?? 307,
        headers: init?.errorHeaders
      });
    }

    return this.returnJson(result, init);
  }

  protected getSafeAppApiResult<T>(result: AppApiResult<T>): AppApiResult<T> {
    return pick(result, [
      'success',
      'id',
      'requestId',
      'message',
      'data'
    ]) as AppApiSuccessInterface<T>;
  }

  public override getPlugins(
    _seedConfig: SeedConfigInterface
  ): BootstrapServerPlugin[] {
    const plugins = super.getPlugins(_seedConfig);
    return [...plugins, nextApiServerBackstop];
  }
}
