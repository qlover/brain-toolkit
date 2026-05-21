# @brain-toolkit/brain-user - English Documentation

Brain User Service - Complete user authentication and management library for the Brain platform

[中文文档](./README.md)

## 🌐 Online Demo

[View Online Example](https://brain-toolkit-brain-user.vercel.app/) - Complete example project built with Vite + React

## Table of Contents

- [Installation](#installation)
- [Quick Start](#quick-start)
- [Features](#features)
- [Configuration](#configuration)
- [Data Model Reference](#data-model-reference)
- [API Reference](#api-reference)
- [Usage Examples](#usage-examples)
- [Common Use Cases](#common-use-cases)
- [Advanced Topics](#advanced-topics)

## Installation

```bash
pnpm add @brain-toolkit/brain-user
```

## Quick Start

```ts
import { BrainUserService } from '@brain-toolkit/brain-user';

const service = new BrainUserService({
  env: 'production'
});

// Login with Google
const credentials = await service.loginWithGoogle({
  authorization_code: 'google-oauth-code'
});

// Get user info
const user = await service.getUserInfo();
console.log(user.email, user.name);

// Optional: exchange for userly access_token
await service.fetchAndStoreAccessToken({ lang: 'en', deviceUid: 'device-id' });
```

## Features

- 🔐 **Authentication**: Google OAuth, email/password login, user registration
- 🎫 **Userly JWT**: Exchange brain-user `token` for userly `access_token` (HS256, for matrix-runtime / benchmark)
- 👤 **User Management**: Get user info, refresh user data, manage user profile
- 🏷️ **Feature Tags**: Type-safe feature permission checking
- 💾 **State Management**: Built-in store supporting localStorage/sessionStorage/Cookie; persistence must be configured manually
- 🔌 **Plugin System**: Extensible plugin architecture for custom hooks
- 🌐 **Multi-Environment**: Development, staging, and production
- 📦 **TypeScript**: Full TypeScript support with type-safe APIs

## Configuration

### Basic Configuration

```ts
const service = new BrainUserService({
  env: 'production' // 'development' | 'production' | string
});
```

### Configuration Options

#### Core Service Options

| Property      | Type                                        | Required | Default              | Description                                  |
| ------------- | ------------------------------------------- | -------- | -------------------- | -------------------------------------------- |
| `serviceName` | `string`                                    | No       | `'brainUserService'` | Service identifier for logging and debugging |
| `executor`    | `ExecutorInterface`                         | No       | -                    | Custom executor for async operations         |
| `logger`      | `LoggerInterface`                           | No       | -                    | Custom logger for service operations         |
| `gateway`     | `BrainUserGateway`                          | No       | Auto-created         | Gateway instance for API communication       |
| `store`       | `BrainUserStore \| CreateBrainStoreOptions` | No       | Auto-created         | State store for user data and credentials    |

#### API Configuration Options

| Property                | Type                                      | Required | Default                                               | Description                                                                 |
| ----------------------- | ----------------------------------------- | -------- | ----------------------------------------------------- | --------------------------------------------------------------------------- |
| `env`                   | `'development' \| 'production' \| string` | No       | `'development'`                                       | Environment key for API domain resolution                                   |
| `domains`               | `Record<string, string>`                  | No       | See below                                             | brain-user API host per env (no invoke path)                                |
| `userlyDomains`         | `Record<string, string>`                  | No       | Same as `domains`                                     | Override host for userly `access_token`; falls back to `domains` if omitted |
| `baseURL`               | `string`                                  | No       | From `env`                                            | Direct API base URL override                                                |
| `endpoints`             | `Record<string, EndpointsType>`           | No       | See [Default endpoints](#default-endpoints-endpoints) | Custom endpoints (`'METHOD /path'`)                                         |
| `headers`               | `Record<string, string>`                  | No       | `{ 'Content-Type': 'application/json' }`              | Default request headers                                                     |
| `responseType`          | `'json' \| 'text' \| 'blob'`              | No       | `'json'`                                              | Expected response type                                                      |
| `requestDataSerializer` | `RequestDataSerializer`                   | No       | Built-in snake_case                                   | Request body key transform (e.g. camelCase → snake_case)                    |
| `requestAdapter`        | `RequestAdapterInterface`                 | No       | `RequestAdapterFetch`                                 | Custom HTTP adapter                                                         |

#### Authentication Options

| Property        | Type      | Required | Default           | Description                                         |
| --------------- | --------- | -------- | ----------------- | --------------------------------------------------- |
| `authKey`       | `string`  | No       | `'Authorization'` | Header key for authentication token                 |
| `tokenPrefix`   | `string`  | No       | `'token'`         | Prefix for token value (e.g. `'Bearer'`, `'token'`) |
| `requiredToken` | `boolean` | No       | `true`            | Whether token is required for requests              |
| `storageKey`    | `string`  | No       | `'brain_profile'` | Key for storing user profile in storage             |

#### Store Configuration Options

| Property                     | Type                                                         | Required | Default           | Description                                           |
| ---------------------------- | ------------------------------------------------------------ | -------- | ----------------- | ----------------------------------------------------- |
| `store.storage`              | `'localStorage' \| 'sessionStorage' \| SyncStorageInterface` | No       | `'localStorage'`  | Storage mechanism for user data                       |
| `store.persistUserInfo`      | `boolean`                                                    | No       | `false`           | Whether to persist user info in storage               |
| `store.storageKey`           | `string`                                                     | No       | `'brain_profile'` | Storage key for persisted user profile                |
| `store.credentialStorageKey` | `string`                                                     | No       | `'brain_token'`   | Storage key for credentials (`token`, `access_token`) |
| `store.featureTags`          | `DynamicFeatureTags`                                         | No       | Auto-created      | Feature tags handler instance                         |
| `store.userProfile`          | `UserProfile`                                                | No       | Auto-created      | User profile handler instance                         |

### Default Domain Configuration

Hosts only; invoke paths come from `endpoints`:

```ts
import { BRAIN_DOMAINS } from '@brain-toolkit/brain-user';

// BRAIN_DOMAINS defaults:
{
  development: 'https://api.dev.brain.ai',
  production: 'https://api.brain.ai'
}
```

### Default endpoints (`endpoints`)

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

// userly (access_token)
GATEWAY_BRAIN_USERLY_ENDPOINTS.accessToken; // POST .../auth/access_token
```

## Data Model Reference

Types are exported from `@brain-toolkit/brain-user` and match the source. Jump to definitions in your IDE.

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

### Credentials and user

`BrainCredentials`: stored after login or `fetchAndStoreAccessToken`. `token` is the brain-user token (`Authorization: token <token>`); `access_token` is the userly HS256 JWT.

```ts
interface BrainCredentials {
  /** brain-user auth token */
  token?: string;
  /** userly JWT (matrix-runtime / benchmark) */
  access_token?: string;
  expires_in?: number;
  refresh_token?: string;
  /** Google login: existing account flag */
  existing?: boolean;
  required_fields?: {
    first_name?: string;
    last_name?: string;
  };
}
```

`getAccessToken` / `fetchAndStoreAccessToken`:

```ts
interface BrainAccessTokenRequest {
  /** defaults to token in store */
  token?: string;
  /** default `'en'` → `X-Brain-User-Lang` */
  lang?: string;
  /** → `X-Brain-User-Location`, e.g. `'35.1814,136.9064'` */
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
  /** `disable_*` entries disable matching features */
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

### API request bodies

```ts
interface BrainUserGoogleRequest {
  authorization_code?: string;
  id_token?: string;
  /** brain web often uses metadata.mode: 'creator' | 'sharer' | 'editor' */
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

/** getUserInfo / refreshUserInfo accept `{ token }`; omit to use store */
type GetUserInfoParams = Pick<BrainCredentials, 'token'>;
```

## API Reference

### BrainUserService

Main service class for user authentication and management.

#### Methods

##### `loginWithGoogle(params: BrainUserGoogleRequest): Promise<BrainCredentials>`

Google OAuth login. Does not fetch user info automatically; call `refreshUserInfo` afterward.

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

Exchange for userly JWT; **does not** write to store.

```ts
const access: BrainAccessToken = await service.getAccessToken({
  lang: 'en',
  appVersion: '1.0.0',
  deviceUid: 'stable-device-id'
});
```

##### `fetchAndStoreAccessToken(params?: BrainAccessTokenRequest): Promise<BrainCredentials>`

Exchange and merge into store (requires existing `token`).

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

State store for user data and credentials.

#### Methods

##### `getUserMe(): BrainUser | null`

Get current user from store.

##### `getCredential(): BrainCredentials | null`

Get current credentials from store.

##### `getToken(): string`

brain-user `token` from credentials, or empty string.

##### `getAccessToken(): string`

userly `access_token` from credentials, or empty string.

```ts
const jwt = service.getStore().getAccessToken();
```

##### `featureTags: DynamicFeatureTags`

Feature tags handler for permission checks.

```ts
const hasGenUI = service.getStore().featureTags.hasGenUI();
const hasGenUIForGuest = service.getStore().featureTags.hasGenUI(true);
```

##### `userProfile: UserProfile`

User profile helper.

```ts
const phone = service.getStore().userProfile.getPhoneNumber();
const email = service.getStore().userProfile.getDaEmail();
const isVerified = service.getStore().userProfile.isEmailVerified();
const hasPermission = service
  .getStore()
  .userProfile.hasPermission('restricted_resources');
```

## Usage Examples

### Userly `access_token` (JWT after login)

brain-user login only provides `token`; matrix-runtime / benchmark and other userly services need the HS256 `access_token`.

```ts
import { BrainUserService } from '@brain-toolkit/brain-user';

const service = new BrainUserService({ env: 'production' });

// 1. brain-user login (Google / email, etc.)
await service.loginWithGoogle({ authorization_code: '...' });
const userInfo = await service.refreshUserInfo();
service.getStore().success(userInfo, service.getCredential()!);

// 2. Exchange and persist (recommended)
await service.fetchAndStoreAccessToken({
  lang: 'en',
  appVersion: '1.0.0',
  deviceUid: 'your-stable-device-id'
});

// 3. Read JWT
const brainToken = service.getStore().getToken();
const userlyJwt = service.getStore().getAccessToken();
const expiresIn = service.getCredential()?.expires_in;
```

Step-by-step (merge into store yourself):

```ts
const access = await service.getAccessToken({
  token: service.getCredential()?.token
});
service.mergeAccessToken(access);
```

Auto-fetch after login (skip if `credential.access_token` already set):

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

Separate userly domain:

```ts
const service = new BrainUserService({
  env: 'staging',
  domains: { staging: 'https://api.staging.brain.ai' },
  userlyDomains: { staging: 'https://userly.staging.brain.ai' }
});
```

Credentials persist under `store.credentialStorageKey` (default `brain_token`); `token` and `access_token` live in the same JSON object.

### Basic Usage (Minimal Configuration)

```ts
const service = new BrainUserService({
  env: 'production'
});

const credentials = await service.loginWithGoogle({
  authorization_code: 'google-oauth-code'
});

const user = await service.getUserInfo();
console.log(user.email, user.name);

const hasGenUI = service.getStore().featureTags.hasGenUI();
const phoneNumber = service.getStore().userProfile.getPhoneNumber();
```

### With Custom Storage (Session Storage)

```ts
const service = new BrainUserService({
  env: 'production',
  store: {
    storage: 'sessionStorage',
    persistUserInfo: true,
    credentialStorageKey: 'my_custom_token_key'
  }
});
```

### With Cookie Storage (Cross-Domain Support)

```ts
import { CookieStorage } from '@qlover/corekit-bridge';

const service = new BrainUserService({
  env: 'production',
  store: {
    storage: new CookieStorage({
      expires: 30,
      path: '/',
      domain: '.example.com',
      secure: true,
      sameSite: 'Lax'
    }),
    persistUserInfo: true
  }
});
```

### With Custom Request Adapter

```ts
import { RequestAdapterFetch } from '@qlover/fe-corekit';

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

### With Custom Logger and Executor

```ts
import { CustomLogger, CustomExecutor } from './custom';

const service = new BrainUserService({
  env: 'production',
  serviceName: 'myUserService',
  logger: new CustomLogger(),
  executor: new CustomExecutor(),
  store: {
    storage: 'localStorage',
    persistUserInfo: true
  }
});
```

### With Custom Domains (Multi-Environment)

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

### With Custom Endpoints

```ts
const service = new BrainUserService({
  env: 'production',
  endpoints: {
    login: 'POST /api/v2/auth/token.json',
    getUserInfo: 'GET /api/v2/users/profile.json'
  }
});
```

### With React Integration

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
      {user ? <div>Welcome, {user.name}!</div> : <div>Please login</div>}
    </div>
  );
}
```

### With Plugin System

```ts
import type { BrainUserPlugin } from '@brain-toolkit/brain-user';

const userServicePlugin: BrainUserPlugin = {
  pluginName: 'myUserServicePlugin',

  onBefore({ parameters: { actionName, store } }) {
    if (actionName === 'refreshUserInfo') {
      store.emit({ loading: true });
    }
  },

  onSuccess({ parameters: { actionName, store } }) {
    if (actionName === 'refreshUserInfo') {
      store.emit({ loading: false });
    }
  }
};

const service = new BrainUserService({
  env: 'production'
}).use(userServicePlugin);
```

## Common Use Cases

### User authentication flow (with access_token)

```ts
const service = new BrainUserService({
  env: 'production',
  store: { persistUserInfo: true }
});

const credentials = await service.loginWithGoogle({
  authorization_code: googleAuthCode
});

const userInfo = await service.refreshUserInfo(credentials);
service.getStore().success(userInfo, credentials);

await service.fetchAndStoreAccessToken({
  deviceUid: 'stable-device-id',
  lang: 'en'
});

if (service.getStore().featureTags.hasGenUI()) {
  // User has Gen UI permission
}

const jwt = service.getStore().getAccessToken();

await service.logout();
```

### User registration flow

```ts
const service = new BrainUserService({ env: 'production' });

const user = await service.register({
  email: 'user@example.com',
  password: 'securePassword123',
  first_name: 'John',
  last_name: 'Doe'
});

console.log('Registered user:', user.email);
```

### Refresh user information

```ts
const service = new BrainUserService({ env: 'production' });

const updatedUser = await service.refreshUserInfo();

const email = service.getStore().userProfile.getDaEmail();
const isVerified = service.getStore().userProfile.isEmailVerified();
```

### Access stored user data

```ts
const service = new BrainUserService({
  env: 'production',
  store: { persistUserInfo: true }
});

const user = service.getStore().getUserMe();

if (user) {
  console.log('User is logged in:', user.email);
} else {
  console.log('User is not logged in');
}
```

### Feature permission checking

```ts
const service = new BrainUserService({ env: 'production' });
const store = service.getStore();

if (store.featureTags.hasGenUI()) {
  // Show Gen UI features
}

if (store.featureTags.hasNoMeetingTab()) {
  // Show meeting tab
}

const isGuest = service.getStore().getUserMe()?.is_guest ?? false;
if (store.featureTags.hasGenUI(isGuest)) {
  // Show Gen UI for guest users
}
```

### User profile access

```ts
const service = new BrainUserService({ env: 'production' });
const profile = service.getStore().userProfile;

const phoneNumber = profile.getPhoneNumber();
const email = profile.getDaEmail();
const profileImage = profile.getProfileImgUrl();
const isEmailVerified = profile.isEmailVerified();
const hasPermission = profile.hasPermission('restricted_resources');
const permissionValue = profile.getPermissionValues('restricted_resources');
```

## Advanced Topics

### Type-safe feature tags

```ts
type CustomTags = readonly [
  'disable_custom_feature',
  'disable_another_feature'
];

const service = new BrainUserService<CustomTags>({
  env: 'production'
});

const hasCustomFeature = service.getStore().featureTags.hasCustomFeature();
const hasAnotherFeature = service.getStore().featureTags.hasAnotherFeature();
```

### Complete configuration example

```ts
import { CookieStorage } from '@qlover/corekit-bridge';
import { RequestAdapterFetch } from '@qlover/fe-corekit';

const service = new BrainUserService({
  serviceName: 'brainUserService',

  env: 'production',
  headers: {
    'X-App-Version': '1.0.0'
  },

  authKey: 'Authorization',
  tokenPrefix: 'token',
  requiredToken: true,
  storageKey: 'user_profile',

  userlyDomains: {
    production: 'https://api.brain.ai'
  },

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

  requestAdapter: new RequestAdapterFetch({
    timeout: 15000
  })
});

await service.fetchAndStoreAccessToken({
  appVersion: '1.0.0',
  deviceUid: 'device-1'
});
```

## License

ISC
