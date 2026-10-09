import { SupabaseRepo } from '@qlover/next-kit/server';
import { inject, injectable } from '@shared/container';
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

/**
 * oauth-wrapper identity CRUD on `brain_oauth_users` + links table
 * (service-role client; no Supabase Auth).
 * Orchestration (find-or-create) lives in OAuthWrapperService.ensureLocalUser.
 */
@injectable()
export class BrainOAuthUserStore implements OAuthIdentityStore {
  constructor(
    @inject(I.Logger) protected readonly logger: LoggerInterface,
    @inject(SupabaseRepo)
    protected readonly supabaseRepo: SupabaseRepo<unknown>
  ) {}

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
   * @override
   */
  public async findByEmail(
    email: string
  ): Promise<OAuthIdentityEmailUser | null> {
    const supabase = await this.supabaseRepo.getAdminSupabase();
    const { data, error } = await supabase
      .from(usersTable)
      .select('id')
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
    const { data, error } = await supabase
      .from(usersTable)
      .insert({
        email: normalizeEmail(draft.email),
        phone: draft.phone?.trim() || null,
        name: draft.name,
        extra: draft.extra ?? null,
        last_login_at: now
      })
      .select('id')
      .single();

    if (!error && data?.id) {
      return String(data.id);
    }

    if (error?.code === PG_UNIQUE_VIOLATION) {
      const existing = await this.findByEmail(draft.email);
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
        extra: draft.extra ?? null,
        updated_at: new Date().toISOString()
      },
      { onConflict: 'user_id' }
    );

    if (error) {
      throw new Error(`Failed to upsert ${linksTable}: ${error.message}`);
    }
  }

  /**
   * @override
   */
  public async refreshMetadata(
    userId: string,
    draft: OAuthLocalUserDraft & { name: string; email: string | null }
  ): Promise<void> {
    const supabase = await this.supabaseRepo.getAdminSupabase();
    const now = new Date().toISOString();
    const { error } = await supabase
      .from(usersTable)
      .update({
        name: draft.name,
        ...(draft.email ? { email: normalizeEmail(draft.email) } : {}),
        ...(draft.phone?.trim() ? { phone: draft.phone.trim() } : {}),
        ...(draft.extra ? { extra: draft.extra } : {}),
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

  protected async findExternalUserId(userId: string): Promise<string | null> {
    const supabase = await this.supabaseRepo.getAdminSupabase();
    const { data, error } = await supabase
      .from(linksTable)
      .select('external_user_id')
      .eq('user_id', userId)
      .eq('provider', oauthLocalUserConfig.provider)
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
