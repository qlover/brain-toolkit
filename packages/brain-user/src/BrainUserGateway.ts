import type {
  BrainUserGoogleRequest,
  BrainUserGatewayInterface,
  BrainUserRegisterRequest,
  BrainLoginRequest,
  BrainGetUserInfoRequest,
  BrainCredentials,
  BrainGoogleCredentials
} from './interface/BrainUserGatewayInterface';
import type { BrainUser } from './types/BrainUserTypes';
import type { BrainUserApi, BrainUserApiConfig } from './BrainUserApi';

/**
 * Brain User Gateway - Business logic layer for user operations
 *
 * Significance: Bridge between service layer and API layer with business logic
 * Core idea: Transform API responses into domain models and handle business rules
 * Main function: Orchestrate API calls and process responses for service consumption
 * Main purpose: Provide clean interface for user operations with proper error handling and data transformation
 *
 * @example
 * ```ts
 * const api = new BrainUserApi(adapter);
 * const gateway = new BrainUserGateway(api);
 *
 * // Login with Google - returns clean credentials
 * const credentials = await gateway.loginWithGoogle({ authorization_code: 'google-auth-code' });
 *
 * // Register user - returns user data with credentials
 * const user = await gateway.register({
 *   email: 'user@example.com',
 *   password: 'password123'
 * });
 *
 * // Get user info
 * const userInfo = await gateway.getUserInfo({ token: 'auth-token' });
 * ```
 */
export class BrainUserGateway implements BrainUserGatewayInterface {
  constructor(
    protected brainUserApi: BrainUserApi<BrainUserApiConfig<unknown>>
  ) {}

  /**
   * Login with Google
   *
   * Significance: Authenticate user using Google OAuth flow
   * Core idea: Exchange Google authorization code or ID token for Brain credentials
   * Main function: Process Google OAuth response and return Brain authentication token
   * Main purpose: Enable seamless Google-based authentication integration
   *
   * This api is used to login with Google.
   *
   * @override
   * @param params - Google login request parameters
   * @param params.authorization_code - Google OAuth authorization code (from redirect)
   * @param params.id_token - Google ID token (alternative to authorization_code)
   * @param params.metadata - Optional metadata (e.g., mode for brain web)
   * @returns Promise resolving to Google credentials with token and optional required_fields
   *
   * @example
   * ```ts
   * // Login with authorization code
   * const credentials = await gateway.loginWithGoogle({
   *   authorization_code: 'google-oauth-code'
   * });
   *
   * // Login with ID token
   * const credentials = await gateway.loginWithGoogle({
   *   id_token: 'google-id-token'
   * });
   * ```
   */
  public async loginWithGoogle(
    params: BrainUserGoogleRequest
  ): Promise<BrainGoogleCredentials> {
    const response = await this.brainUserApi.loginWithGoogle(params);

    return response.data;
  }

  /**
   * Login with email and password
   *
   * Significance: Authenticate user with traditional credentials
   * Core idea: Validate email/password and return authentication token
   * Main function: Process login request and return credentials
   * Main purpose: Provide standard email/password authentication
   *
   * This api is used to login the user.
   *
   * @override
   * @param params - Login request parameters
   * @param params.email - User email address
   * @param params.password - User password
   * @param params.metadata - Optional metadata for additional context
   * @returns Promise resolving to credentials with token, or null if login fails
   *
   * @example
   * ```ts
   * const credentials = await gateway.login({
   *   email: 'user@example.com',
   *   password: 'password123'
   * });
   *
   * if (credentials?.token) {
   *   console.log('Login successful');
   * }
   * ```
   */
  public async login(
    params: BrainLoginRequest
  ): Promise<BrainCredentials | null> {
    const response = await this.brainUserApi.login(params);

    return response.data ?? null;
  }

  /**
   * Logout current user
   *
   * Significance: End user session and clear server-side authentication
   * Core idea: Invalidate authentication token on server
   * Main function: Send logout request to server
   * Main purpose: Securely terminate user session
   *
   * This api is used to logout the user.
   *
   * @override
   * @param _params - Optional logout parameters (not used, kept for interface compatibility)
   * @returns Promise resolving to void
   *
   * @example
   * ```ts
   * await gateway.logout();
   * // User session is now terminated
   * ```
   */
  public async logout<Parmas = unknown, Result = void>(
    _params?: Parmas
  ): Promise<Result> {
    await this.brainUserApi.logout();

    return undefined as Result;
  }

  /**
   * Register a new user account
   *
   * Significance: Create new user account in the system
   * Core idea: Validate registration data and create user profile
   * Main function: Process registration request and return user data with credentials
   * Main purpose: Enable new user onboarding with automatic login
   *
   * This api is used to register a new user.
   *
   * @override
   * @param params - Registration request parameters
   * @param params.email - User email address
   * @param params.password - User password
   * @param params.first_name - User first name
   * @param params.last_name - User last name
   * @param params.otp - Optional OTP code for verification
   * @param params.metadata - Optional metadata for additional information
   * @param params.roles - Optional array of user roles
   * @returns Promise resolving to user data with credentials, or null if registration fails
   *
   * @example
   * ```ts
   * const user = await gateway.register({
   *   email: 'user@example.com',
   *   password: 'securePassword123',
   *   first_name: 'John',
   *   last_name: 'Doe'
   * });
   *
   * // User is automatically logged in after registration
   * console.log('Registered user:', user.email);
   * ```
   */
  public async register(
    params: BrainUserRegisterRequest
  ): Promise<BrainCredentials & BrainUser> {
    const response = await this.brainUserApi.register(params);

    return response.data ?? null;
  }

  /**
   * Get user info
   *
   * Significance: Retrieve current user information from the server
   * Core idea: Fetch user profile data using authentication token
   * Main function: Call API to get user information and return formatted response
   * Main purpose: Provide user data for application consumption
   *
   * This api is used to get the user info.
   *
   * @override
   * @param params - Get user info parameters (optional, defaults to empty object)
   * @param params.token - Optional authentication token (if not provided, uses token from store)
   * @returns Promise resolving to user data with credentials, or null if not found
   *
   * @example
   * ```ts
   * // Get user info with stored token
   * const user = await gateway.getUserInfo();
   *
   * // Get user info with explicit token
   * const user = await gateway.getUserInfo({ token: 'auth-token' });
   * ```
   */
  public async getUserInfo(
    params: BrainGetUserInfoRequest = {}
  ): Promise<BrainCredentials & BrainUser> {
    const response = await this.brainUserApi.getUserInfo(params);

    return response.data ?? null;
  }

  /**
   * Refresh user info from server
   *
   * Significance: Update user information with latest data from server
   * Core idea: Fetch current user profile data to ensure data freshness
   * Main function: Call getUserInfo API and return updated user data
   * Main purpose: Synchronize local user data with server state
   *
   * This api is used to refresh the user info.
   *
   * @override
   * @param params - Optional refresh parameters (defaults to empty object)
   * @param params.token - Optional authentication token (if not provided, uses token from store)
   * @returns Promise resolving to updated user data with credentials, or null if not found
   *
   * @example
   * ```ts
   * // Refresh user info with stored token
   * const updatedUser = await gateway.refreshUserInfo();
   *
   * // Refresh user info with explicit token
   * const updatedUser = await gateway.refreshUserInfo({ token: 'auth-token' });
   * ```
   */
  public async refreshUserInfo<Params = BrainGetUserInfoRequest>(
    params?: Params | BrainGetUserInfoRequest
  ): Promise<BrainCredentials & BrainUser> {
    const response = await this.brainUserApi.getUserInfo(params ?? {});

    return response.data ?? null;
  }
}
