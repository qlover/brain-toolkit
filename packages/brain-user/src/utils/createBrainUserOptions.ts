import type { UserServiceConfig } from '@qlover/corekit-bridge/gateway-auth';
import type { BrainUserServiceOptions } from '../BrainUserService';
import type { BrainCredentials, BrainUser } from '../types/BrainUserTypes';
import {
  defaultBrainStoreOptions,
  defaultBrainUserOptions
} from '../config/common';
import { BrainUserGateway } from '../BrainUserGateway';
import type { BrainUserApiConfig } from '../BrainUserApi';
import { BrainUserApi } from '../BrainUserApi';
import { createAdapter } from './createAdapter';
import type {
  CreateBrainStoreOptions} from './createBrainUserStore';
import {
  createBrainUserStore,
  isBrainUserStoreInterface
} from './createBrainUserStore';
import type { BrainUserStore } from '../BrainUserStore';
import type { BrainUserStoreInterface } from '../interface/BrainUserStoreInterface';

/**
 * Create BrainUserService configuration options
 *
 * Significance: Central configuration factory for BrainUserService initialization
 * Core idea: Merge user-provided options with defaults and initialize all dependencies
 * Main function: Transform BrainUserServiceOptions into complete UserServiceConfig
 * Main purpose: Simplify service initialization with proper defaults and dependency injection
 *
 * @param options - Partial service configuration options
 * @returns Complete UserServiceConfig ready for BrainUserService initialization
 *
 * @example
 * ```ts
 * const config = createBrainUserOptions({
 *   env: 'production',
 *   store: {
 *     storage: 'localStorage',
 *     persistUserInfo: true
 *   }
 * });
 * const service = new BrainUserService(config);
 * ```
 */
export function createBrainUserOptions<Tags extends readonly string[]>(
  options?: BrainUserServiceOptions<Tags>
): Omit<UserServiceConfig<BrainUser, BrainCredentials>, 'store'> & {
  store: BrainUserStoreInterface<Tags>;
} {
  // merge options
  const mergedOptions = {
    ...defaultBrainUserOptions,
    ...options
  };
  
  const {
    executor,
    logger,
    serviceName,
    gateway,
    store,
    requestAdapter,
    ...resetOptions
  } = mergedOptions;

  // merge store options
  const storeOptions = isBrainUserStoreInterface(store)
    ? store
    : ({
        ...defaultBrainStoreOptions,
        ...store
      } as CreateBrainStoreOptions<Tags>);

  const userStore = createBrainUserStore(
    storeOptions as CreateBrainStoreOptions<Tags>
  );

  // TODO: 合并 requestAdapter 配置, requestAdapter 接口为提供 setConfig 或 mergeConfig 方法
  if (requestAdapter) {
    Object.assign(requestAdapter.config, resetOptions, {
      token: resetOptions.token || userStore.getToken.bind(userStore)
    } as BrainUserApiConfig<unknown>);
  }

  return {
    serviceName: serviceName,
    executor: executor,
    gateway:
      gateway ??
      new BrainUserGateway(
        new BrainUserApi(
          createAdapter(requestAdapter ?? resetOptions, userStore)
        )
      ),
    store: userStore as BrainUserStore<Tags>,
    logger: logger
  };
}

