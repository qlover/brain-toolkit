import { describe, expect, it } from 'vitest';
import { PAMEnvVariableDraftUtil } from '@shared/utils/PAMEnvVariableDraftUtil';
import type { PAMVariable } from '@schemas/PAMEnvironmentSchema';

const PLACEHOLDER = '__PAM_SENSITIVE_0123456789abcdef01234567__';

const baseline: PAMVariable[] = [
  { id: 'a', key: 'PLAIN', value: 'one', sensitive: false },
  { id: 'b', key: 'SECRET', value: '', sensitive: true }
];
const locked = new Set(['a', 'b']);

describe('PAMEnvVariableDraftUtil.countChanges', () => {
  it('is zero for an untouched draft', () => {
    expect(
      PAMEnvVariableDraftUtil.countChanges(
        baseline,
        baseline.map((item) => ({ ...item }))
      )
    ).toBe(0);
  });

  it('counts edits, additions, and removals', () => {
    const draft: PAMVariable[] = [
      { id: 'a', key: 'PLAIN', value: 'two', sensitive: false },
      { id: 'c', key: 'NEW', value: 'x', sensitive: false }
    ];
    expect(PAMEnvVariableDraftUtil.countChanges(baseline, draft)).toBe(3);
  });
});

describe('PAMEnvVariableDraftUtil.previewImport', () => {
  it('classifies entries against the draft', () => {
    const entries = PAMEnvVariableDraftUtil.previewImport(
      baseline,
      [
        { key: 'PLAIN', value: 'one' },
        { key: 'SECRET', value: PLACEHOLDER },
        { key: 'NEW', value: 'v' },
        { key: 'FOREIGN', value: PLACEHOLDER }
      ],
      locked
    );
    expect(entries.map((entry) => [entry.key, entry.status])).toEqual([
      ['PLAIN', 'unchanged'],
      ['SECRET', 'unchanged'],
      ['NEW', 'added'],
      ['FOREIGN', 'skipped']
    ]);
  });

  it('treats a new value for a saved sensitive key as changed', () => {
    const [entry] = PAMEnvVariableDraftUtil.previewImport(
      baseline,
      [{ key: 'SECRET', value: 'rotated' }],
      locked
    );
    expect(entry!.status).toBe('changed');
  });
});

describe('PAMEnvVariableDraftUtil.applyImport', () => {
  it('updates changed keys and adds new keys as sensitive', () => {
    const next = PAMEnvVariableDraftUtil.applyImport(
      baseline,
      [
        { key: 'PLAIN', value: 'two', status: 'changed' },
        { key: 'SECRET', value: '', status: 'unchanged' },
        { key: 'NEW', value: 'v', status: 'added' },
        { key: 'FOREIGN', value: PLACEHOLDER, status: 'skipped' }
      ],
      () => 'new-id'
    );
    expect(next).toEqual([
      { id: 'a', key: 'PLAIN', value: 'two', sensitive: false },
      { id: 'b', key: 'SECRET', value: '', sensitive: true },
      { id: 'new-id', key: 'NEW', value: 'v', sensitive: true }
    ]);
  });
});

describe('PAMEnvVariableDraftUtil.buildPatch', () => {
  it('returns empty patch when draft matches baseline', () => {
    expect(
      PAMEnvVariableDraftUtil.buildPatch(
        baseline,
        baseline.map((item) => ({ ...item }))
      )
    ).toEqual({ upsert: [], deleteIds: [] });
  });

  it('upserts changed and new rows; deleteIds for removals', () => {
    const draft: PAMVariable[] = [
      { id: 'a', key: 'PLAIN', value: 'two', sensitive: false },
      { id: 'c', key: 'NEW', value: 'x', sensitive: false }
    ];
    expect(PAMEnvVariableDraftUtil.buildPatch(baseline, draft)).toEqual({
      upsert: [
        { id: 'a', key: 'PLAIN', value: 'two', sensitive: false },
        { id: 'c', key: 'NEW', value: 'x', sensitive: false }
      ],
      deleteIds: ['b']
    });
  });
});

describe('PAMEnvVariableDraftUtil.findIssue', () => {
  it('accepts saved sensitive variables with empty values', () => {
    expect(PAMEnvVariableDraftUtil.findIssue(baseline, locked)).toBeNull();
  });

  it('reports empty keys, duplicates, and unsaved empty secrets', () => {
    expect(
      PAMEnvVariableDraftUtil.findIssue(
        [{ id: 'x', key: ' ', value: 'v' }],
        locked
      )
    ).toEqual({ kind: 'key_required' });
    expect(
      PAMEnvVariableDraftUtil.findIssue(
        [...baseline, { id: 'x', key: 'PLAIN', value: 'v' }],
        locked
      )
    ).toEqual({ kind: 'key_duplicate', key: 'PLAIN' });
    expect(
      PAMEnvVariableDraftUtil.findIssue(
        [{ id: 'x', key: 'NEW', value: '', sensitive: true }],
        locked
      )
    ).toEqual({ kind: 'sensitive_value', key: 'NEW' });
  });
});
