/**
 * Home Page Component
 *
 * Introduction and overview of the react-kit package
 */
import { Link } from 'react-router-dom';

export function HomePage() {
  return (
    <div className="home-content">
      <h1 className="home-title">@brain-toolkit/react-kit Examples</h1>
      <p className="home-text">
        Welcome to the react-kit example showcase! This interactive demo
        demonstrates the capabilities of various React hooks provided by the
        package.
      </p>

      <h2 className="home-subtitle">What is @brain-toolkit/react-kit?</h2>
      <p className="home-text">
        A collection of essential React hooks that simplify common patterns and
        eliminate boilerplate code in React applications. These hooks are
        designed to be lightweight, type-safe, and easy to integrate.
      </p>

      <h2 className="home-subtitle">Available Hooks</h2>
      <ul className="link-list">
        <li>
          <Link to="/lifecycle">useLifecycle</Link> - Manage component lifecycle
          events with a clean API
        </li>
        <li>
          <Link to="/factory">useFactory</Link> - Create instances with factory
          pattern and automatic cleanup
        </li>
        <li>
          <Link to="/store">useStore</Link> - Simple state management with
          reactive updates
        </li>
        <li>
          <Link to="/mounted-client">useMountedClient</Link> - Execute client-side
          code safely after mounting
        </li>
      </ul>

      <h2 className="home-subtitle">Key Features</h2>
      <ul className="feature-list">
        <li>🚀 <strong>Easy to Use</strong>: Minimal setup and intuitive API</li>
        <li>📦 <strong>Lightweight</strong>: Small bundle size with zero dependencies</li>
        <li>🎯 <strong>Type Safe</strong>: Full TypeScript support</li>
        <li>🔄 <strong>Reactive</strong>: Automatic updates and cleanup</li>
        <li>🎨 <strong>Flexible</strong>: Works with any React application</li>
        <li>📚 <strong>Well Documented</strong>: Clear examples and API documentation</li>
      </ul>

      <h2 className="home-subtitle">Links</h2>
      <ul className="link-list">
        <li>
          <a href="https://github.com/qlover/brain-toolkit" target="_blank" rel="noopener noreferrer">
            GitHub Repository
          </a>
        </li>
        <li>
          <a href="https://react.dev/" target="_blank" rel="noopener noreferrer">
            React Documentation
          </a>
        </li>
      </ul>
    </div>
  );
}

