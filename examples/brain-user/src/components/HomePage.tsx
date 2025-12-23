import { useSliceStore } from '@qlover/slice-store-react';
import { useUserService } from '../utils/useUserService';
import { UserInfo } from './UserInfo';

export function HomePage() {
  const { userService, userStore } = useUserService();
  const token = useSliceStore(userStore, (state) => state.credential?.token);
  const user = useSliceStore(userStore, (state) => state.result);
  const loading = useSliceStore(userStore, (state) => state.loading);

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
        </h1>
        <UserInfo user={user} onLogout={handleLogout} loading={loading} />
      </div>
    </div>
  );
}
