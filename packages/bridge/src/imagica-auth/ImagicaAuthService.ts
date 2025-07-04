import {
  UserAuthService,
  type LoginResponseData,
  type UserAuthOptions
} from '@qlover/corekit-bridge';
import {
  ImagicaAuthApi,
  ImagicaAuthApiConfig,
  type LoginWithGoogleRequest,
  type UserInfoResponseData
} from './ImagicaAuthApi';
import { defaultRequestConfig, mergedOptions } from './consts';

export interface ImagicaAuthServiceConfig<User> extends UserAuthOptions<User> {
  requestConfig?: ImagicaAuthApiConfig;
}

export class ImagicaAuthService<
  User extends UserInfoResponseData = UserInfoResponseData,
  Opt extends ImagicaAuthServiceConfig<User> = ImagicaAuthServiceConfig<User>
> extends UserAuthService<User, Opt> {
  constructor(options: Opt = {} as Opt) {
    const { requestConfig, ...opts } = mergedOptions(options);
    const { api, ...restOpts } = opts;

    const service =
      api || new ImagicaAuthApi(requestConfig || defaultRequestConfig());

    super({ ...restOpts, api: service } as Opt);
  }

  override get api(): ImagicaAuthApi<User> {
    return this.options.api as ImagicaAuthApi<User>;
  }

  loginWithGoogle(params: LoginWithGoogleRequest): Promise<LoginResponseData> {
    return this.api.loginWithGoogle(params);
  }
}
