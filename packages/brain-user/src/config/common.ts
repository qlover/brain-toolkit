import { requestDataSerializer } from '../utils/requestDataSerializer';

export const BRAIN_DOMAINS = Object.freeze({
  development:
    'https://brus-dev.api.brain.ai/v1.0/invoke/brain-user-system/method',
  production: 'https://brus.api.brain.ai/v1.0/invoke/brain-user-system/method'
});

export const BRAIN_STORAGE_CREDENTIAL_KEY = 'brain_token';

export const BRAIN_STORAGE_PROFILE_KEY = 'brain_profile';

export const defaultServiceName = 'brainUserService';

export const defaultEnv = 'development';

export const defaultBrainStoreOptions = {
  persistUserInfo: false,
  storageKey: BRAIN_STORAGE_PROFILE_KEY,
  credentialStorageKey: BRAIN_STORAGE_CREDENTIAL_KEY
} as const;

export const defaultBrainUserOptions = {
  env: defaultEnv,
  domains: BRAIN_DOMAINS,
  serviceName: defaultServiceName,
  responseType: 'json',
  tokenPrefix: 'token',
  authKey: 'Authorization',
  requiredToken: true,
  requestDataSerializer: requestDataSerializer
} as const;
