import { describe, expect, it } from 'vitest';
import { shouldAuditApiRequest } from '../../server/utils/shouldAuditApiRequest';

describe('shouldAuditApiRequest', () => {
  it('allows core mutations', () => {
    expect(shouldAuditApiRequest('POST', '/api/pam/create')).toBe(true);
    expect(shouldAuditApiRequest('POST', '/api/pam/edit/abc-123')).toBe(true);
    expect(shouldAuditApiRequest('POST', '/api/pam/delete/abc-123')).toBe(true);
    expect(
      shouldAuditApiRequest('POST', '/api/pam/proj-1/environments/env-1/delete')
    ).toBe(true);
    expect(
      shouldAuditApiRequest(
        'POST',
        '/api/pam/proj-1/environments/env-1/variables'
      )
    ).toBe(true);
  });

  it('denies high-frequency noise', () => {
    expect(shouldAuditApiRequest('GET', '/api/user/session')).toBe(false);
    expect(shouldAuditApiRequest('GET', '/api/pam/search')).toBe(false);
    expect(shouldAuditApiRequest('GET', '/api/pam/categories')).toBe(false);
    expect(shouldAuditApiRequest('GET', '/api/pam/detail/abc-123')).toBe(false);
    expect(shouldAuditApiRequest('GET', '/api/locales/json')).toBe(false);
    expect(shouldAuditApiRequest('GET', '/api/user/request-logs')).toBe(false);
    expect(shouldAuditApiRequest('POST', '/api/pam/cli/device/token')).toBe(
      false
    );
    expect(shouldAuditApiRequest('GET', '/api/pam/proj-1/environments')).toBe(
      false
    );
  });

  it('skips login/logout HTTP rows (covered by insertWithAuth)', () => {
    expect(shouldAuditApiRequest('POST', '/api/user/login')).toBe(false);
    expect(shouldAuditApiRequest('POST', '/api/user/logout')).toBe(false);
    expect(shouldAuditApiRequest('POST', '/api/pam/cli/token')).toBe(false);
    expect(shouldAuditApiRequest('POST', '/api/pam/cli/logout')).toBe(false);
  });
});
