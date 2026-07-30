import { describe, expect, it } from 'vitest';
import { PAMEnvDotenvParseUtil } from '@shared/utils/PAMEnvDotenvParseUtil';
import { PAMEnvVariableMergeUtil } from '@shared/utils/PAMEnvVariableMergeUtil';
import { PAMEnvVariableNormalizeUtil } from '@shared/utils/PAMEnvVariableNormalizeUtil';
import { PAMEnvVariableRedactUtil } from '@shared/utils/PAMEnvVariableRedactUtil';

describe('PAMEnvDotenvParseUtil', () => {
  it('parses keys, quotes, and comments', () => {
    const parsed = PAMEnvDotenvParseUtil.parse(`
# comment
API_KEY="secret#1"
FOO=bar # trailing
DUPLICATE=one
DUPLICATE=two
EMPTY=
EMPTY_QUOTED=""
BAD LINE
=emptykey
`);

    expect(parsed).toEqual([
      { key: 'API_KEY', value: 'secret#1' },
      { key: 'FOO', value: 'bar' },
      { key: 'DUPLICATE', value: 'one' }
    ]);
  });

  it('allows only env and txt import filenames', () => {
    expect(PAMEnvDotenvParseUtil.isAllowedImportFileName('.env')).toBe(true);
    expect(PAMEnvDotenvParseUtil.isAllowedImportFileName('.env.local')).toBe(
      true
    );
    expect(PAMEnvDotenvParseUtil.isAllowedImportFileName('prod.env')).toBe(
      true
    );
    expect(PAMEnvDotenvParseUtil.isAllowedImportFileName('vars.txt')).toBe(
      true
    );
    expect(PAMEnvDotenvParseUtil.isAllowedImportFileName('data.json')).toBe(
      false
    );
    expect(PAMEnvDotenvParseUtil.isAllowedImportFileName('notes.md')).toBe(
      false
    );
  });
});

describe('PAMEnvVariableNormalizeUtil', () => {
  it('normalizes array and object shapes', () => {
    expect(
      PAMEnvVariableNormalizeUtil.normalizeVariables([
        { id: '11111111-1111-1111-1111-111111111111', key: 'A', value: '1' }
      ])
    ).toEqual([
      {
        id: '11111111-1111-1111-1111-111111111111',
        key: 'A',
        value: '1',
        sensitive: false
      }
    ]);

    expect(
      PAMEnvVariableNormalizeUtil.normalizeVariables({ A: '1', B: '2' })
    ).toEqual([
      { key: 'A', value: '1', sensitive: false },
      { key: 'B', value: '2', sensitive: false }
    ]);
  });
});

describe('PAMEnvVariableMergeUtil', () => {
  it('keeps existing sensitive values when incoming value is empty', () => {
    const merged = PAMEnvVariableMergeUtil.mergeVariables(
      [
        {
          id: '11111111-1111-1111-1111-111111111111',
          key: 'SECRET',
          value: 'stored',
          sensitive: true
        },
        { key: 'PLAIN', value: 'plain', sensitive: false }
      ],
      [
        {
          id: '11111111-1111-1111-1111-111111111111',
          key: 'SECRET',
          value: '',
          sensitive: true
        },
        { key: 'PLAIN', value: 'plain2', sensitive: false },
        { key: 'NEW', value: 'fresh', sensitive: true }
      ]
    );

    expect(merged).toEqual([
      {
        id: '11111111-1111-1111-1111-111111111111',
        key: 'SECRET',
        value: 'stored',
        sensitive: true
      },
      { key: 'PLAIN', value: 'plain2', sensitive: false },
      { key: 'NEW', value: 'fresh', sensitive: true }
    ]);
  });

  it('locks sensitive flag for existing variables', () => {
    const merged = PAMEnvVariableMergeUtil.mergeVariables(
      [
        {
          id: '11111111-1111-1111-1111-111111111111',
          key: 'SECRET',
          value: 'stored',
          sensitive: true
        },
        {
          id: '22222222-2222-2222-2222-222222222222',
          key: 'PLAIN',
          value: 'plain',
          sensitive: false
        }
      ],
      [
        {
          id: '11111111-1111-1111-1111-111111111111',
          key: 'SECRET',
          value: 'replaced',
          sensitive: false
        },
        {
          id: '22222222-2222-2222-2222-222222222222',
          key: 'PLAIN',
          value: 'plain2',
          sensitive: true
        }
      ]
    );

    expect(merged).toEqual([
      {
        id: '11111111-1111-1111-1111-111111111111',
        key: 'SECRET',
        value: 'replaced',
        sensitive: true
      },
      {
        id: '22222222-2222-2222-2222-222222222222',
        key: 'PLAIN',
        value: 'plain2',
        sensitive: false
      }
    ]);
  });
});

describe('PAMEnvVariableRedactUtil', () => {
  it('clears sensitive values only', () => {
    expect(
      PAMEnvVariableRedactUtil.redactVariables([
        { key: 'SECRET', value: 'x', sensitive: true },
        { key: 'PLAIN', value: 'y', sensitive: false }
      ])
    ).toEqual([
      { key: 'SECRET', value: '', sensitive: true },
      { key: 'PLAIN', value: 'y', sensitive: false }
    ]);
  });
});
