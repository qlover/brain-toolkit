import { ExecutorError } from '@qlover/fe-corekit/executor';
import { PostgrestError } from '@supabase/supabase-js';
import { describe, expect, it } from 'vitest';
import { createApiErrorNormalizer } from '../src/server/utils/createApiErrorNormalizer';

const SERVER_ERROR = 'api:server__error';

describe('createApiErrorNormalizer', () => {
  const normalizer = createApiErrorNormalizer({
    serverErrorId: SERVER_ERROR,
    passthroughIds: ['authorization_pending'],
    isDiagnosticsEnabled: () => false
  });

  it('keeps i18n keys and passthrough ids, rejects class-name ids', () => {
    expect(normalizer.isStableApiErrorId('api:not_authorized')).toBe(true);
    expect(normalizer.isStableApiErrorId('common:v:zod_failed')).toBe(true);
    expect(normalizer.isStableApiErrorId('authorization_pending')).toBe(true);
    expect(normalizer.isStableApiErrorId('SupabasePGRSTError')).toBe(false);
  });

  it('remaps unstable ids and keeps the cause', () => {
    const cause = { code: '42501' };
    const remapped = normalizer.toStableApiExecutorError(
      new ExecutorError('SupabasePGRSTError', cause)
    );
    expect(remapped.id).toBe(SERVER_ERROR);
    expect(remapped.cause).toEqual({ source: 'SupabasePGRSTError', cause });
  });

  it('strips server error diagnostics when disabled', () => {
    const facing = normalizer.toClientFacingExecutorError(
      new ExecutorError(SERVER_ERROR, { source: 'x' })
    );
    expect(facing.id).toBe(SERVER_ERROR);
    expect(facing.cause).toBeUndefined();
  });

  it('maps PostgrestError, then app mapper, then null', () => {
    const withMapper = createApiErrorNormalizer({
      serverErrorId: SERVER_ERROR,
      mapThrown: (value, id) =>
        value === 'custom' ? new ExecutorError(id, { source: 'custom' }) : null
    });

    const pg = withMapper.toExecutorErrorFromThrown(
      new PostgrestError({ message: 'm', details: '', hint: '', code: '42501' })
    );
    expect(pg?.cause).toMatchObject({ source: 'PostgrestError', code: '42501' });
    expect(withMapper.toExecutorErrorFromThrown('custom')?.cause).toEqual({
      source: 'custom'
    });
    expect(withMapper.toExecutorErrorFromThrown(new Error('boom'))).toBeNull();
  });
});
