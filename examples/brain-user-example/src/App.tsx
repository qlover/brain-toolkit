import { useState, useEffect, useMemo, useRef } from 'react';
import { useSliceStore } from '@qlover/slice-store-react';
import { SyncStorageInterface } from '@qlover/fe-corekit';
import {
  BrainUserPluginInterface,
  BrainUserService
} from '@brain-toolkit/brain-user';
import { GatewayExecutor } from '@qlover/corekit-bridge';

class LocalStorage implements SyncStorageInterface<string> {
  getItem<T>(key: string, defaultValue?: T | undefined): T | null {
    const value = localStorage.getItem(key);
    return value ? JSON.parse(value) : (defaultValue ?? null);
  }
  setItem<T>(key: string, value: T): void {
    localStorage.setItem(key, JSON.stringify(value));
  }
  removeItem(key: string): void {
    localStorage.removeItem(key);
  }
  clear(): void {
    localStorage.clear();
  }
  key(index: number): string | null {
    return localStorage.key(index);
  }
  get length(): number {
    return localStorage.length;
  }
}

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
          storage: new LocalStorage()
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

  const profileString = useMemo(() => {
    if (!user?.profile) {
      return 'None';
    }

    try {
      return JSON.stringify(user?.profile, null, 2);
    } catch (err) {
      return 'Invalid profile';
    }
  }, [user]);

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
    } catch (err) {
      // Error is handled by store
    }
  };

  const handleGetUserInfo = async () => {
    try {
      // Store will automatically update through useSliceStore
      await userService.getUserInfo();
    } catch (err) {
      // Error is handled by store
    }
  };

  const handleRefreshUserInfo = async () => {
    try {
      // Store will automatically update through useSliceStore
      await userService.refreshUserInfo();
    } catch (err) {
      // Error is handled by store
    }
  };

  return (
    <div style={{ maxWidth: '800px', margin: '0 auto' }}>
      <h1>Brain User Service Example</h1>

      <div
        style={{
          backgroundColor: 'white',
          padding: '20px',
          borderRadius: '8px',
          marginTop: '20px',
          boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
        }}
      >
        <h2>Status</h2>
        <div style={{ marginTop: '10px' }}>
          <p>
            <strong>Token:</strong> {token || 'Not logged in'}
          </p>
          <p>
            <strong>User:</strong>{' '}
            {user ? `${user.name} (${user.email})` : 'Not logged in'}
          </p>
        </div>
      </div>

      {!token && (
        <div
          style={{
            backgroundColor: 'white',
            padding: '20px',
            borderRadius: '8px',
            marginTop: '20px',
            boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
          }}
        >
          <h2>Login</h2>
          <div style={{ marginTop: '15px' }}>
            <div style={{ marginBottom: '15px' }}>
              <label
                htmlFor="email"
                style={{
                  display: 'block',
                  marginBottom: '5px',
                  fontWeight: '500',
                  color: '#333'
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
                  padding: '8px 12px',
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
            <div style={{ marginBottom: '15px' }}>
              <label
                htmlFor="password"
                style={{
                  display: 'block',
                  marginBottom: '5px',
                  fontWeight: '500',
                  color: '#333'
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
                  padding: '8px 12px',
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
                padding: '10px 20px',
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
          </div>
        </div>
      )}

      <div
        style={{
          backgroundColor: 'white',
          padding: '20px',
          borderRadius: '8px',
          marginTop: '20px',
          boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
        }}
      >
        <h2>Actions</h2>
        <div
          style={{
            display: 'flex',
            gap: '10px',
            flexWrap: 'wrap',
            marginTop: '10px'
          }}
        >
          {token && (
            <button
              onClick={handleLogout}
              disabled={loading}
              style={{
                padding: '10px 20px',
                backgroundColor: '#ff4d4f',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: loading ? 'not-allowed' : 'pointer',
                opacity: loading ? 0.6 : 1
              }}
            >
              Logout
            </button>
          )}
          {token && (
            <>
              <button
                onClick={handleGetUserInfo}
                disabled={loading}
                style={{
                  padding: '10px 20px',
                  backgroundColor: '#52c41a',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: loading ? 'not-allowed' : 'pointer',
                  opacity: loading ? 0.6 : 1
                }}
              >
                Get User Info
              </button>
              <button
                onClick={handleRefreshUserInfo}
                disabled={loading}
                style={{
                  padding: '10px 20px',
                  backgroundColor: '#722ed1',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: loading ? 'not-allowed' : 'pointer',
                  opacity: loading ? 0.6 : 1
                }}
              >
                Refresh User Info
              </button>
            </>
          )}
        </div>
      </div>

      {error instanceof Error && (
        <div
          style={{
            backgroundColor: '#fff2f0',
            border: '1px solid #ffccc7',
            color: '#cf1322',
            padding: '15px',
            borderRadius: '4px',
            marginTop: '20px'
          }}
        >
          <strong>Error:</strong> {error.message}
        </div>
      )}

      {loading && (
        <div
          style={{
            textAlign: 'center',
            padding: '20px',
            color: '#666'
          }}
        >
          Loading...
        </div>
      )}

      {user && (
        <div
          style={{
            backgroundColor: 'white',
            padding: '20px',
            borderRadius: '8px',
            marginTop: '20px',
            boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
          }}
        >
          <h2>User Details</h2>
          <pre
            style={{
              backgroundColor: '#f5f5f5',
              padding: '15px',
              borderRadius: '4px',
              overflow: 'auto',
              marginTop: '10px',
              fontSize: '14px'
            }}
          >
            {JSON.stringify(user, null, 2)}
          </pre>
        </div>
      )}

      <div
        style={{
          backgroundColor: 'white',
          padding: '20px',
          borderRadius: '8px',
          marginTop: '20px',
          boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
        }}
      >
        <h2>Store Information</h2>
        <div style={{ marginTop: '10px' }}>
          <p>
            <strong>Feature Tags:</strong>{' '}
            {user?.feature_tags?.join(', ') || 'None'}
          </p>
          <div
            style={{
              backgroundColor: '#f5f5f5',
              padding: '15px',
              borderRadius: '4px',
              overflow: 'auto',
              marginTop: '10px',
              fontSize: '14px'
            }}
          >
            <strong>Profile</strong> <pre>{profileString}</pre>
          </div>
        </div>
      </div>
    </div>
  );
}
