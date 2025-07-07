import {
  UserAuthApiInterface,
  UserAuthService,
  UserAuthStore,
  type LoginResponseData,
  type UserAuthOptions
} from '@qlover/corekit-bridge';
import {
  ImagicaAuthApi,
  ImagicaAuthApiConfig,
  type LoginWithGoogleRequest
} from './ImagicaAuthApi';
import { defaultRequestConfig, mergedOptions } from './consts';
import { ImagicaAuthState } from './ImagicaAuthState';

export interface ImagicaAuthServiceConfig
  extends UserAuthOptions<ImagicaAuthState> {
  api?: UserAuthApiInterface<ImagicaAuthState>;
  requestConfig?: ImagicaAuthApiConfig;
}

export class ImagicaAuthService extends UserAuthService<ImagicaAuthState> {
  declare readonly api: ImagicaAuthApi;

  constructor(options: ImagicaAuthServiceConfig) {
    const { requestConfig, ...opts } = mergedOptions(options);
    const { api, ...restOpts } = opts;

    const service =
      api || new ImagicaAuthApi(requestConfig || defaultRequestConfig());

    super(service, restOpts);
  }

  override get store(): UserAuthStore<ImagicaAuthState> {
    return super.store as UserAuthStore<ImagicaAuthState>;
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
