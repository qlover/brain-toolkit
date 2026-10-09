import { describe, expect, it, vi } from 'vitest';

const adminInsert = vi.fn(
  async (): Promise<{ error: { message: string } | null }> => ({ error: null })
);
const adminFrom = vi.fn(() => ({ insert: adminInsert }));

vi.mock('@qlover/next-kit/server', () => {
  class RequestLogsRepository {
    public insert = vi.fn(async () => undefined);
    public search = vi.fn(async () => ({ items: [], total: 0 }));
    protected serverContext = { getState: () => 'req-1' };
    public getAdminSupabase(): { from: typeof adminFrom } {
      return { from: adminFrom };
    }
    public getRepoName(): string {
      return 'request_logs';
    }
  }
  return { RequestLogsRepository, Operators: { eq: '=' } };
});

const { UserScopedRequestLogsRepository } = await import(
  '../src/server/repositorys/UserScopedRequestLogsRepository'
);

type Spies = {
  insert: ReturnType<typeof vi.fn>;
  search: ReturnType<typeof vi.fn>;
};

function createRepo() {
  adminInsert.mockClear();
  adminFrom.mockClear();
  const repo = new (UserScopedRequestLogsRepository as unknown as new () => InstanceType<
    typeof UserScopedRequestLogsRepository
  >)();
  return { repo, spies: repo as unknown as Spies };
}

describe('UserScopedRequestLogsRepository', () => {
  it('persists user_id on auth logs via the service-role client', async () => {
    const { repo, spies } = createRepo();
    await repo.insertWithAuth({
      event_type: 'logout',
      auth_provider: 'brain',
      userAgent: 'ua',
      ipAddress: '1.1.1.1',
      user_id: 'u-1'
    });
    expect(adminFrom).toHaveBeenCalledWith('request_logs');
    expect(adminInsert).toHaveBeenCalledWith(
      expect.objectContaining({
        event_category: 'auth',
        event_type: 'logout',
        request_id: 'req-1',
        user_id: 'u-1'
      })
    );
    expect(spies.insert).not.toHaveBeenCalled();
  });

  it('omits user_id when absent', async () => {
    const { repo } = createRepo();
    await repo.insertWithAuth({
      event_type: 'login',
      auth_provider: 'brain',
      userAgent: null,
      ipAddress: null
    });
    const [[row]] = adminInsert.mock.calls as unknown as [[object]];
    expect(row).not.toHaveProperty('user_id');
  });

  it('throws when the insert fails', async () => {
    const { repo } = createRepo();
    adminInsert.mockResolvedValueOnce({ error: { message: 'denied' } });
    await expect(
      repo.insertWithAuth({
        event_type: 'login',
        auth_provider: 'brain',
        userAgent: null,
        ipAddress: null
      })
    ).rejects.toThrow(/denied/);
  });

  it('replaces caller where with owner filter', async () => {
    const { repo, spies } = createRepo();
    await repo.searchForUser('u-1', {
      page: 1,
      pageSize: 10,
      where: [['user_id', '=', 'other']]
    } as never);
    expect(spies.search).toHaveBeenCalledWith({
      page: 1,
      pageSize: 10,
      where: [['user_id', '=', 'u-1']]
    });
  });
});
