import { describe, expect, it, vi } from 'vitest';
import { BrainOAuthUserStore } from '@server/services/BrainOAuthUserStore';
import type { LoggerInterface } from '@qlover/logger';
import type { SupabaseRepo } from '@qlover/next-kit/server';

type Result = {
  data: unknown;
  error: { code?: string; message: string } | null;
};

/**
 * Minimal PostgREST builder fake: every chain call records itself; awaiting
 * (or `.single()` / `.maybeSingle()`) resolves the next queued result for the table.
 */
function createFakeSupabase(results: Record<string, Result[]>) {
  const calls: { table: string; method: string; args: unknown[] }[] = [];

  const from = (table: string) => {
    const next = (): Promise<Result> =>
      Promise.resolve(results[table]?.shift() ?? { data: null, error: null });
    const builder: Record<string, unknown> = {};
    for (const method of ['select', 'insert', 'update', 'upsert', 'eq']) {
      builder[method] = (...args: unknown[]) => {
        calls.push({ table, method, args });
        return builder;
      };
    }
    builder.single = next;
    builder.maybeSingle = next;
    builder.then = (
      resolve: (value: Result) => unknown,
      reject: (reason: unknown) => unknown
    ) => next().then(resolve, reject);
    return builder;
  };

  return { client: { from }, calls };
}

function createStore(results: Record<string, Result[]>) {
  const fake = createFakeSupabase(results);
  const logger = { warn: vi.fn() } as unknown as LoggerInterface;
  const repo = {
    getAdminSupabase: async () => fake.client
  } as unknown as SupabaseRepo<unknown>;
  return { store: new BrainOAuthUserStore(logger, repo), calls: fake.calls };
}

const draft = {
  provider: 'brain',
  externalUserId: '42',
  email: 'Alice@Example.com',
  name: 'Alice'
};

describe('BrainOAuthUserStore', () => {
  it('creates users with a lowercased email', async () => {
    const { store, calls } = createStore({
      brain_oauth_users: [{ data: { id: 'u-1' }, error: null }]
    });

    await expect(store.createUser(draft)).resolves.toBe('u-1');

    const insert = calls.find((c) => c.method === 'insert');
    expect(insert?.args[0]).toMatchObject({ email: 'alice@example.com' });
  });

  it('reuses the existing user on email conflict when unlinked', async () => {
    const { store } = createStore({
      brain_oauth_users: [
        { data: null, error: { code: '23505', message: 'duplicate' } },
        { data: { id: 'u-existing' }, error: null }
      ],
      brain_oauth_user_links: [{ data: null, error: null }]
    });

    await expect(store.createUser(draft)).resolves.toBe('u-existing');
  });

  it('rejects email conflict linked to another external id', async () => {
    const { store } = createStore({
      brain_oauth_users: [
        { data: null, error: { code: '23505', message: 'duplicate' } },
        { data: { id: 'u-existing' }, error: null }
      ],
      brain_oauth_user_links: [
        { data: { external_user_id: '99' }, error: null }
      ]
    });

    await expect(store.createUser(draft)).rejects.toThrow(
      /already linked to a different brain user/
    );
  });

  it('resolves links by external id', async () => {
    const { store } = createStore({
      brain_oauth_user_links: [{ data: { user_id: 'u-1' }, error: null }]
    });

    await expect(store.findAuthUserIdByExternalId('brain', '42')).resolves.toBe(
      'u-1'
    );
  });

  it('upserts links keyed by user_id', async () => {
    const { store, calls } = createStore({});

    await store.upsertLink('u-1', draft);

    const upsert = calls.find((c) => c.method === 'upsert');
    expect(upsert?.args[0]).toMatchObject({
      user_id: 'u-1',
      provider: 'brain',
      external_user_id: '42'
    });
    expect(upsert?.args[1]).toEqual({ onConflict: 'user_id' });
  });

  it('swallows metadata refresh errors', async () => {
    const { store } = createStore({
      brain_oauth_users: [
        { data: null, error: { code: '23505', message: 'duplicate' } }
      ]
    });

    await expect(
      store.refreshMetadata('u-1', { ...draft, email: 'x@y.z' })
    ).resolves.toBeUndefined();
  });
});
