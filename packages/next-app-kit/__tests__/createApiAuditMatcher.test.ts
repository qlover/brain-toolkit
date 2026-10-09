import { describe, expect, it } from 'vitest';
import { createApiAuditMatcher } from '../src/server/utils/createApiAuditMatcher';

describe('createApiAuditMatcher', () => {
  const shouldAudit = createApiAuditMatcher([
    { method: 'POST', path: '/api/clients' },
    { method: ['PUT', 'DELETE'], path: /^\/api\/clients\/[^/]+$/ }
  ]);

  it('matches exact path and method case-insensitively', () => {
    expect(shouldAudit('post', '/api/clients')).toBe(true);
    expect(shouldAudit('GET', '/api/clients')).toBe(false);
  });

  it('matches RegExp paths with method lists', () => {
    expect(shouldAudit('DELETE', '/api/clients/abc')).toBe(true);
    expect(shouldAudit('POST', '/api/clients/abc')).toBe(false);
    expect(shouldAudit('PUT', '/api/clients/abc/extra')).toBe(false);
  });
});
