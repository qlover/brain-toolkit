import { describe, expect, it, vi } from 'vitest';

vi.mock('@qlover/next-kit/server', () => {
  class RequestLogsRepository {
    public insert = vi.fn(async () => undefined);
    public search = vi.fn(async () => ({ items: [], total: 0 }));
    protected serverContext = { getState: () => 'req-1' };
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
  const repo = new (UserScopedRequestLogsRepository as unknown as new () => InstanceType<
    typeof UserScopedRequestLogsRepository
  >)();
  return { repo, spies: repo as unknown as Spies };
}

describe('UserScopedRequestLogsRepository', () => {
  it('persists user_id on auth logs', async () => {
    const { repo, spies } = createRepo();
    await repo.insertWithAuth({
      event_type: 'logout',
      auth_provider: 'brain',
      userAgent: 'ua',
      ipAddress: '1.1.1.1',
      user_id: 'u-1'
    });
    expect(spies.insert).toHaveBeenCalledWith({
      data: expect.objectContaining({
        event_category: 'auth',
        event_type: 'logout',
        request_id: 'req-1',
        user_id: 'u-1'
      })
    });
  });

  it('omits user_id when absent', async () => {
    const { repo, spies } = createRepo();
    await repo.insertWithAuth({
      event_type: 'login',
      auth_provider: 'brain',
      userAgent: null,
      ipAddress: null
    });
    const [[arg]] = spies.insert.mock.calls as [[{ data: object }]];
    expect(arg.data).not.toHaveProperty('user_id');
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
