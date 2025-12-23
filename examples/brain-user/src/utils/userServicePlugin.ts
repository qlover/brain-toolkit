import type {
  BrainUserPluginInterface,
  BrainUserPluginContext,
  BrainCredentials,
  BrainUser
} from '@brain-toolkit/brain-user';

/**
 * User service plugin for handling loading state during user info refresh
 *
 * Significance: Manages loading state during user information refresh operations
 * Core idea: Automatically update loading state before and after refresh
 * Main function: Set loading to true before refresh, false after success
 * Main purpose: Provide consistent loading state management for user operations
 *
 * @example
 * ```ts
 * const service = new BrainUserService({ env: 'development' })
 *   .use(userServicePlugin);
 * ```
 */
export const userServicePlugin: BrainUserPluginInterface = {
  pluginName: 'brainUserServicePlugin',

  onRefreshUserInfoBefore(
    context: BrainUserPluginContext<BrainUser, BrainCredentials>
  ) {
    context.parameters.store.updateState({
      loading: true
    });
  },

  onRefreshUserInfoSuccess(
    context: BrainUserPluginContext<BrainUser, BrainCredentials>
  ) {
    context.parameters.store.updateState({
      loading: false
    });
  }
};

