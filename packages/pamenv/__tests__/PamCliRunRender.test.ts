import { afterEach, describe, expect, it, vi } from 'vitest';
import { mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { PushCommand } from '../src/commands/PushCommand';
import { RenderCommand } from '../src/commands/RenderCommand';
import { RunCommand } from '../src/commands/RunCommand';
import { PamCliApiError } from '../src/impls/PamCliApiError';
import type { PamCliParsedVarType } from '../src/impls/PamCliDotenvUtil';
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

describe('RunCommand variable resolution', () => {
  class TestRunCommand extends RunCommand {
    public resolve(
      ref: string,
      envName?: string
    ): Promise<{
      variables: readonly PamCliResolvedVarType[];
      projectSlug: string;
      envName: string;
    }> {
      return this.resolveVariables(ref, { envName });
    }
  }

  const project: PamCliProjectType = {
    id: 'p1',
    slug: 'app',
    name: 'App',
    my_role: 'member',
    permissions: ['pam_environments_inject'],
    environments: [{ id: 'e1', name: 'local' }]
  };
  const injected = [{ key: 'TOKEN', value: 'v', sensitive: true }];

  it('with -e uses one by-name request and skips the project search', async () => {
    const listProjects = vi.fn();
    const api = {
      listProjects,
      resolveEnvironmentByName: async () => ({
        projectId: 'p1',
        projectSlug: 'app',
        environmentId: 'e1',
        environmentName: 'local',
        variables: injected
      })
    };

    const result = await new TestRunCommand(api as never).resolve(
      'app',
      'local'
    );
    expect(result).toEqual({
      variables: injected,
      projectSlug: 'app',
      envName: 'local'
    });
    expect(listProjects).not.toHaveBeenCalled();
  });

  it('falls back to search + resolve on 404 (older server)', async () => {
    const api = {
      resolveEnvironmentByName: async () => {
        throw new PamCliApiError({ id: 'not_found', httpStatus: 404 });
      },
      listProjects: async () => [project],
      resolveEnvironment: async () => ({ variables: injected })
    };

    const result = await new TestRunCommand(api as never).resolve(
      'app',
      'local'
    );
    expect(result.variables).toEqual(injected);
    expect(result.envName).toBe('local');
  });

  it('does not fall back on 403 auth denial', async () => {
    const listProjects = vi.fn();
    const api = {
      listProjects,
      resolveEnvironmentByName: async () => {
        throw new PamCliApiError({
          id: 'forbidden',
          httpStatus: 403
        });
      }
    };

    await expect(
      new TestRunCommand(api as never).resolve('app', 'local')
    ).rejects.toBeInstanceOf(PamCliApiError);
    expect(listProjects).not.toHaveBeenCalled();
  });

  it('does not retry a protected environment', async () => {
    const listProjects = vi.fn();
    const api = {
      listProjects,
      resolveEnvironmentByName: async () => {
        throw new PamCliApiError({
          id: 'api:pam_env_protected',
          httpStatus: 403
        });
      }
    };

    await expect(
      new TestRunCommand(api as never).resolve('app', 'local')
    ).rejects.toBeInstanceOf(PamCliApiError);
    expect(listProjects).not.toHaveBeenCalled();
  });
});

describe('PamCliRunWarningUtil', () => {
  it('finds .env files that redefine injected keys, skipping templates', async () => {
    const dir = await mkdtemp(join(tmpdir(), 'pamenv-run-'));
    try {
      await writeFile(
        join(dir, '.env.local'),
        'TOKEN=old\nOTHER=1\nAPI_KEY=__PAM_SENSITIVE_abc__\n'
      );
      await writeFile(join(dir, '.env.example'), 'TOKEN=\n');
      const overlaps = await PamCliRunWarningUtil.findDotenvOverlaps(
        dir,
        new Set(['TOKEN', 'API_URL', 'API_KEY'])
      );
      expect(overlaps).toEqual([
        {
          file: '.env.local',
          keys: ['TOKEN', 'API_KEY'],
          placeholderKeys: ['API_KEY']
        }
      ]);
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

  it('denies export/inject when permissions array is missing (fail-closed)', () => {
    const admin: PamCliProjectType = { ...base, my_role: 'admin' };
    expect(PamCliProjectAccessUtil.canExport(admin)).toBe(false);
    const writer: PamCliProjectType = { ...base, can_edit: true };
    expect(PamCliProjectAccessUtil.canInject(writer)).toBe(false);
    expect(PamCliProjectAccessUtil.canExport(writer)).toBe(false);
  });
});

describe('RenderCommand sensitive values', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  const project: PamCliProjectType = {
    id: 'p1',
    slug: 'app',
    name: 'App',
    my_role: 'admin',
    permissions: ['pam_environments_export'],
    environments: [{ id: 'e1', name: 'local' }]
  };

  async function render(sensitivePlaceholder?: string): Promise<{
    output: unknown;
    message: string;
  }> {
    const api = {
      listProjects: async () => [project],
      exportEnvironment: async () => ({
        projectId: 'p1',
        projectSlug: 'app',
        environmentId: 'e1',
        environmentName: 'local',
        content: '',
        sensitiveKeys: ['TOKEN'],
        ...(sensitivePlaceholder ? { sensitivePlaceholder } : {}),
        variables: [
          { key: 'API_URL', value: 'https://x.dev', sensitive: false },
          { key: 'TOKEN', value: sensitivePlaceholder ?? '', sensitive: true }
        ]
      })
    };
    const stdout = vi
      .spyOn(process.stdout, 'write')
      .mockImplementation(() => true);
    const stderr = vi.spyOn(console, 'error').mockImplementation(() => {});

    await new RenderCommand(api as never).run('app', {
      envName: 'local',
      format: 'json'
    });

    return {
      output: JSON.parse(String(stdout.mock.calls[0]?.[0])),
      message: String(stderr.mock.calls[0]?.[0])
    };
  }

  it('renders sensitive values as the env placeholder', async () => {
    const { output, message } = await render('__PAM_SENSITIVE_abc__');
    expect(output).toEqual({
      API_URL: 'https://x.dev',
      TOKEN: '__PAM_SENSITIVE_abc__'
    });
    expect(message).toContain('render_sensitive_placeholder');
  });

  it('writes empty keep values when the server sends no placeholder', async () => {
    const { output, message } = await render();
    expect(output).toEqual({ API_URL: 'https://x.dev', TOKEN: '' });
    expect(message).toContain('render_sensitive_empty');
  });

  it('forces placeholder when export leaks sensitive plaintext', async () => {
    const api = {
      listProjects: async () => [project],
      exportEnvironment: async () => ({
        projectId: 'p1',
        projectSlug: 'app',
        environmentId: 'e1',
        environmentName: 'local',
        content: '',
        sensitiveKeys: ['TOKEN'],
        sensitivePlaceholder: '__PAM_SENSITIVE_abc__',
        variables: [
          { key: 'API_URL', value: 'https://x.dev', sensitive: false },
          { key: 'TOKEN', value: 'leaked-secret', sensitive: true }
        ]
      })
    };
    const stdout = vi
      .spyOn(process.stdout, 'write')
      .mockImplementation(() => true);
    vi.spyOn(console, 'error').mockImplementation(() => {});

    await new RenderCommand(api as never).run('app', {
      envName: 'local',
      format: 'json'
    });

    expect(JSON.parse(String(stdout.mock.calls[0]?.[0]))).toEqual({
      API_URL: 'https://x.dev',
      TOKEN: '__PAM_SENSITIVE_abc__'
    });
  });
});

describe('PushCommand sensitive values', () => {
  class TestPushCommand extends PushCommand {
    public clear(
      variables: PamCliParsedVarType[],
      remote: ReadonlySet<string>,
      placeholder?: string
    ): ReturnType<PushCommand['clearSensitiveValues']> {
      return this.clearSensitiveValues(variables, remote, placeholder);
    }

    public assertPlaceholders(
      variables: PamCliParsedVarType[],
      remote: ReadonlySet<string>,
      placeholder?: string,
      remoteKeys?: ReadonlySet<string>
    ): void {
      this.assertPlaceholdersValid(
        variables,
        'local',
        remote,
        placeholder,
        remoteKeys
      );
    }

    public assertPresent(
      variables: PamCliParsedVarType[],
      remote: ReadonlySet<string>
    ): void {
      this.assertSensitiveValuesPresent(variables, 'local', remote);
    }

    public applyOverrides(
      variables: PamCliParsedVarType[],
      overrides: Record<string, string>,
      remote: ReadonlySet<string>
    ): PamCliParsedVarType[] {
      return this.applyAssignmentOverrides(variables, overrides, remote);
    }

    public unset(
      variables: PamCliParsedVarType[],
      keys: ReadonlySet<string>
    ): PamCliParsedVarType[] {
      return this.removeUnsetKeys(variables, keys);
    }
  }

  const parsed = (
    key: string,
    value: string,
    sensitive: boolean
  ): PamCliParsedVarType => ({
    key,
    value,
    sensitive,
    comments: [],
    trailingComment: ''
  });

  const push = new TestPushCommand(null as never, null as never);

  it('clears sensitive values (local marker or remote) after push', () => {
    const result = push.clear(
      [
        parsed('API_URL', 'https://x.dev', false),
        parsed('NEW_SECRET', 's1', true),
        parsed('OLD_SECRET', 's2', false),
        parsed('KEPT_SECRET', '', false),
        // Unmarked lookalike keys are not auto-sensitive — value stays.
        parsed('API_TOKEN', 'leak-me', false)
      ],
      new Set(['OLD_SECRET', 'KEPT_SECRET'])
    );
    expect(result.keys).toEqual(['NEW_SECRET', 'OLD_SECRET']);
    expect(result.variables.map((item) => [item.key, item.value])).toEqual([
      ['API_URL', 'https://x.dev'],
      ['NEW_SECRET', ''],
      ['OLD_SECRET', ''],
      ['KEPT_SECRET', ''],
      ['API_TOKEN', 'leak-me']
    ]);
    expect(
      result.variables
        .filter((item) => item.key !== 'API_URL' && item.key !== 'API_TOKEN')
        .every((item) => item.sensitive)
    ).toBe(true);
    expect(
      result.variables.find((item) => item.key === 'API_TOKEN')?.sensitive
    ).toBe(false);
  });

  it('replaces sensitive values with the env placeholder when known', () => {
    const placeholder = '__PAM_SENSITIVE_abc__';
    const result = push.clear(
      [
        parsed('NEW_SECRET', 's1', true),
        parsed('KEPT_SECRET', placeholder, true)
      ],
      new Set(['KEPT_SECRET']),
      placeholder
    );
    expect(result.keys).toEqual(['NEW_SECRET']);
    expect(result.variables.map((item) => item.value)).toEqual([
      placeholder,
      placeholder
    ]);
  });

  it('accepts only this env placeholder on keys already sensitive remotely', () => {
    const placeholder = '__PAM_SENSITIVE_abc__';
    const remote = new Set(['OLD_SECRET']);
    expect(() =>
      push.assertPlaceholders(
        [parsed('OLD_SECRET', placeholder, true)],
        remote,
        placeholder
      )
    ).not.toThrow();
    expect(() =>
      push.assertPlaceholders(
        [parsed('OLD_SECRET', '__PAM_SENSITIVE_other__', true)],
        remote,
        placeholder
      )
    ).toThrow(/push_placeholder_invalid/);
    expect(() =>
      push.assertPlaceholders(
        [parsed('NEW_SECRET', placeholder, true)],
        remote,
        placeholder
      )
    ).toThrow(/push_placeholder_invalid/);
    const placeholderKeep = '__PAM_SENSITIVE_abc__';
    // Lookalike name alone is not enough: local must mark sensitive to keep.
    expect(() =>
      push.assertPlaceholders(
        [parsed('DATABASE_URL', placeholderKeep, true)],
        new Set(),
        placeholderKeep,
        new Set(['DATABASE_URL'])
      )
    ).not.toThrow();
    expect(() =>
      push.assertPlaceholders(
        [parsed('DATABASE_URL', placeholderKeep, false)],
        new Set(),
        placeholderKeep,
        new Set(['DATABASE_URL'])
      )
    ).toThrow(/push_placeholder_invalid/);
    expect(() =>
      push.assertPlaceholders(
        [parsed('API_URL', placeholderKeep, false)],
        new Set(),
        placeholderKeep,
        new Set(['API_URL'])
      )
    ).toThrow(/push_placeholder_invalid/);
  });

  it('empty value keeps an existing remote secret, but not a new one', () => {
    expect(() =>
      push.assertPresent([parsed('OLD_SECRET', '', true)], new Set(['OLD_SECRET']))
    ).not.toThrow();
    expect(() =>
      push.assertPresent([parsed('NEW_SECRET', '', true)], new Set())
    ).toThrow();
  });

  it('parseAssignments accepts KEY=value and rejects invalid forms', () => {
    expect(PushCommand.parseAssignments(['A=1', 'B=x=y'])).toEqual({
      A: '1',
      B: 'x=y'
    });
    expect(PushCommand.parseAssignments(['EMPTY='])).toEqual({ EMPTY: '' });
    expect(() => PushCommand.parseAssignments(['nope'])).toThrow(
      /push_assignment_invalid/
    );
    expect(() => PushCommand.parseAssignments(['=nope'])).toThrow(
      /push_assignment_invalid/
    );
  });

  it('applies overrides then unset on the file snapshot', () => {
    const base = [
      parsed('API_URL', 'https://x.dev', false),
      parsed('TOKEN', '__PAM_SENSITIVE_abc__', true),
      parsed('DROP_ME', '1', false)
    ];
    const withOverrides = push.applyOverrides(
      base,
      { TOKEN: 'rotated', NEW: '2' },
      new Set(['TOKEN'])
    );
    expect(withOverrides.map((item) => [item.key, item.value, item.sensitive])).toEqual([
      ['API_URL', 'https://x.dev', false],
      ['TOKEN', 'rotated', true],
      ['DROP_ME', '1', false],
      ['NEW', '2', false]
    ]);
    const afterUnset = push.unset(
      withOverrides,
      new Set(['DROP_ME', 'MISSING'])
    );
    expect(afterUnset.map((item) => item.key)).toEqual([
      'API_URL',
      'TOKEN',
      'NEW'
    ]);
  });
});
