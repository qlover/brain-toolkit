import { useState, useMemo } from 'react';
import type { ReactNode } from 'react';
import { GatewayExecutor } from '@qlover/corekit-bridge/gateway-auth';
import { BrainUserService } from '@brain-toolkit/brain-user';
import { localStorage } from './LocalStorage';
import { userServicePlugin } from './userServicePlugin';
import { UserServiceContext } from './useUserService';

export interface UserServiceContextValue {
  userService: BrainUserService<readonly string[]>;
  userStore: ReturnType<BrainUserService<readonly string[]>['getStore']>;
}

export function UserServiceProvider({ children }: { children: ReactNode }) {
  const [userService] = useState(() => {
    return new BrainUserService({
      env: 'development',
      store: {
        storage: localStorage
      },
      executor: new GatewayExecutor()
    }).use(userServicePlugin);
  });

  const userStore = useMemo(() => {
    return userService.getStore();
  }, [userService]);

  // Don't refresh here - let MainApp handle it to avoid duplicate calls
  // The initial refresh will be handled by MainApp when it mounts

  const value: UserServiceContextValue = {
    userService,
    userStore
  };

  return (
    <UserServiceContext.Provider value={value}>
      {children}
    </UserServiceContext.Provider>
  );
}
