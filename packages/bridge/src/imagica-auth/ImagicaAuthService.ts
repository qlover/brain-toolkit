import type { SyncStorage } from '@qlover/fe-corekit';
import {
  type LoginResponseData,
  type StorageTokenInterface,
  type UserAuthOptions,
  UserAuthService,
  UserToken,
  ExpiresInType
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
  /**
   * Persist token key
   *
   * @default 'imagica-token'
   */
  storageKey?: string;

  /**
   * Persist token expiration time
   *
   * @default 'month'
   */
  expiresIn?: ExpiresInType;

  /**
   * Persist token implementation
   *
   * Built-in four implementations
   *
   * - cookie
   * - localStorage
   * - sessionStorage
   * - memory
   *
   * You can also pass in a custom StorageTokenInterface implementation
   *
   * @default 'localStorage'
   */
  storageToken?: string | StorageTokenInterface<string>;

  /**
   * Persist token implementation
   *
   * - cookie -> CookieStorage
   * - localStorage -> window.localStorage
   * - sessionStorage -> window.sessionStorage
   * - memory -> undefined(use memory)
   *
   * @default `defaultStorageMaps`
   */
  storageMaps?: Record<string, () => SyncStorage<string, string>>;
}

function getDefaultStorage(config: ImagicaAuthServiceConfig) {
  const { storageKey, storageToken, expiresIn, storageMaps } = config;

  if (typeof storageToken !== 'string' && storageToken) {
    return storageToken;
  }

  let syncStorage: SyncStorage<string, string> | undefined;

  if (storageToken && storageMaps && storageMaps[storageToken]) {
    syncStorage = storageMaps[storageToken]();
  }

  return new UserToken({
    storageKey: storageKey!,
    // storage can be undefined
    storage: syncStorage!,
    expiresIn
  });
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
    const storageToken = getDefaultStorage(mergedOpts);

    const service =
      mergedOpts.service ||
      new ImagicaAuthApi({
        ...mergedOpts,
        token() {
          return storageToken.getToken();
        }
      });

    super({ ...mergedOpts, storageToken, service });
  }

  get service(): ImagicaAuthApi {
    return this.options.service as ImagicaAuthApi;
  }

  loginWithGoogle(params: LoginWithGoogleRequest): Promise<LoginResponseData> {
    return this.service.loginWithGoogle(params);
  }
}
