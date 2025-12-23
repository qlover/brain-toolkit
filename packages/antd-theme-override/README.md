# @brain-toolkit/antd-theme-override

一个用于管理和覆盖 Ant Design 主题与全局 API 的工具包。

## 特性

- 🎨 简单高效的主题覆盖机制
- 🛡️ 全局 API 使用规范控制
- 🔧 支持 Vite 构建集成
- 📦 开箱即用的 TypeScript 支持
- 🎯 基于 CSS 变量的主题定制

## 安装

```bash
npm install @brain-toolkit/antd-theme-override
# 或者
yarn add @brain-toolkit/antd-theme-override
# 或者
pnpm add @brain-toolkit/antd-theme-override
```

## 使用方法

### 1. 主题覆盖

#### React 组件方式

```tsx
import { AntdThemeProvider } from '@brain-toolkit/antd-theme-override';

function App() {
  return (
    <AntdThemeProvider
      theme={{
        token: {
          colorPrimary: '#00b96b'
        }
      }}
    >
      <YourApp />
    </AntdThemeProvider>
  );
}
```

### 2. 全局 API 管理

#### Vite 配置

```typescript
// vite.config.ts
import antdDeprecated from '@brain-toolkit/antd-theme-override/vite';

export default {
  plugins: [
    antdDeprecated({
      // 模式选择
      mode: 'noGlobals', // 或 'overrideStatic'

      // 类型文件生成路径（可选）
      targetPath: './src/types/deprecated-antd.d.ts',

      // CSS 注入文件路径（可选）
      inLoadCssFile: './src/main.tsx',

      // 覆盖样式文件路径（可选，仅在 overrideStatic 模式下生效）
      overriedCssFilePath: './src/styles/antd-override.css'
    })
  ]
};
```

## 配置选项

### AntdThemeProvider 属性

| 属性名    | 类型                         | 默认值 | 描述                |
| --------- | ---------------------------- | ------ | ------------------- |
| theme     | ConfigProviderProps['theme'] | -      | Ant Design 主题配置 |
| staticApi | AntdStaticApiInterface       | -      | 静态 API 配置       |
| children  | ReactNode                    | -      | 子组件              |

### Vite 插件选项

| 选项名              | 类型                            | 默认值                             | 描述             |
| ------------------- | ------------------------------- | ---------------------------------- | ---------------- |
| mode                | 'noGlobals' \| 'overrideStatic' | 'noGlobals'                        | 插件工作模式     |
| targetPath          | string                          | './src/types/deprecated-antd.d.ts' | 类型文件生成路径 |
| inLoadCssFile       | string                          | './src/main.tsx'                   | CSS 注入文件路径 |
| overriedCssFilePath | string                          | './src/styles/antd-override.css'   | 覆盖样式文件路径 |

## 工作模式说明

### noGlobals 模式

在此模式下，插件会：

- 生成类型定义文件，禁止使用 Ant Design 的全局 API
- 包括：`message`、`Modal.confirm`、`notification` 等
- 强制开发者使用组件化的方式调用这些功能

### overrideStatic 模式

在此模式下，插件会：

- 允许使用全局 API，但通过自定义样式覆盖其默认行为
- 自动注入覆盖样式文件
- 提供统一的视觉风格管理

## 最佳实践

1. **静态 API 注入（推荐）**

```tsx
// antd-static-api.ts
import { message, Modal, notification } from 'antd';
import type { AntdStaticApiInterface } from '@brain-toolkit/antd-theme-override';

// 实现 AntdStaticApiInterface 接口
export class CustomAntdStaticApi implements AntdStaticApiInterface {
  message = message;
  Modal = Modal;
  notification = notification;
}

// App.tsx
import { AntdThemeProvider } from '@brain-toolkit/antd-theme-override';
import { CustomAntdStaticApi } from './antd-static-api';

function App() {
  return (
    <AntdThemeProvider
      theme={myTheme}
      staticApi={new CustomAntdStaticApi()} // 注入自定义的实现
    >
      <YourApp />
    </AntdThemeProvider>
  );
}
```

这种方式的优点：

- 简单直接：只需实现接口并传入
- 易于替换：可以方便地替换静态 API 的实现
- 便于测试：可以轻松模拟静态 API 的行为

2. **使用 CSS 变量（推荐）**

```tsx
// theme.ts
export const myTheme = {
  token: {
    // 使用 CSS 变量
    colorPrimary: 'var(--brand-color, #00b96b)',
    borderRadius: 'var(--border-radius, 6px)',
    colorBgContainer: 'var(--background-color, #ffffff)',
  },
};

// styles/variables.css
:root {
  --brand-color: #00b96b;
  --border-radius: 6px;
  --background-color: #ffffff;
}

// 暗色主题
[data-theme='dark'] {
  --brand-color: #52c41a;
  --background-color: #141414;
}

// App.tsx
import { myTheme } from './theme';
import './styles/variables.css';

function App() {
  return (
    <AntdThemeProvider theme={myTheme}>
      <YourApp />
    </AntdThemeProvider>
  );
}
```

3. **直接设置主题变量（不推荐）**

```tsx
// theme.ts
export const myTheme = {
  token: {
    colorPrimary: '#00b96b',
    borderRadius: 6
  }
};

// App.tsx
import { myTheme } from './theme';

function App() {
  return (
    <AntdThemeProvider theme={myTheme}>
      <YourApp />
    </AntdThemeProvider>
  );
}
```

4. **全局 API 替代方案**

```tsx
// 不推荐
message.success('操作成功');

// 推荐
import { Message } from 'antd';

function MyComponent() {
  return <Message type="success">操作成功</Message>;
}
```

## 高级用法

### 1. 自定义静态 API 实现

你可以通过实现 `AntdStaticApiInterface` 接口来自定义 Ant Design 的静态 API 行为：

```tsx
import type {
  AntdStaticApiInterface,
  MessageApi,
  ModalApi,
  NotificationApi
} from '@brain-toolkit/antd-theme-override';

// 灵活的实现方式
export class UiDialog implements AntdStaticApiInterface {
  private antds: {
    message?: MessageApi;
    modal?: ModalApi;
    notification?: NotificationApi;
  } = {};

  // 提供 setter 方法以动态设置各个 API 实现
  setMessage(message: MessageApi): void {
    this.antds.message = message;
  }

  setModal(modal: ModalApi): void {
    this.antds.modal = modal;
  }

  setNotification(notification: NotificationApi): void {
    this.antds.notification = notification;
  }

  // 实现接口方法
  success(content: string): void {
    this.antds.message?.success(content);
  }

  // ... 其他方法实现
}

// 使用示例
const uiDialog = new UiDialog();

// 可以在需要时设置具体的实现
uiDialog.setMessage(antd.message);
uiDialog.setModal(antd.Modal);
uiDialog.setNotification(antd.notification);

// 在 React 组件中使用
function App() {
  return (
    <AntdThemeProvider theme={myTheme} staticApi={uiDialog}>
      <YourApp />
    </AntdThemeProvider>
  );
}
```

这种实现方式的优点：

- 灵活性：可以动态设置各个 API 的实现
- 可选性：可以只实现需要的 API
- 可测试性：易于 mock 和测试
- 可扩展性：方便添加新的功能或修改现有行为
- 依赖注入友好：易于与各种 DI 容器集成

## 常见问题

1. **为什么要避免使用全局 API？**
   - 更好的可测试性
   - 更清晰的组件依赖关系
   - 更容易进行主题定制

2. **如何迁移现有的全局 API 使用？**
   - 使用组件化的替代方案
   - 利用 IDE 的类型检查提示进行重构
   - 渐进式迁移，可以先使用 overrideStatic 模式

## 贡献指南

欢迎提交 Issue 和 Pull Request。在提交 PR 之前，请确保：

1. 添加/更新测试用例
2. 更新相关文档
3. 遵循现有的代码风格

## 许可证

ISC
