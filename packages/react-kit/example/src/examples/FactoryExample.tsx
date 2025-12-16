/**
 * Factory Hook Examples
 *
 * Demonstrates useFactory for creating stable class instances
 */
import { useState } from 'react';
import { useFactory } from '@brain-toolkit/react-kit';

/**
 * Example Service Class
 */
class CounterService {
  private _count: number;
  private _id: string;

  constructor(initialCount: number = 0, id: string = 'default') {
    this._count = initialCount;
    this._id = id;
    console.log(
      `CounterService ${id} created with initial count: ${initialCount}`
    );
  }

  public get count(): number {
    return this._count;
  }

  public get id(): string {
    return this._id;
  }

  public increment(): void {
    this._count++;
  }

  public decrement(): void {
    this._count--;
  }

  public reset(): void {
    this._count = 0;
  }
}

/**
 * Example Logger Class
 */
class Logger {
  private namespace: string;

  constructor(namespace: string) {
    this.namespace = namespace;
  }

  public log(message: string): string {
    return `[${this.namespace}] ${message}`;
  }
}

/**
 * Example 1: Basic Factory Usage
 */
function BasicFactoryExample() {
  const [count, setCount] = useState(0);

  // Create a stable instance of CounterService
  // Instance is created once and reused across re-renders
  const counter = useFactory(CounterService, 10, 'basic-counter');

  const handleIncrement = () => {
    counter.increment();
    setCount(counter.count);
  };

  const handleDecrement = () => {
    counter.decrement();
    setCount(counter.count);
  };

  const handleReset = () => {
    counter.reset();
    setCount(counter.count);
  };

  return (
    <div className="example-card">
      <h3 className="example-title">Basic useFactory Example</h3>
      <p className="page-description">
        Create a stable service instance that persists across component
        re-renders. The instance is created once with the initial value of 10.
      </p>
      <div className="demo-section">
        <div className="counter-display">{count}</div>
        <p style={{ textAlign: 'center', color: '#666' }}>
          Service ID: {counter.id}
        </p>
        <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
          <button className="button primary" onClick={handleIncrement}>
            Increment
          </button>
          <button className="button primary" onClick={handleDecrement}>
            Decrement
          </button>
          <button className="button" onClick={handleReset}>
            Reset
          </button>
        </div>
      </div>
    </div>
  );
}

/**
 * Example 2: Factory with Argument Changes
 */
function DynamicFactoryExample() {
  const [initialValue, setInitialValue] = useState(0);
  const [count, setCount] = useState(0);
  const [recreateCount, setRecreateCount] = useState(0);

  // Instance will be recreated when initialValue changes
  const counter = useFactory(
    CounterService,
    initialValue,
    `dynamic-${recreateCount}`
  );

  const handleChangeInitial = (value: number) => {
    setInitialValue(value);
    setRecreateCount((prev) => prev + 1);
    setCount(value);
  };

  const handleIncrement = () => {
    counter.increment();
    setCount(counter.count);
  };

  return (
    <div className="example-card">
      <h3 className="example-title">Dynamic Recreation Example</h3>
      <p className="page-description">
        When constructor arguments change, the instance is automatically
        recreated. Try changing the initial value to see this in action.
      </p>
      <div className="demo-section">
        <div className="counter-display">{count}</div>
        <p style={{ textAlign: 'center', color: '#666' }}>
          Instance recreated: {recreateCount} times
        </p>
        <div style={{ marginBottom: '16px' }}>
          <label style={{ display: 'block', marginBottom: '8px' }}>
            Initial Value:
          </label>
          <input
            type="number"
            value={initialValue}
            onChange={(e) => handleChangeInitial(Number(e.target.value))}
            style={{
              padding: '8px',
              border: '1px solid #d9d9d9',
              borderRadius: '4px',
              width: '100%'
            }}
          />
        </div>
        <button className="button primary" onClick={handleIncrement}>
          Increment
        </button>
      </div>
    </div>
  );
}

/**
 * Example 3: Multiple Factory Instances
 */
function MultipleInstancesExample() {
  const [logs, setLogs] = useState<string[]>([]);

  // Create multiple service instances
  const logger1 = useFactory(Logger, 'App');
  const logger2 = useFactory(Logger, 'User');
  const logger3 = useFactory(Logger, 'API');

  const addLog = (logger: Logger, message: string) => {
    const logMessage = logger.log(message);
    setLogs((prev) => [...prev, logMessage]);
  };

  return (
    <div className="example-card">
      <h3 className="example-title">Multiple Instances Example</h3>
      <p className="page-description">
        Create multiple service instances in the same component. Each instance
        maintains its own state and identity.
      </p>
      <div className="demo-section">
        <div
          style={{
            display: 'flex',
            gap: '8px',
            marginBottom: '16px',
            flexWrap: 'wrap'
          }}
        >
          <button
            className="button primary"
            onClick={() => addLog(logger1, 'Application started')}
          >
            Log to App
          </button>
          <button
            className="button primary"
            onClick={() => addLog(logger2, 'User logged in')}
          >
            Log to User
          </button>
          <button
            className="button primary"
            onClick={() => addLog(logger3, 'API request sent')}
          >
            Log to API
          </button>
          <button className="button" onClick={() => setLogs([])}>
            Clear Logs
          </button>
        </div>
        <div className="log-section">
          <h4>Logs:</h4>
          {logs.length === 0 ? (
            <div className="log-item">No logs yet. Click a button to log!</div>
          ) : (
            logs.map((log, index) => (
              <div key={index} className="log-item">
                {log}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

/**
 * Main Factory Example Component
 */
export function FactoryExample() {
  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">useFactory Hook</h1>
        <p className="page-description">
          The useFactory hook creates stable class instances that persist across
          component re-renders. It's perfect for creating service instances,
          stores, or any objects that need to maintain identity and state.
        </p>
      </div>

      <BasicFactoryExample />
      <DynamicFactoryExample />
      <MultipleInstancesExample />

      <div className="example-card">
        <h3 className="example-title">Key Features</h3>
        <ul className="feature-list">
          <li>
            🏭 <strong>Instance Creation</strong>: Uses constructor pattern with
            'new' keyword
          </li>
          <li>
            📌 <strong>Stable Reference</strong>: Instance persists across
            re-renders
          </li>
          <li>
            🔄 <strong>Auto Recreation</strong>: Recreates when arguments change
          </li>
          <li>
            🎯 <strong>Type Safe</strong>: Full TypeScript support with
            inference
          </li>
          <li>
            ⚡ <strong>Performance</strong>: Optimized with useMemo internally
          </li>
        </ul>
      </div>
    </div>
  );
}
