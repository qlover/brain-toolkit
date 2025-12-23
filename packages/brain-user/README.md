# @brain-toolkit/brain-user

Brain User Service - 完整的用户认证和管理库，适用于 Brain 平台

[English Documentation](./README.en.md)

## 🌐 在线演示

[查看在线示例](https://brain-toolkit-brain-user.vercel.app/) - 基于 Vite + React 的完整示例项目

## 目录

- [安装](#安装)
- [快速开始](#快速开始)
- [功能特性](#功能特性)
- [配置选项](#配置选项)
- [API 参考](#api-参考)
- [使用示例](#使用示例)
- [常见用例](#常见用例)
- [高级主题](#高级主题)

## 安装

```bash
pnpm add @brain-toolkit/brain-user
```

## 快速开始

```ts
import { BrainUserService } from '@brain-toolkit/brain-user';

const service = new BrainUserService({
  env: 'production'
});

// 使用 Google 登录
const credentials = await service.loginWithGoogle({
  authorization_code: 'google-oauth-code'
});

// 获取用户信息
const user = await service.getUserInfo();
console.log(user.email, user.name);
```

## 功能特性

- 🔐 **身份认证**: Google OAuth、邮箱密码登录、用户注册
- 👤 **用户管理**: 获取用户信息、刷新用户数据、管理用户资料
- 🏷️ **功能标签**: 类型安全的功能权限检查
- 💾 **状态管理**: 内置 store，支持多种存储机制（localStorage/sessionStorage/Cookie），需手动配置持久化
- 🔌 **插件系统**: 可扩展的插件架构，支持自定义钩子
- 🌐 **多环境支持**: 支持开发、预发布和生产环境
- 📦 **TypeScript**: 完整的 TypeScript 支持，类型安全的 API

## 配置选项

### 基础配置

```ts
const service = new BrainUserService({
  env: 'production' // 'development' | 'production' | string
});
```

### 配置选项说明

#### 核心服务选项

| 属性          | 类型                                        | 必填 | 默认值               | 说明                       |
| ------------- | ------------------------------------------- | ---- | -------------------- | -------------------------- |
| `serviceName` | `string`                                    | 否   | `'brainUserService'` | 服务标识符，用于日志和调试 |
| `executor`    | `ExecutorInterface`                         | 否   | -                    | 自定义异步操作执行器       |
| `logger`      | `LoggerInterface`                           | 否   | -                    | 自定义日志记录器           |
| `gateway`     | `BrainUserGateway`                          | 否   | 自动创建             | API 通信的网关实例         |
| `store`       | `BrainUserStore \| CreateBrainStoreOptions` | 否   | 自动创建             | 用户数据和凭证的状态存储   |

#### API 配置选项

| 属性           | 类型                                      | 必填 | 默认值                         | 说明                                          |
| -------------- | ----------------------------------------- | ---- | ------------------------------ | --------------------------------------------- |
| `env`          | `'development' \| 'production' \| string` | 否   | `'development'`                | 环境标识，用于确定 API 域名                   |
| `domains`      | `Record<string, string>`                  | 否   | 见下方                         | 自定义环境域名映射                            |
| `baseURL`      | `string`                                  | 否   | 从 env 自动获取                | 直接覆盖 API 基础 URL                         |
| `endpoints`    | `Record<string, EndpointsType>`           | 否   | `GATEWAY_BRAIN_USER_ENDPOINTS` | 自定义 API 端点配置（格式：`'METHOD /path'`） |
| `headers`      | `Record<string, string>`                  | 否   | -                              | 所有请求的默认请求头                          |
| `responseType` | `'json' \| 'text' \| 'blob'`              | 否   | `'json'`                       | 期望的响应类型                                |

#### 认证配置选项

| 属性            | 类型      | 必填 | 默认值            | 说明                                 |
| --------------- | --------- | ---- | ----------------- | ------------------------------------ |
| `authKey`       | `string`  | 否   | `'Authorization'` | 认证令牌的请求头键名                 |
| `tokenPrefix`   | `string`  | 否   | `'token'`         | 令牌值的前缀（如 'Bearer', 'token'） |
| `requiredToken` | `boolean` | 否   | `true`            | 请求是否需要令牌                     |
| `storageKey`    | `string`  | 否   | `'brain_profile'` | 存储用户资料的键名                   |

#### 存储配置选项

| 属性                         | 类型                                                         | 必填 | 默认值           | 说明                     |
| ---------------------------- | ------------------------------------------------------------ | ---- | ---------------- | ------------------------ |
| `store.storage`              | `'localStorage' \| 'sessionStorage' \| SyncStorageInterface` | 否   | `'localStorage'` | 用户数据的存储机制       |
| `store.persistUserInfo`      | `boolean`                                                    | 否   | `false`          | 是否持久化用户信息到存储 |
| `store.credentialStorageKey` | `string`                                                     | 否   | `'brain_token'`  | 存储凭证的键名           |
| `store.featureTags`          | `DynamicFeatureTags`                                         | 否   | 自动创建         | 功能标签处理器实例       |
| `store.userProfile`          | `UserProfile`                                                | 否   | 自动创建         | 用户资料处理器实例       |

#### 自定义适配器选项

| 属性             | 类型                      | 必填 | 默认值                | 说明                       |
| ---------------- | ------------------------- | ---- | --------------------- | -------------------------- |
| `requestAdapter` | `RequestAdapterInterface` | 否   | `RequestAdapterFetch` | 自定义 HTTP 通信请求适配器 |

### 默认域名配置

```ts
{
  development: 'https://brus-dev.api.brain.ai/v1.0/invoke/brain-user-system/method',
  production: 'https://brus.api.brain.ai/v1.0/invoke/brain-user-system/method'
}
```

## API 参考

### BrainUserService

用户认证和管理的主服务类。

#### 方法

##### `loginWithGoogle(params: BrainUserGoogleRequest): Promise<BrainGoogleCredentials>`

使用 Google OAuth 授权码登录。

**注意：** 此方法不会自动获取用户信息。登录成功后需要手动调用 `refreshUserInfo()` 来获取用户详情。

```ts
const credentials = await service.loginWithGoogle({
  authorization_code: 'google-oauth-code'
});

// 然后刷新用户信息
const userInfo = await service.refreshUserInfo(credentials);
service.getStore().success(userInfo, credentials);
```

**参数：**

- `params.authorization_code` (可选): Google OAuth 授权码
- `params.id_token` (可选): Google ID 令牌
- `params.metadata` (可选): 额外的元数据（例如，brain web 的 `mode`）

**返回：** Promise，解析为包含 token 和可选 required_fields 的 Google 凭证

##### `login(params: BrainLoginRequest): Promise<BrainCredentials | null>`

使用邮箱和密码登录。

```ts
const credentials = await service.login({
  email: 'user@example.com',
  password: 'password123'
});
```

**参数：**

- `params.email`: 用户邮箱地址
- `params.password`: 用户密码
- `params.metadata` (可选): 额外的元数据

**返回：** Promise，解析为凭证或 null

##### `register(params: BrainUserRegisterRequest): Promise<BrainUser>`

注册新用户账户。

```ts
const user = await service.register({
  email: 'user@example.com',
  password: 'securePassword123',
  first_name: 'John',
  last_name: 'Doe'
});
```

**参数：**

- `params.email`: 用户邮箱地址
- `params.password`: 用户密码
- `params.first_name`: 用户名字
- `params.last_name`: 用户姓氏
- `params.otp` (可选): 验证码
- `params.metadata` (可选): 额外的元数据
- `params.roles` (可选): 用户角色数组

**返回：** Promise，解析为包含凭证的用户数据

##### `getUserInfo(params?: BrainGetUserInfoRequest): Promise<BrainUser | null>`

获取当前用户信息。

```ts
const user = await service.getUserInfo();
// 或使用显式令牌
const user = await service.getUserInfo({ token: 'auth-token' });
```

**参数：**

- `params.token` (可选): 认证令牌（如果未提供，则使用存储的令牌）

**返回：** Promise，解析为用户数据或 null

##### `refreshUserInfo(params?: BrainGetUserInfoRequest): Promise<BrainUser | null>`

从服务器刷新用户信息。

```ts
const updatedUser = await service.refreshUserInfo();
```

**参数：**

- `params.token` (可选): 认证令牌（如果未提供，则使用存储的令牌）

**返回：** Promise，解析为更新的用户数据或 null

##### `logout(params?: unknown): Promise<void>`

登出当前用户。

```ts
await service.logout();
```

**返回：** Promise，解析为 void

##### `getStore(): BrainUserStore<Tags>`

获取用户 store 实例以访问状态。

```ts
const store = service.getStore();
const user = store.getUserMe();
const token = store.getCredential()?.token;
```

**返回：** BrainUserStore 实例

##### `getCredential(): BrainCredentials | null`

获取当前用户凭证。

```ts
const credential = service.getCredential();
if (credential?.token) {
  // 用户已认证
}
```

**返回：** 凭证对象或 null

### BrainUserStore

用户数据和凭证的状态存储。

#### 方法

##### `getUserMe(): BrainUser | null`

从 store 获取当前用户数据。

##### `getCredential(): BrainCredentials | null`

从 store 获取当前凭证。

##### `featureTags: DynamicFeatureTags`

用于权限检查的功能标签处理器。

```ts
// 检查用户是否有 Gen UI 权限
const hasGenUI = service.getStore().featureTags.hasGenUI();

// 使用访客标志检查
const hasGenUI = service.getStore().featureTags.hasGenUI(true);
```

##### `userProfile: UserProfile`

用于访问资料数据的用户资料处理器。

```ts
// 获取电话号码
const phone = service.getStore().userProfile.getPhoneNumber();

// 获取邮箱
const email = service.getStore().userProfile.getDaEmail();

// 检查邮箱验证状态
const isVerified = service.getStore().userProfile.isEmailVerified();

// 检查权限
const hasPermission = service
  .getStore()
  .userProfile.hasPermission('restricted_resources');
```

## 使用示例

### 基础用法（最小配置）

```ts
const service = new BrainUserService({
  env: 'production'
});

// 使用 Google 登录
const credentials = await service.loginWithGoogle({
  authorization_code: 'google-oauth-code'
});

// 获取用户信息
const user = await service.getUserInfo();
console.log(user.email, user.name);

// 检查功能权限
const hasGenUI = service.getStore().featureTags.hasGenUI();

// 访问用户资料
const phoneNumber = service.getStore().userProfile.getPhoneNumber();
```

### 使用自定义存储（Session Storage）

```ts
const service = new BrainUserService({
  env: 'production',
  store: {
    storage: 'sessionStorage', // 标签页关闭时清除数据
    persistUserInfo: true,
    credentialStorageKey: 'my_custom_token_key'
  }
});
```

### 使用 Cookie 存储（跨域支持）

```ts
import { CookieStorage } from '@qlover/corekit-bridge';

const service = new BrainUserService({
  env: 'production',
  store: {
    storage: new CookieStorage({
      expires: 30, // 30 天
      path: '/',
      domain: '.example.com', // 跨子域名工作
      secure: true, // 仅 HTTPS
      sameSite: 'Lax' // CSRF 保护
    }),
    persistUserInfo: true
  }
});
```

### 使用自定义请求适配器

```ts
import { RequestAdapterFetch } from '@qlover/fe-corekit';

// 创建带拦截器的自定义适配器
const customAdapter = new RequestAdapterFetch({
  baseURL: 'https://custom-api.example.com',
  timeout: 10000,
  headers: {
    'X-App-Version': '1.0.0',
    'X-Custom-Header': 'value'
  }
});

const service = new BrainUserService({
  requestAdapter: customAdapter
});
```

### 使用自定义日志记录器和执行器

```ts
import { CustomLogger, CustomExecutor } from './custom';

const service = new BrainUserService({
  env: 'production',
  serviceName: 'myUserService',
  logger: new CustomLogger(), // 自定义日志
  executor: new CustomExecutor(), // 自定义异步执行
  store: {
    storage: 'localStorage',
    persistUserInfo: true
  }
});
```

### 使用自定义域名（多环境）

```ts
const service = new BrainUserService({
  env: 'staging',
  domains: {
    development: 'https://dev-api.example.com',
    staging: 'https://staging-api.example.com',
    production: 'https://api.example.com'
  }
});
```

### 使用自定义端点

```ts
// 覆盖特定端点
const service = new BrainUserService({
  env: 'production',
  endpoints: {
    login: 'POST /api/v2/auth/token.json',
    getUserInfo: 'GET /api/v2/users/profile.json'
  }
});
```

### 与 React 集成

```ts
import { useState, useEffect } from 'react';
import { useSliceStore } from '@qlover/slice-store-react';
import { BrainUserService } from '@brain-toolkit/brain-user';
import { GatewayExecutor } from '@qlover/corekit-bridge/gateway-auth';

function App() {
  const [userService] = useState(() => {
    return new BrainUserService({
      env: 'production',
      executor: new GatewayExecutor()
    });
  });

  const userStore = userService.getStore();
  const user = useSliceStore(userStore, (state) => state.result);
  const loading = useSliceStore(userStore, (state) => state.loading);
  const error = useSliceStore(userStore, (state) => state.error);

  useEffect(() => {
    if (userService.getCredential()) {
      userService.refreshUserInfo();
    }
  }, [userService]);

  return (
    <div>
      {user ? (
        <div>欢迎，{user.name}！</div>
      ) : (
        <div>请登录</div>
      )}
    </div>
  );
}
```

### 使用插件系统

```ts
import type { BrainUserPluginInterface } from '@brain-toolkit/brain-user';

const userServicePlugin: BrainUserPluginInterface = {
  pluginName: 'myUserServicePlugin',

  onRefreshUserInfoBefore(context) {
    context.parameters.store.updateState({
      loading: true
    });
  },

  onRefreshUserInfoSuccess(context) {
    context.parameters.store.updateState({
      loading: false
    });
  }
};

const service = new BrainUserService({
  env: 'production'
}).use(userServicePlugin);
```

## 常见用例

### 用户认证流程

```ts
// 1. 初始化服务
const service = new BrainUserService({ env: 'production' });

// 2. 使用 Google 登录
const credentials = await service.loginWithGoogle({
  authorization_code: googleAuthCode
});

// 3. 获取用户信息
const userInfo = await service.refreshUserInfo(credentials);
service.getStore().success(userInfo, credentials);

// 4. 检查权限
if (service.getStore().featureTags.hasGenUI()) {
  // 用户有 Gen UI 权限
}

// 5. 登出
await service.logout();
```

### 用户注册流程

```ts
const service = new BrainUserService({ env: 'production' });

// 注册新用户
const user = await service.register({
  email: 'user@example.com',
  password: 'securePassword123',
  first_name: 'John',
  last_name: 'Doe'
});

// 注册后用户自动登录
console.log('已注册用户:', user.email);
```

### 刷新用户信息

```ts
const service = new BrainUserService({ env: 'production' });

// 从服务器刷新用户信息
const updatedUser = await service.refreshUserInfo();

// 访问更新的资料
const email = service.getStore().userProfile.getDaEmail();
const isVerified = service.getStore().userProfile.isEmailVerified();
```

### 访问存储的用户数据

```ts
const service = new BrainUserService({
  env: 'production',
  store: { persistUserInfo: true }
});

// 从 store 获取用户（如果已持久化，页面重新加载后仍可用）
const user = service.getStore().getUserMe();

if (user) {
  console.log('用户已登录:', user.email);
} else {
  console.log('用户未登录');
}
```

### 功能权限检查

```ts
const service = new BrainUserService({ env: 'production' });
const store = service.getStore();

// 检查功能权限
if (store.featureTags.hasGenUI()) {
  // 显示 Gen UI 功能
}

if (store.featureTags.hasNoMeetingTab()) {
  // 显示会议标签页
}

// 使用访客标志检查
const isGuest = service.getStore().getUserMe()?.is_guest ?? false;
if (store.featureTags.hasGenUI(isGuest)) {
  // 为访客用户显示 Gen UI
}
```

### 用户资料访问

```ts
const service = new BrainUserService({ env: 'production' });
const profile = service.getStore().userProfile;

// 获取资料数据
const phoneNumber = profile.getPhoneNumber();
const email = profile.getDaEmail();
const profileImage = profile.getProfileImgUrl();

// 检查验证状态
const isEmailVerified = profile.isEmailVerified();

// 检查权限
const hasPermission = profile.hasPermission('restricted_resources');
const permissionValue = profile.getPermissionValue('restricted_resources');
```

## 高级主题

### 类型安全的功能标签

您可以定义自定义功能标签并保持类型安全：

```ts
type CustomTags = readonly [
  'disable_custom_feature',
  'disable_another_feature'
];

const service = new BrainUserService<CustomTags>({
  env: 'production'
});

// 类型安全的功能检查
const hasCustomFeature = service.getStore().featureTags.hasCustomFeature();
const hasAnotherFeature = service.getStore().featureTags.hasAnotherFeature();
```

### 完整配置示例

```ts
import { CookieStorage } from '@qlover/corekit-bridge';
import { RequestAdapterFetch } from '@qlover/fe-corekit';

const service = new BrainUserService({
  // 服务配置
  serviceName: 'brainUserService',

  // API 配置
  env: 'production',
  headers: {
    'X-App-Version': '1.0.0'
  },

  // 认证配置
  authKey: 'Authorization',
  tokenPrefix: 'Bearer',
  requiredToken: true,
  storageKey: 'user_profile',

  // 存储配置
  store: {
    storage: new CookieStorage({
      expires: 7,
      path: '/',
      domain: '.myapp.com',
      secure: true
    }),
    persistUserInfo: true,
    credentialStorageKey: 'auth_token'
  },

  // 自定义适配器
  requestAdapter: new RequestAdapterFetch({
    timeout: 15000
  })
});
```

## 许可证

ISC
