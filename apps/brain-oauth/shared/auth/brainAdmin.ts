import { UserRole } from '@qlover/next-kit/common';

/**
 * Platform admin = Brain account with the `admin` role (mapped to
 * `UserRole.ADMIN` at login and stored in the session user).
 */
export function isBrainAdminUser(user: unknown): boolean {
  if (!user || typeof user !== 'object') {
    return false;
  }
  // UserRole.ADMIN is 0, so compare explicitly instead of truthiness.
  return (user as { role?: unknown }).role === UserRole.ADMIN;
}
