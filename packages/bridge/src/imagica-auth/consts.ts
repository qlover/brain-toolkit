import { SyncStorageInterface } from '@qlover/fe-corekit';
import { ImagicaAuthApiConfig } from './ImagicaAuthApi';
import type { ImagicaAuthServiceConfig } from './ImagicaAuthService';

export const defaultDomains: Record<string, string> = {
  development: 'https://api-dev.braininc.net',
  production: 'https://api.braininc.net'
};

const isBrowser = typeof window !== 'undefined';

export const defaultEnv = 'production';

export const defaultRequestConfig: () => ImagicaAuthApiConfig = () => ({
  env: defaultEnv,
  domains: defaultDomains,
  tokenPrefix: 'token',
  authKey: 'Authorization',
  responseType: 'json',
  requestDataSerializer: (data, context) => {
    if (data instanceof FormData) {
      return data;
    }

    if (context.parameters?.responseType === 'json') {
      return JSON.stringify(data);
    }

    return data;
  }
});

export const defaultOptions: () => Partial<ImagicaAuthServiceConfig> = () => ({
  /**
   * userStorage
   *
   * default not save userInfo
   *
   * @default false
   */
  userStorage: false,

  /**
   * credentialStorage
   *
   * - key is `imagica-token`
   * - expires is `3 months`
   */
  credentialStorage: {
    key: 'imagica-token',
    expires: ['month', 3],
    storage: isBrowser
      ? (window.localStorage as SyncStorageInterface<string, string>)
      : undefined
  },

  /**
   * If is browser, you can set the href and tokenKey
   *
   * @default 'window.location.href'
   */
  href: isBrowser ? window.location.href : '',

  tokenKey: 'imagica-token',

  requestConfig: defaultRequestConfig()
});

export function mergedOptions<Opt extends ImagicaAuthServiceConfig>(
  options: Opt
): ImagicaAuthServiceConfig {
  const defaultOpts = defaultOptions();

  const result = {
    ...defaultOpts,
    ...options,
    requestConfig: { ...defaultOpts.requestConfig, ...options.requestConfig }
  };

  // set default headers
  if (result.requestConfig?.responseType === 'json') {
    if (!result.requestConfig.defaultHeaders) {
      result.requestConfig.defaultHeaders = {
        'Content-Type': 'application/json'
      };
    }
  }

  return result;
}
