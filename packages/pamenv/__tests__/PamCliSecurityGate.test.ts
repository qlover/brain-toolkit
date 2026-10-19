import { describe, expect, it, vi } from 'vitest';
import { PamCliSecurityGate } from '../src/impls/PamCliSecurityGate';
import { PamCliProjectResolveUtil } from '../src/impls/PamCliProjectResolveUtil';
import { PamCliApiError } from '../src/impls/PamCliApiError';
import type { PamCliExportResultType, PamCliProjectType } from '../src/interfaces/PamCliTypes';

describe('PamCliProjectResolveUtil exact match', () => {
  const projects: PamCliProjectType[] = [
    { id: '1', slug: 'pam', name: 'PAM' },
    { id: '2', slug: 'pamenv-v2-test-project', name: 'Test' }
  ];

  it('does not match substring slugs for privileged resolve', () => {
    expect(PamCliProjectResolveUtil.findExactInList(projects, 'pam')?.id).toBe(
      '1'
    );
    expect(
      PamCliProjectResolveUtil.findExactInList(projects, 'pamenv')
    ).toBeUndefined();
  });

  it('resolveExact rejects substring-only hits', async () => {
    const api = {
      listProjects: async () => [
        { id: '2', slug: 'pamenv-v2-test-project', name: 'Test' }
      ]
    };
    await expect(
      PamCliProjectResolveUtil.resolveExact(api as never, 'pam')
    ).rejects.toThrow(/pam|not found|找不到/i);
  });
});

describe('PamCliSecurityGate.assertExportRedacted', () => {
  const base: PamCliExportResultType = {
    projectId: 'p1',
    projectSlug: 'app',
    environmentId: 'e1',
    environmentName: 'dev',
    content: '',
    sensitiveKeys: ['TOKEN'],
    sensitivePlaceholder: '__PAM_SENSITIVE_abc__',
    variables: []
  };

  it('allows placeholder and empty sensitive values', () => {
    expect(() =>
      PamCliSecurityGate.assertExportRedacted({
        ...base,
        variables: [
          {
            key: 'TOKEN',
            value: '__PAM_SENSITIVE_abc__',
            sensitive: true
          },
          { key: 'SECRET', value: '', sensitive: true }
        ]
      })
    ).not.toThrow();
  });

  it('rejects plaintext on sensitive keys', () => {
    expect(() =>
      PamCliSecurityGate.assertExportRedacted({
        ...base,
        variables: [{ key: 'TOKEN', value: 'real-secret', sensitive: true }]
      })
    ).toThrow(/export_sensitive_leak|TOKEN|plaintext|明文|拒绝/i);
  });
});

describe('PamCliSecurityGate.redactExportForLocalOutput', () => {
  const base: PamCliExportResultType = {
    projectId: 'p1',
    projectSlug: 'app',
    environmentId: 'e1',
    environmentName: 'dev',
    content: '',
    sensitiveKeys: ['TOKEN'],
    sensitivePlaceholder: '__PAM_SENSITIVE_abc__',
    variables: []
  };

  it('forces placeholders when export leaks plaintext', () => {
    const result = PamCliSecurityGate.redactExportForLocalOutput({
      ...base,
      variables: [
        { key: 'API_URL', value: 'https://x.dev', sensitive: false },
        { key: 'TOKEN', value: 'real-secret', sensitive: true }
      ]
    });
    expect(result.variables).toEqual([
      { key: 'API_URL', value: 'https://x.dev', sensitive: false },
      {
        key: 'TOKEN',
        value: '__PAM_SENSITIVE_abc__',
        sensitive: true
      }
    ]);
    expect(result.placeholderKeys).toEqual(['TOKEN']);
    expect(result.emptyKeepKeys).toEqual([]);
  });

  it('writes empty keep values when the server sends no placeholder', () => {
    const result = PamCliSecurityGate.redactExportForLocalOutput({
      ...base,
      sensitivePlaceholder: undefined,
      variables: [
        { key: 'API_URL', value: 'https://x.dev', sensitive: false },
        { key: 'TOKEN', value: 'real-secret', sensitive: true }
      ]
    });
    expect(result.variables).toEqual([
      { key: 'API_URL', value: 'https://x.dev', sensitive: false },
      { key: 'TOKEN', value: '', sensitive: true }
    ]);
    expect(result.emptyKeepKeys).toEqual(['TOKEN']);
  });

  it('keeps unmarked lookalike keys as plain values', () => {
    const result = PamCliSecurityGate.redactExportForLocalOutput({
      ...base,
      sensitiveKeys: [],
      variables: [
        { key: 'API_URL', value: 'https://x.dev', sensitive: false },
        {
          key: 'DATABASE_URL',
          value: 'postgres://user:password@db/app',
          sensitive: false
        }
      ]
    });
    expect(result.variables).toEqual([
      { key: 'API_URL', value: 'https://x.dev', sensitive: false },
      {
        key: 'DATABASE_URL',
        value: 'postgres://user:password@db/app',
        sensitive: false
      }
    ]);
  });
});

describe('PamCliSecurityGate.run guards', () => {
  it('detects auth denials', () => {
    expect(
      PamCliSecurityGate.isAuthDenied(
        new PamCliApiError({ id: 'forbidden', httpStatus: 403 })
      )
    ).toBe(true);
    expect(
      PamCliSecurityGate.isAuthDenied(
        new PamCliApiError({ id: 'not_found', httpStatus: 404 })
      )
    ).toBe(false);
  });

  it('asserts by-name slug matches the request', () => {
    expect(() =>
      PamCliSecurityGate.assertResolvedProjectMatches('app', 'app', 'p1')
    ).not.toThrow();
    expect(() =>
      PamCliSecurityGate.assertResolvedProjectMatches('app', 'other', 'p1')
    ).toThrow(/app|other|mismatch|拒绝/i);
  });
});

describe('PamCliSecurityGate.assertIdentity', () => {
  it('fails when there is no token', async () => {
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => undefined);
    const authStore = {
      getToken: async () => null,
      getConfig: async () => ({ email: null }),
      getActivePamRoot: () => '/tmp/project/.pam'
    };
    await expect(
      PamCliSecurityGate.assertIdentity(authStore as never)
    ).rejects.toThrow(/not_logged_in|login|登录/i);
    errorSpy.mockRestore();
  });
});
