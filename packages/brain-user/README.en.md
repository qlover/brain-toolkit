# @brain-toolkit/brain-user - English Documentation

Brain User Service - Complete user authentication and management library for Brain platform

## Table of Contents

- [Installation](#installation)
- [Quick Start](#quick-start)
- [Features](#features)
- [Configuration](#configuration)
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
```

## Features

- 🔐 **Authentication**: Google OAuth, email/password login, user registration
- 👤 **User Management**: Get user info, refresh user data, manage user profile
- 🏷️ **Feature Tags**: Type-safe feature permission checking
- 💾 **State Management**: Built-in store supporting multiple storage mechanisms (localStorage/sessionStorage/Cookie), requires manual configuration for persistence
- 🔌 **Plugin System**: Extensible plugin architecture for custom hooks
- 🌐 **Multi-Environment**: Support for development, staging, and production environments
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

| Property       | Type                                      | Required | Default                        | Description                                                   |
| -------------- | ----------------------------------------- | -------- | ------------------------------ | ------------------------------------------------------------- |
| `env`          | `'development' \| 'production' \| string` | No       | `'development'`                | Environment to determine API domain                           |
| `domains`      | `Record<string, string>`                  | No       | See below                      | Custom domain mapping for environments                        |
| `baseURL`      | `string`                                  | No       | Auto from env                  | Override API base URL directly                                |
| `endpoints`    | `Record<string, EndpointsType>`           | No       | `GATEWAY_BRAIN_USER_ENDPOINTS` | Custom API endpoints configuration (format: `'METHOD /path'`) |
| `timeout`      | `number`                                  | No       | -                              | Request timeout in milliseconds                               |
| `headers`      | `Record<string, string>`                  | No       | -                              | Default headers for all requests                              |
| `responseType` | `'json' \| 'text' \| 'blob'`              | No       | `'json'`                       | Expected response type                                        |

#### Authentication Options

| Property        | Type      | Required | Default           | Description                                      |
| --------------- | --------- | -------- | ----------------- | ------------------------------------------------ |
| `authKey`       | `string`  | No       | `'Authorization'` | Header key for authentication token              |
| `tokenPrefix`   | `string`  | No       | `'token'`         | Prefix for token value (e.g., 'Bearer', 'token') |
| `requiredToken` | `boolean` | No       | `true`            | Whether token is required for requests           |
| `storageKey`    | `string`  | No       | `'brain_profile'` | Key for storing user profile in storage          |

#### Store Configuration Options

| Property                     | Type                                                         | Required | Default          | Description                             |
| ---------------------------- | ------------------------------------------------------------ | -------- | ---------------- | --------------------------------------- |
| `store.storage`              | `'localStorage' \| 'sessionStorage' \| SyncStorageInterface` | No       | `'localStorage'` | Storage mechanism for user data         |
| `store.persistUserInfo`      | `boolean`                                                    | No       | `false`          | Whether to persist user info in storage |
| `store.credentialStorageKey` | `string`                                                     | No       | `'brain_token'`  | Key for storing credentials             |
| `store.featureTags`          | `DynamicFeatureTags`                                         | No       | Auto-created     | Feature tags handler instance           |
| `store.userProfile`          | `UserProfile`                                                | No       | Auto-created     | User profile handler instance           |

#### Custom Adapter Option

| Property         | Type                      | Required | Default               | Description                                   |
| ---------------- | ------------------------- | -------- | --------------------- | --------------------------------------------- |
| `requestAdapter` | `RequestAdapterInterface` | No       | `RequestAdapterFetch` | Custom request adapter for HTTP communication |

### Default Domain Configuration

```ts
{
  development: 'https://brus-dev.api.brain.ai/v1.0/invoke/brain-user-system/method',
  production: 'https://brus.api.brain.ai/v1.0/invoke/brain-user-system/method'
}
```

## API Reference

### BrainUserService

Main service class for user authentication and management.

#### Methods

##### `loginWithGoogle(params: BrainUserGoogleRequest): Promise<BrainGoogleCredentials>`

Login with Google OAuth authorization code.

**Note:** This method does NOT automatically fetch user information. You need to manually call `refreshUserInfo()` after successful login to get the user details.

```ts
const credentials = await service.loginWithGoogle({
  authorization_code: 'google-oauth-code'
});

// Then refresh user info
const userInfo = await service.refreshUserInfo(credentials);
service.getStore().success(userInfo, credentials);
```

**Parameters:**

- `params.authorization_code` (optional): Google OAuth authorization code
- `params.id_token` (optional): Google ID token
- `params.metadata` (optional): Additional metadata (e.g., `mode` for brain web)

**Returns:** Promise resolving to Google credentials with token and optional required_fields

##### `login(params: BrainLoginRequest): Promise<BrainCredentials | null>`

Login with email and password.

```ts
const credentials = await service.login({
  email: 'user@example.com',
  password: 'password123'
});
```

**Parameters:**

- `params.email`: User email address
- `params.password`: User password
- `params.metadata` (optional): Additional metadata

**Returns:** Promise resolving to credentials or null

##### `register(params: BrainUserRegisterRequest): Promise<BrainUser>`

Register a new user account.

```ts
const user = await service.register({
  email: 'user@example.com',
  password: 'securePassword123',
  first_name: 'John',
  last_name: 'Doe'
});
```

**Parameters:**

- `params.email`: User email address
- `params.password`: User password
- `params.first_name`: User first name
- `params.last_name`: User last name
- `params.otp` (optional): OTP code for verification
- `params.metadata` (optional): Additional metadata
- `params.roles` (optional): User roles array

**Returns:** Promise resolving to user data with credentials

##### `getUserInfo(params?: BrainGetUserInfoRequest): Promise<BrainUser | null>`

Get current user information.

```ts
const user = await service.getUserInfo();
// or with explicit token
const user = await service.getUserInfo({ token: 'auth-token' });
```

**Parameters:**

- `params.token` (optional): Authentication token (uses stored token if not provided)

**Returns:** Promise resolving to user data or null

##### `refreshUserInfo(params?: BrainGetUserInfoRequest): Promise<BrainUser | null>`

Refresh user information from server.

```ts
const updatedUser = await service.refreshUserInfo();
```

**Parameters:**

- `params.token` (optional): Authentication token (uses stored token if not provided)

**Returns:** Promise resolving to updated user data or null

##### `logout(params?: unknown): Promise<void>`

Logout current user.

```ts
await service.logout();
```

**Returns:** Promise resolving to void

##### `getStore(): BrainUserStore<Tags>`

Get the user store instance for accessing state.

```ts
const store = service.getStore();
const user = store.getUserMe();
const token = store.getCredential()?.token;
```

**Returns:** BrainUserStore instance

##### `getCredential(): BrainCredentials | null`

Get current user credentials.

```ts
const credential = service.getCredential();
if (credential?.token) {
  // User is authenticated
}
```

**Returns:** Credentials object or null

### BrainUserStore

State store for user data and credentials.

#### Methods

##### `getUserMe(): BrainUser | null`

Get current user data from store.

##### `getCredential(): BrainCredentials | null`

Get current credentials from store.

##### `featureTags: DynamicFeatureTags`

Feature tags handler for permission checking.

```ts
// Check if user has Gen UI permission
const hasGenUI = service.getStore().featureTags.hasGenUI();

// Check with guest flag
const hasGenUI = service.getStore().featureTags.hasGenUI(true);
```

##### `userProfile: UserProfile`

User profile handler for accessing profile data.

```ts
// Get phone number
const phone = service.getStore().userProfile.getPhoneNumber();

// Get email
const email = service.getStore().userProfile.getDaEmail();

// Check email verification
const isVerified = service.getStore().userProfile.isEmailVerified();

// Check permission
const hasPermission = service
  .getStore()
  .userProfile.hasPermission('restricted_resources');
```

## Usage Examples

### Basic Usage (Minimal Configuration)

```ts
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

// Check feature permissions
const hasGenUI = service.getStore().featureTags.hasGenUI();

// Access user profile
const phoneNumber = service.getStore().userProfile.getPhoneNumber();
```

### With Custom Storage (Session Storage)

```ts
const service = new BrainUserService({
  env: 'production',
  store: {
    storage: 'sessionStorage', // Data cleared on tab close
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
      expires: 30, // 30 days
      path: '/',
      domain: '.example.com', // Works across subdomains
      secure: true, // HTTPS only
      sameSite: 'Lax' // CSRF protection
    }),
    persistUserInfo: true
  }
});
```

### With Custom Request Adapter

```ts
import { RequestAdapterFetch } from '@qlover/fe-corekit';

// Create custom adapter with interceptors
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
  logger: new CustomLogger(), // Custom logging
  executor: new CustomExecutor(), // Custom async execution
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
// Override specific endpoints
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
      {user ? (
        <div>Welcome, {user.name}!</div>
      ) : (
        <div>Please login</div>
      )}
    </div>
  );
}
```

### With Plugin System

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

## Common Use Cases

### User Authentication Flow

```ts
// 1. Initialize service
const service = new BrainUserService({ env: 'production' });

// 2. Login with Google
const credentials = await service.loginWithGoogle({
  authorization_code: googleAuthCode
});

// 3. Get user information
const userInfo = await service.refreshUserInfo(credentials);
service.getStore().success(userInfo, credentials);

// 4. Check permissions
if (service.getStore().featureTags.hasGenUI()) {
  // User has Gen UI permission
}

// 5. Logout
await service.logout();
```

### User Registration Flow

```ts
const service = new BrainUserService({ env: 'production' });

// Register new user
const user = await service.register({
  email: 'user@example.com',
  password: 'securePassword123',
  first_name: 'John',
  last_name: 'Doe'
});

// User is automatically logged in after registration
console.log('Registered user:', user.email);
```

### Refresh User Information

```ts
const service = new BrainUserService({ env: 'production' });

// Refresh user info from server
const updatedUser = await service.refreshUserInfo();

// Access updated profile
const email = service.getStore().userProfile.getDaEmail();
const isVerified = service.getStore().userProfile.isEmailVerified();
```

### Access Stored User Data

```ts
const service = new BrainUserService({
  env: 'production',
  store: { persistUserInfo: true }
});

// Get user from store (works after page reload if persisted)
const user = service.getStore().getUserMe();

if (user) {
  console.log('User is logged in:', user.email);
} else {
  console.log('User is not logged in');
}
```

### Feature Permission Checking

```ts
const service = new BrainUserService({ env: 'production' });
const store = service.getStore();

// Check feature permissions
if (store.featureTags.hasGenUI()) {
  // Show Gen UI features
}

if (store.featureTags.hasNoMeetingTab()) {
  // Show meeting tab
}

// Check with guest flag
const isGuest = service.getStore().getUserMe()?.is_guest ?? false;
if (store.featureTags.hasGenUI(isGuest)) {
  // Show Gen UI for guest users
}
```

### User Profile Access

```ts
const service = new BrainUserService({ env: 'production' });
const profile = service.getStore().userProfile;

// Get profile data
const phoneNumber = profile.getPhoneNumber();
const email = profile.getDaEmail();
const profileImage = profile.getProfileImgUrl();

// Check verification status
const isEmailVerified = profile.isEmailVerified();

// Check permissions
const hasPermission = profile.hasPermission('restricted_resources');
const permissionValue = profile.getPermissionValue('restricted_resources');
```

## Advanced Topics

### Type-Safe Feature Tags

You can define custom feature tags with type safety:

```ts
type CustomTags = readonly [
  'disable_custom_feature',
  'disable_another_feature'
];

const service = new BrainUserService<CustomTags>({
  env: 'production'
});

// Type-safe feature checking
const hasCustomFeature = service.getStore().featureTags.hasCustomFeature();
const hasAnotherFeature = service.getStore().featureTags.hasAnotherFeature();
```

### Complete Configuration Example

```ts
import { CookieStorage } from '@qlover/corekit-bridge';
import { RequestAdapterFetch } from '@qlover/fe-corekit';

const service = new BrainUserService({
  // Service configuration
  serviceName: 'brainUserService',

  // API configuration
  env: 'production',
  timeout: 30000,
  headers: {
    'X-App-Version': '1.0.0'
  },

  // Authentication configuration
  authKey: 'Authorization',
  tokenPrefix: 'Bearer',
  requiredToken: true,
  storageKey: 'user_profile',

  // Store configuration
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

  // Custom adapter
  requestAdapter: new RequestAdapterFetch({
    timeout: 15000
  })
});
```

## License

ISC
