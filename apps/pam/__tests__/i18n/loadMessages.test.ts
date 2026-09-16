import { describe, expect, it } from 'vitest';
import { filterMessagesByNamespace } from '@/i18n/loadMessages';

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
