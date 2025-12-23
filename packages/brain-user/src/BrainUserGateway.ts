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
   * This api is used to login with Google.
   *
   * @override
   * @param params Login with Google parameters
   * @returns Login with Google response data
   */
  public async loginWithGoogle(
    params: BrainUserGoogleRequest
  ): Promise<BrainGoogleCredentials> {
    const response = await this.brainUserApi.loginWithGoogle(params);

    return response.data;
  }

  /**
   * Login
   *
   * This api is used to login the user.
   *
   * @override
   * @param params Login parameters
   * @returns Login response data
   */
  public async login(
    params: BrainLoginRequest
  ): Promise<BrainCredentials | null> {
    const response = await this.brainUserApi.login(params);

    return response.data ?? null;
  }

  /**
   * Logout
   *
   * This api is used to logout the user.
   *
   * @override
   * @param params Logout parameters
   * @returns Logout response data
   */
  public async logout<Parmas = unknown, Result = void>(
    _params?: Parmas
  ): Promise<Result> {
    await this.brainUserApi.logout();

    return undefined as Result;
  }

  /**
   * Register
   *
   * This api is used to register a new user.
   *
   * @override
   * @param params Register parameters
   * @returns Register response data
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
   * This api is used to get the user info.
   *
   * @override
   * @param params Get user info parameters
   * @returns Get user info response data
   */
  public async getUserInfo(
    params: BrainGetUserInfoRequest
  ): Promise<BrainCredentials & BrainUser> {
    const response = await this.brainUserApi.getUserInfo(params);

    return response.data ?? null;
  }

  /**
   * Refresh user info
   *
   * This api is used to refresh the user info.
   *
   * @override
   * @param params Refresh user info parameters
   * @returns Refresh user info response data
   */
  public async refreshUserInfo<Params = BrainGetUserInfoRequest>(
    params?: Params | BrainGetUserInfoRequest
  ): Promise<BrainCredentials & BrainUser> {
    const response = await this.brainUserApi.getUserInfo(params!);

    return response.data ?? null;
  }
}

