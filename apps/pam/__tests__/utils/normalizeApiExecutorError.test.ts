import { ExecutorError } from '@qlover/fe-corekit/executor';
import { PostgrestError } from '@supabase/supabase-js';
import { describe, expect, it, vi } from 'vitest';
import {
  API_NOT_AUTHORIZED,
  API_SERVER_ERROR
} from '@config/i18n-identifier/api';
import { V_REQUIRED } from '@config/i18n-identifier/common/validators';
import {
  isApiErrorDiagnosticsEnabled,
  isStableApiErrorId,
  toClientFacingExecutorError,
  toExecutorErrorFromThrown,
  toStableApiExecutorError
} from '@server/utils/normalizeApiExecutorError';

describe('normalizeApiExecutorError', () => {
  it('keeps api / common / nested i18n keys', () => {
    expect(isStableApiErrorId(API_NOT_AUTHORIZED)).toBe(true);
    expect(isStableApiErrorId(API_SERVER_ERROR)).toBe(true);
    expect(isStableApiErrorId(V_REQUIRED)).toBe(true);
  });

  it('keeps RFC8628 soft-fail ids', () => {
    expect(isStableApiErrorId('authorization_pending')).toBe(true);
    expect(isStableApiErrorId('expired_token')).toBe(true);
  });

  it('rejects infrastructure class-name ids', () => {
    expect(isStableApiErrorId('SupabasePGRSTError')).toBe(false);
    expect(isStableApiErrorId('SupabaseAuthError')).toBe(false);
  });

  it('remaps SupabasePGRSTError to api:server__error and preserves cause', () => {
    const cause = {
      cause: {
        code: '42501',
        message: 'new row violates row-level security policy'
      }
    };
    const remapped = toStableApiExecutorError(
      new ExecutorError('SupabasePGRSTError', cause)
    );

    expect(remapped.id).toBe(API_SERVER_ERROR);
    expect(remapped.cause).toEqual({
      source: 'SupabasePGRSTError',
      cause
    });
  });

  it('passes through stable ExecutorError unchanged', () => {
    const original = new ExecutorError(API_NOT_AUTHORIZED);
    expect(toStableApiExecutorError(original)).toBe(original);
  });
});

describe('toClientFacingExecutorError', () => {
  it('keeps business api:* causes', () => {
    const original = new ExecutorError(API_NOT_AUTHORIZED, { reason: 'x' });
    expect(toClientFacingExecutorError(original)).toBe(original);
  });

  it('strips api:server__error diagnostics in production', () => {
    vi.stubEnv('NODE_ENV', 'production');
    try {
      expect(isApiErrorDiagnosticsEnabled()).toBe(false);
      const remapped = toClientFacingExecutorError(
        new ExecutorError(API_SERVER_ERROR, {
          source: 'UNKNOWN_ASYNC_ERROR',
          cause: { message: 'column does not exist' }
        })
      );
      expect(remapped.id).toBe(API_SERVER_ERROR);
      expect(remapped.cause).toBeUndefined();
    } finally {
      vi.unstubAllEnvs();
    }
  });

  it('keeps api:server__error diagnostics outside production', () => {
    vi.stubEnv('NODE_ENV', 'development');
    try {
      expect(isApiErrorDiagnosticsEnabled()).toBe(true);
      const withCause = new ExecutorError(API_SERVER_ERROR, {
        source: 'PostgrestError',
        code: '42703'
      });
      expect(toClientFacingExecutorError(withCause)).toBe(withCause);
    } finally {
      vi.unstubAllEnvs();
    }
  });
});

describe('toExecutorErrorFromThrown', () => {
  it('remaps PostgrestError from throwOnError to api:server__error', () => {
    const pg = new PostgrestError({
      message: 'new row violates row-level security policy',
      details: '',
      hint: '',
      code: '42501'
    });
    const remapped = toExecutorErrorFromThrown(pg);

    expect(remapped?.id).toBe(API_SERVER_ERROR);
    expect(remapped?.cause).toMatchObject({
      source: 'PostgrestError',
      code: '42501',
      message: 'new row violates row-level security policy'
    });
  });

  it('remaps unstable ExecutorError ids', () => {
    const remapped = toExecutorErrorFromThrown(
      new ExecutorError('SupabasePGRSTError')
    );
    expect(remapped?.id).toBe(API_SERVER_ERROR);
  });

  it('returns null for generic Error (kit createServerError path)', () => {
    expect(toExecutorErrorFromThrown(new Error('boom'))).toBeNull();
  });
});
