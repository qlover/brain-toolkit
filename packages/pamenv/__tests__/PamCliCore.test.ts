import { describe, expect, it } from 'vitest';
import { mkdtemp, rm, stat } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { PamCliDotenvUtil } from '../src/impls/PamCliDotenvUtil';
import { PamCliEnvDiffUtil } from '../src/impls/PamCliEnvDiffUtil';
import { PamCliEnvironmentSelectUtil } from '../src/impls/PamCliEnvironmentSelectUtil';
import { PamCliLocalEnvFileUtil } from '../src/impls/PamCliLocalEnvFileUtil';
import { PamCliPrivateFsUtil } from '../src/impls/PamCliPrivateFsUtil';
import { PamCliProjectResolveUtil } from '../src/impls/PamCliProjectResolveUtil';
import {
  PamCliSyncConflictKind,
  PamCliSyncConflictUtil
} from '../src/impls/PamCliSyncConflictUtil';
import type {
  PamCliEnvironmentSummaryType,
  PamCliProjectType
} from '../src/interfaces/PamCliTypes';

describe('PamCliDotenvUtil', () => {
  it('serializes and quotes values when needed', () => {
    const text = PamCliDotenvUtil.serialize([
      { key: 'A', value: 'simple' },
      { key: 'B', value: 'has space' },
      { key: 'C', value: '' }
    ]);
    expect(text).toContain('A=simple');
    expect(text).toContain('B="has space"');
    expect(text).toContain('C=""');
  });

  it('round-trips comments, trailing notes, and sensitive markers', () => {
    const source = `# header for A
A=simple
# pam:sensitive
# token note
TOKEN=secret # keep me
B=plain
# trailing orphan
`;
    const doc = PamCliDotenvUtil.parseDocument(source);
    expect(doc.variables[0]).toMatchObject({
      key: 'A',
      value: 'simple',
      sensitive: false,
      comments: ['# header for A']
    });
    expect(doc.variables[1]).toMatchObject({
      key: 'TOKEN',
      value: 'secret',
      sensitive: true,
      comments: ['# token note'],
      trailingComment: ' # keep me'
    });
    expect(doc.trailingComments).toEqual(['# trailing orphan']);

    const roundTrip = PamCliDotenvUtil.parseDocument(
      PamCliDotenvUtil.serializeDocument(doc)
    );
    expect(roundTrip).toEqual(doc);
  });

  it('merges remote values while keeping local comments', () => {
    const local = PamCliDotenvUtil.parseDocument(`# keep
FOO=old # trail
`);
    const merged = PamCliDotenvUtil.mergeRemotePreservingComments(local, [
      { key: 'FOO', value: 'new', sensitive: true },
      { key: 'BAR', value: '2', sensitive: false }
    ]);
    expect(merged.variables[0]).toMatchObject({
      key: 'FOO',
      value: 'new',
      sensitive: true,
      comments: ['# keep'],
      trailingComment: ' # trail'
    });
    expect(merged.variables[1]).toMatchObject({
      key: 'BAR',
      value: '2',
      comments: []
    });
  });

  it('prefers remote comments on pull when remote provides them', () => {
    const local = PamCliDotenvUtil.parseDocument(`# local only
FOO=old
`);
    const merged = PamCliDotenvUtil.mergeRemotePreservingComments(local, [
      {
        key: 'FOO',
        value: 'new',
        sensitive: false,
        comments: ['# from remote'],
        trailingComment: ''
      }
    ]);
    expect(merged.variables[0]).toMatchObject({
      key: 'FOO',
      value: 'new',
      comments: ['# from remote'],
      trailingComment: ''
    });
  });

  it('maps trailing comments into API comments array', () => {
    expect(
      PamCliDotenvUtil.toApiComments({
        comments: ['# block'],
        trailingComment: ' # trail'
      })
    ).toEqual(['# block', '# trail']);
  });
});

describe('PamCliLocalEnvFileUtil', () => {
  it('builds .env.<envName> filenames', () => {
    expect(PamCliLocalEnvFileUtil.toFileName('staging')).toBe('.env.staging');
    expect(PamCliLocalEnvFileUtil.toFileName('local')).toBe('.env.local');
  });
});

describe('PamCliEnvDiffUtil', () => {
  it('classifies created, modified, and deleted keys', () => {
    const remote = new Map([
      ['KEEP', '1'],
      ['CHANGE', 'old'],
      ['SECRET', 'hidden'],
      ['GONE', 'x']
    ]);
    const local = [
      { key: 'KEEP', value: '1' },
      { key: 'CHANGE', value: 'new' },
      { key: 'SECRET', value: 'hidden2' },
      { key: 'NEW', value: 'y', sensitive: true }
    ];
    const sensitive = new Set(['SECRET']);
    const diff = PamCliEnvDiffUtil.diff(remote, local, sensitive);

    expect(diff.created.map((item) => item.key)).toEqual(['NEW']);
    expect(diff.created[0]?.sensitive).toBe(true);
    expect(diff.modified.map((item) => item.key)).toEqual(['CHANGE', 'SECRET']);
    expect(diff.deleted.map((item) => item.key)).toEqual(['GONE']);
    expect(PamCliEnvDiffUtil.formatLine(diff.modified[1]!)).toBe(
      'SECRET=*****'
    );
    expect(PamCliEnvDiffUtil.formatLine(diff.modified[0]!)).toBe(
      'CHANGE=*****'
    );
    expect(PamCliEnvDiffUtil.formatLine(diff.created[0]!)).toBe('NEW=*****');
    expect(
      PamCliEnvDiffUtil.formatLine(diff.modified[0]!, { showValues: true })
    ).toBe('CHANGE=new');
    expect(
      PamCliEnvDiffUtil.formatLine(diff.modified[1]!, { showValues: true })
    ).toBe('SECRET=*****');
    expect(PamCliEnvDiffUtil.looksSensitiveKey('API_TOKEN')).toBe(true);
    expect(PamCliEnvDiffUtil.looksSensitiveKey('SITE_URL')).toBe(false);
  });

  it('flags large key-name changes', () => {
    expect(PamCliEnvDiffUtil.isLargeKeyChange(2, 2, 10)).toBe(true);
    expect(PamCliEnvDiffUtil.isLargeKeyChange(1, 1, 10)).toBe(false);
    expect(PamCliEnvDiffUtil.isLargeKeyChange(3, 0, 0)).toBe(true);
  });
});

describe('PamCliSyncConflictUtil', () => {
  it('classifies three-way sync states', () => {
    const base = { A: '1', B: '2' };
    expect(
      PamCliSyncConflictUtil.classify(base, { A: '1', B: '2' }, { A: '1', B: '2' })
    ).toBe(PamCliSyncConflictKind.Noop);
    expect(
      PamCliSyncConflictUtil.classify(base, { A: '9', B: '2' }, { A: '1', B: '2' })
    ).toBe(PamCliSyncConflictKind.LocalOnly);
    expect(
      PamCliSyncConflictUtil.classify(base, { A: '1', B: '2' }, { A: '1', B: '9' })
    ).toBe(PamCliSyncConflictKind.RemoteOnly);
    expect(
      PamCliSyncConflictUtil.classify(base, { A: '9', B: '2' }, { A: '1', B: '8' })
    ).toBe(PamCliSyncConflictKind.Conflict);
    expect(
      PamCliSyncConflictUtil.classify(null, { A: '1' }, { A: '2' })
    ).toBe(PamCliSyncConflictKind.NoBase);
  });
});

describe('PamCliEnvironmentSelectUtil', () => {
  const environments: PamCliEnvironmentSummaryType[] = [
    { id: 'e1', name: 'staging' },
    { id: 'e2', name: 'production' }
  ];

  it('defaults to the first environment', () => {
    expect(
      PamCliEnvironmentSelectUtil.select(environments, undefined, 'demo').name
    ).toBe('staging');
  });

  it('selects by -e name', () => {
    expect(
      PamCliEnvironmentSelectUtil.select(environments, 'production', 'demo').id
    ).toBe('e2');
  });
});

describe('PamCliProjectResolveUtil', () => {
  const projects: PamCliProjectType[] = [
    {
      id: '11111111-1111-4111-8111-111111111111',
      slug: 'alpha-app',
      name: 'Alpha'
    },
    {
      id: '22222222-2222-4222-8222-222222222222',
      slug: 'beta-service',
      name: 'Beta'
    }
  ];

  it('matches by project id first', () => {
    const project = PamCliProjectResolveUtil.findInList(
      projects,
      '22222222-2222-4222-8222-222222222222'
    );
    expect(project?.slug).toBe('beta-service');
  });

  it('matches by exact slug', () => {
    const project = PamCliProjectResolveUtil.findInList(projects, 'alpha-app');
    expect(project?.id).toBe('11111111-1111-4111-8111-111111111111');
  });

  it('falls back to slug substring', () => {
    const project = PamCliProjectResolveUtil.findInList(projects, 'beta');
    expect(project?.slug).toBe('beta-service');
  });

  it('detects uuid-like project ids', () => {
    expect(
      PamCliProjectResolveUtil.isLikelyProjectId(
        '11111111-1111-4111-8111-111111111111'
      )
    ).toBe(true);
    expect(PamCliProjectResolveUtil.isLikelyProjectId('alpha-app')).toBe(false);
  });
});

describe('PamCliPrivateFsUtil', () => {
  it('writes files with owner-only mode on POSIX', async () => {
    const dir = await mkdtemp(join(tmpdir(), 'pamenv-private-'));
    const filePath = join(dir, 'nested', 'secret.env');
    try {
      await PamCliPrivateFsUtil.writePrivateFile(filePath, 'SECRET=1\n');
      const fileStat = await stat(filePath);
      const dirStat = await stat(join(dir, 'nested'));
      if (process.platform !== 'win32') {
        expect(fileStat.mode & 0o777).toBe(0o600);
        expect(dirStat.mode & 0o777).toBe(0o700);
      } else {
        expect(fileStat.isFile()).toBe(true);
      }
    } finally {
      await rm(dir, { recursive: true, force: true });
    }
  });
});
