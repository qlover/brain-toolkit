/**
 * Main Application Component
 *
 * Provides routing and layout for all examples
 */
import {
  BrowserRouter,
  Routes,
  Route,
  Link,
  useLocation
} from 'react-router-dom';
import { HomePage } from './pages/HomePage';
import { LifecycleExample } from './examples/LifecycleExample';
import { FactoryExample } from './examples/FactoryExample';
import { StoreExample } from './examples/StoreExample';
import { MountedClientExample } from './examples/MountedClientExample';

/**
 * Navigation menu configuration
 */
const menuItems = [
  {
    key: '/',
    label: 'Home'
  },
  {
    key: '/lifecycle',
    label: 'useLifecycle'
  },
  {
    key: '/factory',
    label: 'useFactory'
  },
  {
    key: '/store',
    label: 'useStore'
  },
  {
    key: '/mounted-client',
    label: 'useMountedClient'
  }
];

/**
 * App Layout Component
 */
function AppLayout() {
  const location = useLocation();

  return (
    <div data-testid="AppLayout" className="app-container">
      {/* Sidebar Navigation */}
      <div className="sidebar">
        <div className="sidebar-header">React Kit</div>
        <nav className="sidebar-nav">
          {menuItems.map((item) => (
            <Link
              data-testid="AppLayout"
              key={item.key}
              to={item.key}
              className={`nav-item ${location.pathname === item.key ? 'active' : ''}`}
            >
              {item.label}
            </Link>
          ))}
        </nav>
      </div>

      {/* Main Content */}
      <div className="main-content">
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/lifecycle" element={<LifecycleExample />} />
          <Route path="/factory" element={<FactoryExample />} />
          <Route path="/store" element={<StoreExample />} />
          <Route path="/mounted-client" element={<MountedClientExample />} />
        </Routes>
      </div>
    </div>
  );
}

/**
 * Root App Component
 */
export function App() {
  return (
    <BrowserRouter data-testid="App">
      <AppLayout />
    </BrowserRouter>
  );
}
