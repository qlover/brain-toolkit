import { ExecutorError } from '@qlover/fe-corekit/executor';
import { SupabaseRepo } from '@qlover/next-kit/server';
import { inject, injectable } from '@shared/container';
import { BRAIN_PLACEHOLDER_EMAIL_SUFFIX } from '@shared/utils/pamUserIdentity';
import { API_BRAIN_EMAIL_CONFLICT } from '@config/i18n-identifier/api';
import { I } from '@config/ioc-identifiter';
import { PamUserIdentitiesRepo } from '@server/repositorys/PamUserIdentitiesRepo';
import { PamUsersRepo } from '@server/repositorys/PamUsersRepo';
import type { LoggerInterface } from '@qlover/logger';

export { BRAIN_PLACEHOLDER_EMAIL_SUFFIX };

export const BRAIN_IDENTITY_PROVIDER = 'brain';

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const AUTH_USER_LOOKUP_PAGES = 5;
const AUTH_USER_LOOKUP_PER_PAGE = 200;

export type BrainIdentityInput = {
  readonly sub: string;
  readonly email: string;
  readonly emailVerified: boolean;
};

export type BrainIdentityResult = {
  readonly userId: string;
  /** True when a new PAM account was created for this Brain user. */
  readonly created: boolean;
};

function isPlaceholderEmail(email: string): boolean {
  return email.toLowerCase().endsWith(BRAIN_PLACEHOLDER_EMAIL_SUFFIX);
}

function isEmailExistsError(
  error: { code?: string; message?: string } | null
): boolean {
  if (!error) {
    return false;
  }
  return (
    error.code === 'email_exists' ||
    /already (been )?registered/i.test(error.message ?? '')
  );
}

/**
 * Maps a brain-oauth `sub` to a local PAM user via `pam_user_identities`,
 * creating the Supabase Auth user when this Brain account is new to PAM.
 */
@injectable()
export class BrainIdentityLinkService {
  constructor(
    @inject(I.Logger) protected readonly logger: LoggerInterface,
    @inject(SupabaseRepo)
    protected readonly supabaseBridge: SupabaseRepo<unknown>,
    @inject(PamUserIdentitiesRepo)
    protected readonly identities: PamUserIdentitiesRepo,
    @inject(PamUsersRepo) protected readonly pamUsers: PamUsersRepo
  ) {}

  public async resolveUser(
    input: BrainIdentityInput
  ): Promise<BrainIdentityResult> {
    const sub = input.sub.trim();
    const email = input.email.trim();

    const linked = await this.identities.findUserId(
      BRAIN_IDENTITY_PROVIDER,
      sub
    );
    if (linked) {
      await this.identities.touchLastLogin(BRAIN_IDENTITY_PROVIDER, sub);
      return { userId: linked, created: false };
    }

    // Accounts created before pam_user_identities used the sub as pam_users.id.
    if (UUID_PATTERN.test(sub) && (await this.pamUsers.findById(sub))) {
      return { userId: await this.link(sub, sub), created: false };
    }

    const businessEmail = isPlaceholderEmail(email) ? null : email;
    if (businessEmail) {
      const existing = await this.pamUsers.findByEmail(businessEmail);
      if (existing) {
        this.assertCanLinkByEmail(input, sub);
        return { userId: await this.link(sub, existing.id), created: false };
      }
    }

    const authUserId = await this.createAuthUser(input, sub, email);
    return { userId: await this.link(sub, authUserId), created: true };
  }

  protected async link(sub: string, userId: string): Promise<string> {
    const linkedUserId = await this.identities.link({
      provider: BRAIN_IDENTITY_PROVIDER,
      externalUserId: sub,
      userId
    });
    this.logger.info('Brain identity linked', { sub, userId: linkedUserId });
    return linkedUserId;
  }

  protected assertCanLinkByEmail(input: BrainIdentityInput, sub: string): void {
    if (input.emailVerified) {
      return;
    }
    this.logger.warn('Brain login email conflicts with unverified email', {
      sub
    });
    throw new ExecutorError(API_BRAIN_EMAIL_CONFLICT);
  }

  protected async createAuthUser(
    input: BrainIdentityInput,
    sub: string,
    email: string
  ): Promise<string> {
    const admin = await this.supabaseBridge.getAdminSupabase();
    const created = await admin.auth.admin.createUser({
      email,
      email_confirm: true,
      user_metadata: { brain_sub: sub }
    });

    if (created.data.user?.id) {
      return created.data.user.id;
    }

    // auth.users has the email but pam_users does not (profile never created).
    if (isEmailExistsError(created.error)) {
      this.assertCanLinkByEmail(input, sub);
      const existingId = await this.findAuthUserIdByEmail(email);
      if (existingId) {
        return existingId;
      }
    }

    this.logger.error('Brain auth user creation failed', {
      sub,
      error: created.error
    });
    this.supabaseBridge.throwIfError(created);
    throw new Error('Failed to create auth user for Brain login');
  }

  protected async findAuthUserIdByEmail(email: string): Promise<string | null> {
    const admin = await this.supabaseBridge.getAdminSupabase();
    const needle = email.toLowerCase();

    for (let page = 1; page <= AUTH_USER_LOOKUP_PAGES; page += 1) {
      const listed = await admin.auth.admin.listUsers({
        page,
        perPage: AUTH_USER_LOOKUP_PER_PAGE
      });
      this.supabaseBridge.throwIfError(listed);
      const users = listed.data?.users ?? [];
      const match = users.find((user) => user.email?.toLowerCase() === needle);
      if (match?.id) {
        return match.id;
      }
      if (users.length < AUTH_USER_LOOKUP_PER_PAGE) {
        break;
      }
    }

    return null;
  }
}
