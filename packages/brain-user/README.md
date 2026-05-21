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
- [数据模型参考](#数据模型参考)
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

// 可选：换取 userly access_token
await service.fetchAndStoreAccessToken({ lang: 'en', deviceUid: 'device-id' });
```

## 功能特性

- 🔐 **身份认证**: Google OAuth、邮箱密码登录、用户注册
- 🎫 **Userly JWT**: 将 brain-user `token` 换取 userly `access_token`（HS256，用于 matrix-runtime / benchmark）
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

| 属性                    | 类型                                      | 必填 | 默认值                                   | 说明                                                           |
| ----------------------- | ----------------------------------------- | ---- | ---------------------------------------- | -------------------------------------------------------------- |
| `env`                   | `'development' \| 'production' \| string` | 否   | `'development'`                          | 环境标识，用于确定 API 域名                                    |
| `domains`               | `Record<string, string>`                  | 否   | 见下方                                   | brain-user API 的环境域名（不含 invoke 路径）                  |
| `userlyDomains`         | `Record<string, string>`                  | 否   | 同 `domains`                             | userly `access_token` 接口的域名覆盖；未设置时回退到 `domains` |
| `baseURL`               | `string`                                  | 否   | 从 env 自动获取                          | 直接覆盖 API 基础 URL                                          |
| `endpoints`             | `Record<string, EndpointsType>`           | 否   | 见下方「默认端点」                       | 自定义 API 端点（格式：`'METHOD /path'`）                      |
| `headers`               | `Record<string, string>`                  | 否   | `{ 'Content-Type': 'application/json' }` | 所有请求的默认请求头                                           |
| `responseType`          | `'json' \| 'text' \| 'blob'`              | 否   | `'json'`                                 | 期望的响应类型                                                 |
| `requestDataSerializer` | `RequestDataSerializer`                   | 否   | 内置 snake_case 序列化                   | 请求体字段命名转换（如 camelCase → snake_case）                |
| `requestAdapter`        | `RequestAdapterInterface`                 | 否   | `RequestAdapterFetch`                    | 自定义 HTTP 适配器（见下方独立表）                             |

#### 认证配置选项

| 属性            | 类型      | 必填 | 默认值            | 说明                                 |
| --------------- | --------- | ---- | ----------------- | ------------------------------------ |
| `authKey`       | `string`  | 否   | `'Authorization'` | 认证令牌的请求头键名                 |
| `tokenPrefix`   | `string`  | 否   | `'token'`         | 令牌值的前缀（如 'Bearer', 'token'） |
| `requiredToken` | `boolean` | 否   | `true`            | 请求是否需要令牌                     |
| `storageKey`    | `string`  | 否   | `'brain_profile'` | 存储用户资料的键名                   |

#### 存储配置选项

| 属性                         | 类型                                                         | 必填 | 默认值            | 说明                                         |
| ---------------------------- | ------------------------------------------------------------ | ---- | ----------------- | -------------------------------------------- |
| `store.storage`              | `'localStorage' \| 'sessionStorage' \| SyncStorageInterface` | 否   | `'localStorage'`  | 用户数据的存储机制                           |
| `store.persistUserInfo`      | `boolean`                                                    | 否   | `false`           | 是否持久化用户信息到存储                     |
| `store.storageKey`           | `string`                                                     | 否   | `'brain_profile'` | 持久化用户资料时的存储键名                   |
| `store.credentialStorageKey` | `string`                                                     | 否   | `'brain_token'`   | 存储凭证（含 `token`、`access_token`）的键名 |
| `store.featureTags`          | `DynamicFeatureTags`                                         | 否   | 自动创建          | 功能标签处理器实例                           |
| `store.userProfile`          | `UserProfile`                                                | 否   | 自动创建          | 用户资料处理器实例                           |

### 默认域名配置

域名仅包含 host，invoke 路径由 `endpoints` 拼接：

```ts
import { BRAIN_DOMAINS } from '@brain-toolkit/brain-user';

// BRAIN_DOMAINS 默认值：
{
  development: 'https://api.dev.brain.ai',
  production: 'https://api.brain.ai'
}
```

### 默认端点（`endpoints`）

```ts
import {
  GATEWAY_BRAIN_USER_ENDPOINTS,
  GATEWAY_BRAIN_USERLY_ENDPOINTS
} from '@brain-toolkit/brain-user';

// brain-user-system
GATEWAY_BRAIN_USER_ENDPOINTS.login; // POST .../api/auth/token.json
GATEWAY_BRAIN_USER_ENDPOINTS.register;
GATEWAY_BRAIN_USER_ENDPOINTS.getUserInfo;
GATEWAY_BRAIN_USER_ENDPOINTS.loginWithGoogle;
GATEWAY_BRAIN_USER_ENDPOINTS.logout;

// userly（access_token）
GATEWAY_BRAIN_USERLY_ENDPOINTS.accessToken; // POST .../auth/access_token
```

## 数据模型参考

类型均从 `@brain-toolkit/brain-user` 导出，与源码一致。IDE 中可直接跳转定义。

```ts
import type {
  BrainCredentials,
  BrainAccessToken,
  BrainAccessTokenRequest,
  BrainUser,
  BrainUserProfileInterface,
  BrainUserPermissions,
  BrainUserGoogleRequest,
  BrainLoginRequest,
  BrainUserRegisterRequest
} from '@brain-toolkit/brain-user';
```

### 凭证与用户

`BrainCredentials`：登录或 `fetchAndStoreAccessToken` 后写入 store。`token` 为 brain-user 令牌（`Authorization: token <token>`）；`access_token` 为 userly HS256 JWT。

```ts
interface BrainCredentials {
  /** brain-user 认证令牌 */
  token?: string;
  /** userly JWT（matrix-runtime / benchmark） */
  access_token?: string;
  expires_in?: number;
  refresh_token?: string;
  /** Google 登录：是否已有账号 */
  existing?: boolean;
  required_fields?: {
    first_name?: string;
    last_name?: string;
  };
}
```

`getAccessToken` / `fetchAndStoreAccessToken`：

```ts
interface BrainAccessTokenRequest {
  /** 默认取 store 中的 token */
  token?: string;
  /** 默认 `'en'` → `X-Brain-User-Lang` */
  lang?: string;
  /** → `X-Brain-User-Location`，如 `'35.1814,136.9064'` */
  location?: string;
  /** → `X-APP-VERSION` */
  appVersion?: string;
  /** → `X-Brain-Device-Uid` */
  deviceUid?: string;
}

interface BrainAccessToken {
  access_token: string;
  expires_in: number;
  refresh_token: string;
}
```

```ts
interface BrainUser {
  id: number;
  email: string;
  name: string;
  first_name?: string;
  middle_name?: string;
  last_name?: string;
  profile?: BrainUserProfileInterface;
  auth_token: { key: string };
  is_guest?: boolean;
  is_superuser?: boolean;
  is_active?: boolean;
  roles?: string[];
  created_at?: string;
  referral_enabled?: boolean;
  referred_by?: unknown;
  is_live?: unknown;
  promocode?: string;
  tags?: string[];
  /** 含 `disable_*` 时禁用对应功能 */
  feature_tags?: readonly string[];
  is_supernatural?: boolean;
  is_decentralized?: boolean;
  account?: unknown;
}

interface BrainUserProfileInterface {
  phone_number?: string;
  da_email?: string;
  da_email_password?: string;
  certificate?: string;
  permissions?: BrainUserPermissions[];
  profile_img_url?: string;
  amplitude_device_id?: unknown;
  email_verified?: boolean;
}

interface BrainUserPermissions {
  key?: string;
  value?: string[];
}
```

### API 请求体

```ts
interface BrainUserGoogleRequest {
  authorization_code?: string;
  id_token?: string;
  /** brain web 常用 metadata.mode: 'creator' | 'sharer' | 'editor' */
  metadata?: Record<string, unknown>;
}

interface BrainLoginRequest {
  email: string;
  password: string;
  metadata?: Record<string, unknown>;
}

interface BrainUserRegisterRequest {
  email: string;
  password: string;
  first_name: string;
  last_name: string;
  otp?: string;
  metadata?: Record<string, unknown>;
  roles?: string[];
}

/** getUserInfo / refreshUserInfo 可传 { token }，省略则用 store */
type GetUserInfoParams = Pick<BrainCredentials, 'token'>;
```

## API 参考

### BrainUserService

用户认证和管理的主服务类。

#### 方法

##### `loginWithGoogle(params: BrainUserGoogleRequest): Promise<BrainCredentials>`

使用 Google OAuth 登录。不会自动拉取用户信息，需再调用 `refreshUserInfo`。

```ts
const credentials: BrainCredentials = await service.loginWithGoogle({
  authorization_code: 'google-oauth-code'
});
const userInfo: BrainUser = await service.refreshUserInfo(credentials);
service.getStore().success(userInfo, credentials);
```

##### `login(params: BrainLoginRequest): Promise<BrainCredentials | null>`

```ts
const credentials = await service.login({
  email: 'user@example.com',
  password: 'password123'
});
```

##### `register(params: BrainUserRegisterRequest): Promise<BrainUser>`

```ts
const user: BrainUser = await service.register({
  email: 'user@example.com',
  password: 'securePassword123',
  first_name: 'John',
  last_name: 'Doe'
});
```

##### `getUserInfo(params?: GetUserInfoParams): Promise<BrainUser | null>`

```ts
const user = await service.getUserInfo();
const userWithToken = await service.getUserInfo({ token: 'auth-token' });
```

##### `refreshUserInfo(params?: GetUserInfoParams): Promise<BrainUser | null>`

```ts
const updatedUser: BrainUser | null = await service.refreshUserInfo();
```

##### `logout(params?: unknown): Promise<void>`

```ts
await service.logout();
```

##### `getStore(): BrainUserStore<Tags>`

```ts
const store = service.getStore();
const user = store.getUserMe();
const token = store.getCredential()?.token;
```

##### `getCredential(): BrainCredentials | null`

```ts
const credential: BrainCredentials | null = service.getCredential();
```

##### `getAccessToken(params?: BrainAccessTokenRequest): Promise<BrainAccessToken>`

换取 userly JWT，**不**写入 store。

```ts
const access: BrainAccessToken = await service.getAccessToken({
  lang: 'en',
  appVersion: '1.0.0',
  deviceUid: 'stable-device-id'
});
```

##### `fetchAndStoreAccessToken(params?: BrainAccessTokenRequest): Promise<BrainCredentials>`

换取并合并进 store（需已有 `token`）。

```ts
const merged: BrainCredentials = await service.fetchAndStoreAccessToken({
  lang: 'en',
  deviceUid: getDeviceUid()
});
```

##### `mergeAccessToken(access: BrainAccessToken): BrainCredentials`

```ts
const credential: BrainCredentials = service.mergeAccessToken({
  access_token: 'eyJ...',
  expires_in: 3600,
  refresh_token: 'rt_...'
});
```

### BrainUserStore

用户数据和凭证的状态存储。

#### 方法

##### `getUserMe(): BrainUser | null`

从 store 获取当前用户数据。

##### `getCredential(): BrainCredentials | null`

从 store 获取当前凭证。

##### `getToken(): string`

返回当前凭证中的 brain-user `token`，无则空字符串。

##### `getAccessToken(): string`

返回当前凭证中的 userly `access_token`，无则空字符串。

```ts
const jwt = service.getStore().getAccessToken();
```

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

### Userly `access_token`（登录后换取 JWT）

brain-user 登录只得到 `token`；调用 matrix-runtime / benchmark 等 userly 服务时需要 HS256 `access_token`。

```ts
import { BrainUserService } from '@brain-toolkit/brain-user';

const service = new BrainUserService({ env: 'production' });

// 1. 先完成 brain-user 登录（Google / 邮箱等）
await service.loginWithGoogle({ authorization_code: '...' });
const userInfo = await service.refreshUserInfo();
service.getStore().success(userInfo, service.getCredential()!);

// 2. 一键换取并写入 store（推荐）
await service.fetchAndStoreAccessToken({
  lang: 'en',
  appVersion: '1.0.0',
  deviceUid: 'your-stable-device-id'
});

// 3. 读取 JWT
const brainToken = service.getStore().getToken();
const userlyJwt = service.getStore().getAccessToken();
const expiresIn = service.getCredential()?.expires_in;
```

分步调用（需自行合并到 store）：

```ts
const access = await service.getAccessToken({
  token: service.getCredential()?.token
});
service.mergeAccessToken(access);
```

登录后自动换取（避免重复请求时可判断 `credential.access_token`）：

```ts
async function ensureUserlyAccessToken(service: BrainUserService) {
  const credential = service.getCredential();
  if (!credential?.token || credential.access_token) return;

  await service.fetchAndStoreAccessToken({
    lang: navigator.language?.split('-')[0] ?? 'en',
    appVersion: '1.0.0',
    deviceUid: getDeviceUid()
  });
}
```

自定义 userly 域名（与 brain-user 域名分离时）：

```ts
const service = new BrainUserService({
  env: 'staging',
  domains: { staging: 'https://api.staging.brain.ai' },
  userlyDomains: { staging: 'https://userly.staging.brain.ai' }
});
```

凭证会随 `store.credentialStorageKey`（默认 `brain_token`）持久化，`access_token` 与 `token` 保存在同一 JSON 对象中。

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

### 用户认证流程（含 access_token）

```ts
// 1. 初始化服务
const service = new BrainUserService({
  env: 'production',
  store: { persistUserInfo: true }
});

// 2. 使用 Google 登录
const credentials = await service.loginWithGoogle({
  authorization_code: googleAuthCode
});

// 3. 获取用户信息
const userInfo = await service.refreshUserInfo(credentials);
service.getStore().success(userInfo, credentials);

// 4. 换取 userly access_token（matrix-runtime 等）
await service.fetchAndStoreAccessToken({
  deviceUid: 'stable-device-id',
  lang: 'en'
});

// 5. 检查权限
if (service.getStore().featureTags.hasGenUI()) {
  // 用户有 Gen UI 权限
}

// 6. 调用下游 API 时使用 userly JWT
const jwt = service.getStore().getAccessToken();

// 7. 登出
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
  tokenPrefix: 'token',
  requiredToken: true,
  storageKey: 'user_profile',

  // userly JWT（可选独立域名）
  userlyDomains: {
    production: 'https://api.brain.ai'
  },

  // 存储配置（token + access_token 同一键）
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

// 登录后换取 access_token
await service.fetchAndStoreAccessToken({
  appVersion: '1.0.0',
  deviceUid: 'device-1'
});
```

## 许可证

ISC
