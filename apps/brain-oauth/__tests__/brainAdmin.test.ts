import { UserRole } from '@qlover/next-kit/common';
import { describe, expect, it } from 'vitest';
import { isBrainAdminUser } from '@shared/auth/brainAdmin';
import { isAdminOnlyPath } from '@config/route';

describe('isBrainAdminUser', () => {
  it('treats UserRole.ADMIN (0) as admin', () => {
    expect(isBrainAdminUser({ role: UserRole.ADMIN })).toBe(true);
  });

  it('rejects regular users and missing sessions', () => {
    expect(isBrainAdminUser({ role: UserRole.USER })).toBe(false);
    expect(isBrainAdminUser({})).toBe(false);
    expect(isBrainAdminUser(null)).toBe(false);
  });
});

describe('isAdminOnlyPath', () => {
  it('matches admin-only pages with or without locale', () => {
    expect(isAdminOnlyPath('/admin/users')).toBe(true);
    expect(isAdminOnlyPath('/zh/admin/users/')).toBe(true);
  });

  it('keeps the dashboard and personal logs open', () => {
    expect(isAdminOnlyPath('/en/admin')).toBe(false);
    expect(isAdminOnlyPath('/en/admin/request-logs')).toBe(false);
  });
});
