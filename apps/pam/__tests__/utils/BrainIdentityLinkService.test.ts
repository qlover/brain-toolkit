import { describe, expect, it, vi } from 'vitest';
import { API_BRAIN_EMAIL_CONFLICT } from '@config/i18n-identifier/api';
import type { PamUserIdentitiesRepo } from '@server/repositorys/PamUserIdentitiesRepo';
import type { PamUsersRepo } from '@server/repositorys/PamUsersRepo';
import { BrainIdentityLinkService } from '@server/services/BrainIdentityLinkService';
import type { LoggerInterface } from '@qlover/logger';
import type { SupabaseRepo } from '@qlover/next-kit/server';

// next-kit's server bundle imports `next/server`, which vitest cannot resolve.
vi.mock('@qlover/next-kit/server', () => ({ SupabaseRepo: class {} }));

const SUB = '11111111-1111-4111-8111-111111111111';
const EXISTING_ID = '22222222-2222-4222-8222-222222222222';
const CREATED_ID = '33333333-3333-4333-8333-333333333333';

type Setup = {
  links?: Record<string, string>;
  pamById?: string[];
  pamByEmail?: Record<string, string>;
  createUserResult?: {
    data: { user: { id: string } | null };
    error: { code?: string; message?: string } | null;
  };
  authUsers?: { id: string; email: string }[];
};

function createService(setup: Setup = {}) {
  const links = new Map(Object.entries(setup.links ?? {}));
  const identities = {
    findUserId: vi.fn(
      async (_p: string, sub: string) => links.get(sub) ?? null
    ),
    link: vi.fn(async (params: { externalUserId: string; userId: string }) => {
      links.set(params.externalUserId, params.userId);
      return params.userId;
    }),
    touchLastLogin: vi.fn(async () => undefined)
  };
  const pamUsers = {
    findById: vi.fn(async (id: string) =>
      setup.pamById?.includes(id) ? { id } : null
    ),
    findByEmail: vi.fn(async (email: string) => {
      const id = setup.pamByEmail?.[email.toLowerCase()];
      return id ? { id } : null;
    })
  };
  const createUser = vi.fn(
    async () =>
      setup.createUserResult ?? {
        data: { user: { id: CREATED_ID } },
        error: null
      }
  );
  const admin = {
    auth: {
      admin: {
        createUser,
        listUsers: vi.fn(async () => ({
          data: { users: setup.authUsers ?? [] },
          error: null
        }))
      }
    }
  };
  const supabaseBridge = {
    getAdminSupabase: vi.fn(async () => admin),
    throwIfError: vi.fn((result: { error: unknown }) => {
      if (result.error) {
        throw result.error;
      }
    })
  };
  const logger = { info: vi.fn(), warn: vi.fn(), error: vi.fn() };

  const service = new BrainIdentityLinkService(
    logger as unknown as LoggerInterface,
    supabaseBridge as unknown as SupabaseRepo<unknown>,
    identities as unknown as PamUserIdentitiesRepo,
    pamUsers as unknown as PamUsersRepo
  );
  return { service, identities, createUser, links };
}

describe('BrainIdentityLinkService', () => {
  it('returns the linked user and touches last login', async () => {
    const { service, identities, createUser } = createService({
      links: { [SUB]: EXISTING_ID }
    });
    const identityData = { env: 'production', account: 'a@x.com' };

    await expect(
      service.resolveUser({
        sub: SUB,
        email: 'a@x.com',
        emailVerified: false,
        identityData
      })
    ).resolves.toEqual({ userId: EXISTING_ID, created: false });
    expect(identities.touchLastLogin).toHaveBeenCalledWith(
      'brain',
      SUB,
      identityData
    );
    expect(createUser).not.toHaveBeenCalled();
  });

  it('links legacy accounts whose pam_users.id is the sub', async () => {
    const { service, identities, links } = createService({ pamById: [SUB] });
    const identityData = { env: 'development' };

    await expect(
      service.resolveUser({
        sub: SUB,
        email: 'a@x.com',
        emailVerified: false,
        identityData
      })
    ).resolves.toEqual({ userId: SUB, created: false });
    expect(links.get(SUB)).toBe(SUB);
    expect(identities.link).toHaveBeenCalledWith(
      expect.objectContaining({ externalUserId: SUB, identityData })
    );
  });

  it('links an existing email account only when email is verified', async () => {
    const verified = createService({
      pamByEmail: { 'a@x.com': EXISTING_ID }
    });
    await expect(
      verified.service.resolveUser({
        sub: SUB,
        email: 'A@x.com',
        emailVerified: true
      })
    ).resolves.toEqual({ userId: EXISTING_ID, created: false });

    const unverified = createService({
      pamByEmail: { 'a@x.com': EXISTING_ID }
    });
    await expect(
      unverified.service.resolveUser({
        sub: SUB,
        email: 'a@x.com',
        emailVerified: false
      })
    ).rejects.toMatchObject({ id: API_BRAIN_EMAIL_CONFLICT });
    expect(unverified.links.has(SUB)).toBe(false);
  });

  it('creates an auth user for a new Brain account', async () => {
    const { service, createUser } = createService();

    await expect(
      service.resolveUser({ sub: SUB, email: 'new@x.com', emailVerified: true })
    ).resolves.toEqual({ userId: CREATED_ID, created: true });
    expect(createUser).toHaveBeenCalledWith(
      expect.objectContaining({ email: 'new@x.com', email_confirm: true })
    );
  });

  it('never matches placeholder emails against existing accounts', async () => {
    const email = `${SUB}@brain.oauth`;
    const { service } = createService({
      pamByEmail: { [email]: EXISTING_ID }
    });

    await expect(
      service.resolveUser({ sub: SUB, email, emailVerified: false })
    ).resolves.toEqual({ userId: CREATED_ID, created: true });
  });

  it('reuses an auth user that exists without a PAM profile', async () => {
    const { service } = createService({
      createUserResult: {
        data: { user: null },
        error: { code: 'email_exists', message: 'already registered' }
      },
      authUsers: [{ id: EXISTING_ID, email: 'orphan@x.com' }]
    });

    await expect(
      service.resolveUser({
        sub: SUB,
        email: 'orphan@x.com',
        emailVerified: true
      })
    ).resolves.toEqual({ userId: EXISTING_ID, created: true });
  });
});
