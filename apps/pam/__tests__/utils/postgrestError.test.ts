import { ExecutorError } from '@qlover/fe-corekit/executor';
import { describe, expect, it } from 'vitest';
import {
  extractPostgrestError,
  isPostgrestRangeNotSatisfiable,
  parsePostgrestRowCount
} from '@server/utils/postgrestError';

describe('postgrestError', () => {
  it('detects PGRST103 in nested cause', () => {
    const error = new ExecutorError('SupabasePGRSTError', {
      cause: {
        code: 'PGRST103',
        message: 'An offset of 10 was requested, but there are only 4 rows.'
      }
    });

    expect(isPostgrestRangeNotSatisfiable(error.cause)).toBe(true);
    expect(extractPostgrestError(error.cause)?.code).toBe('PGRST103');
  });

  it('parses row count from PGRST103 message', () => {
    expect(
      parsePostgrestRowCount(
        'An offset of 10 was requested, but there are only 4 rows.'
      )
    ).toBe(4);
  });

  it('returns false for other PostgREST codes', () => {
    expect(
      isPostgrestRangeNotSatisfiable({
        code: 'PGRST100',
        message: 'invalid'
      })
    ).toBe(false);
  });
});
