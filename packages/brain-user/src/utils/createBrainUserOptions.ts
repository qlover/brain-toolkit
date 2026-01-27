import type {
  BrainUserPlugin,
  BrainUserServiceOptions
} from '../BrainUserService';
import {
  defaultBrainStoreOptions,
  defaultBrainUserOptions
} from '../config/common';
import { BrainUserGateway } from '../BrainUserGateway';
import { createAdapter } from './createAdapter';
import type { CreateBrainStoreOptions } from './createBrainUserStore';
import {
  createBrainUserStore,
  isBrainUserStoreInterface
} from './createBrainUserStore';
import type { BrainUserGatewayConfig } from '../interface/BrainUserGatewayInterface';
import type { ExecutorInterface } from '@qlover/fe-corekit';

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
) {
  const { serviceName, store, logger, executor, ...requestConfig } = {
    ...defaultBrainUserOptions,
    ...options
  };

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

  const _requestAdapter = createAdapter(
    requestConfig as BrainUserGatewayConfig<unknown>,
    userStore
  );

  return {
    serviceName: serviceName,
    gateway: new BrainUserGateway(_requestAdapter),
    store: userStore,
    logger: logger,
    executor: executor as ExecutorInterface<BrainUserPlugin<Tags>>,
    requestAdapter: _requestAdapter
  };
}
