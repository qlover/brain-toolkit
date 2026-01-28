import type {
  RequestAdapterConfig,
  RequestAdapterInterface
} from '@qlover/fe-corekit';
import { RequestAdapterFetch } from '@qlover/fe-corekit';
import type { BrainUserGatewayConfig } from '../interface/BrainUserGatewayInterface';
import type { BrainUserStoreInterface } from '../interface/BrainUserStoreInterface';
import { defaultBrainUserOptions } from '../config/common';

/**
 * Type definition for adapter creation options
 *
 * Can be either a RequestAdapterInterface instance or BrainUserGatewayConfig
 */
export type CreateAdapterType<Config extends BrainUserGatewayConfig<unknown>> =
  | RequestAdapterInterface<Config>
  | BrainUserGatewayConfig<unknown>;

/**
 * Type guard to check if the value is a RequestAdapterInterface
 *
 * Significance: Distinguish between adapter instance and configuration
 * Core idea: Runtime type checking for adapter interfaces
 * Main function: Check if an object implements RequestAdapterInterface
 * Main purpose: Enable safe type narrowing for adapter operations
 *
 * @param options - The value to check
 * @returns True if the value implements RequestAdapterInterface, false otherwise
 *
 * @example
 * ```ts
 * const adapter = getAdapter();
 * if (isRequestAdapterInterface(adapter)) {
 *   adapter.request(config);
 * }
 * ```
 */
export function isRequestAdapterInterface(
  options: CreateAdapterType<BrainUserGatewayConfig<unknown>>
): options is RequestAdapterInterface<RequestAdapterConfig> {
  if (!options || typeof options !== 'object') {
    return false;
  }

  return (
    'config' in options &&
    typeof options.config === 'object' &&
    'request' in options &&
    typeof options.request === 'function' &&
    'getConfig' in options &&
    typeof options.getConfig === 'function'
  );
}

/**
 * Parse base URL from API configuration
 *
 * Significance: Extract the correct base URL based on environment
 * Core idea: Priority-based URL resolution
 * Main function: Resolve base URL from config or domain mapping
 * Main purpose: Provide consistent base URL for API requests
 *
 * @param config - The API configuration
 * @returns The resolved base URL string
 *
 * @example
 * ```ts
 * const url = parseBaseURL({
 *   env: 'development',
 *   domains: { development: 'https://dev.api.com' }
 * });
 * // Returns: 'https://dev.api.com'
 * ```
 */
function parseBaseURL(
  baseURL?: string,
  env?: string,
  domains?: Record<string, string>
): string {
  if (typeof baseURL === 'string' && baseURL !== null) {
    return baseURL;
  }

  return env && domains ? domains[env] : '';
}

/**
 * Create a request adapter for API communication
 *
 * Significance: Factory function for flexible adapter creation with plugins
 * Core idea: Accept either adapter instance or configuration, and configure plugins
 * Main function: Initialize or return a request adapter with FetchURLPlugin and RequestCommonPlugin
 * Main purpose: Simplify adapter setup with automatic configuration and proper request handling
 *
 * @param options - Either a RequestAdapterInterface instance or BrainUserGatewayConfig
 * @param userStore - Optional user store for token retrieval
 * @returns A RequestAdapterInterface instance ready for use with plugins configured
 *
 * @example
 * ```ts
 * // Create from config with user store
 * const adapter1 = createAdapter({
 *   env: 'production',
 *   domains: { production: 'https://api.example.com' }
 * }, userStore);
 *
 * // Pass existing adapter (plugins won't be added if adapter already exists)
 * const existingAdapter = new RequestAdapterFetch({ baseURL: 'https://api.com' });
 * const adapter2 = createAdapter(existingAdapter); // returns same instance
 * ```
 */
export function createAdapter<
  Config extends BrainUserGatewayConfig<unknown>,
  Tags extends readonly string[] = readonly string[]
>(
  options: CreateAdapterType<Config>,
  _userStore?: BrainUserStoreInterface<Tags> | null
): RequestAdapterInterface<RequestAdapterConfig> {
  if (isRequestAdapterInterface(options)) {
    return options;
  }

  const config = options as BrainUserGatewayConfig<unknown>;
  const { env, domains, baseURL, endpoints, ...restOptions } = config;

  return new RequestAdapterFetch({
    ...defaultBrainUserOptions,
    ...restOptions,
    endpoints: {
      ...defaultBrainUserOptions.endpoints,
      ...endpoints
    },
    baseURL: parseBaseURL(baseURL, env, domains)
  });
}
