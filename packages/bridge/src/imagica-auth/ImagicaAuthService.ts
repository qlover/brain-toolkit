import {
  type PickUser,
  type UserAuthOptions,
  type LoginResponseData,
  UserAuthStore,
  UserAuthService,
  UserAuthApiInterface
} from '@qlover/corekit-bridge';
import {
  type LoginWithGoogleRequest,
  ImagicaAuthApi,
  ImagicaAuthApiConfig
} from './ImagicaAuthApi';
import { defaultRequestConfig, mergedOptions } from './consts';
import { ImagicaAuthState } from './ImagicaAuthState';
import { ExecutorPlugin } from '@qlover/fe-corekit';

export interface ImagicaAuthServiceConfig
  extends UserAuthOptions<ImagicaAuthState> {
  api?: UserAuthApiInterface<PickUser<ImagicaAuthState>>;
  requestConfig?: ImagicaAuthApiConfig;
}

export class ImagicaAuthService extends UserAuthService<ImagicaAuthState> {
  declare public readonly api: ImagicaAuthApi;

  constructor(options?: ImagicaAuthServiceConfig) {
    const { requestConfig, ...opts } = mergedOptions(options);
    const { api, ...restOpts } = opts;

    const service =
      api || new ImagicaAuthApi(requestConfig || defaultRequestConfig());

    super(service, restOpts);
  }

  public override get store(): UserAuthStore<ImagicaAuthState> {
    return super.store as UserAuthStore<ImagicaAuthState>;
  }

  public use(plugin: ExecutorPlugin): this {
    this.api.usePlugin(plugin);

    return this;
  }

  public reset(): void {
    this.store.reset();
  }

  public getState(): ImagicaAuthState {
    return this.store.state;
  }

  public loginWithGoogle(
    params: LoginWithGoogleRequest
  ): Promise<LoginResponseData> {
    return this.api.loginWithGoogle(params);
  }
}
