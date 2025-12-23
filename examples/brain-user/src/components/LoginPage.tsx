import { useState } from 'react';
import { GoogleOAuthProvider, useGoogleLogin } from '@react-oauth/google';
import { useSliceStore } from '@qlover/slice-store-react';
import { useUserService } from '../utils/useUserService';

function LoginForm() {
  const { userService, userStore } = useUserService();
  const loading = useSliceStore(userStore, (state) => state.loading);
  const error = useSliceStore(
    userStore,
    (state) => state.error
  ) as Error | null;
  const [email, setEmail] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [loginLoading, setLoginLoading] = useState(false);

  const handlePasswordLogin = async () => {
    if (!email || !password) {
      return;
    }

    setLoginLoading(true);
    try {
      const credentials = await userService.login({
        email: email.trim(),
        password: password
      });

      if (!credentials?.token) {
        throw new Error('Login failed');
      }

      // Get user info after successful login
      const userInfo = await userService.refreshUserInfo(credentials);

      if (!userInfo) {
        throw new Error('Failed to get user info');
      }

      // Update store with user info and credentials
      userService.getStore().success(userInfo, credentials);

      setPassword('');
    } catch (err) {
      console.error('Password login failed:', err);
      // Error is handled by store
    } finally {
      setLoginLoading(false);
    }
  };

  const handleGoogleLogin = useGoogleLogin({
    onSuccess: async (tokenResponse) => {
      try {
        setLoginLoading(true);
        const brainCredentials = await userService.loginWithGoogle({
          authorization_code: tokenResponse.code
        });

        if (!brainCredentials.token) {
          throw new Error('Google login failed');
        }

        const userInfo = await userService.refreshUserInfo(brainCredentials);

        if (!userInfo) {
          throw new Error('Google login failed');
        }

        userService.getStore().success(userInfo, brainCredentials);
      } catch (err) {
        console.error('Google login failed:', err);
      } finally {
        setLoginLoading(false);
      }
    },
    onError: (error) => {
      console.error('Google OAuth error:', error);
      setLoginLoading(false);
    },
    flow: 'auth-code'
  });

  const isLoading = loading || loginLoading;

  return (
    <div
      data-testid="LoginPage"
      style={{ maxWidth: '500px', margin: '100px auto' }}
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
          style={{ textAlign: 'center', marginBottom: '30px', color: '#333' }}
        >
          登录
        </h1>

        {/* Password Login Form */}
        <div style={{ marginBottom: '30px' }}>
          <h2
            style={{
              fontSize: '16px',
              fontWeight: '600',
              marginBottom: '20px',
              color: '#333',
              borderBottom: '1px solid #e8e8e8',
              paddingBottom: '10px'
            }}
          >
            密码登录
          </h2>
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
              邮箱:
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="请输入邮箱"
              disabled={isLoading}
              style={{
                width: '100%',
                padding: '10px 12px',
                border: '1px solid #d9d9d9',
                borderRadius: '4px',
                fontSize: '14px',
                boxSizing: 'border-box'
              }}
              onKeyPress={(e) => {
                if (e.key === 'Enter' && !isLoading && email && password) {
                  handlePasswordLogin();
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
              密码:
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="请输入密码"
              disabled={isLoading}
              style={{
                width: '100%',
                padding: '10px 12px',
                border: '1px solid #d9d9d9',
                borderRadius: '4px',
                fontSize: '14px',
                boxSizing: 'border-box'
              }}
              onKeyPress={(e) => {
                if (e.key === 'Enter' && !isLoading && email && password) {
                  handlePasswordLogin();
                }
              }}
            />
          </div>
          <button
            onClick={handlePasswordLogin}
            disabled={isLoading || !email || !password}
            style={{
              width: '100%',
              padding: '12px 20px',
              backgroundColor: '#1890ff',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor:
                isLoading || !email || !password ? 'not-allowed' : 'pointer',
              opacity: isLoading || !email || !password ? 0.6 : 1,
              fontSize: '16px',
              fontWeight: '500'
            }}
          >
            {isLoading ? '登录中...' : '登录'}
          </button>
        </div>

        {/* Divider */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            margin: '30px 0',
            color: '#999'
          }}
        >
          <div style={{ flex: 1, height: '1px', backgroundColor: '#e8e8e8' }} />
          <span style={{ padding: '0 15px', fontSize: '14px' }}>或</span>
          <div style={{ flex: 1, height: '1px', backgroundColor: '#e8e8e8' }} />
        </div>

        {/* Google Login */}
        <div>
          <h2
            style={{
              fontSize: '16px',
              fontWeight: '600',
              marginBottom: '20px',
              color: '#333',
              borderBottom: '1px solid #e8e8e8',
              paddingBottom: '10px'
            }}
          >
            Google 登录
          </h2>
          <button
            onClick={handleGoogleLogin}
            disabled={isLoading}
            style={{
              width: '100%',
              padding: '12px 20px',
              backgroundColor: '#4285f4',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: isLoading ? 'not-allowed' : 'pointer',
              opacity: isLoading ? 0.6 : 1,
              fontSize: '16px',
              fontWeight: '500',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '10px'
            }}
          >
            {isLoading ? (
              '登录中...'
            ) : (
              <>
                <svg
                  width="18"
                  height="18"
                  viewBox="0 0 18 18"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <g fill="#000" fillRule="evenodd">
                    <path
                      d="M9 3.48c1.69 0 2.83.73 3.48 1.34l2.54-2.48C13.46.89 11.43 0 9 0 5.48 0 2.44 2.02.96 4.96l2.91 2.26C4.6 5.05 6.62 3.48 9 3.48z"
                      fill="#EA4335"
                    />
                    <path
                      d="M17.64 9.2c0-.74-.06-1.28-.19-1.84H9v3.34h4.96c-.21 1.18-.84 2.18-1.79 2.85l2.75 2.13c1.66-1.52 2.72-3.77 2.72-6.48z"
                      fill="#4285F4"
                    />
                    <path
                      d="M3.88 10.78A5.54 5.54 0 0 1 3.58 9c0-.62.11-1.22.29-1.78L.96 4.96A9.008 9.008 0 0 0 0 9c0 1.45.35 2.82.96 4.04l2.92-2.26z"
                      fill="#FBBC05"
                    />
                    <path
                      d="M9 18c2.43 0 4.47-.8 5.96-2.18l-2.75-2.13c-.76.53-1.78.9-3.21.9-2.38 0-4.4-1.57-5.12-3.74L.96 13.04C2.45 15.98 5.48 18 9 18z"
                      fill="#34A853"
                    />
                  </g>
                </svg>
                使用 Google 登录
              </>
            )}
          </button>
        </div>

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
            <strong>错误:</strong> {error.message}
          </div>
        )}
      </div>
    </div>
  );
}

export function LoginPage() {
  // You need to replace this with your actual Google Client ID
  const GOOGLE_CLIENT_ID =
    import.meta.env.VITE_GOOGLE_CLIENT_ID || 'YOUR_GOOGLE_CLIENT_ID_HERE';

  return (
    <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
      <LoginForm />
    </GoogleOAuthProvider>
  );
}
