import type { BrainCredentials } from '../interface/BrainUserGatewayInterface';
import type { BrainUser } from '../types/BrainUserTypes';

export type PossibleFrequentResult = {
  // email: ['This field is required.'];
  email: [string];
  // password: ['This field is required.'];
  password: [string];
};

function isPossibleFrequentProp(value: unknown): value is [string] {
  return (
    Array.isArray(value) && value.length > 0 && typeof value[0] === 'string'
  );
}

/**
 * 判断是否为可能登录频繁的返回结果
 *
 * @example 当登录接口返回以下可能是登录太频繁
 * ```
 * {
 *   email: ['This field is required.'];
 *   password: ['This field is required.'];
 * }
 * ```
 *
 * @param value
 * @returns
 */
export function isPossibleFrequentResult(
  value: unknown
): value is PossibleFrequentResult {
  return (
    typeof value === 'object' &&
    value !== null &&
    'email' in value &&
    isPossibleFrequentProp(value.email) &&
    'password' in value &&
    isPossibleFrequentProp(value.password)
  );
}

export function isBrainUser(value: unknown): value is BrainUser {
  if (typeof value !== 'object' || value === null) {
    return false;
  }

  const obj = value as Record<string, unknown>;

  // Check required properties for BrainUser
  return (
    'id' in obj &&
    typeof obj.id === 'number' &&
    'email' in obj &&
    typeof obj.email === 'string' &&
    'name' in obj &&
    typeof obj.name === 'string' &&
    'auth_token' in obj &&
    obj.auth_token !== null &&
    typeof obj.auth_token === 'object' &&
    'key' in (obj.auth_token as Record<string, unknown>) &&
    typeof (obj.auth_token as Record<string, unknown>).key === 'string'
  );
}

export function isBrainCredentials(value: unknown): value is BrainCredentials {
  return (
    typeof value === 'object' &&
    value !== null &&
    'token' in value &&
    typeof value.token === 'string'
  );
}
