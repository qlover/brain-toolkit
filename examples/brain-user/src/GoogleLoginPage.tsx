import { useState, useMemo } from 'react';
import { GoogleOAuthProvider, useGoogleLogin } from '@react-oauth/google';
import { useSliceStore } from '@qlover/slice-store-react';
import { BrainUserService } from '@brain-toolkit/brain-user';
import { GatewayExecutor } from '@qlover/corekit-bridge/gateway-auth';
import { UserInfo } from './UserInfo';

function GoogleLoginButton() {
  const [userService] = useState(() => {
    return new BrainUserService({
      env: 'development',
      executor: new GatewayExecutor()
    });
  });

  // Access store through service (store is protected, but we need it for useSliceStore)
  const userStore = useMemo(() => {
    return userService.getStore();
  }, [userService]);

  const token = useSliceStore(userStore, (state) => state.credential?.token);
  const user = useSliceStore(userStore, (state) => state.result);
  const loading = useSliceStore(userStore, (state) => state.loading);
  const error = useSliceStore(userStore, (state) => state.error);
  const [loginLoading, setLoginLoading] = useState(false);

  const handleGoogleLogin = useGoogleLogin({
    onSuccess: async (tokenResponse) => {
      try {
        setLoginLoading(true);
        // Use authorization_code from Google OAuth response
        // don't automatically get user info
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

        // Login successful, you can handle redirect or state update here
        console.log('Google login successful', userInfo);
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
    flow: 'auth-code' // Use authorization code flow
  });

  const handleLogout = async () => {
    try {
      await userService.logout();
    } catch {
      // Error is handled by store
    }
  };

  return (
    <div
      data-testid="GoogleLoginPage"
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
          Google Login
        </h1>

        {token && user ? (
          <UserInfo user={user} onLogout={handleLogout} loading={loading} />
        ) : (
          <>
            <button
              onClick={handleGoogleLogin}
              disabled={loginLoading || loading}
              style={{
                width: '100%',
                padding: '12px 20px',
                backgroundColor: '#4285f4',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: loginLoading || loading ? 'not-allowed' : 'pointer',
                opacity: loginLoading || loading ? 0.6 : 1,
                fontSize: '16px',
                fontWeight: '500',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '10px'
              }}
            >
              {loginLoading || loading ? (
                'Logging in...'
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
                  Sign in with Google
                </>
              )}
            </button>
            <p
              style={{
                marginTop: '15px',
                fontSize: '14px',
                color: '#666',
                textAlign: 'center'
              }}
            >
              Click the button above to login with your Google account
            </p>
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

export function GoogleLoginPage() {
  // You need to replace this with your actual Google Client ID
  // Get it from: https://console.cloud.google.com/apis/credentials
  const GOOGLE_CLIENT_ID =
    import.meta.env.VITE_GOOGLE_CLIENT_ID || 'YOUR_GOOGLE_CLIENT_ID_HERE';

  return (
    <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
      <GoogleLoginButton />
    </GoogleOAuthProvider>
  );
}
