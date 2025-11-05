# @brain-toolkit/antd-blocks

> 基于 Ant Design 的高级业务组件库，提供开箱即用的 CRUD 资源管理解决方案

[![NPM version](https://img.shields.io/npm/v/@brain-toolkit/antd-blocks.svg)](https://www.npmjs.com/package/@brain-toolkit/antd-blocks)
[![License](https://img.shields.io/npm/l/@brain-toolkit/antd-blocks.svg)](https://github.com/qlover/brain-toolkit)

[English](./README_EN.md) | 简体中文

## ✨ 特性

- 🚀 **开箱即用**：提供完整的 CRUD 资源管理解决方案，大幅减少样板代码
- 📦 **高度集成**：基于 Ant Design 组件体系，与现有项目无缝集成
- 🎯 **类型安全**：完整的 TypeScript 类型定义，提供优秀的开发体验
- 🔄 **状态管理**：内置响应式状态管理，自动处理加载、成功、错误状态
- 🎨 **高度可定制**：灵活的配置选项和插槽，满足各种业务场景
- 📱 **响应式设计**：支持移动端适配，提供良好的移动体验

## 📦 安装

```bash
# npm
npm install @brain-toolkit/antd-blocks

# yarn
yarn add @brain-toolkit/antd-blocks

# pnpm
pnpm add @brain-toolkit/antd-blocks
```

### 依赖要求

```json
{
  "react": ">=18.0.0",
  "antd": ">=5.0.0",
  "@qlover/corekit-bridge": ">=1.6.0",
  "@qlover/slice-store-react": ">=1.4.0"
}
```

## 🚀 快速开始

### 基础示例

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
    { title: '姓名', dataIndex: 'name', key: 'name' },
    { title: '邮箱', dataIndex: 'email', key: 'email' },
    { title: '角色', dataIndex: 'role', key: 'role' }
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

## ⚡ 性能优化建议

### 使用 useMemo 包裹实例创建

在 React 组件中创建服务实例和事件处理器时，**必须使用 `useMemo`** 包裹，以避免每次渲染时都创建新实例。

**❌ 错误示例（会导致性能问题）：**

```typescript
function UserList() {
  // 错误：每次渲染都会创建新实例
  const userService = new UserService();
  const tableEvent = new ResourceEvent('users', userService);
  // ...
}
```

**✅ 正确示例：**

```typescript
function UserList() {
  // 正确：使用 useMemo 确保实例只创建一次
  const userService = useMemo(() => new UserService(), []);
  const tableEvent = useMemo(
    () => new ResourceEvent('users', userService),
    [userService]
  );
  // ...
}
```

**原因说明：**

- 不使用 `useMemo` 会导致每次渲染创建新实例
- 新实例会触发子组件不必要的重新渲染
- 可能导致 `useEffect` 依赖项变化，引发无限循环
- 造成内存泄漏和性能下降

## 📚 核心组件

### ResourceTable

资源表格组件，提供完整的 CRUD 功能和分页支持。

**主要特性：**

- ✅ 自动数据加载和分页
- ✅ 内置增删改查操作按钮
- ✅ 加载状态自动管理
- ✅ 响应式设计，支持移动端

**Props：**

| 属性          | 类型                                                  | 必填 | 默认值 | 说明                            |
| ------------- | ----------------------------------------------------- | ---- | ------ | ------------------------------- |
| `columns`     | `ResourceTableOption<T>[]`                            | ✅   | -      | 表格列配置                      |
| `tableEvent`  | `ResourceTableEventInterface`                         | ✅   | -      | 事件处理器实例                  |
| `actionProps` | `false \| TableColumnProps & ResourceTableActionI18n` | ❌   | -      | 操作列配置，设为 `false` 可隐藏 |

### ResourceEvent

资源事件处理类，管理 CRUD 操作的完整生命周期。

**主要特性：**

- ✅ 统一的 CRUD 操作接口
- ✅ 自动状态管理（loading、success、error）
- ✅ 表单数据自动填充和重置
- ✅ 可扩展的操作钩子

**构造函数参数：**

| 参数            | 类型                       | 必填 | 说明                   |
| --------------- | -------------------------- | ---- | ---------------------- |
| `namespace`     | `string`                   | ✅   | 命名空间，用于状态隔离 |
| `resource`      | `ResourceServiceInterface` | ✅   | 资源服务实例           |
| `store`         | `ResourceEventStroe`       | ❌   | 自定义 store 实例      |
| `schemaFormRef` | `FormInstance`             | ❌   | Ant Design Form 实例   |

### ResourceTableProvider

资源表格上下文提供者，用于共享状态和事件处理器。

```typescript
import { ResourceTableProvider } from '@brain-toolkit/antd-blocks/resourceTable';

<ResourceTableProvider tableEvent={tableEvent}>
  <ResourceTableHeader />
  <ResourceTable columns={columns} tableEvent={tableEvent} />
  <ResourceTablePopup />
</ResourceTableProvider>
```

## 💡 使用场景

### 场景 1：标准 CRUD 管理

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
    { title: '产品名称', dataIndex: 'name' },
    { title: '价格', dataIndex: 'price' },
    { title: '库存', dataIndex: 'stock' }
  ];

  return <ResourceTable columns={columns} tableEvent={tableEvent} />;
}
```

### 场景 2：自定义操作列

```typescript
<ResourceTable
  columns={columns}
  tableEvent={tableEvent}
  actionProps={{
    width: 200,
    fixed: 'right',
    editText: '修改',
    deleteText: '删除',
    detailText: '查看详情'
  }}
/>
```

### 场景 3：隐藏操作列

```typescript
<ResourceTable
  columns={columns}
  tableEvent={tableEvent}
  actionProps={false}
/>
```

### 场景 4：自定义删除逻辑

```typescript
class CustomResourceEvent extends ResourceEvent {
  protected async actionDelete(values: unknown): Promise<unknown> {
    const confirmed = await Modal.confirm({
      title: '确认删除',
      content: '删除后数据将无法恢复，是否继续？'
    });

    if (confirmed) {
      await this.resource.remove(values);
      await this.onRefresh({ resource: this.resource });
      message.success('删除成功');
    }

    return confirmed;
  }
}
```

### 场景 5：完整的表单集成

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
      <ResourceTablePopup title="用户信息">
        <ResourceTableSchemaForm>
          <Form.Item name="name" label="姓名" rules={[{ required: true }]}>
            <Input />
          </Form.Item>
          <Form.Item name="email" label="邮箱" rules={[{ required: true, type: 'email' }]}>
            <Input />
          </Form.Item>
          <Form.Item name="role" label="角色">
            <Select>
              <Select.Option value="admin">管理员</Select.Option>
              <Select.Option value="user">普通用户</Select.Option>
            </Select>
          </Form.Item>
        </ResourceTableSchemaForm>
      </ResourceTablePopup>
    </ResourceTableProvider>
  );
}
```

## 🔌 实现资源服务

资源服务需要实现 `ResourceServiceInterface` 接口：

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
    // 实现创建逻辑
    const response = await api.post('/users', data);
    return response.data;
  }

  async update(data: Partial<User>): Promise<User> {
    // 实现更新逻辑
    const response = await api.put(`/users/${data.id}`, data);
    return response.data;
  }

  async remove(data: unknown): Promise<void> {
    // 实现删除逻辑
    await api.delete(`/users/${(data as User).id}`);
  }

  async search(query: ResourceQuery): Promise<ResourceListResult<User>> {
    // 实现查询逻辑
    const response = await api.get('/users', { params: query });
    return {
      list: response.data.items,
      total: response.data.total
    };
  }

  created() {
    // 组件挂载时调用
    this.search({ page: 1, pageSize: 10 });
  }

  updated() {
    // 组件更新时调用
  }

  destroyed() {
    // 组件卸载时调用
  }
}
```

## 📖 API 文档

### ResourceTable Props

| 属性          | 类型                                                       | 必填 | 默认值 | 说明                                       |
| ------------- | ---------------------------------------------------------- | ---- | ------ | ------------------------------------------ |
| `columns`     | `ResourceTableOption<T>[]`                                 | ✅   | -      | 表格列配置，扩展自 Ant Design Table Column |
| `tableEvent`  | `ResourceTableEventInterface`                              | ✅   | -      | 事件处理器实例                             |
| `actionProps` | `false \| (TableColumnProps<T> & ResourceTableActionI18n)` | ❌   | -      | 操作列配置，设为 `false` 隐藏操作列        |
| ...其他       | `TableProps<T>`                                            | ❌   | -      | 继承所有 Ant Design Table 组件 props       |

### ResourceEvent Methods

| 方法                     | 参数                                             | 返回值             | 说明           |
| ------------------------ | ------------------------------------------------ | ------------------ | -------------- |
| `onCreated(params)`      | `ResourceTableEventCommonParams`                 | `void`             | 触发创建操作   |
| `onEdited(params)`       | `ResourceTableEventCommonParams`                 | `void`             | 触发编辑操作   |
| `onDeleted(params)`      | `ResourceTableEventCommonParams`                 | `void`             | 触发删除操作   |
| `onDetail(params)`       | `ResourceTableEventCommonParams`                 | `void`             | 查看详情       |
| `onRefresh(params)`      | `ResourceTableEventCommonParams`                 | `Promise<unknown>` | 刷新列表       |
| `onSubmit(values)`       | `unknown`                                        | `Promise<unknown>` | 提交表单       |
| `onClosePopup()`         | -                                                | `void`             | 关闭弹窗       |
| `onChangeParams(params)` | `ResourceTableEventCommonParams & ResourceQuery` | `void`             | 更改查询参数   |
| `created()`              | -                                                | `void`             | 生命周期：创建 |
| `updated()`              | -                                                | `void`             | 生命周期：更新 |
| `destroyed()`            | -                                                | `void`             | 生命周期：销毁 |

## 🎨 主题定制

组件基于 Ant Design，支持 Ant Design 的所有主题定制方式：

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

## 🔗 相关链接

- [GitHub Repository](https://github.com/qlover/brain-toolkit)
- [Ant Design 文档](https://ant.design/)
- [问题反馈](https://github.com/qlover/brain-toolkit/issues)

## 🤝 贡献

欢迎贡献代码！请查看我们的 [贡献指南](../../CONTRIBUTING.md)。

## 📄 许可证

[ISC](LICENSE) © qlover

## 🙏 致谢

本项目基于以下优秀的开源项目：

- [Ant Design](https://ant.design/) - 企业级 UI 设计语言和 React 组件库
- [React](https://react.dev/) - 用于构建用户界面的 JavaScript 库
- [@qlover/corekit-bridge](https://github.com/qlover/fe-corekit) - 核心工具库
