# @brain-toolkit/antd-blocks 示例

> 展示 antd-blocks ResourceTable 组件功能的交互式示例

简体中文 | [English](./README.md)

## 📖 概述

这个示例项目展示了 `@brain-toolkit/antd-blocks` 库的各种用例和配置。提供了 ResourceTable 组件的完整功能展示，包含真实的、可交互的示例供你探索和学习。

## ✨ 包含内容

### 1. **基础示例**
最简单的实现，展示：
- 默认表格配置
- 自动数据加载
- 内置分页
- 默认操作按钮（编辑、删除、详情）

### 2. **带表单示例**
完整的 CRUD 功能：
- 弹窗中的创建/编辑表单
- 表单验证规则
- 自定义表单字段
- 带创建按钮的头部
- 完整的 CRUD 操作

### 3. **自定义操作示例**
操作列的自定义：
- 自定义按钮文本（i18n 支持）
- 自定义列宽度
- 固定列位置
- 本地化操作标签

### 4. **无操作列示例**
只读表格展示：
- 隐藏操作列
- 自定义单元格渲染
- 紧凑型表格尺寸
- 邮箱链接和彩色标签

### 5. **自定义分页示例**
增强的分页功能：
- 自定义页面大小选项
- 页面大小选择器
- 快速跳转
- 自定义格式的总数显示

## 🚀 快速开始

### 环境要求

- Node.js >= 18.0.0
- pnpm >= 8.0.0（推荐）或 npm/yarn

### 安装

```bash
# 进入 antd-blocks 包目录
cd packages/antd-blocks

# 安装依赖
pnpm install

# 或使用 npm
npm install

# 或使用 yarn
yarn install
```

### 开发

```bash
# 启动示例开发服务器
pnpm dev:example

# 或
npm run dev:example
```

应用会自动在浏览器中打开 `http://localhost:3000`

### 构建

```bash
# 构建生产版本
pnpm build:example

# 或
npm run build:example
```

### 预览生产版本

```bash
# 预览生产构建
pnpm preview:example

# 或
npm run preview:example
```

## 📁 项目结构

```
packages/antd-blocks/
├── example/                # 示例目录
│   ├── src/
│   │   ├── examples/       # 示例组件
│   │   │   ├── BasicExample.tsx
│   │   │   ├── WithFormExample.tsx
│   │   │   ├── CustomActionExample.tsx
│   │   │   ├── NoActionExample.tsx
│   │   │   └── CustomPaginationExample.tsx
│   │   ├── services/       # Mock 服务
│   │   │   ├── types.ts
│   │   │   └── UserService.ts
│   │   ├── App.tsx         # 带路由的主应用
│   │   ├── main.tsx        # 入口文件
│   │   └── index.css       # 全局样式
│   └── index.html          # HTML 模板
├── src/                    # antd-blocks 源代码
├── vite.example.config.ts  # 示例的 Vite 配置
├── package.json            # 包配置
└── README.md               # 包文档
```

## 🎯 学习路径

如果你是 `@brain-toolkit/antd-blocks` 的新手，建议按以下顺序浏览示例：

1. **从基础示例开始** - 理解核心概念和最小化配置
2. **进入带表单示例** - 学习完整的 CRUD 操作和表单使用
3. **探索自定义操作示例** - 了解如何自定义操作列
4. **查看无操作列示例** - 理解只读场景
5. **最后看自定义分页示例** - 学习高级分页自定义

## 💡 关键概念

### 使用 `useMemo` 包裹实例

**重要**：始终使用 `useMemo` 包裹服务和事件实例，以防止不必要的重新渲染：

```typescript
// ✅ 正确
const userService = useMemo(() => new UserService(), []);
const tableEvent = useMemo(
  () => new ResourceEvent('users', userService, undefined, form),
  [userService, form]
);

// ❌ 错误 - 每次渲染都会创建新实例
const userService = new UserService();
const tableEvent = new ResourceEvent('users', userService);
```

### 生命周期管理

别忘了管理表格事件的生命周期：

```typescript
useEffect(() => {
  tableEvent.created();
  return () => tableEvent.destroyed();
}, [tableEvent]);
```

### ResourceService 接口

所有服务必须实现 `ResourceServiceInterface`：

- `create(data)` - 创建新资源
- `update(data)` - 更新现有资源
- `remove(data)` - 删除资源
- `search(query)` - 搜索/列出带分页的资源
- `getStore()` - 获取资源存储
- 生命周期钩子：`created()`、`updated()`、`destroyed()`

## 🔧 自定义示例

### 自定义列渲染

```typescript
{
  title: '角色',
  dataIndex: 'role',
  render: (role: string) => (
    <Tag color={role === 'admin' ? 'red' : 'blue'}>
      {role.toUpperCase()}
    </Tag>
  )
}
```

### 自定义操作属性

```typescript
<ResourceTable
  actionProps={{
    width: 200,
    fixed: 'right',
    editText: '编辑',
    deleteText: '移除',
    detailText: '查看'
  }}
/>
```

### 自定义分页

```typescript
<ResourceTable
  pagination={{
    showSizeChanger: true,
    showQuickJumper: true,
    showTotal: (total) => `共 ${total} 条`
  }}
/>
```

## 📚 相关文档

- [主包 README](../README.md)
- [Ant Design 文档](https://ant.design/)
- [React 文档](https://react.dev/)
- [Vite 文档](https://cn.vitejs.dev/)

## 🤝 贡献

发现了 bug 或有建议？请在 [GitHub](https://github.com/qlover/brain-toolkit/issues) 上提 issue。

## 📄 许可证

[ISC](../../../LICENSE) © qlover

