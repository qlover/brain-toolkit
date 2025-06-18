import {
  UserAuthService,
  type LoginResponseData,
  type UserAuthOptions
} from '@qlover/corekit-bridge';
import {
  ImagicaAuthApi,
  type ImagicaAuthApiConfig,
  type LoginWithGoogleRequest,
  type UserInfoResponseData
} from './ImagicaAuthApi';
import { defaultOptions } from './consts';

export interface ImagicaAuthServiceConfig
  extends Omit<UserAuthOptions<UserInfoResponseData>, 'storageToken'>,
    ImagicaAuthApiConfig {
  storageToken?: string | UserAuthOptions<UserInfoResponseData>['storageToken'];
}

/**
 * Imagica Auth Service
 *
 * @since 0.0.1
 *
 * @example basic usage
 * ```ts
 * const authService = new ImagicaAuthService();
 * ```
 *
 * @example custom storage
 *
 * ```ts
 * const authService = new ImagicaAuthService({
 *   storageToken: 'cookie',
 * });
 * ```
 */
export class ImagicaAuthService<
  Opt extends UserAuthOptions<UserInfoResponseData>
> extends UserAuthService<UserInfoResponseData, Opt> {
  constructor(options: Opt = {} as Opt) {
    const mergedOpts = { ...defaultOptions, ...options };

    const service = mergedOpts.api || new ImagicaAuthApi(mergedOpts);

    super({ ...mergedOpts, service });
  }

  get api(): ImagicaAuthApi {
    return this.options.api as ImagicaAuthApi;
  }

  loginWithGoogle(params: LoginWithGoogleRequest): Promise<LoginResponseData> {
    return this.api.loginWithGoogle(params);
  }
}
