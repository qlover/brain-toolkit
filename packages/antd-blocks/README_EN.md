# @brain-toolkit/antd-blocks

> Advanced business component library based on Ant Design, providing out-of-the-box CRUD resource management solutions

[![NPM version](https://img.shields.io/npm/v/@brain-toolkit/antd-blocks.svg)](https://www.npmjs.com/package/@brain-toolkit/antd-blocks)
[![License](https://img.shields.io/npm/l/@brain-toolkit/antd-blocks.svg)](https://github.com/qlover/brain-toolkit)

English | [简体中文](./README.md)

## ✨ Features

- 🚀 **Out of the Box**: Complete CRUD resource management solution, dramatically reducing boilerplate code
- 📦 **Highly Integrated**: Based on Ant Design component system, seamlessly integrates with existing projects
- 🎯 **Type Safe**: Complete TypeScript type definitions for excellent developer experience
- 🔄 **State Management**: Built-in reactive state management, automatically handles loading, success, and error states
- 🎨 **Highly Customizable**: Flexible configuration options and slots to meet various business scenarios
- 📱 **Responsive Design**: Mobile-friendly with excellent mobile experience

## 📦 Installation

```bash
# npm
npm install @brain-toolkit/antd-blocks

# yarn
yarn add @brain-toolkit/antd-blocks

# pnpm
pnpm add @brain-toolkit/antd-blocks
```

### Peer Dependencies

```json
{
  "react": ">=18.0.0",
  "antd": ">=5.0.0",
  "@qlover/corekit-bridge": ">=1.6.0",
  "@qlover/slice-store-react": ">=1.4.0"
}
```

## 🚀 Quick Start

### Basic Example

```typescript
import React, { useEffect, useMemo } from 'react';
import { Form } from 'antd';
import { ResourceTable, ResourceEvent } from '@brain-toolkit/antd-blocks/resourceTable';
import { UserService } from './services/UserService';

function UserList() {
  const [form] = Form.useForm();

  // Use useMemo to ensure instances are created only once
  const userService = useMemo(() => new UserService(), []);
  const tableEvent = useMemo(
    () => new ResourceEvent('users', userService, undefined, form),
    [userService, form]
  );

  useEffect(() => {
    tableEvent.created();
    return () => tableEvent.destroyed();
  }, [tableEvent]);

  const columns = [
    { title: 'Name', dataIndex: 'name', key: 'name' },
    { title: 'Email', dataIndex: 'email', key: 'email' },
    { title: 'Role', dataIndex: 'role', key: 'role' }
  ];

  return (
    <ResourceTable
      columns={columns}
      tableEvent={tableEvent}
    />
  );
}

export default UserList;
```

## ⚡ Performance Optimization

### Use useMemo to Wrap Instance Creation

When creating service instances and event handlers in React components, **you must use `useMemo`** to prevent creating new instances on every render.

**❌ Wrong Example (causes performance issues):**

```typescript
function UserList() {
  // Wrong: Creates new instances on every render
  const userService = new UserService();
  const tableEvent = new ResourceEvent('users', userService);
  // ...
}
```

**✅ Correct Example:**

```typescript
function UserList() {
  // Correct: Use useMemo to ensure instances are created only once
  const userService = useMemo(() => new UserService(), []);
  const tableEvent = useMemo(
    () => new ResourceEvent('users', userService),
    [userService]
  );
  // ...
}
```

**Why this matters:**

- Without `useMemo`, new instances are created on every render
- New instances trigger unnecessary re-renders in child components
- May cause `useEffect` dependency changes, leading to infinite loops
- Results in memory leaks and performance degradation

## 📚 Core Components

### ResourceTable

Resource table component providing complete CRUD functionality and pagination support.

**Key Features:**

- ✅ Automatic data loading and pagination
- ✅ Built-in CRUD operation buttons
- ✅ Automatic loading state management
- ✅ Responsive design with mobile support

**Props:**

| Property      | Type                                                  | Required | Default | Description                                  |
| ------------- | ----------------------------------------------------- | -------- | ------- | -------------------------------------------- |
| `columns`     | `ResourceTableOption<T>[]`                            | ✅       | -       | Table column configuration                   |
| `tableEvent`  | `ResourceTableEventInterface`                         | ✅       | -       | Event handler instance                       |
| `actionProps` | `false \| TableColumnProps & ResourceTableActionI18n` | ❌       | -       | Action column config, set to `false` to hide |

### ResourceEvent

Resource event handler class managing the complete lifecycle of CRUD operations.

**Key Features:**

- ✅ Unified CRUD operation interface
- ✅ Automatic state management (loading, success, error)
- ✅ Automatic form data filling and reset
- ✅ Extensible operation hooks

**Constructor Parameters:**

| Parameter       | Type                       | Required | Description                   |
| --------------- | -------------------------- | -------- | ----------------------------- |
| `namespace`     | `string`                   | ✅       | Namespace for state isolation |
| `resource`      | `ResourceServiceInterface` | ✅       | Resource service instance     |
| `store`         | `ResourceEventStroe`       | ❌       | Custom store instance         |
| `schemaFormRef` | `FormInstance`             | ❌       | Ant Design Form instance      |

### ResourceTableProvider

Resource table context provider for sharing state and event handlers.

```typescript
import { ResourceTableProvider } from '@brain-toolkit/antd-blocks/resourceTable';

<ResourceTableProvider tableEvent={tableEvent}>
  <ResourceTableHeader />
  <ResourceTable columns={columns} tableEvent={tableEvent} />
  <ResourceTablePopup />
</ResourceTableProvider>
```

## 💡 Usage Scenarios

### Scenario 1: Standard CRUD Management

```typescript
import { useMemo } from 'react';
import { ResourceTable, ResourceEvent } from '@brain-toolkit/antd-blocks/resourceTable';

function ProductList() {
  const productService = useMemo(() => new ProductService(), []);
  const tableEvent = useMemo(
    () => new ResourceEvent('products', productService),
    [productService]
  );

  const columns = [
    { title: 'Product Name', dataIndex: 'name' },
    { title: 'Price', dataIndex: 'price' },
    { title: 'Stock', dataIndex: 'stock' }
  ];

  return <ResourceTable columns={columns} tableEvent={tableEvent} />;
}
```

### Scenario 2: Custom Action Column

```typescript
<ResourceTable
  columns={columns}
  tableEvent={tableEvent}
  actionProps={{
    width: 200,
    fixed: 'right',
    editText: 'Edit',
    deleteText: 'Delete',
    detailText: 'View Details'
  }}
/>
```

### Scenario 3: Hide Action Column

```typescript
<ResourceTable
  columns={columns}
  tableEvent={tableEvent}
  actionProps={false}
/>
```

### Scenario 4: Custom Delete Logic

```typescript
class CustomResourceEvent extends ResourceEvent {
  protected async actionDelete(values: unknown): Promise<unknown> {
    const confirmed = await Modal.confirm({
      title: 'Confirm Delete',
      content: 'Data cannot be recovered after deletion. Continue?'
    });

    if (confirmed) {
      await this.resource.remove(values);
      await this.onRefresh({ resource: this.resource });
      message.success('Deleted successfully');
    }

    return confirmed;
  }
}
```

### Scenario 5: Complete Form Integration

```typescript
import { useEffect, useMemo } from 'react';
import { Form, Input, Select } from 'antd';
import { ResourceTableProvider, ResourceTableHeader, ResourceTablePopup, ResourceTableSchemaForm } from '@brain-toolkit/antd-blocks/resourceTable';

function UserManagement() {
  const [form] = Form.useForm();

  const userService = useMemo(() => new UserService(), []);
  const tableEvent = useMemo(
    () => new ResourceEvent('users', userService, undefined, form),
    [userService, form]
  );

  useEffect(() => {
    tableEvent.created();
    return () => tableEvent.destroyed();
  }, [tableEvent]);

  return (
    <ResourceTableProvider tableEvent={tableEvent}>
      <ResourceTableHeader />
      <ResourceTable columns={columns} tableEvent={tableEvent} />
      <ResourceTablePopup title="User Information">
        <ResourceTableSchemaForm>
          <Form.Item name="name" label="Name" rules={[{ required: true }]}>
            <Input />
          </Form.Item>
          <Form.Item name="email" label="Email" rules={[{ required: true, type: 'email' }]}>
            <Input />
          </Form.Item>
          <Form.Item name="role" label="Role">
            <Select>
              <Select.Option value="admin">Admin</Select.Option>
              <Select.Option value="user">User</Select.Option>
            </Select>
          </Form.Item>
        </ResourceTableSchemaForm>
      </ResourceTablePopup>
    </ResourceTableProvider>
  );
}
```

## 🔌 Implementing Resource Service

Resource service must implement `ResourceServiceInterface`:

```typescript
import {
  ResourceServiceInterface,
  ResourceStore,
  ResourceStateInterface
} from '@qlover/corekit-bridge';

class UserService
  implements
    ResourceServiceInterface<User, ResourceStore<ResourceStateInterface>>
{
  private store = new ResourceStore<ResourceStateInterface>();

  getStore() {
    return this.store;
  }

  async create(data: unknown): Promise<User> {
    // Implement create logic
    const response = await api.post('/users', data);
    return response.data;
  }

  async update(data: Partial<User>): Promise<User> {
    // Implement update logic
    const response = await api.put(`/users/${data.id}`, data);
    return response.data;
  }

  async remove(data: unknown): Promise<void> {
    // Implement delete logic
    await api.delete(`/users/${(data as User).id}`);
  }

  async search(query: ResourceQuery): Promise<ResourceListResult<User>> {
    // Implement search logic
    const response = await api.get('/users', { params: query });
    return {
      list: response.data.items,
      total: response.data.total
    };
  }

  created() {
    // Called when component mounts
    this.search({ page: 1, pageSize: 10 });
  }

  updated() {
    // Called when component updates
  }

  destroyed() {
    // Called when component unmounts
  }
}
```

## 📖 API Documentation

### ResourceTable Props

| Property      | Type                                                       | Required | Default | Description                                          |
| ------------- | ---------------------------------------------------------- | -------- | ------- | ---------------------------------------------------- |
| `columns`     | `ResourceTableOption<T>[]`                                 | ✅       | -       | Table column config, extends Ant Design Table Column |
| `tableEvent`  | `ResourceTableEventInterface`                              | ✅       | -       | Event handler instance                               |
| `actionProps` | `false \| (TableColumnProps<T> & ResourceTableActionI18n)` | ❌       | -       | Action column config, set to `false` to hide         |
| ...others     | `TableProps<T>`                                            | ❌       | -       | Inherits all Ant Design Table component props        |

### ResourceEvent Methods

| Method                   | Parameters                                       | Return             | Description              |
| ------------------------ | ------------------------------------------------ | ------------------ | ------------------------ |
| `onCreated(params)`      | `ResourceTableEventCommonParams`                 | `void`             | Trigger create operation |
| `onEdited(params)`       | `ResourceTableEventCommonParams`                 | `void`             | Trigger edit operation   |
| `onDeleted(params)`      | `ResourceTableEventCommonParams`                 | `void`             | Trigger delete operation |
| `onDetail(params)`       | `ResourceTableEventCommonParams`                 | `void`             | View details             |
| `onRefresh(params)`      | `ResourceTableEventCommonParams`                 | `Promise<unknown>` | Refresh list             |
| `onSubmit(values)`       | `unknown`                                        | `Promise<unknown>` | Submit form              |
| `onClosePopup()`         | -                                                | `void`             | Close popup              |
| `onChangeParams(params)` | `ResourceTableEventCommonParams & ResourceQuery` | `void`             | Change query parameters  |
| `created()`              | -                                                | `void`             | Lifecycle: created       |
| `updated()`              | -                                                | `void`             | Lifecycle: updated       |
| `destroyed()`            | -                                                | `void`             | Lifecycle: destroyed     |

## 🎨 Theme Customization

Components are based on Ant Design and support all Ant Design theme customization methods:

```typescript
import { ConfigProvider } from 'antd';

<ConfigProvider
  theme={{
    token: {
      colorPrimary: '#00b96b',
    },
  }}
>
  <ResourceTable columns={columns} tableEvent={tableEvent} />
</ConfigProvider>
```

## 🔗 Links

- [GitHub Repository](https://github.com/qlover/brain-toolkit)
- [Ant Design Documentation](https://ant.design/)
- [Issue Tracker](https://github.com/qlover/brain-toolkit/issues)

## 🤝 Contributing

Contributions are welcome! Please check our [Contributing Guide](../../CONTRIBUTING.md).

## 📄 License

[ISC](LICENSE) © qlover

## 🙏 Acknowledgements

This project is built upon these excellent open source projects:

- [Ant Design](https://ant.design/) - Enterprise-class UI design language and React UI library
- [React](https://react.dev/) - A JavaScript library for building user interfaces
- [@qlover/corekit-bridge](https://github.com/qlover/fe-corekit) - Core toolkit library
