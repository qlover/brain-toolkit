# 快速开始指南

## 5分钟快速体验 antd-blocks

### 步骤 1：安装依赖

```bash
cd packages/antd-blocks
pnpm install
```

### 步骤 2：启动示例

```bash
pnpm dev:example
```

### 步骤 3：浏览器自动打开

访问 http://localhost:3000，你将看到：

- **首页** - 项目介绍和特性说明
- **基础示例** - 最简单的用法
- **带表单示例** - 完整的增删改查
- **自定义操作示例** - 自定义操作按钮
- **无操作列示例** - 只读表格
- **自定义分页示例** - 高级分页配置

## 推荐学习顺序

1. 📋 **基础示例** - 5分钟了解核心功能
2. 📝 **带表单示例** - 10分钟掌握 CRUD 操作
3. 🎨 **自定义操作示例** - 5分钟学会自定义
4. 👁️ **无操作列示例** - 3分钟理解只读场景
5. ⚙️ **自定义分页示例** - 3分钟掌握分页配置

**总计：约 26 分钟完整掌握 antd-blocks！**

## 常见操作

### 创建用户
1. 点击页面上的"创建"按钮
2. 填写表单
3. 点击"确定"

### 编辑用户
1. 点击表格行的"编辑"按钮
2. 修改表单内容
3. 点击"确定"

### 删除用户
1. 点击表格行的"删除"按钮
2. 确认删除

### 查看详情
1. 点击表格行的"详情"按钮
2. 查看只读表单

## 核心代码示例

最简单的使用方式：

```typescript
import { useMemo, useEffect } from 'react';
import { Form } from 'antd';
import { ResourceTable, ResourceEvent } from '@brain-toolkit/antd-blocks/resourceTable';
import { UserService } from './services/UserService';

function UserList() {
  const [form] = Form.useForm();
  
  // 创建服务和事件实例
  const userService = useMemo(() => new UserService(), []);
  const tableEvent = useMemo(
    () => new ResourceEvent('users', userService, undefined, form),
    [userService, form]
  );

  // 生命周期管理
  useEffect(() => {
    tableEvent.created();
    return () => tableEvent.destroyed();
  }, [tableEvent]);

  // 定义列
  const columns = [
    { title: '姓名', dataIndex: 'name' },
    { title: '邮箱', dataIndex: 'email' },
    { title: '角色', dataIndex: 'role' }
  ];

  return <ResourceTable columns={columns} tableEvent={tableEvent} />;
}
```

就这么简单！🎉

## 下一步

查看 [README.md](./README.md) 获取完整文档。

