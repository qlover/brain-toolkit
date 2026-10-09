import { describe, expect, it } from 'vitest';
import { pagerItems } from '@/uikit/components-app/admin/AdminPager';
import {
  isUuid,
  localDayStarts,
  sanitizeSearchKeyword
} from '@shared/admin/adminDashboard';

describe('localDayStarts', () => {
  it('splits days at the viewer local midnight', () => {
    // 2026-09-30 01:30 in UTC+8 is 2026-09-29 17:30 UTC.
    const now = Date.UTC(2026, 8, 29, 17, 30);
    const days = localDayStarts(now, -480, 3);
    expect(days.map((d) => new Date(d).toISOString())).toEqual([
      '2026-09-27T16:00:00.000Z',
      '2026-09-28T16:00:00.000Z',
      '2026-09-29T16:00:00.000Z'
    ]);
  });
});

describe('sanitizeSearchKeyword', () => {
  it('drops characters that break PostgREST or-filters', () => {
    expect(sanitizeSearchKeyword(' a,b(c)*%: ')).toBe('a b c');
    expect(sanitizeSearchKeyword(42)).toBe('');
  });

  it('keeps emails intact', () => {
    expect(sanitizeSearchKeyword('lin@brain.im')).toBe('lin@brain.im');
  });
});

describe('isUuid', () => {
  it('recognises request / user ids', () => {
    expect(isUuid('3f2b8c1e-0d4a-4e6b-9c1f-2a7d5e8b9c0d')).toBe(true);
    expect(isUuid('/oauth/token')).toBe(false);
  });
});

describe('pagerItems', () => {
  it('shows neighbours with gaps', () => {
    expect(pagerItems(1, 1)).toEqual([1]);
    expect(pagerItems(1, 8)).toEqual([1, 2, null, 8]);
    expect(pagerItems(5, 12)).toEqual([1, null, 4, 5, 6, null, 12]);
  });
});
