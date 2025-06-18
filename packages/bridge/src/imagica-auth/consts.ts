import { CookieStorage } from '@qlover/corekit-bridge';
import type { SyncStorage } from '@qlover/fe-corekit';
import { ImagicaAuthServiceConfig } from './ImagicaAuthService';

const defaultStorageMaps: Record<string, () => SyncStorage<string, string>> = {
  cookie: () => new CookieStorage(),
  localStorage: () => {
    if (typeof window === 'undefined') {
      throw new Error('localStorage is not supported');
    }

    return window.localStorage as SyncStorage<string, string>;
  },
  sessionStorage: () => {
    if (typeof window === 'undefined') {
      throw new Error('sessionStorage is not supported');
    }

    return window.sessionStorage as SyncStorage<string, string>;
  }
};
export const defaultDomains: Record<string, string> = {
  development: 'https://api-dev.braininc.net',
  production: 'https://api.braininc.net'
};

export const defaultEnv = 'production';

export const defaultOptions: Partial<ImagicaAuthServiceConfig> = {
  storageKey: 'imagica-token',
  expiresIn: 'month',
  storageToken: 'localStorage',
  storageMaps: defaultStorageMaps,
  domains: defaultDomains,
  env: defaultEnv,
  tokenPrefix: 'token',
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
};
