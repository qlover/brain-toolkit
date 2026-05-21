import { useState } from 'react';
import { useUserService } from '../utils/useUserService';
import { useBrainUserStore } from '../utils/useBrainUserStore';
import { getDeviceUid } from '../utils/deviceUid';
import { UserInfo } from './UserInfo';

function truncateToken(value: string, head = 12, tail = 8): string {
  if (value.length <= head + tail + 3) {
    return value;
  }
  return `${value.slice(0, head)}…${value.slice(-tail)}`;
}

export function HomePage() {
  const { userService, userStore } = useUserService();
  const credential = useBrainUserStore(userStore, (state) => state.credential);
  const token = credential?.token;
  const accessToken = credential?.access_token;
  const expiresIn = credential?.expires_in;
  const user = useBrainUserStore(userStore, (state) => state.result);
  const loading = useBrainUserStore(userStore, (state) => state.loading);
  const [accessTokenLoading, setAccessTokenLoading] = useState(false);
  const isLoginWithGoogle = useBrainUserStore(userStore, (state) =>
    userService.isGoogleLogined(state.credential!)
  );

  const handleRefreshAccessToken = async () => {
    setAccessTokenLoading(true);
    try {
      await userService.fetchAndStoreAccessToken({
        token,
        lang: navigator.language?.split('-')[0] ?? 'en',
        appVersion: '1.0.0',
        deviceUid: getDeviceUid()
      });
    } catch (err) {
      console.error('Failed to fetch access_token:', err);
    } finally {
      setAccessTokenLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await userService.logout();
    } finally {
      userService.getStore().reset();
    }
  };

  if (!token) {
    return null; // This shouldn't happen if routing is correct
  }

  if (!user && loading) {
    return (
      <div
        data-testid="HomePage-loading"
        style={{
          maxWidth: '800px',
          margin: '100px auto',
          textAlign: 'center',
          padding: '40px'
        }}
      >
        <div style={{ fontSize: '18px', color: '#666' }}>加载用户信息中...</div>
      </div>
    );
  }

  if (!user) {
    return (
      <div
        data-testid="HomePage-error"
        style={{
          maxWidth: '800px',
          margin: '100px auto',
          textAlign: 'center',
          padding: '40px'
        }}
      >
        <div style={{ fontSize: '18px', color: '#cf1322' }}>
          无法加载用户信息
        </div>
      </div>
    );
  }

  return (
    <div
      data-testid="HomePage"
      style={{ maxWidth: '800px', margin: '50px auto', padding: '0 20px' }}
    >
      <div
        style={{
          backgroundColor: 'white',
          padding: '40px',
          borderRadius: '8px',
          boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
        }}
      >
        <h1
          style={{
            textAlign: 'center',
            marginBottom: '30px',
            color: '#333',
            fontSize: '28px'
          }}
        >
          首页
          {isLoginWithGoogle ? (
            <span style={{ fontSize: '14px', color: '#f00' }}>
              (Google 登录)
            </span>
          ) : (
            ''
          )}
        </h1>
        <UserInfo
          user={user}
          brainToken={token ? truncateToken(token) : undefined}
          accessToken={accessToken ? truncateToken(accessToken) : undefined}
          expiresIn={expiresIn}
          accessTokenLoading={accessTokenLoading || (Boolean(token) && !accessToken)}
          onRefreshAccessToken={handleRefreshAccessToken}
          onLogout={handleLogout}
          loading={loading}
        />
      </div>
    </div>
  );
}
