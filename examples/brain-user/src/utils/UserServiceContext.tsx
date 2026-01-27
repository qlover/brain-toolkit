import { useState, useMemo } from 'react';
import type { ReactNode } from 'react';
import type {
  BrainUserContext,
  BrainUserPlugin
} from '@brain-toolkit/brain-user';
import { BrainUserService } from '@brain-toolkit/brain-user';
import { localStorage } from './LocalStorage';
import { UserServiceContext } from './useUserService';
import { LifecycleExecutor } from '@qlover/fe-corekit';
import { userServicePlugin } from './userServicePlugin';
import type { BrainUserStore } from '@brain-toolkit/brain-user';

export interface UserServiceContextValue {
  userService: BrainUserService<readonly string[]>;
  userStore: BrainUserStore<readonly string[]>;
}

export function UserServiceProvider({ children }: { children: ReactNode }) {
  const [userService] = useState(() => {
    return new BrainUserService({
      // @ts-expect-error
      logger: console,
      store: {
        storage: localStorage
      },
      executor: new LifecycleExecutor<
        BrainUserContext<readonly string[]>,
        BrainUserPlugin
      >()
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
