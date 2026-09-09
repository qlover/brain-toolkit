import { SupabaseRepo } from '@qlover/next-kit/server';
import { inject, injectable } from '@shared/container';
import {
  isPhonePlaceholderEmail,
  toBusinessEmail
} from '@shared/utils/pamUserIdentity';
import { I } from '@config/ioc-identifiter';
import type { PamUserRow } from '@schemas/PamUserSchema';
import type { LoggerInterface } from '@qlover/logger';

const TABLE = 'pam_users';

export type PamUserUpsertInput = {
  readonly id: string;
  /** Business email; null for phone-only. */
  readonly email: string | null;
  readonly displayName?: string | null;
  readonly phone?: string | null;
};

@injectable()
export class PamUsersRepo {
  constructor(
    @inject(SupabaseRepo)
    protected readonly supabaseBridge: SupabaseRepo<unknown>,
    @inject(I.Logger)
    protected readonly logger: LoggerInterface
  ) {}

  public async findById(id: string): Promise<PamUserRow | null> {
    const supabase = await this.supabaseBridge.getAdminSupabase();
    const { data, error } = await supabase
      .from(TABLE)
      .select('*')
      .eq('id', id)
      .maybeSingle();

    if (error) {
      this.logger.error('PamUsersRepo.findById failed', { error, id });
      throw new Error(error.message);
    }

    return (data as PamUserRow | null) ?? null;
  }

  public async findByPhone(phone: string): Promise<PamUserRow | null> {
    const supabase = await this.supabaseBridge.getAdminSupabase();
    const { data, error } = await supabase
      .from(TABLE)
      .select('*')
      .eq('phone', phone)
      .maybeSingle();

    if (error) {
      this.logger.error('PamUsersRepo.findByPhone failed', { error, phone });
      throw new Error(error.message);
    }

    return (data as PamUserRow | null) ?? null;
  }

  public async findByEmail(email: string): Promise<PamUserRow | null> {
    const normalized = email.trim().toLowerCase();
    if (!normalized || isPhonePlaceholderEmail(normalized)) {
      return null;
    }

    const supabase = await this.supabaseBridge.getAdminSupabase();
    const { data, error } = await supabase
      .from(TABLE)
      .select('*')
      .ilike('email', normalized)
      .maybeSingle();

    if (error) {
      this.logger.error('PamUsersRepo.findByEmail failed', {
        error,
        email: normalized
      });
      throw new Error(error.message);
    }

    return (data as PamUserRow | null) ?? null;
  }

  /**
   * Upsert profile fields; never clears an existing platform admin flag.
   * Never overwrites a real email with null/placeholder.
   */
  public async ensureProfile(input: PamUserUpsertInput): Promise<PamUserRow> {
    const supabase = await this.supabaseBridge.getAdminSupabase();
    const existing = await this.findById(input.id);
    const incomingEmail = toBusinessEmail(input.email);

    if (existing) {
      const existingBusiness = toBusinessEmail(existing.email);
      const nextEmail = incomingEmail ?? existingBusiness ?? null;
      const nextDisplayName =
        input.displayName !== undefined
          ? input.displayName
          : existing.display_name;
      const nextPhone =
        input.phone !== undefined ? input.phone : (existing.phone ?? null);

      const { data, error } = await supabase
        .from(TABLE)
        .update({
          email: nextEmail,
          display_name: nextDisplayName,
          phone: nextPhone,
          updated_at: new Date().toISOString()
        })
        .eq('id', input.id)
        .select('*')
        .single();

      if (error) {
        this.logger.error('PamUsersRepo.ensureProfile update failed', {
          error,
          id: input.id
        });
        throw new Error(error.message);
      }

      return data as PamUserRow;
    }

    const { data, error } = await supabase
      .from(TABLE)
      .insert({
        id: input.id,
        email: incomingEmail,
        display_name: input.displayName ?? null,
        phone: input.phone ?? null,
        is_platform_admin: false,
        status: 'active'
      })
      .select('*')
      .single();

    if (error) {
      this.logger.error('PamUsersRepo.ensureProfile insert failed', {
        error,
        id: input.id
      });
      throw new Error(error.message);
    }

    return data as PamUserRow;
  }

  public async updateEmailAndPhone(params: {
    userId: string;
    email?: string | null;
    phone?: string | null;
    displayName?: string | null;
  }): Promise<PamUserRow> {
    const supabase = await this.supabaseBridge.getAdminSupabase();
    const patch: Record<string, unknown> = {
      updated_at: new Date().toISOString()
    };
    if (params.email !== undefined) {
      patch.email = toBusinessEmail(params.email);
    }
    if (params.phone !== undefined) {
      patch.phone = params.phone;
    }
    if (params.displayName !== undefined) {
      patch.display_name = params.displayName;
    }

    const { data, error } = await supabase
      .from(TABLE)
      .update(patch)
      .eq('id', params.userId)
      .select('*')
      .single();

    if (error) {
      this.logger.error('PamUsersRepo.updateEmailAndPhone failed', {
        error,
        userId: params.userId
      });
      throw new Error(error.message);
    }

    return data as PamUserRow;
  }

  public async deleteById(userId: string): Promise<void> {
    const supabase = await this.supabaseBridge.getAdminSupabase();
    const { error } = await supabase.from(TABLE).delete().eq('id', userId);
    if (error) {
      this.logger.error('PamUsersRepo.deleteById failed', { error, userId });
      throw new Error(error.message);
    }
  }

  public async setPlatformAdmin(
    userId: string,
    enabled: boolean,
    actorUserId: string
  ): Promise<PamUserRow> {
    const supabase = await this.supabaseBridge.getAdminSupabase();
    const existing = await this.findById(userId);

    if (!existing) {
      const { data: authData, error: authError } =
        await supabase.auth.admin.getUserById(userId);

      if (authError || !authData.user?.id) {
        throw new Error('User not found');
      }

      await this.ensureProfile({
        id: authData.user.id,
        email: toBusinessEmail(authData.user.email),
        phone: authData.user.phone ?? null
      });
    }

    if (!enabled && userId === actorUserId) {
      throw new Error('Cannot revoke your own platform admin access');
    }

    if (!enabled) {
      const adminCount = await this.countPlatformAdmins();
      const target = await this.findById(userId);
      if (target?.is_platform_admin && adminCount <= 1) {
        throw new Error('At least one platform admin is required');
      }
    }

    const { data, error } = await supabase
      .from(TABLE)
      .update({
        is_platform_admin: enabled,
        updated_at: new Date().toISOString()
      })
      .eq('id', userId)
      .select('*')
      .single();

    if (error) {
      this.logger.error('PamUsersRepo.setPlatformAdmin failed', {
        error,
        userId,
        enabled
      });
      throw new Error(error.message);
    }

    return data as PamUserRow;
  }

  public async countPlatformAdmins(): Promise<number> {
    const supabase = await this.supabaseBridge.getAdminSupabase();
    const { count, error } = await supabase
      .from(TABLE)
      .select('id', { count: 'exact', head: true })
      .eq('is_platform_admin', true);

    if (error) {
      this.logger.error('PamUsersRepo.countPlatformAdmins failed', { error });
      throw new Error(error.message);
    }

    return count ?? 0;
  }

  public async searchForAdmin(params: {
    query?: string;
    limit?: number;
    offset?: number;
  }): Promise<
    Array<{
      id: string;
      email: string | null;
      phone: string | null;
      isPlatformAdmin: boolean;
      status: string;
      createdAt: string;
      displayName: string | null;
    }>
  > {
    const supabase = await this.supabaseBridge.getAdminSupabase();
    const { data: authRows, error: authError } = await supabase.rpc(
      'pam_auth_users_search',
      {
        p_query: params.query?.trim() || '',
        p_exclude_id: null,
        p_limit: params.limit ?? 20,
        p_offset: params.offset ?? 0
      }
    );

    if (authError) {
      this.logger.error('PamUsersRepo.searchForAdmin auth search failed', {
        error: authError
      });
      throw new Error(authError.message);
    }

    const users = Array.isArray(authRows) ? authRows : [];
    if (users.length === 0) {
      return [];
    }

    const ids = users
      .map((row) => String((row as { id?: string }).id ?? ''))
      .filter(Boolean);

    const { data: pamRows, error: pamError } = await supabase
      .from(TABLE)
      .select(
        'id, is_platform_admin, status, created_at, display_name, email, phone'
      )
      .in('id', ids);

    if (pamError) {
      this.logger.error('PamUsersRepo.searchForAdmin pam lookup failed', {
        error: pamError
      });
      throw new Error(pamError.message);
    }

    const pamById = new Map(
      (pamRows ?? []).map((row) => [String(row.id), row as PamUserRow])
    );

    return users.map((row) => {
      const id = String((row as { id?: string }).id ?? '');
      const authEmail = String((row as { email?: string }).email ?? '');
      const pam = pamById.get(id);
      return {
        id,
        email: toBusinessEmail(pam?.email ?? authEmail),
        phone: pam?.phone ?? null,
        displayName: pam?.display_name ?? null,
        isPlatformAdmin: pam?.is_platform_admin ?? false,
        status: pam?.status ?? 'active',
        createdAt: pam?.created_at ?? new Date().toISOString()
      };
    });
  }
}
