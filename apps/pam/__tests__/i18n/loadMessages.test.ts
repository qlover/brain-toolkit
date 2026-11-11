import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  filterMessagesByNamespace,
  shouldFetchApiLocalesAtRuntime
} from '@/i18n/loadMessages';

describe('shouldFetchApiLocalesAtRuntime', () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it('skips API fetch during next production build', () => {
    vi.stubEnv('NEXT_PHASE', 'phase-production-build');
    expect(shouldFetchApiLocalesAtRuntime()).toBe(false);
  });

  it('allows API fetch outside production build', () => {
    vi.stubEnv('NEXT_PHASE', '');
    expect(shouldFetchApiLocalesAtRuntime()).toBe(true);
  });
});

describe('filterMessagesByNamespace', () => {
  const messages = {
    'common:save': 'Save',
    'api:error': 'Error',
    'admin_locales:title': 'Locales',
    'admin_users:title': 'Users'
  };

  it('returns all messages when namespace is omitted', () => {
    expect(filterMessagesByNamespace(messages)).toEqual(messages);
  });

  it('keeps a single namespace with prefix', () => {
    expect(filterMessagesByNamespace(messages, 'admin_locales')).toEqual({
      'admin_locales:title': 'Locales'
    });
  });

  it('keeps multiple namespaces', () => {
    expect(
      filterMessagesByNamespace(messages, ['common', 'admin_locales'])
    ).toEqual({
      'common:save': 'Save',
      'admin_locales:title': 'Locales'
    });
  });
});
