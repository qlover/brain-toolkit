import { requestDataSerializer } from '../utils/requestDataSerializer';
import type { BrainUserServiceOptions } from '../BrainUserService';
import type { BrainUserStoreOptions } from '../BrainUserStore';
import { GATEWAY_BRAIN_USER_ENDPOINTS } from './EndPoints';

export const BRAIN_DOMAINS = Object.freeze({
  development:
    'https://brus-dev.api.brain.ai/v1.0/invoke/brain-user-system/method',
  production: 'https://brus.api.brain.ai/v1.0/invoke/brain-user-system/method'
});

export const BRAIN_STORAGE_CREDENTIAL_KEY = 'brain_token';

export const BRAIN_STORAGE_PROFILE_KEY = 'brain_profile';

export const defaultServiceName = 'brainUserService';

export const defaultEnv = 'development';

export const defaultBrainStoreOptions: BrainUserStoreOptions<
  readonly string[]
> = {
  persistUserInfo: false,
  storageKey: BRAIN_STORAGE_PROFILE_KEY,
  credentialStorageKey: BRAIN_STORAGE_CREDENTIAL_KEY
};

export const defaultBrainUserOptions: BrainUserServiceOptions<
  readonly string[]
> = {
  env: defaultEnv,
  domains: BRAIN_DOMAINS,
  endpoints: GATEWAY_BRAIN_USER_ENDPOINTS,
  serviceName: defaultServiceName,
  responseType: 'json',
  headers: {
    'Content-Type': 'application/json'
  },
  tokenPrefix: 'token',
  authKey: 'Authorization',
  requestDataSerializer: requestDataSerializer
};
