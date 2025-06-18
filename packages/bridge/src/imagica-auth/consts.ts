import type { ImagicaAuthServiceConfig } from './ImagicaAuthService';

export const defaultDomains: Record<string, string> = {
  development: 'https://api-dev.braininc.net',
  production: 'https://api.braininc.net'
};

export const defaultEnv = 'production';

export const defaultOptions: Partial<ImagicaAuthServiceConfig> = {
  storageToken: {
    storageKey: 'imagica-token',
    expiresIn: 'month'
  },
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
