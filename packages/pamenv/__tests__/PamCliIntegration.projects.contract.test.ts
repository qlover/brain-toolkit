import { afterEach, describe, expect, it, vi } from 'vitest';
import { ProjectsCommand } from '../src/commands/ProjectsCommand';
import {
  MEMBER_PERMS,
  OWNER_PERMS,
  memberProject,
  ownerProject
} from './helpers/PamCliIntegrationFixtures';
import {
  createPamCliIntegrationContext,
  type PamCliIntegrationContextType
} from './helpers/PamCliIntegrationHarness';

describe('pamenv projects contract (mock PAM)', () => {
  let ctx: PamCliIntegrationContextType | undefined;
  let logSpy: ReturnType<typeof vi.spyOn>;

  afterEach(async () => {
    await ctx?.cleanup();
    ctx = undefined;
    vi.clearAllMocks();
    vi.restoreAllMocks();
  });

  function mockConsole(): void {
    vi.spyOn(console, 'error').mockImplementation(() => undefined);
    logSpy = vi.spyOn(console, 'log').mockImplementation(() => undefined);
  }

  it('sends web-aligned filters and sort on the wire', async () => {
    mockConsole();
    ctx = await createPamCliIntegrationContext();
    ctx.mock.setHandlers({
      projects: [
        {
          ...ownerProject(),
          category: 'frontend'
        } as ReturnType<typeof ownerProject> & { category: string }
      ]
    });

    await new ProjectsCommand(ctx.apiClient).run(undefined, {
      category: 'frontend',
      visibility: 'private',
      sortBy: 'updated_at',
      sortOrder: 'asc',
      page: 1,
      pageSize: 10
    });

    const search = ctx.mock.requests.find((item) =>
      item.url.startsWith('/api/pam/search')
    );
    expect(search).toBeTruthy();
    const url = new URL(search!.url, 'http://127.0.0.1');
    expect(JSON.parse(url.searchParams.get('filters')!)).toMatchObject({
      view: 'compact',
      category: 'frontend',
      visibility: 'private'
    });
    expect(JSON.parse(url.searchParams.get('sort')!)[1]).toEqual({
      orderBy: 'updated_at',
      order: 'asc'
    });
    expect(url.searchParams.get('pageSize')).toBe('10');
    expect(url.searchParams.get('view')).toBe('compact');
  });

  it('defaults to pageSize 10 like the web home list', async () => {
    mockConsole();
    ctx = await createPamCliIntegrationContext();
    ctx.mock.setHandlers({ projects: [ownerProject()] });

    await new ProjectsCommand(ctx.apiClient).run();

    const search = ctx.mock.requests.find((item) =>
      item.url.startsWith('/api/pam/search')
    );
    expect(search).toBeTruthy();
    const url = new URL(search!.url, 'http://127.0.0.1');
    expect(url.searchParams.get('page')).toBe('1');
    expect(url.searchParams.get('pageSize')).toBe('10');
    expect(url.searchParams.get('view')).toBe('compact');
  });

  it('--mine / --writable are sent as filters on the wire', async () => {
    mockConsole();
    ctx = await createPamCliIntegrationContext();
    ctx.mock.setHandlers({ projects: [ownerProject()] });

    await new ProjectsCommand(ctx.apiClient).run(undefined, {
      mine: true,
      writable: true
    });

    const search = ctx.mock.requests.find((item) =>
      item.url.startsWith('/api/pam/search')
    );
    expect(search).toBeTruthy();
    const url = new URL(search!.url, 'http://127.0.0.1');
    expect(JSON.parse(url.searchParams.get('filters')!)).toMatchObject({
      view: 'compact',
      mine: true,
      writable: true
    });
  });

  it('--mine lists only strict owners; --writable includes team editors', async () => {
    mockConsole();
    ctx = await createPamCliIntegrationContext();
    const owned = ownerProject({
      id: '11111111-1111-4111-8111-111111111111',
      slug: 'owned-app',
      name: 'Owned',
      is_owner: true,
      my_role: 'owner',
      permissions: [...OWNER_PERMS]
    });
    const team = memberProject({
      id: '22222222-2222-4222-8222-222222222222',
      slug: 'team-app',
      name: 'Team',
      my_role: 'member',
      can_edit: true,
      permissions: [...MEMBER_PERMS, 'pam_project_edit']
    });
    const readonly = ownerProject({
      id: '33333333-3333-4333-8333-333333333333',
      slug: 'public-app',
      name: 'Public',
      is_owner: false,
      my_role: 'none',
      permissions: []
    });
    ctx.mock.setHandlers({ projects: [owned, team, readonly] });

    await new ProjectsCommand(ctx.apiClient).run(undefined, { mine: true });
    const mineLines = logSpy.mock.calls.map((call) => String(call[0]));
    expect(mineLines.some((line) => line.includes('owned-app'))).toBe(true);
    expect(mineLines.some((line) => line.includes('team-app'))).toBe(false);

    logSpy.mockClear();
    await new ProjectsCommand(ctx.apiClient).run(undefined, {
      writable: true
    });
    const writableLines = logSpy.mock.calls.map((call) => String(call[0]));
    expect(writableLines.some((line) => line.includes('owned-app'))).toBe(true);
    expect(writableLines.some((line) => line.includes('team-app'))).toBe(true);
    expect(writableLines.some((line) => line.includes('public-app'))).toBe(
      false
    );
  });

  it('prints compact role labels without dumping web card fields', async () => {
    mockConsole();
    ctx = await createPamCliIntegrationContext();
    ctx.mock.setHandlers({
      projects: [
        ownerProject({
          slug: 'fe-base',
          name: 'FE Base',
          is_owner: true,
          my_role: 'owner'
        }),
        memberProject({
          slug: 'pam',
          name: 'PAM',
          my_role: 'member',
          can_edit: true,
          permissions: [...MEMBER_PERMS, 'pam_project_edit']
        })
      ]
    });

    await new ProjectsCommand(ctx.apiClient).run();
    const lines = logSpy.mock.calls.map((call) => String(call[0]));
    // Header + aligned columns; role is its own column (not "(owner)" suffix).
    expect(lines[0]).toMatch(/SLUG|标识/);
    expect(lines.some((line) => /\bowner\b/.test(line))).toBe(true);
    expect(lines.some((line) => /member, writable/.test(line))).toBe(true);
    expect(lines.every((line) => !/description|category|created_at/i.test(line))).toBe(
      true
    );
    // Default hides UUID; verbose shows it.
    const uuid =
      /[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/i;
    expect(lines.every((line) => !uuid.test(line))).toBe(true);
    // Pagination footer from search meta (total / page).
    expect(
      lines.some(
        (line) =>
          /共\s*2\s*个/.test(line) ||
          /total\s+2\b/i.test(line) ||
          /page\s+1\/1/i.test(line) ||
          /第\s*1\/1\s*页/.test(line)
      )
    ).toBe(true);

    logSpy.mockClear();
    await new ProjectsCommand(ctx.apiClient).run(undefined, { verbose: true });
    const verboseLines = logSpy.mock.calls.map((call) => String(call[0]));
    expect(verboseLines.some((line) => uuid.test(line))).toBe(true);
  });

  it('treats offset+loaded total as a lower bound when hasMore', async () => {
    mockConsole();
    // Production PAM skips exact count on page 2+ and sets total=offset+loaded.
    const items = Array.from({ length: 10 }, (_, i) =>
      ownerProject({ slug: `p${i}`, name: `P${i}` })
    );
    const api = {
      searchProjects: async () => ({
        items,
        page: 2,
        pageSize: 10,
        total: 20,
        hasMore: true
      })
    };
    await new ProjectsCommand(api as never).run(undefined, {
      page: 2,
      pageSize: 10
    });
    const lines = logSpy.mock.calls.map((call) => String(call[0]));
    const footer = lines[lines.length - 1] ?? '';
    expect(footer).toMatch(/至少\s*20|at least\s+20/i);
    expect(footer).not.toMatch(/第\s*2\/2\s*页|page\s+2\/2/i);
    expect(footer).toMatch(/--page\s*3|page 3/i);
  });
});
