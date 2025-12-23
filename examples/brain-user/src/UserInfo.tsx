import type { BrainUser } from '@brain-toolkit/brain-user';

interface UserInfoProps {
  user: BrainUser;
  onLogout?: () => void;
  loading?: boolean;
}

export function UserInfo({ user, onLogout, loading = false }: UserInfoProps) {
  return (
    <div>
      <div
        style={{
          textAlign: 'center',
          marginBottom: '20px',
          padding: '15px',
          backgroundColor: '#e6f7ff',
          borderRadius: '6px',
          border: '1px solid #91d5ff'
        }}
      >
        <p style={{ margin: 0, fontSize: '16px', color: '#0050b3' }}>
          Welcome, <strong>{user.name}</strong> ({user.email})
        </p>
      </div>

      <div style={{ marginTop: '20px' }}>
        <h2
          style={{
            fontSize: '18px',
            fontWeight: '600',
            marginBottom: '20px',
            color: '#333',
            borderBottom: '2px solid #1890ff',
            paddingBottom: '10px'
          }}
        >
          User Information
        </h2>
        <div
          style={{
            backgroundColor: '#f5f5f5',
            padding: '20px',
            borderRadius: '6px',
            marginBottom: '20px'
          }}
        >
          <div style={{ marginBottom: '12px' }}>
            <strong style={{ color: '#666', display: 'inline-block', width: '120px' }}>
              ID:
            </strong>
            <span style={{ color: '#333' }}>{user.id}</span>
          </div>
          <div style={{ marginBottom: '12px' }}>
            <strong style={{ color: '#666', display: 'inline-block', width: '120px' }}>
              Name:
            </strong>
            <span style={{ color: '#333' }}>{user.name}</span>
          </div>
          <div style={{ marginBottom: '12px' }}>
            <strong style={{ color: '#666', display: 'inline-block', width: '120px' }}>
              Email:
            </strong>
            <span style={{ color: '#333' }}>{user.email}</span>
          </div>
          {user.first_name && (
            <div style={{ marginBottom: '12px' }}>
              <strong style={{ color: '#666', display: 'inline-block', width: '120px' }}>
                First Name:
              </strong>
              <span style={{ color: '#333' }}>{user.first_name}</span>
            </div>
          )}
          {user.last_name && (
            <div style={{ marginBottom: '12px' }}>
              <strong style={{ color: '#666', display: 'inline-block', width: '120px' }}>
                Last Name:
              </strong>
              <span style={{ color: '#333' }}>{user.last_name}</span>
            </div>
          )}
          {user.profile?.phone_number && (
            <div style={{ marginBottom: '12px' }}>
              <strong style={{ color: '#666', display: 'inline-block', width: '120px' }}>
                Phone:
              </strong>
              <span style={{ color: '#333' }}>{user.profile.phone_number}</span>
            </div>
          )}
          {user.profile?.da_email && (
            <div style={{ marginBottom: '12px' }}>
              <strong style={{ color: '#666', display: 'inline-block', width: '120px' }}>
                DA Email:
              </strong>
              <span style={{ color: '#333' }}>{user.profile.da_email}</span>
            </div>
          )}
          {user.profile?.email_verified !== undefined && (
            <div style={{ marginBottom: '12px' }}>
              <strong style={{ color: '#666', display: 'inline-block', width: '120px' }}>
                Email Verified:
              </strong>
              <span style={{ color: user.profile.email_verified ? '#52c41a' : '#ff4d4f' }}>
                {user.profile.email_verified ? 'Yes' : 'No'}
              </span>
            </div>
          )}
          {user.roles && user.roles.length > 0 && (
            <div style={{ marginBottom: '12px' }}>
              <strong style={{ color: '#666', display: 'inline-block', width: '120px' }}>
                Roles:
              </strong>
              <span style={{ color: '#333' }}>{user.roles.join(', ')}</span>
            </div>
          )}
          {user.is_superuser && (
            <div style={{ marginBottom: '12px' }}>
              <strong style={{ color: '#666', display: 'inline-block', width: '120px' }}>
                Superuser:
              </strong>
              <span style={{ color: '#52c41a' }}>Yes</span>
            </div>
          )}
          {user.created_at && (
            <div style={{ marginBottom: '12px' }}>
              <strong style={{ color: '#666', display: 'inline-block', width: '120px' }}>
                Created At:
              </strong>
              <span style={{ color: '#333' }}>
                {new Date(user.created_at).toLocaleString()}
              </span>
            </div>
          )}
        </div>
        {onLogout && (
          <button
            onClick={onLogout}
            disabled={loading}
            style={{
              width: '100%',
              padding: '10px 30px',
              backgroundColor: '#ff4d4f',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: loading ? 'not-allowed' : 'pointer',
              opacity: loading ? 0.6 : 1,
              fontSize: '16px',
              fontWeight: '500'
            }}
          >
            Logout
          </button>
        )}
      </div>
    </div>
  );
}

