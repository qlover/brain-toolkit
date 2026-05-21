import { useEffect, useRef } from 'react';
import { useUserService } from '../utils/useUserService';
import { useBrainUserStore } from '../utils/useBrainUserStore';
import { LoginPage } from './LoginPage';
import { HomePage } from './HomePage';

export function MainApp() {
  const { userService, userStore } = useUserService();
  const token = useBrainUserStore(userStore, (state) => state.credential?.token);
  const user = useBrainUserStore(userStore, (state) => state.result);
  const refreshingRef = useRef(false);

  useEffect(() => {
    // If there's a token but no user info, refresh user info
    // Use ref to prevent duplicate calls
    if (token && !user && !refreshingRef.current) {
      refreshingRef.current = true;
      userService.refreshUserInfo().finally(() => {
        refreshingRef.current = false;
      });
    }
  }, [token, user, userService]);

  // If user is logged in (has token), show home page
  // Otherwise, show login page
  return (
    <div data-testid="MainApp">{token ? <HomePage /> : <LoginPage />}</div>
  );
}
