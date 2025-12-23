import { createContext, useContext } from 'react';
import type { UserServiceContextValue } from './UserServiceContext';

export const UserServiceContext = createContext<UserServiceContextValue | null>(
  null
);

/**
 * Hook to access user service and store from context
 *
 * Significance: Provides access to shared user service instance
 * Core idea: Centralized access point for user authentication state
 * Main function: Returns userService and userStore from context
 * Main purpose: Enable components to access user service without prop drilling
 *
 * @returns Object containing userService and userStore
 * @throws Error if used outside UserServiceProvider
 *
 * @example
 * ```tsx
 * function MyComponent() {
 *   const { userService, userStore } = useUserService();
 *   const user = useSliceStore(userStore, (state) => state.result);
 *   // ...
 * }
 * ```
 */
export function useUserService() {
  const context = useContext(UserServiceContext);
  if (!context) {
    throw new Error('useUserService must be used within UserServiceProvider');
  }
  return context;
}
