import { describe, expect, it } from 'vitest';
import { mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { RunCommand } from '../src/commands/RunCommand';
import { PamCliOutputAdapterRegistry } from '../src/impls/PamCliOutputAdapters';
import { PamCliProjectAccessUtil } from '../src/impls/PamCliProjectAccessUtil';
import { PamCliRunWarningUtil } from '../src/impls/PamCliRunWarningUtil';
import type {
  PamCliProjectType,
  PamCliResolvedVarType
} from '../src/interfaces/PamCliTypes';

const vars: PamCliResolvedVarType[] = [
  { key: 'API_URL', value: 'https://x.dev', sensitive: false },
  {
    key: 'TOKEN',
    value: 'a "quoted"\nline',
    sensitive: true,
    comments: ['# api token']
  }
];

describe('PamCliOutputAdapterRegistry', () => {
  it('lists the four formats', () => {
    expect(PamCliOutputAdapterRegistry.formats().sort()).toEqual([
      'dotenv',
      'json',
      'toml',
      'yaml'
    ]);
    expect(PamCliOutputAdapterRegistry.isFormat('ini')).toBe(false);
  });

  it('dotenv keeps comments and the sensitive marker', () => {
    const text = PamCliOutputAdapterRegistry.get('dotenv').serialize(vars);
    expect(text).toContain('API_URL=https://x.dev');
    expect(text).toContain('# api token\n# pam:sensitive\nTOKEN=');
  });

  it('json is a flat object', () => {
    const text = PamCliOutputAdapterRegistry.get('json').serialize(vars);
    expect(JSON.parse(text)).toEqual({
      API_URL: 'https://x.dev',
      TOKEN: 'a "quoted"\nline'
    });
  });

  it('yaml quotes values and odd keys', () => {
    const adapter = PamCliOutputAdapterRegistry.get('yaml');
    expect(adapter.serialize(vars)).toBe(
      'API_URL: "https://x.dev"\nTOKEN: "a \\"quoted\\"\\nline"\n'
    );
    expect(
      adapter.serialize([{ key: 'a.b', value: 'v', sensitive: false }])
    ).toBe('"a.b": "v"\n');
    expect(adapter.serialize([])).toBe('{}\n');
  });

  it('toml escapes basic strings', () => {
    expect(PamCliOutputAdapterRegistry.get('toml').serialize(vars)).toBe(
      'API_URL = "https://x.dev"\nTOKEN = "a \\"quoted\\"\\nline"\n'
    );
  });
});

describe('RunCommand.mergeEnv', () => {
  it('PAM wins except keep-env keys already set in the shell', () => {
    const merged = RunCommand.mergeEnv(
      { API_URL: 'shell', TOKEN: 'shell-token', HOME: '/home/a' },
      vars,
      ['TOKEN', 'MISSING']
    );
    expect(merged.API_URL).toBe('https://x.dev');
    expect(merged.TOKEN).toBe('shell-token');
    expect(merged.HOME).toBe('/home/a');
  });

  it('keep-env does not block keys absent from the shell', () => {
    const merged = RunCommand.mergeEnv({}, vars, ['TOKEN']);
    expect(merged.TOKEN).toBe('a "quoted"\nline');
  });
});

describe('RunCommand child process', () => {
  class TestRunCommand extends RunCommand {
    public spawn(command: string[], env: NodeJS.ProcessEnv): Promise<number> {
      return this.spawnChild(command, env);
    }
  }

  it('passes injected env to the child and returns its exit code', async () => {
    const runner = new TestRunCommand(null as never);
    const code = await runner.spawn(
      [
        process.execPath,
        '-e',
        "process.exit(process.env.PAMENV_TEST === 'injected' ? 7 : 1)"
      ],
      RunCommand.mergeEnv(process.env, [
        { key: 'PAMENV_TEST', value: 'injected', sensitive: true }
      ])
    );
    expect(code).toBe(7);
  });

  it('rejects when the command cannot start', async () => {
    const runner = new TestRunCommand(null as never);
    await expect(
      runner.spawn(['pamenv-command-that-does-not-exist'], process.env)
    ).rejects.toThrow();
  });
});

describe('PamCliRunWarningUtil', () => {
  it('finds .env files that redefine injected keys, skipping templates', async () => {
    const dir = await mkdtemp(join(tmpdir(), 'pamenv-run-'));
    try {
      await writeFile(join(dir, '.env.local'), 'TOKEN=old\nOTHER=1\n');
      await writeFile(join(dir, '.env.example'), 'TOKEN=\n');
      const overlaps = await PamCliRunWarningUtil.findDotenvOverlaps(
        dir,
        new Set(['TOKEN', 'API_URL'])
      );
      expect(overlaps).toEqual([{ file: '.env.local', keys: ['TOKEN'] }]);
    } finally {
      await rm(dir, { recursive: true, force: true });
    }
  });

  it('flags sensitive keys with public bundler prefixes', () => {
    expect(
      PamCliRunWarningUtil.findPublicSensitiveKeys([
        { key: 'NEXT_PUBLIC_SECRET', value: 'x', sensitive: true },
        { key: 'VITE_URL', value: 'x', sensitive: false }
      ])
    ).toEqual(['NEXT_PUBLIC_SECRET']);
  });

  it('reports keys undeclared in a strict turbo.json', async () => {
    const dir = await mkdtemp(join(tmpdir(), 'pamenv-turbo-'));
    try {
      await writeFile(
        join(dir, 'turbo.json'),
        `{
  // comment
  "globalEnv": ["API_*"],
  "tasks": { "dev": { "passThroughEnv": ["DB_URL"] } }
}`
      );
      const result = await PamCliRunWarningUtil.findTurboUndeclared(dir, [
        'API_URL',
        'DB_URL',
        'TOKEN'
      ]);
      expect(result?.keys).toEqual(['TOKEN']);
    } finally {
      await rm(dir, { recursive: true, force: true });
    }
  });

  it('turbo v1 pipeline defaults to loose mode', () => {
    expect(PamCliRunWarningUtil.isTurboStrict({ pipeline: {} })).toBe(false);
    expect(
      PamCliRunWarningUtil.isTurboStrict({ pipeline: {}, envMode: 'strict' })
    ).toBe(true);
  });
});

describe('PamCliProjectAccessUtil inject / export', () => {
  const base = { id: '1', slug: 's', name: 'n' };

  it('member with inject only cannot export', () => {
    const member: PamCliProjectType = {
      ...base,
      permissions: ['pam_environments_inject', 'pam_project_edit']
    };
    expect(PamCliProjectAccessUtil.canInject(member)).toBe(true);
    expect(PamCliProjectAccessUtil.canExport(member)).toBe(false);
  });

  it('falls back to role flags for payloads without permissions', () => {
    const admin: PamCliProjectType = { ...base, my_role: 'admin' };
    expect(PamCliProjectAccessUtil.canExport(admin)).toBe(true);
    const writer: PamCliProjectType = { ...base, can_edit: true };
    expect(PamCliProjectAccessUtil.canInject(writer)).toBe(true);
    expect(PamCliProjectAccessUtil.canExport(writer)).toBe(false);
  });
});
