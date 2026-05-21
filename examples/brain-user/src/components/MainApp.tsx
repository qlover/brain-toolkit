import { useEffect, useRef } from 'react';
import { useUserService } from '../utils/useUserService';
import { useBrainUserStore } from '../utils/useBrainUserStore';
import { LoginPage } from './LoginPage';
import { HomePage } from './HomePage';
import { fetchUserlyAccessToken } from '../utils/fetchUserlyAccessToken';

export function MainApp() {
  const { userService, userStore } = useUserService();
  const token = useBrainUserStore(userStore, (state) => state.credential?.token);
  const accessToken = useBrainUserStore(
    userStore,
    (state) => state.credential?.access_token
  );
  const user = useBrainUserStore(userStore, (state) => state.result);
  const refreshingRef = useRef(false);
  const accessTokenRef = useRef(false);

  useEffect(() => {
    if (token && !user && !refreshingRef.current) {
      refreshingRef.current = true;
      userService
        .refreshUserInfo()
        .then((userInfo) => {
          if (userInfo) {
            userService
              .getStore()
              .success(userInfo, userService.getCredential() ?? undefined);
          }
        })
        .finally(() => {
          refreshingRef.current = false;
        });
    }
  }, [token, user, userService]);

  useEffect(() => {
    if (token && !accessToken && !accessTokenRef.current) {
      accessTokenRef.current = true;
      fetchUserlyAccessToken(userService).finally(() => {
        accessTokenRef.current = false;
      });
    }
  }, [token, accessToken, userService]);

  // If user is logged in (has token), show home page
  // Otherwise, show login page
  return (
    <div data-testid="MainApp">{token ? <HomePage /> : <LoginPage />}</div>
  );
}
