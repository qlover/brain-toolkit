import { SupabaseRepo } from '@qlover/next-kit/server';
import { resolveOAuthRealEmail } from '@qlover/oauth-wrapper';
import { inject, injectable } from '@shared/container';
import { BRAIN_LEGACY_ENV, brainProviderForEnv } from '@config/brainApi';
import { I } from '@config/ioc-identifiter';
import { oauthLocalUserConfig } from '@config/oauthLocalUser';
import type { LoggerInterface } from '@qlover/logger';
import type {
  OAuthIdentityEmailUser,
  OAuthIdentityStore,
  OAuthLocalUserDraft
} from '@qlover/oauth-wrapper';

const PG_UNIQUE_VIOLATION = '23505';

const { usersTable, linksTable } = oauthLocalUserConfig;

export interface LinkedLocalUser {
  id: string;
  email: string | null;
  phone: string | null;
  name: string | null;
  extra: Record<string, unknown> | null;
}

/**
 * oauth-wrapper identity CRUD on `brain_oauth_users` + links table
 * (service-role client; no Supabase Auth).
 * Orchestration (find-or-create) lives in OAuthWrapperService.ensureLocalUser.
 */
@injectable()
export class BrainOAuthUserStore implements OAuthIdentityStore {
  /**
   * Brain env of the identity being resolved. Emails are unique per env, and
   * the `OAuthIdentityStore` lookups carry no provider, so the provider sets
   * this per request (IOC is per request).
   */
  protected env: string = BRAIN_LEGACY_ENV;

  constructor(
    @inject(I.Logger) protected readonly logger: LoggerInterface,
    @inject(SupabaseRepo)
    protected readonly supabaseRepo: SupabaseRepo<unknown>
  ) {}

  public useEnv(env: string): void {
    this.env = env;
  }

  /** Env the local user signed in with; legacy rows are development. */
  public async findUserEnv(userId: string): Promise<string> {
    const supabase = await this.supabaseRepo.getAdminSupabase();
    const { data, error } = await supabase
      .from(usersTable)
      .select('brain_env')
      .eq('id', userId)
      .maybeSingle();

    if (error) {
      throw new Error(
        `Failed to read ${usersTable}.brain_env: ${error.message}`
      );
    }
    const env = (data as { brain_env?: unknown } | null)?.brain_env;
    return typeof env === 'string' && env.trim() ? env : BRAIN_LEGACY_ENV;
  }

  /**
   * @override
   */
  public async findAuthUserIdByExternalId(
    provider: string,
    externalUserId: string
  ): Promise<string | null> {
    const supabase = await this.supabaseRepo.getAdminSupabase();
    const { data, error } = await supabase
      .from(linksTable)
      .select('user_id')
      .eq('provider', provider)
      .eq('external_user_id', externalUserId)
      .maybeSingle();

    if (error) {
      throw new Error(`Failed to lookup ${linksTable}: ${error.message}`);
    }

    return data?.user_id ? String(data.user_id) : null;
  }

  /**
   * Link + user row in one round trip (embedded via the `user_id` FK).
   * Returns `null` when unlinked or on any read error so callers can fall back
   * to the full find-or-create path.
   */
  public async findLinkedUser(
    provider: string,
    externalUserId: string
  ): Promise<LinkedLocalUser | null> {
    const supabase = await this.supabaseRepo.getAdminSupabase();
    const { data, error } = await supabase
      .from(linksTable)
      .select(`user_id, user:${usersTable}(id,email,phone,name,extra)`)
      .eq('provider', provider)
      .eq('external_user_id', externalUserId)
      .maybeSingle();

    if (error) {
      this.logger.warn(`Failed to read ${linksTable} with user`, {
        error: error.message
      });
      return null;
    }

    const user = (data as { user?: unknown } | null)?.user;
    const row = (Array.isArray(user) ? user[0] : user) as
      | LinkedLocalUser
      | null
      | undefined;
    return row?.id ? { ...row, id: String(row.id) } : null;
  }

  /**
   * @override
   */
  public async findByEmail(
    email: string
  ): Promise<OAuthIdentityEmailUser | null> {
    const supabase = await this.supabaseRepo.getAdminSupabase();
    const { data, error } = await supabase
      .from(usersTable)
      .select('id')
      .eq('brain_env', this.env)
      .eq('email', normalizeEmail(email))
      .maybeSingle();

    if (error) {
      throw new Error(`Failed to lookup ${usersTable}: ${error.message}`);
    }
    if (!data?.id) {
      return null;
    }

    const userId = String(data.id);
    return {
      id: userId,
      externalUserId: await this.findExternalUserId(userId)
    };
  }

  /**
   * @override
   */
  public async createUser(
    draft: OAuthLocalUserDraft & { email: string; name: string }
  ): Promise<string> {
    const supabase = await this.supabaseRepo.getAdminSupabase();
    const now = new Date().toISOString();
    const email = realEmailOrNull(draft.email);
    const { data, error } = await supabase
      .from(usersTable)
      .insert({
        email,
        phone: draft.phone?.trim() || null,
        name: draft.name,
        extra: draft.extra ?? null,
        brain_env: this.env,
        last_login_at: now
      })
      .select('id')
      .single();

    if (!error && data?.id) {
      return String(data.id);
    }

    if (email && error?.code === PG_UNIQUE_VIOLATION) {
      const existing = await this.findByEmail(email);
      if (existing) {
        if (
          existing.externalUserId &&
          existing.externalUserId !== draft.externalUserId
        ) {
          throw new Error(
            `Email ${draft.email} is already linked to a different ${draft.provider} user`
          );
        }
        return existing.id;
      }
    }

    throw new Error(
      `Failed to create ${usersTable} row: ${error?.message ?? 'no id returned'}`
    );
  }

  /**
   * Identity mapping only. Brain profile data is fetched live on login and
   * `/oauth/userinfo`, so `extra` is intentionally not written here.
   *
   * @override
   */
  public async upsertLink(
    userId: string,
    draft: OAuthLocalUserDraft & { name: string }
  ): Promise<void> {
    const supabase = await this.supabaseRepo.getAdminSupabase();
    const { error } = await supabase.from(linksTable).upsert(
      {
        user_id: userId,
        provider: draft.provider,
        external_user_id: draft.externalUserId,
        updated_at: new Date().toISOString()
      },
      { onConflict: 'user_id' }
    );

    if (error) {
      throw new Error(`Failed to upsert ${linksTable}: ${error.message}`);
    }
  }

  /**
   * Upstream without a real email clears the column, so a stale real email
   * cannot keep blocking the Brain account that owns it.
   *
   * @override
   */
  public async refreshMetadata(
    userId: string,
    draft: OAuthLocalUserDraft & { name: string; email: string | null }
  ): Promise<void> {
    const supabase = await this.supabaseRepo.getAdminSupabase();
    const now = new Date().toISOString();
    const extra = draft.extra
      ? await this.mergeUserExtra(userId, draft.extra)
      : null;
    const email = realEmailOrNull(draft.email);
    const { error } = await supabase
      .from(usersTable)
      .update({
        name: draft.name,
        email,
        ...(draft.phone?.trim() ? { phone: draft.phone.trim() } : {}),
        ...(extra ? { extra } : {}),
        last_login_at: now,
        updated_at: now
      })
      .eq('id', userId);

    if (error) {
      this.logger.warn(`Failed to refresh ${usersTable} metadata`, {
        userId,
        error: error.message
      });
    }
  }

  /**
   * Brain account emails are unique upstream, so a local row holding `email`
   * while linked to another external user is stale (e.g. claimed earlier via
   * `google_email`). Clear that row's email so the owner can sign in.
   */
  public async releaseStaleEmail(
    email: string,
    externalUserId: string
  ): Promise<void> {
    const existing = await this.findByEmail(email);
    if (
      !existing?.externalUserId ||
      existing.externalUserId === externalUserId
    ) {
      return;
    }

    const supabase = await this.supabaseRepo.getAdminSupabase();
    const { error } = await supabase
      .from(usersTable)
      .update({ email: null, updated_at: new Date().toISOString() })
      .eq('id', existing.id);

    if (error) {
      throw new Error(
        `Failed to release ${usersTable} email: ${error.message}`
      );
    }

    this.logger.warn('Released stale local email held by another account', {
      userId: existing.id,
      heldBy: existing.externalUserId,
      claimedBy: externalUserId
    });
  }

  /**
   * Shallow-merges `patch` over the user's current `extra` so keys written by
   * other features (or legacy migrations) survive each login.
   */
  protected async mergeUserExtra(
    userId: string,
    patch: Record<string, unknown>
  ): Promise<Record<string, unknown>> {
    const supabase = await this.supabaseRepo.getAdminSupabase();
    const { data, error } = await supabase
      .from(usersTable)
      .select('extra')
      .eq('id', userId)
      .maybeSingle();

    if (error) {
      throw new Error(`Failed to read ${usersTable}.extra: ${error.message}`);
    }

    const current = (data as { extra?: unknown } | null)?.extra;
    const base =
      current && typeof current === 'object' && !Array.isArray(current)
        ? (current as Record<string, unknown>)
        : {};
    return { ...base, ...patch };
  }

  protected async findExternalUserId(userId: string): Promise<string | null> {
    const supabase = await this.supabaseRepo.getAdminSupabase();
    const { data, error } = await supabase
      .from(linksTable)
      .select('external_user_id')
      .eq('user_id', userId)
      .eq('provider', brainProviderForEnv(this.env))
      .maybeSingle();

    if (error) {
      throw new Error(`Failed to lookup ${linksTable}: ${error.message}`);
    }

    return data?.external_user_id ? String(data.external_user_id) : null;
  }
}

function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

/**
 * oauth-wrapper hands phone-only users a synthetic address; the column is
 * nullable, so store `NULL` and let `phone` identify them instead.
 */
function realEmailOrNull(email: string | null | undefined): string | null {
  return resolveOAuthRealEmail(
    email,
    oauthLocalUserConfig.syntheticEmailDomain
  );
}
