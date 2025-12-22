/**
 * Lifecycle Hook Examples
 *
 * Demonstrates useLifecycle, useLifecycleCreated, useLifecycleUpdated, and useLifecycleDestroyed
 */
import { useState } from 'react';
import {
  useLifecycleCreated,
  useLifecycleUpdated,
  useLifecycleDestroyed
} from '@brain-toolkit/react-kit';

/**
 * Example 1: useLifecycleCreated
 */
function CreatedExample() {
  const [logs, setLogs] = useState<string[]>([]);

  useLifecycleCreated(() => {
    const timestamp = new Date().toLocaleTimeString();
    setLogs((prev) => [...prev, `Component created at ${timestamp}`]);
  });

  return (
    <div data-testid="CreatedExample" className="example-card">
      <h3 className="example-title">useLifecycleCreated Example</h3>
      <p className="page-description">
        This hook runs once when the component is mounted, similar to{' '}
        <code>componentDidMount</code> in class components.
      </p>
      <div className="log-section">
        <h4>Lifecycle Logs:</h4>
        {logs.map((log, index) => (
          <div data-testid="CreatedExample" key={index} className="log-item">
            {log}
          </div>
        ))}
      </div>
    </div>
  );
}

/**
 * Example 2: useLifecycleUpdated
 */
function UpdatedExample() {
  const [count, setCount] = useState(0);
  const [logs, setLogs] = useState<string[]>([]);

  useLifecycleUpdated(() => {
    const timestamp = new Date().toLocaleTimeString();
    setLogs((prev) => [
      ...prev,
      `Component updated at ${timestamp}, count is ${count}`
    ]);
  }, [count]);

  return (
    <div data-testid="UpdatedExample" className="example-card">
      <h3 className="example-title">useLifecycleUpdated Example</h3>
      <p className="page-description">
        This hook runs after every update (but not on initial mount). Click the
        button to trigger updates.
      </p>
      <div className="demo-section">
        <div className="counter-display">{count}</div>
        <button className="button primary" onClick={() => setCount(count + 1)}>
          Increment Count
        </button>
        <button className="button" onClick={() => setLogs([])}>
          Clear Logs
        </button>
      </div>
      <div className="log-section">
        <h4>Update Logs:</h4>
        {logs.length === 0 ? (
          <div className="log-item">No updates yet. Click Increment!</div>
        ) : (
          logs.map((log, index) => (
            <div data-testid="UpdatedExample" key={index} className="log-item">
              {log}
            </div>
          ))
        )}
      </div>
    </div>
  );
}

/**
 * Example 3: useLifecycleDestroyed
 */
function DestroyedExample() {
  const [showChild, setShowChild] = useState(true);
  const [logs, setLogs] = useState<string[]>([]);

  const ChildComponent = () => {
    useLifecycleDestroyed(() => {
      const timestamp = new Date().toLocaleTimeString();
      setLogs((prev) => [...prev, `Child component destroyed at ${timestamp}`]);
    });

    return (
      <div
        data-testid="ChildComponent" style={{
          padding: '16px',
          background: '#e6f7ff',
          borderRadius: '4px',
          marginTop: '16px'
        }}
      >
        <p>👋 I'm a child component!</p>
      </div>
    );
  };

  return (
    <div data-testid="DestroyedExample" className="example-card">
      <h3 className="example-title">useLifecycleDestroyed Example</h3>
      <p className="page-description">
        This hook runs cleanup when the component unmounts. Toggle the child
        component to see it in action.
      </p>
      <div className="demo-section">
        <button
          className="button primary"
          onClick={() => setShowChild(!showChild)}
        >
          {showChild ? 'Unmount Child' : 'Mount Child'}
        </button>
        <button className="button" onClick={() => setLogs([])}>
          Clear Logs
        </button>
        {showChild && <ChildComponent />}
      </div>
      <div className="log-section">
        <h4>Destruction Logs:</h4>
        {logs.length === 0 ? (
          <div className="log-item">
            No destruction logs yet. Try unmounting the child!
          </div>
        ) : (
          logs.map((log, index) => (
            <div data-testid="DestroyedExample" key={index} className="log-item">
              {log}
            </div>
          ))
        )}
      </div>
    </div>
  );
}

/**
 * Main Lifecycle Example Component
 */
export function LifecycleExample() {
  return (
    <div data-testid="LifecycleExample">
      <div className="page-header">
        <h1 className="page-title">useLifecycle Hooks</h1>
        <p className="page-description">
          Lifecycle hooks provide a clean API for managing component lifecycle
          events. These hooks simplify component initialization, updates, and
          cleanup with an intuitive interface.
        </p>
      </div>

      <CreatedExample />
      <UpdatedExample />
      <DestroyedExample />

      <div className="example-card">
        <h3 className="example-title">Key Features</h3>
        <ul className="feature-list">
          <li>
            🎯 <strong>useLifecycleCreated</strong>: Execute code once when
            component mounts
          </li>
          <li>
            🔄 <strong>useLifecycleUpdated</strong>: Run side effects on
            component updates
          </li>
          <li>
            🧹 <strong>useLifecycleDestroyed</strong>: Clean up resources when
            component unmounts
          </li>
          <li>
            ⚡ <strong>Performance</strong>: Uses requestAnimationFrame for
            optimal timing
          </li>
          <li>
            🎨 <strong>Flexible</strong>: Supports dependency arrays for
            fine-grained control
          </li>
        </ul>
      </div>
    </div>
  );
}
