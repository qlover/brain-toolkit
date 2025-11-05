# @brain-toolkit/antd-blocks Examples

> Interactive examples showcasing the capabilities of antd-blocks ResourceTable component

[简体中文](./README_ZH.md) | English

## 📖 Overview

This example project demonstrates various use cases and configurations of the `@brain-toolkit/antd-blocks` library. It provides a comprehensive showcase of the ResourceTable component with real, interactive examples that you can explore and learn from.

## ✨ What's Included

### 1. **Basic Example**
The simplest implementation showing:
- Default table configuration
- Automatic data loading
- Built-in pagination
- Default action buttons (Edit, Delete, Detail)

### 2. **With Form Example**
Complete CRUD functionality with:
- Create/Edit form in popup modal
- Form validation rules
- Custom form fields
- Header with create button
- Full CRUD operations

### 3. **Custom Action Example**
Customization of action column:
- Custom button text (i18n support)
- Custom column width
- Fixed column position
- Localized action labels

### 4. **No Action Example**
Read-only table display:
- Hidden action column
- Custom cell rendering
- Compact table size
- Email links and colored tags

### 5. **Custom Pagination Example**
Enhanced pagination features:
- Custom page size options
- Size changer
- Quick jumper
- Total count display with custom format

## 🚀 Quick Start

### Prerequisites

- Node.js >= 18.0.0
- pnpm >= 8.0.0 (recommended) or npm/yarn

### Installation

```bash
# Navigate to the antd-blocks package directory
cd packages/antd-blocks

# Install dependencies
pnpm install

# Or using npm
npm install

# Or using yarn
yarn install
```

### Development

```bash
# Start development server for examples
pnpm dev:example

# Or
npm run dev:example
```

The application will automatically open in your browser at `http://localhost:3000`

### Build

```bash
# Build examples for production
pnpm build:example

# Or
npm run build:example
```

### Preview Production Build

```bash
# Preview the production build
pnpm preview:example

# Or
npm run preview:example
```

## 📁 Project Structure

```
packages/antd-blocks/
├── example/                # Examples directory
│   ├── src/
│   │   ├── examples/       # Example components
│   │   │   ├── BasicExample.tsx
│   │   │   ├── WithFormExample.tsx
│   │   │   ├── CustomActionExample.tsx
│   │   │   ├── NoActionExample.tsx
│   │   │   └── CustomPaginationExample.tsx
│   │   ├── services/       # Mock services
│   │   │   ├── types.ts
│   │   │   └── UserService.ts
│   │   ├── App.tsx         # Main app with routing
│   │   ├── main.tsx        # Entry point
│   │   └── index.css       # Global styles
│   └── index.html          # HTML template
├── src/                    # Source code of antd-blocks
├── vite.example.config.ts  # Vite config for examples
├── package.json            # Package configuration
└── README.md               # Package documentation
```

## 🎯 Learning Path

If you're new to `@brain-toolkit/antd-blocks`, we recommend exploring the examples in this order:

1. **Start with Basic Example** - Understand the core concept and minimal setup
2. **Move to With Form Example** - Learn about full CRUD operations with forms
3. **Explore Custom Action Example** - See how to customize the action column
4. **Check No Action Example** - Understand read-only scenarios
5. **Finally Custom Pagination Example** - Learn advanced pagination customization

## 💡 Key Concepts

### Using `useMemo` for Instances

**Important**: Always wrap service and event instances with `useMemo` to prevent unnecessary re-renders:

```typescript
// ✅ Correct
const userService = useMemo(() => new UserService(), []);
const tableEvent = useMemo(
  () => new ResourceEvent('users', userService, undefined, form),
  [userService, form]
);

// ❌ Wrong - Creates new instances on every render
const userService = new UserService();
const tableEvent = new ResourceEvent('users', userService);
```

### Lifecycle Management

Don't forget to manage the lifecycle of your table event:

```typescript
useEffect(() => {
  tableEvent.created();
  return () => tableEvent.destroyed();
}, [tableEvent]);
```

### ResourceService Interface

All services must implement the `ResourceServiceInterface`:

- `create(data)` - Create new resource
- `update(data)` - Update existing resource
- `remove(data)` - Delete resource
- `search(query)` - Search/list resources with pagination
- `getStore()` - Get the resource store
- Lifecycle hooks: `created()`, `updated()`, `destroyed()`

## 🔧 Customization Examples

### Custom Column Rendering

```typescript
{
  title: 'Role',
  dataIndex: 'role',
  render: (role: string) => (
    <Tag color={role === 'admin' ? 'red' : 'blue'}>
      {role.toUpperCase()}
    </Tag>
  )
}
```

### Custom Action Props

```typescript
<ResourceTable
  actionProps={{
    width: 200,
    fixed: 'right',
    editText: 'Edit',
    deleteText: 'Remove',
    detailText: 'View'
  }}
/>
```

### Custom Pagination

```typescript
<ResourceTable
  pagination={{
    showSizeChanger: true,
    showQuickJumper: true,
    showTotal: (total) => `Total ${total} items`
  }}
/>
```

## 📚 Related Documentation

- [Main Package README](../README.md)
- [Ant Design Documentation](https://ant.design/)
- [React Documentation](https://react.dev/)
- [Vite Documentation](https://vitejs.dev/)

## 🤝 Contributing

Found a bug or have a suggestion? Please open an issue on [GitHub](https://github.com/qlover/brain-toolkit/issues).

## 📄 License

[ISC](../../../LICENSE) © qlover

