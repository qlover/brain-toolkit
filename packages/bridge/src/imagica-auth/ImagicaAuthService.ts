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
  declare readonly api: ImagicaAuthApi;

  constructor(options?: ImagicaAuthServiceConfig) {
    const { requestConfig, ...opts } = mergedOptions(options);
    const { api, ...restOpts } = opts;

    const service =
      api || new ImagicaAuthApi(requestConfig || defaultRequestConfig());

    super(service, restOpts);
  }

  override get store(): UserAuthStore<ImagicaAuthState> {
    return super.store as UserAuthStore<ImagicaAuthState>;
  }

  use(plugin: ExecutorPlugin): this {
    this.api.usePlugin(plugin);

    return this;
  }

  reset(): void {
    this.store.reset();
  }

  getState(): ImagicaAuthState {
    return this.store.state;
  }

  loginWithGoogle(params: LoginWithGoogleRequest): Promise<LoginResponseData> {
    return this.api.loginWithGoogle(params);
  }
}
