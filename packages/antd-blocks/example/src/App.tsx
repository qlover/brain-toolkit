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
import { Layout, Menu, Typography, Space } from 'antd';
import {
  TableOutlined,
  FormOutlined,
  ToolOutlined,
  EyeInvisibleOutlined,
  SettingOutlined,
  HomeOutlined
} from '@ant-design/icons';
import { BasicExample } from './examples/BasicExample';
import { WithFormExample } from './examples/WithFormExample';
import { CustomActionExample } from './examples/CustomActionExample';
import { NoActionExample } from './examples/NoActionExample';
import { CustomPaginationExample } from './examples/CustomPaginationExample';

const { Header, Sider, Content } = Layout;
const { Title, Paragraph, Link: AntLink } = Typography;

/**
 * Home page with introduction and links
 */
function HomePage() {
  return (
    <div style={{ padding: '24px' }}>
      <Space direction="vertical" size="large" style={{ width: '100%' }}>
        <div>
          <Title level={2}>@brain-toolkit/antd-blocks Examples</Title>
          <Paragraph>
            Welcome to the antd-blocks example showcase! This interactive demo
            demonstrates the capabilities of the ResourceTable component with
            various configurations.
          </Paragraph>
        </div>

        <div>
          <Title level={3}>What is @brain-toolkit/antd-blocks?</Title>
          <Paragraph>
            A high-level business component library based on Ant Design,
            providing out-of-the-box CRUD resource management solutions. It
            eliminates boilerplate code and accelerates development of
            data-driven applications.
          </Paragraph>
        </div>

        <div>
          <Title level={3}>Key Features</Title>
          <ul>
            <li>
              🚀 <strong>Ready to Use</strong>: Complete CRUD solution with
              minimal setup
            </li>
            <li>
              📦 <strong>Highly Integrated</strong>: Built on Ant Design
              component system
            </li>
            <li>
              🎯 <strong>Type Safe</strong>: Full TypeScript type definitions
            </li>
            <li>
              🔄 <strong>State Management</strong>: Built-in reactive state
              management
            </li>
            <li>
              🎨 <strong>Highly Customizable</strong>: Flexible configuration
              and slots
            </li>
            <li>
              📱 <strong>Responsive Design</strong>: Mobile-friendly interface
            </li>
          </ul>
        </div>

        <div>
          <Title level={3}>Available Examples</Title>
          <ul>
            <li>
              <Link to="/basic">Basic Example</Link> - Simplest usage with
              default settings
            </li>
            <li>
              <Link to="/with-form">With Form Example</Link> - Full CRUD with
              form popup, header and schema form
            </li>
            <li>
              <Link to="/custom-action">Custom Action Example</Link> -
              Customized action column
            </li>
            <li>
              <Link to="/no-action">No Action Example</Link> - Read-only table
            </li>
            <li>
              <Link to="/custom-pagination">Custom Pagination Example</Link> -
              Enhanced pagination
            </li>
          </ul>
        </div>

        <div>
          <Title level={3}>Links</Title>
          <Space>
            <AntLink
              href="https://github.com/qlover/brain-toolkit"
              target="_blank"
            >
              GitHub Repository
            </AntLink>
            <AntLink href="https://ant.design/" target="_blank">
              Ant Design
            </AntLink>
          </Space>
        </div>
      </Space>
    </div>
  );
}

/**
 * Navigation menu configuration
 */
const menuItems = [
  {
    key: '/',
    icon: <HomeOutlined />,
    label: 'Home'
  },
  {
    key: '/basic',
    icon: <TableOutlined />,
    label: 'Basic Example'
  },
  {
    key: '/with-form',
    icon: <FormOutlined />,
    label: 'With Form'
  },
  {
    key: '/custom-action',
    icon: <ToolOutlined />,
    label: 'Custom Action'
  },
  {
    key: '/no-action',
    icon: <EyeInvisibleOutlined />,
    label: 'No Action'
  },
  {
    key: '/custom-pagination',
    icon: <SettingOutlined />,
    label: 'Custom Pagination'
  }
];

/**
 * App Layout Component
 */
function AppLayout() {
  const location = useLocation();

  return (
    <Layout style={{ minHeight: '100vh' }}>
      {/* Sidebar Navigation */}
      <Sider
        theme="light"
        width={250}
        style={{
          overflow: 'auto',
          height: '100vh',
          position: 'fixed',
          left: 0,
          top: 0,
          bottom: 0
        }}
      >
        <div
          style={{
            height: '64px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            borderBottom: '1px solid #f0f0f0'
          }}
        >
          <Title level={4} style={{ margin: 0 }}>
            Antd Blocks
          </Title>
        </div>
        <Menu
          mode="inline"
          selectedKeys={[location.pathname]}
          style={{ borderRight: 0 }}
          items={menuItems.map((item) => ({
            key: item.key,
            icon: item.icon,
            label: <Link to={item.key}>{item.label}</Link>
          }))}
        />
      </Sider>

      {/* Main Content */}
      <Layout style={{ marginLeft: 250 }}>
        <Header style={{ background: '#fff', padding: '0 24px' }}>
          <Title level={3} style={{ margin: '14px 0' }}>
            Resource Table Examples
          </Title>
        </Header>
        <Content
          style={{ margin: '24px', padding: '24px', background: '#f0f2f5' }}
        >
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/basic" element={<BasicExample />} />
            <Route path="/with-form" element={<WithFormExample />} />
            <Route path="/custom-action" element={<CustomActionExample />} />
            <Route path="/no-action" element={<NoActionExample />} />
            <Route
              path="/custom-pagination"
              element={<CustomPaginationExample />}
            />
          </Routes>
        </Content>
      </Layout>
    </Layout>
  );
}

/**
 * Root App Component
 */
export function App() {
  return (
    <BrowserRouter>
      <AppLayout />
    </BrowserRouter>
  );
}
