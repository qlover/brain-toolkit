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
      {
        key: 'API_KEY',
        value: 'secret#1',
        sensitive: false,
        comments: ['# comment']
      },
      {
        key: 'FOO',
        value: 'bar',
        sensitive: false,
        comments: ['# trailing']
      },
      { key: 'DUPLICATE', value: 'one', sensitive: false }
    ]);
  });

  it('marks the next key after # pam:sensitive', () => {
    const parsed = PAMEnvDotenvParseUtil.parse(`
# pam:sensitive
TOKEN=secret
NORMAL=1
`);
    expect(parsed).toEqual([
      { key: 'TOKEN', value: 'secret', sensitive: true },
      { key: 'NORMAL', value: '1', sensitive: false }
    ]);
  });

  it('keeps sensitive when comments sit between marker and key', () => {
    const parsed = PAMEnvDotenvParseUtil.parse(`
# pam:sensitive
# DB password
TOKEN=secret # prod only
`);
    expect(parsed).toEqual([
      {
        key: 'TOKEN',
        value: 'secret',
        sensitive: true,
        comments: ['# DB password', '# prod only']
      }
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

  it('treats the env placeholder like empty for existing sensitive keys', () => {
    const placeholder = '__PAM_SENSITIVE_abc__';
    const merged = PAMEnvVariableMergeUtil.mergeVariables(
      [{ key: 'SECRET', value: 'stored', sensitive: true }],
      [
        { key: 'SECRET', value: placeholder },
        { key: 'NEW', value: placeholder, sensitive: true }
      ],
      placeholder
    );

    expect(merged[0]?.value).toBe('stored');
    // New keys have nothing to keep; the service rejects the leftover placeholder.
    expect(merged[1]?.value).toBe(placeholder);
  });

  it('upgrades secret-like keys and keeps the stored sensitive key name', () => {
    const renamed = PAMEnvVariableMergeUtil.mergeVariables(
      [
        {
          id: '11111111-1111-1111-1111-111111111111',
          key: 'API_TOKEN',
          value: 'stored',
          sensitive: true
        }
      ],
      [
        {
          id: '11111111-1111-1111-1111-111111111111',
          key: 'RENAMED',
          value: '',
          sensitive: true
        }
      ]
    );
    expect(renamed[0]).toMatchObject({
      key: 'API_TOKEN',
      value: 'stored',
      sensitive: true
    });

    const upgraded = PAMEnvVariableMergeUtil.mergeVariables(
      [],
      [{ key: 'DATABASE_URL', value: 'postgres://u:p@h/db', sensitive: false }]
    );
    expect(upgraded[0]).toMatchObject({
      key: 'DATABASE_URL',
      value: 'postgres://u:p@h/db',
      sensitive: true
    });

    const plain = PAMEnvVariableMergeUtil.mergeVariables(
      [],
      [{ key: 'AUTHOR_NAME', value: 'ada', sensitive: false }]
    );
    expect(plain[0]?.sensitive).toBe(false);
  });

  it('preserves comments from incoming or previous', () => {
    const merged = PAMEnvVariableMergeUtil.mergeVariables(
      [
        {
          key: 'A',
          value: '1',
          sensitive: false,
          comments: ['# old note']
        }
      ],
      [
        { key: 'A', value: '2', sensitive: false },
        {
          key: 'B',
          value: '3',
          sensitive: false,
          comments: ['# new note']
        }
      ]
    );

    expect(merged).toEqual([
      {
        key: 'A',
        value: '2',
        sensitive: false,
        comments: ['# old note']
      },
      {
        key: 'B',
        value: '3',
        sensitive: false,
        comments: ['# new note']
      }
    ]);
  });

  it('does not downgrade sensitive, but can upgrade an existing variable', () => {
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
        sensitive: true
      }
    ]);
  });

  it('upgrades an existing variable and keeps its stored value when incoming is empty', () => {
    const merged = PAMEnvVariableMergeUtil.mergeVariables(
      [{ key: 'API_TOKEN', value: 'stored-secret', sensitive: false }],
      [{ key: 'API_TOKEN', value: '', sensitive: true }]
    );
    expect(merged).toEqual([
      { key: 'API_TOKEN', value: 'stored-secret', sensitive: true }
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
