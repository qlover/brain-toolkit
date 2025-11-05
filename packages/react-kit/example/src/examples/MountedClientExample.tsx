/**
 * Mounted Client Hook Examples
 *
 * Demonstrates useMountedClient for SSR-safe client-side code
 */
import { useEffect, useState } from 'react';
import { useMountedClient } from '@brain-toolkit/react-kit';

/**
 * Example 1: Basic SSR Safety
 */
function BasicMountedExample() {
  const mounted = useMountedClient();

  return (
    <div className="example-card">
      <h3 className="example-title">Basic Mounted Client Example</h3>
      <p className="page-description">
        The useMountedClient hook returns <code>false</code> during SSR and
        initial render, then <code>true</code> after client-side mount. This
        prevents hydration mismatches.
      </p>
      <div className="demo-section">
        <div
          style={{
            padding: '24px',
            background: mounted ? '#f6ffed' : '#fff7e6',
            borderRadius: '4px',
            border: `2px solid ${mounted ? '#52c41a' : '#faad14'}`
          }}
        >
          <p style={{ fontSize: '18px', fontWeight: 'bold', marginBottom: '8px' }}>
            Mounted Status: {mounted ? '✅ Mounted' : '⏳ Not Mounted'}
          </p>
          <p style={{ color: '#666' }}>
            {mounted
              ? 'Component is now mounted on the client!'
              : 'Component is being rendered (SSR or initial render)'}
          </p>
        </div>
      </div>
    </div>
  );
}

/**
 * Example 2: Safe Browser API Access
 */
function BrowserAPIExample() {
  const mounted = useMountedClient();
  const [windowSize, setWindowSize] = useState({ width: 0, height: 0 });

  useEffect(() => {
    if (!mounted) return;

    const updateSize = () => {
      setWindowSize({
        width: window.innerWidth,
        height: window.innerHeight
      });
    };

    updateSize();
    window.addEventListener('resize', updateSize);
    return () => window.removeEventListener('resize', updateSize);
  }, [mounted]);

  if (!mounted) {
    return (
      <div className="example-card">
        <h3 className="example-title">Window Size Tracker</h3>
        <p className="page-description">
          This example safely accesses browser APIs like <code>window</code>.
        </p>
        <div className="demo-section">
          <p style={{ textAlign: 'center', color: '#999' }}>
            Loading window information...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="example-card">
      <h3 className="example-title">Window Size Tracker</h3>
      <p className="page-description">
        This example safely accesses browser APIs like <code>window</code>.
        Resize your browser window to see it update!
      </p>
      <div className="demo-section">
        <div style={{ textAlign: 'center' }}>
          <div
            style={{
              fontSize: '32px',
              fontWeight: 'bold',
              color: '#1890ff',
              marginBottom: '16px'
            }}
          >
            {windowSize.width} × {windowSize.height}
          </div>
          <p style={{ color: '#666' }}>
            Window dimensions (width × height in pixels)
          </p>
        </div>
      </div>
    </div>
  );
}

/**
 * Example 3: Client-Only Content
 */
function ClientOnlyContentExample() {
  const mounted = useMountedClient();
  const [clientInfo, setClientInfo] = useState({
    userAgent: '',
    language: '',
    platform: '',
    cookiesEnabled: false
  });

  useEffect(() => {
    if (!mounted) return;

    setClientInfo({
      userAgent: navigator.userAgent,
      language: navigator.language,
      platform: navigator.platform,
      cookiesEnabled: navigator.cookieEnabled
    });
  }, [mounted]);

  return (
    <div className="example-card">
      <h3 className="example-title">Client Information</h3>
      <p className="page-description">
        Display client-only information safely. During SSR or initial render, a
        placeholder is shown to prevent hydration mismatches.
      </p>
      <div className="demo-section">
        {!mounted ? (
          <div style={{ padding: '24px', textAlign: 'center', color: '#999' }}>
            Loading client information...
          </div>
        ) : (
          <div
            style={{
              background: '#fafafa',
              padding: '16px',
              borderRadius: '4px'
            }}
          >
            <div style={{ marginBottom: '12px' }}>
              <strong>Browser:</strong>
              <div
                style={{
                  marginTop: '4px',
                  padding: '8px',
                  background: '#fff',
                  borderRadius: '4px',
                  fontSize: '12px',
                  wordBreak: 'break-all'
                }}
              >
                {clientInfo.userAgent}
              </div>
            </div>
            <div style={{ marginBottom: '12px' }}>
              <strong>Language:</strong>
              <div
                style={{
                  marginTop: '4px',
                  padding: '8px',
                  background: '#fff',
                  borderRadius: '4px'
                }}
              >
                {clientInfo.language}
              </div>
            </div>
            <div style={{ marginBottom: '12px' }}>
              <strong>Platform:</strong>
              <div
                style={{
                  marginTop: '4px',
                  padding: '8px',
                  background: '#fff',
                  borderRadius: '4px'
                }}
              >
                {clientInfo.platform}
              </div>
            </div>
            <div>
              <strong>Cookies Enabled:</strong>
              <div
                style={{
                  marginTop: '4px',
                  padding: '8px',
                  background: '#fff',
                  borderRadius: '4px'
                }}
              >
                {clientInfo.cookiesEnabled ? '✅ Yes' : '❌ No'}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

/**
 * Example 4: LocalStorage Access
 */
function LocalStorageExample() {
  const mounted = useMountedClient();
  const [savedValue, setSavedValue] = useState('');
  const [inputValue, setInputValue] = useState('');

  useEffect(() => {
    if (!mounted) return;

    const stored = localStorage.getItem('react-kit-demo');
    if (stored) {
      setSavedValue(stored);
      setInputValue(stored);
    }
  }, [mounted]);

  const handleSave = () => {
    if (!mounted) return;

    localStorage.setItem('react-kit-demo', inputValue);
    setSavedValue(inputValue);
  };

  const handleClear = () => {
    if (!mounted) return;

    localStorage.removeItem('react-kit-demo');
    setSavedValue('');
    setInputValue('');
  };

  if (!mounted) {
    return (
      <div className="example-card">
        <h3 className="example-title">LocalStorage Example</h3>
        <p className="page-description">
          Safely access localStorage without SSR errors.
        </p>
        <div className="demo-section">
          <p style={{ textAlign: 'center', color: '#999' }}>
            Initializing localStorage...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="example-card">
      <h3 className="example-title">LocalStorage Example</h3>
      <p className="page-description">
        Safely access localStorage without SSR errors. Your data persists across
        page reloads!
      </p>
      <div className="demo-section">
        <div style={{ marginBottom: '16px' }}>
          <label
            style={{
              display: 'block',
              marginBottom: '8px',
              fontWeight: 'bold'
            }}
          >
            Enter some text to save:
          </label>
          <input
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            placeholder="Type something..."
            style={{
              width: '100%',
              padding: '8px',
              border: '1px solid #d9d9d9',
              borderRadius: '4px'
            }}
          />
        </div>
        <div style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
          <button className="button primary" onClick={handleSave}>
            Save to LocalStorage
          </button>
          <button className="button" onClick={handleClear}>
            Clear
          </button>
        </div>
        {savedValue && (
          <div
            style={{
              padding: '16px',
              background: '#f6ffed',
              border: '1px solid #b7eb8f',
              borderRadius: '4px'
            }}
          >
            <strong>Saved Value:</strong> {savedValue}
          </div>
        )}
      </div>
    </div>
  );
}

/**
 * Main Mounted Client Example Component
 */
export function MountedClientExample() {
  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">useMountedClient Hook</h1>
        <p className="page-description">
          The useMountedClient hook is essential for SSR (Server-Side Rendering)
          compatibility. It safely detects when your component has mounted on the
          client, preventing hydration mismatches and enabling safe access to
          browser APIs.
        </p>
      </div>

      <BasicMountedExample />
      <BrowserAPIExample />
      <ClientOnlyContentExample />
      <LocalStorageExample />

      <div className="example-card">
        <h3 className="example-title">Key Features</h3>
        <ul className="feature-list">
          <li>
            🔒 <strong>SSR Safe</strong>: Prevents hydration mismatches in SSR
            applications
          </li>
          <li>
            🌐 <strong>Browser API Access</strong>: Safely use window, document,
            localStorage, etc.
          </li>
          <li>
            ⚡ <strong>Performance</strong>: Uses requestAnimationFrame for
            smooth transitions
          </li>
          <li>
            🎯 <strong>Simple API</strong>: Returns boolean flag - false during
            SSR, true after mount
          </li>
          <li>
            🧹 <strong>Clean Cleanup</strong>: Properly cancels animation frames
            on unmount
          </li>
        </ul>
      </div>
    </div>
  );
}

