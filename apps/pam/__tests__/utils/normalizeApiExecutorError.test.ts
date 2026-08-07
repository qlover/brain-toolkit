import { ExecutorError } from '@qlover/fe-corekit/executor';
import { describe, expect, it } from 'vitest';
import {
  API_NOT_AUTHORIZED,
  API_SERVER_ERROR
} from '@config/i18n-identifier/api';
import { V_REQUIRED } from '@config/i18n-identifier/common/validators';
import {
  isStableApiErrorId,
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
