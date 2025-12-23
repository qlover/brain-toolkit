import type { UserServiceConfig } from '@qlover/corekit-bridge/gateway-auth';
import { UserService } from '@qlover/corekit-bridge/gateway-auth';
import type { BrainCredentials, BrainUser } from './types/BrainUserTypes';
import type {
  BrainGoogleCredentials,
  BrainUserGatewayInterface,
  BrainUserGoogleRequest
} from './interface/BrainUserGatewayInterface';
import type { BrainUserApiConfig } from './BrainUserApi';
import { createBrainUserOptions } from './utils/createBrainUserOptions';
import type { CreateBrainStoreOptions } from './utils/createBrainUserStore';
import type { RequestAdapterInterface } from '@qlover/fe-corekit';
import type { BrainUserStoreInterface } from './interface/BrainUserStoreInterface';
import type { BrainUserStore } from './BrainUserStore';

/**
 * Configuration options for BrainUserService
 *
 * Combines UserServiceConfig, BrainUserApiConfig, and Brain-specific options.
 * All properties are optional and will use sensible defaults if not provided.
 *
 * @template Tags - Array of feature tag strings for type-safe feature checking
 * @see BrainUserService for detailed usage examples and configuration guide
 */
export type BrainUserServiceOptions<Tags extends readonly string[]> = Omit<
  UserServiceConfig<BrainUser, BrainCredentials>,
  'store'
> &
  BrainUserApiConfig<unknown> & {
    /**
     * User store configuration
     *
     * @default Auto-created with localStorage
     * @see CreateBrainStoreOptions for detailed store configuration
     */
    store?: BrainUserStoreInterface<Tags> | CreateBrainStoreOptions<Tags>;

    /**
     * Custom request adapter for HTTP communication
     *
     * @default `new RequestAdapterFetch(options)`
     */
    requestAdapter?: RequestAdapterInterface<BrainUserApiConfig<unknown>>;
  };

/**
 * Brain User Service - Main service class for user authentication and management
 *
 * Significance: Central service for all Brain user-related operations
 * Core idea: Extend UserService with Brain-specific functionality and lifecycle management
 * Main function: Handle user authentication, registration, profile management
 * Main purpose: Provide unified interface for Brain user operations with proper state management
 *
 * ## Configuration Properties Table
 *
 * ### Core Service Options
 *
 * | Property | Type | Required | Default | Description |
 * |----------|------|----------|---------|-------------|
 * | `serviceName` | `string` | No | `'brainUserService'` | Service identifier for logging and debugging |
 * | `executor` | `ExecutorInterface` | No | - | Custom executor for async operations |
 * | `logger` | `LoggerInterface` | No | - | Custom logger for service operations |
 * | `gateway` | `BrainUserGateway` | No | Auto-created | Gateway instance for API communication |
 * | `store` | `BrainUserStore \| CreateBrainStoreOptions` | No | Auto-created | State store for user data and credentials |
 *
 * ### API Configuration Options
 *
 * | Property | Type | Required | Default | Description |
 * |----------|------|----------|---------|-------------|
 * | `env` | `'development' \| 'production' \| string` | No | `'development'` | Environment to determine API domain |
 * | `domains` | `Record<string, string>` | No | See below | Custom domain mapping for environments |
 * | `baseURL` | `string` | No | Auto from env | Override API base URL directly |
 * | `endpoints` | `Record<string, EndpointsType>` | No | `GATEWAY_BRAIN_USER_ENDPOINTS` | Custom API endpoints configuration (format: `'METHOD /path'`) |
 * | `timeout` | `number` | No | - | Request timeout in milliseconds |
 * | `headers` | `Record<string, string>` | No | - | Default headers for all requests |
 * | `responseType` | `'json' \| 'text' \| 'blob'` | No | `'json'` | Expected response type |
 *
 * ### Authentication Options
 *
 * | Property | Type | Required | Default | Description |
 * |----------|------|----------|---------|-------------|
 * | `authKey` | `string` | No | `'Authorization'` | Header key for authentication token |
 * | `tokenPrefix` | `string` | No | `'token'` | Prefix for token value (e.g., 'Bearer', 'token') |
 * | `requiredToken` | `boolean` | No | `true` | Whether token is required for requests |
 * | `storageKey` | `string` | No | `'brain_profile'` | Key for storing user profile in storage |
 *
 * ### Store Configuration Options
 *
 * | Property | Type | Required | Default | Description |
 * |----------|------|----------|---------|-------------|
 * | `store.storage` | `'localStorage' \| 'sessionStorage' \| SyncStorageInterface` | No | `'localStorage'` | Storage mechanism for user data |
 * | `store.persistUserInfo` | `boolean` | No | `false` | Whether to persist user info in storage |
 * | `store.credentialStorageKey` | `string` | No | `'brain_token'` | Key for storing credentials |
 * | `store.featureTags` | `DynamicFeatureTags` | No | Auto-created | Feature tags handler instance |
 * | `store.userProfile` | `UserProfile` | No | Auto-created | User profile handler instance |
 *
 * ### Custom Adapter Option
 *
 * | Property | Type | Required | Default | Description |
 * |----------|------|----------|---------|-------------|
 * | `requestAdapter` | `RequestAdapterInterface` | No | `RequestAdapterFetch` | Custom request adapter for HTTP communication |
 *
 * ## Default Domain Configuration
 *
 * ```ts
 * {
 *   development: 'https://brus-dev.api.brain.ai/v1.0/invoke/brain-user-system/method',
 *   production: 'https://brus.api.brain.ai/v1.0/invoke/brain-user-system/method'
 * }
 * ```
 *
 * ## Usage Examples
 *
 * ### Basic Usage (Minimal Configuration)
 *
 * ```ts
 * const service = new BrainUserService({
 *   env: 'production'
 * });
 *
 * // Login with Google
 * const credentials = await service.loginWithGoogle({
 *   authorization_code: 'google-oauth-code'
 * });
 *
 * // Get user info
 * const user = await service.getUserInfo();
 * console.log(user.email, user.name);
 *
 * // Check feature permissions
 * const hasGenUI = service.store.featureTags.hasGenUI();
 *
 * // Access user profile
 * const phoneNumber = service.store.userProfile.getPhoneNumber();
 * ```
 *
 * ### With Custom Storage (Session Storage)
 *
 * ```ts
 * const service = new BrainUserService({
 *   env: 'production',
 *   store: {
 *     storage: 'sessionStorage',  // Data cleared on tab close
 *     persistUserInfo: true,
 *     credentialStorageKey: 'my_custom_token_key'
 *   }
 * });
 * ```
 *
 * ### With Cookie Storage (Cross-Domain Support)
 *
 * ```ts
 * import { CookieStorage } from '@qlover/corekit-bridge';
 *
 * const service = new BrainUserService({
 *   env: 'production',
 *   store: {
 *     storage: new CookieStorage({
 *       expires: 30,              // 30 days
 *       path: '/',
 *       domain: '.example.com',   // Works across subdomains
 *       secure: true,             // HTTPS only
 *       sameSite: 'Lax'          // CSRF protection
 *     }),
 *     persistUserInfo: true
 *   }
 * });
 * ```
 *
 * ### With Custom Request Adapter
 *
 * ```ts
 * import { RequestAdapterFetch } from '@qlover/fe-corekit';
 *
 * // Create custom adapter with interceptors
 * const customAdapter = new RequestAdapterFetch({
 *   baseURL: 'https://custom-api.example.com',
 *   timeout: 10000,
 *   headers: {
 *     'X-App-Version': '1.0.0',
 *     'X-Custom-Header': 'value'
 *   }
 * });
 *
 * const service = new BrainUserService({
 *   requestAdapter: customAdapter
 * });
 * ```
 *
 * ### With Custom Logger and Executor
 *
 * ```ts
 * import { CustomLogger, CustomExecutor } from './custom';
 *
 * const service = new BrainUserService({
 *   env: 'production',
 *   serviceName: 'myUserService',
 *   logger: new CustomLogger(),      // Custom logging
 *   executor: new CustomExecutor(),  // Custom async execution
 *   store: {
 *     storage: 'localStorage',
 *     persistUserInfo: true
 *   }
 * });
 * ```
 *
 * ### With Custom Domains (Multi-Environment)
 *
 * ```ts
 * const service = new BrainUserService({
 *   env: 'staging',
 *   domains: {
 *     development: 'https://dev-api.example.com',
 *     staging: 'https://staging-api.example.com',
 *     production: 'https://api.example.com'
 *   }
 * });
 * ```
 *
 * ### With Custom Endpoints
 *
 * ```ts
 * // Override specific endpoints
 * const service = new BrainUserService({
 *   env: 'production',
 *   endpoints: {
 *     login: 'POST /api/v2/auth/token.json',
 *     getUserInfo: 'GET /api/v2/users/profile.json'
 *   }
 * });
 *
 * // Override all endpoints
 * const service = new BrainUserService({
 *   env: 'production',
 *   endpoints: {
 *     login: 'POST /api/auth/token.json',
 *     register: 'POST /api/users/signup.json',
 *     getUserInfo: 'GET /api/users/me.json',
 *     loginWithGoogle: 'POST /api/auth/google/brain/token',
 *     logout: 'POST /api/users/signout'
 *   }
 * });
 * ```
 *
 * ### Complete Configuration Example
 *
 * ```ts
 * import { CookieStorage } from '@qlover/corekit-bridge';
 * import { RequestAdapterFetch } from '@qlover/fe-corekit';
 *
 * const service = new BrainUserService({
 *   // Service configuration
 *   serviceName: 'brainUserService',
 *
 *   // API configuration
 *   env: 'production',
 *   timeout: 30000,
 *   headers: {
 *     'X-App-Version': '1.0.0'
 *   },
 *
 *   // Authentication configuration
 *   authKey: 'Authorization',
 *   tokenPrefix: 'Bearer',
 *   requiredToken: true,
 *   storageKey: 'user_profile',
 *
 *   // Store configuration
 *   store: {
 *     storage: new CookieStorage({
 *       expires: 7,
 *       path: '/',
 *       domain: '.myapp.com',
 *       secure: true
 *     }),
 *     persistUserInfo: true,
 *     credentialStorageKey: 'auth_token'
 *   },
 *
 *   // Custom adapter
 *   requestAdapter: new RequestAdapterFetch({
 *     timeout: 15000
 *   })
 * });
 * ```
 *
 * ## Common Use Cases
 *
 * ### User Authentication Flow
 *
 * ```ts
 * // 1. Initialize service
 * const service = new BrainUserService({ env: 'production' });
 *
 * // 2. Login with Google
 * const credentials = await service.loginWithGoogle({
 *   authorization_code: googleAuthCode
 * });
 *
 * // 3. Get user information
 * const user = await service.getUserInfo();
 *
 * // 4. Check permissions
 * if (service.store.featureTags.hasGenUI()) {
 *   // User has Gen UI permission
 * }
 *
 * // 5. Logout
 * await service.logout();
 * ```
 *
 * ### User Registration Flow
 *
 * ```ts
 * const service = new BrainUserService({ env: 'production' });
 *
 * // Register new user
 * const user = await service.register({
 *   email: 'user@example.com',
 *   password: 'securePassword123',
 *   first_name: 'John',
 *   last_name: 'Doe'
 * });
 *
 * // User is automatically logged in after registration
 * console.log('Registered user:', user.email);
 * ```
 *
 * ### Refresh User Information
 *
 * ```ts
 * const service = new BrainUserService({ env: 'production' });
 *
 * // Refresh user info from server
 * const updatedUser = await service.refreshUserInfo();
 *
 * // Access updated profile
 * const email = service.store.userProfile.getDaEmail();
 * const isVerified = service.store.userProfile.isEmailVerified();
 * ```
 *
 * ### Access Stored User Data
 *
 * ```ts
 * const service = new BrainUserService({
 *   env: 'production',
 *   store: { persistUserInfo: true }
 * });
 *
 * // Get user from store (works after page reload if persisted)
 * const user = service.store.getUserMe();
 *
 * if (user) {
 *   console.log('User is logged in:', user.email);
 * } else {
 *   console.log('User is not logged in');
 * }
 * ```
 *
 * @template Tags - Array of feature tag strings for type-safe feature checking
 * @template Config - Service configuration type extending BrainUserServiceOptions
 */
export class BrainUserService<
    Tags extends readonly string[],
    Config extends BrainUserServiceOptions<Tags> = BrainUserServiceOptions<Tags>
  >
  extends UserService<BrainUser, BrainCredentials, string>
  implements BrainUserGatewayInterface
{
  /**
   * Constructor for BrainUserService
   *
   * Significance: Initialize the service with configuration options
   * Core idea: Transform user-provided options into complete service configuration
   * Main function: Set up gateway, store, and other dependencies
   * Main purpose: Create a ready-to-use user service instance
   *
   * @param options - Service configuration options
   */
  constructor(options: Config) {
    super(createBrainUserOptions(options));
  }

  /**
   * Get the user store instance
   *
   * Significance: Access point for user state management
   * Core idea: Provide type-safe access to BrainUserStore with feature tags
   * Main function: Return the store instance with proper type casting
   * Main purpose: Enable direct store access for advanced state management
   *
   * @returns BrainUserStore instance with type-safe feature tags support
   *
   * @example
   * ```ts
   * const service = new BrainUserService({ env: 'production' });
   * const store = service.getStore();
   *
   * // Access user data
   * const user = store.getUserMe();
   * const token = store.getToken();
   *
   * // Access feature tags
   * const hasGenUI = store.featureTags.hasGenUI();
   *
   * // Access user profile
   * const email = store.userProfile.getDaEmail();
   * ```
   */
  public getStore(): BrainUserStore<Tags> {
    return super.getStore() as BrainUserStore<Tags>;
  }

  /**
   * Inherited Methods from UserService
   *
   * The following methods are inherited from UserService base class and are available
   * on BrainUserService instances. They use the execute() method to call corresponding
   * methods on the BrainUserGateway.
   *
   * ### Available Methods:
   *
   * - `register(params: BrainUserRegisterRequest): Promise<BrainUser | null>`
   *   - Register a new user account
   *   - Automatically logs in the user after successful registration
   *
   * - `login(params: BrainLoginRequest): Promise<BrainCredentials | null>`
   *   - Login with email and password
   *   - Returns credentials with authentication token
   *
   * - `getUserInfo(params?: BrainGetUserInfoRequest): Promise<BrainUser | null>`
   *   - Get current user information
   *   - Uses stored token if params.token is not provided
   *
   * - `refreshUserInfo(params?: BrainGetUserInfoRequest): Promise<BrainUser | null>`
   *   - Refresh user information from server
   *   - Updates store with latest user data
   *
   * - `logout(params?: unknown): Promise<void>`
   *   - Logout current user
   *   - Clears credentials and user data from store
   *
   * - `getCredential(): BrainCredentials | null`
   *   - Get current authentication credentials
   *   - Returns null if user is not logged in
   *
   * @see UserService for base implementation details
   * @see BrainUserGatewayInterface for method signatures
   */

  /**
   * Login with Google
   *
   * Significance: Authenticate user using Google OAuth authorization code
   * Core idea: Exchange Google authorization code for Brain credentials
   * Main function: Handle Google OAuth login flow
   * Main purpose: Provide secure Google authentication integration
   *
   * **Note:** This method does NOT automatically fetch user information.
   * You need to manually call `refreshUserInfo()` after successful login
   * to get the user details.
   *
   * @override
   * @param params - Google login request parameters containing authorization_code
   * @returns Promise resolving to Google credentials (token and optional required_fields)
   *
   * @example
   * ```ts
   * const service = new BrainUserService({ env: 'production' });
   *
   * // Step 1: Login with Google authorization code
   * const credentials = await service.loginWithGoogle({
   *   authorization_code: 'google-oauth-code-from-google'
   * });
   *
   * if (!credentials.token) {
   *   throw new Error('Google login failed');
   * }
   *
   * // Step 2: Get user information (required, not automatic)
   * const userInfo = await service.refreshUserInfo(credentials);
   *
   * if (!userInfo) {
   *   throw new Error('Failed to get user info');
   * }
   *
   * // Step 3: Update store with user info and credentials
   * service.getStore().success(userInfo, credentials);
   *
   * // Now you can access user information
   * console.log('User logged in:', userInfo.name, userInfo.email);
   * ```
   *
   * @example
   * ```ts
   * // Example with React component
   * const handleGoogleLogin = async (googleAuthCode: string) => {
   *   try {
   *     const userService = new BrainUserService({
   *       env: 'development',
   *       executor: new GatewayExecutor()
   *     });
   *
   *     // Login with Google
   *     const brainCredentials = await userService.loginWithGoogle({
   *       authorization_code: googleAuthCode
   *     });
   *
   *     if (!brainCredentials.token) {
   *       throw new Error('Google login failed');
   *     }
   *
   *     // Get user info manually (required step)
   *     const userInfo = await userService.refreshUserInfo(brainCredentials);
   *
   *     if (!userInfo) {
   *       throw new Error('Failed to get user info');
   *     }
   *
   *     // Update store
   *     userService.getStore().success(userInfo, brainCredentials);
   *
   *     return userInfo;
   *   } catch (error) {
   *     console.error('Google login failed:', error);
   *     throw error;
   *   }
   * };
   * ```
   */
  public loginWithGoogle(
    params: BrainUserGoogleRequest
  ): Promise<BrainGoogleCredentials> {
    return this.execute('loginWithGoogle', params);
  }
}
