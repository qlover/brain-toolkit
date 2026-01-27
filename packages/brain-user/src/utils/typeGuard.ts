import type { BrainCredentials } from '../interface/BrainUserGatewayInterface';
import type { BrainUser } from '../types/BrainUserTypes';

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
