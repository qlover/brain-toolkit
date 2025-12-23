import { useState, useEffect, useMemo, useRef } from 'react';
import { useSliceStore } from '@qlover/slice-store-react';
import type { BrainUserPluginInterface } from '@brain-toolkit/brain-user';
import { BrainUserService } from '@brain-toolkit/brain-user';
import { GatewayExecutor } from '@qlover/corekit-bridge/gateway-auth';
import { localStorage } from './LocalStorage';
import { UserInfo } from './UserInfo';

const userServicePlugin: BrainUserPluginInterface = {
  pluginName: 'brainUserServicePlugin',

  onRefreshUserInfoBefore(context) {
    context.parameters.store.updateState({
      loading: true
    });
  },

  onRefreshUserInfoSuccess(context) {
    context.parameters.store.updateState({
      loading: false
    });
  }
};

export function App() {
  const [userService] = useState(() => {
    return (
      new BrainUserService({
        env: 'development',
        store: {
          storage: localStorage
        },
        executor: new GatewayExecutor()
      })
        // test refresh user info plugin
        .use(userServicePlugin)
    );
  });

  // Access store through service (store is protected, but we need it for useSliceStore)
  const userStore = useMemo(() => {
    console.log('userService', userService);
    return userService.getStore();
  }, [userService]);

  const token = useSliceStore(userStore, (state) => state.credential?.token);
  const user = useSliceStore(userStore, (state) => state.result);
  const loading = useSliceStore(userStore, (state) => state.loading);
  const error = useSliceStore(userStore, (state) => state.error);

  // UI state (not from store)
  const [email, setEmail] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const mounted = useRef(false);

  useEffect(() => {
    if (mounted.current) {
      return;
    }
    mounted.current = true;

    // login automatically get user info
    if (userService.getCredential()) {
      userService.refreshUserInfo();
    }
  }, [userService]);

  const handleLogin = async () => {
    if (!email || !password) {
      return;
    }

    await userService.login({
      email: email.trim(),
      password: password
    });

    // login automatically get user info
    setPassword('');
  };

  const handleLogout = async () => {
    try {
      await userService.logout();
      // Store will automatically update through useSliceStore
      setEmail('');
      setPassword('');
    } catch {
      // Error is handled by store
    }
  };

  return (
    <div data-testid="App" style={{ maxWidth: '500px', margin: '100px auto' }}>
      <div
        style={{
          backgroundColor: 'white',
          padding: '40px',
          borderRadius: '8px',
          boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
        }}
      >
        <h1
          style={{ textAlign: 'center', marginBottom: '30px', color: '#333' }}
        >
          Login
        </h1>

        {token && user ? (
          <UserInfo user={user} onLogout={handleLogout} loading={loading} />
        ) : (
          <>
            <div style={{ marginBottom: '20px' }}>
              <label
                htmlFor="email"
                style={{
                  display: 'block',
                  marginBottom: '8px',
                  fontWeight: '500',
                  color: '#333',
                  fontSize: '14px'
                }}
              >
                Email:
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter your email"
                disabled={loading}
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  border: '1px solid #d9d9d9',
                  borderRadius: '4px',
                  fontSize: '14px',
                  boxSizing: 'border-box'
                }}
                onKeyPress={(e) => {
                  if (e.key === 'Enter' && !loading && email && password) {
                    handleLogin();
                  }
                }}
              />
            </div>
            <div style={{ marginBottom: '25px' }}>
              <label
                htmlFor="password"
                style={{
                  display: 'block',
                  marginBottom: '8px',
                  fontWeight: '500',
                  color: '#333',
                  fontSize: '14px'
                }}
              >
                Password:
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password"
                disabled={loading}
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  border: '1px solid #d9d9d9',
                  borderRadius: '4px',
                  fontSize: '14px',
                  boxSizing: 'border-box'
                }}
                onKeyPress={(e) => {
                  if (e.key === 'Enter' && !loading && email && password) {
                    handleLogin();
                  }
                }}
              />
            </div>
            <button
              onClick={handleLogin}
              disabled={loading || !email || !password}
              style={{
                width: '100%',
                padding: '12px 20px',
                backgroundColor: '#1890ff',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor:
                  loading || !email || !password ? 'not-allowed' : 'pointer',
                opacity: loading || !email || !password ? 0.6 : 1,
                fontSize: '16px',
                fontWeight: '500'
              }}
            >
              {loading ? 'Logging in...' : 'Login'}
            </button>
          </>
        )}

        {error instanceof Error && (
          <div
            style={{
              backgroundColor: '#fff2f0',
              border: '1px solid #ffccc7',
              color: '#cf1322',
              padding: '12px',
              borderRadius: '4px',
              marginTop: '20px',
              fontSize: '14px'
            }}
          >
            <strong>Error:</strong> {error.message}
          </div>
        )}
      </div>
    </div>
  );
}
