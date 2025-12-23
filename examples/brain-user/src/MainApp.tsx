import { useState } from 'react';
import { App } from './App';
import { GoogleLoginPage } from './GoogleLoginPage';

type PageType = 'normal' | 'google';

export function MainApp() {
  const [currentPage, setCurrentPage] = useState<PageType>('normal');

  return (
    <div data-testid="MainApp">
      <div
        style={{
          backgroundColor: 'white',
          padding: '15px 20px',
          boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
          marginBottom: '20px',
          position: 'sticky',
          top: 0,
          zIndex: 100
        }}
      >
        <div
          style={{
            maxWidth: '1200px',
            margin: '0 auto',
            display: 'flex',
            gap: '15px',
            alignItems: 'center'
          }}
        >
          <h2 style={{ margin: 0, color: '#333', fontSize: '20px' }}>
            Brain User Examples
          </h2>
          <div style={{ marginLeft: 'auto', display: 'flex', gap: '10px' }}>
            <button
              onClick={() => setCurrentPage('normal')}
              style={{
                padding: '8px 20px',
                backgroundColor:
                  currentPage === 'normal' ? '#1890ff' : '#f0f0f0',
                color: currentPage === 'normal' ? 'white' : '#333',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
                fontSize: '14px',
                fontWeight: currentPage === 'normal' ? '500' : 'normal'
              }}
            >
              Normal Login
            </button>
            <button
              onClick={() => setCurrentPage('google')}
              style={{
                padding: '8px 20px',
                backgroundColor:
                  currentPage === 'google' ? '#1890ff' : '#f0f0f0',
                color: currentPage === 'google' ? 'white' : '#333',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
                fontSize: '14px',
                fontWeight: currentPage === 'google' ? '500' : 'normal'
              }}
            >
              Google Login
            </button>
          </div>
        </div>
      </div>
      {currentPage === 'normal' ? <App /> : <GoogleLoginPage />}
    </div>
  );
}
