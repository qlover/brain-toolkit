import { mkdtemp, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { PamCliEnvMergeUtil } from '../src/impls/PamCliEnvMergeUtil';
import type { PamCliResolvedVarType } from '../src/interfaces/PamCliTypes';

const remote: readonly PamCliResolvedVarType[] = [
  { key: 'API_URL', value: 'https://pam.dev', sensitive: false },
  { key: 'SECRET', value: 'pam-secret', sensitive: true },
  { key: 'ONLY_REMOTE', value: 'from-pam', sensitive: false }
];

describe('PamCliEnvMergeUtil.merge', () => {
  it('remote priority: PAM wins except keepEnv', () => {
    const result = PamCliEnvMergeUtil.merge(
      { API_URL: 'shell', SECRET: 'shell-secret', KEEP: '1' },
      remote,
      { priority: 'remote', keepEnv: ['API_URL'] }
    );
    expect(result.env.API_URL).toBe('shell');
    expect(result.env.SECRET).toBe('pam-secret');
    expect(result.env.ONLY_REMOTE).toBe('from-pam');
    expect(result.picks.process).toEqual(['API_URL']);
    expect(result.warnings.some((w) => w.kind === 'remote_sensitive_local_plaintext')).toBe(
      false
    );
  });

  it('remote priority warns when keepEnv keeps plaintext for sensitive key', () => {
    const result = PamCliEnvMergeUtil.merge(
      { SECRET: 'local-plain' },
      remote,
      { priority: 'remote', keepEnv: ['SECRET'] }
    );
    expect(result.env.SECRET).toBe('local-plain');
    expect(result.warnings).toEqual([
      {
        kind: 'remote_sensitive_local_plaintext',
        keys: ['SECRET']
      }
    ]);
  });

  it('local priority: process → file → remote', () => {
    const result = PamCliEnvMergeUtil.merge(
      { API_URL: 'from-process' },
      remote,
      {
        priority: 'local',
        fileLayer: {
          API_URL: 'from-file',
          SECRET: 'from-file-secret',
          FILE_ONLY: 'file-only'
        }
      }
    );
    expect(result.env.API_URL).toBe('from-process');
    expect(result.env.SECRET).toBe('from-file-secret');
    expect(result.env.ONLY_REMOTE).toBe('from-pam');
    expect(result.env.FILE_ONLY).toBe('file-only');
    expect(result.picks.process).toEqual(['API_URL']);
    expect(result.picks.file).toEqual(['FILE_ONLY', 'SECRET']);
    expect(result.picks.remote).toEqual(['ONLY_REMOTE']);
    expect(result.warnings).toEqual([
      {
        kind: 'remote_sensitive_local_plaintext',
        keys: ['SECRET']
      }
    ]);
  });

  it('local priority resolves sensitive placeholders to PAM plaintext', () => {
    const result = PamCliEnvMergeUtil.merge(
      {},
      remote,
      {
        priority: 'local',
        fileLayer: {
          SECRET: '__PAM_SENSITIVE_abcdef0123456789__',
          API_URL: 'https://file.dev'
        }
      }
    );
    expect(result.env.SECRET).toBe('pam-secret');
    expect(result.env.API_URL).toBe('https://file.dev');
    expect(result.picks.placeholder).toEqual(['SECRET']);
    expect(result.warnings).toEqual([]);
  });

  it('local priority warns on orphan placeholders and does not inject them', () => {
    const result = PamCliEnvMergeUtil.merge(
      { ORPHAN: '__PAM_SENSITIVE_deadbeef__' },
      remote,
      { priority: 'local' }
    );
    expect(result.env.ORPHAN).toBeUndefined();
    expect(result.warnings).toEqual([
      { kind: 'orphan_placeholder', keys: ['ORPHAN'] }
    ]);
  });
});

describe('PamCliEnvMergeUtil.loadFileLayer', () => {
  it('loads Next-style chain with later files winning', async () => {
    const dir = await mkdtemp(join(tmpdir(), 'pamenv-merge-'));
    await writeFile(join(dir, '.env'), 'A=base\nB=base\n', 'utf8');
    await writeFile(join(dir, '.env.local'), 'B=local\nC=local\n', 'utf8');
    await writeFile(
      join(dir, '.env.development'),
      'C=dev\nD=dev\n',
      'utf8'
    );
    await writeFile(
      join(dir, '.env.development.local'),
      'D=dev-local\n',
      'utf8'
    );
    const layer = await PamCliEnvMergeUtil.loadFileLayer(dir, 'development');
    expect(layer).toEqual({
      A: 'base',
      B: 'local',
      C: 'dev',
      D: 'dev-local'
    });
  });
});
