import { SupabaseRepo } from '@qlover/next-kit/server';
import { PlatformRoleKey } from '@shared/auth/roleKeys';
import {
  normalizeSystemRole,
  SystemRole,
  type SystemRoleType
} from '@shared/auth/systemRole';
import { inject, injectable } from '@shared/container';
import {
  isPhonePlaceholderEmail,
  toBusinessEmail
} from '@shared/utils/pamUserIdentity';
import type { PamUserRow } from '@schemas/PamUserSchema';
import { PamRolePermissionsRepo } from '@server/repositorys/PamRolePermissionsRepo';

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
    @inject(PamRolePermissionsRepo)
    protected readonly roles: PamRolePermissionsRepo
  ) {}

  public async findById(id: string): Promise<PamUserRow | null> {
    const supabase = await this.supabaseBridge.getAdminSupabase();
    const result = await supabase
      .from(TABLE)
      .select('*')
      .eq('id', id)
      .maybeSingle();
    this.supabaseBridge.throwIfError(result);

    return (result.data as PamUserRow | null) ?? null;
  }

  public async findByPhone(phone: string): Promise<PamUserRow | null> {
    const supabase = await this.supabaseBridge.getAdminSupabase();
    const result = await supabase
      .from(TABLE)
      .select('*')
      .eq('phone', phone)
      .maybeSingle();
    this.supabaseBridge.throwIfError(result);

    return (result.data as PamUserRow | null) ?? null;
  }

  public async findByEmail(email: string): Promise<PamUserRow | null> {
    const normalized = email.trim().toLowerCase();
    if (!normalized || isPhonePlaceholderEmail(normalized)) {
      return null;
    }

    const supabase = await this.supabaseBridge.getAdminSupabase();
    const result = await supabase
      .from(TABLE)
      .select('*')
      .ilike('email', normalized)
      .maybeSingle();
    this.supabaseBridge.throwIfError(result);

    return (result.data as PamUserRow | null) ?? null;
  }

  /**
   * Upsert profile fields; never clears an existing role_id.
   * Never overwrites a real email with null/placeholder.
   * Does not touch legacy is_platform_admin except on insert default.
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

      const result = await supabase
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
      this.supabaseBridge.throwIfError(result);

      return result.data as PamUserRow;
    }

    const defaultRoleId = await this.roles.requireRoleIdByKey(
      PlatformRoleKey.User
    );

    const result = await supabase
      .from(TABLE)
      .insert({
        id: input.id,
        email: incomingEmail,
        display_name: input.displayName ?? null,
        phone: input.phone ?? null,
        is_platform_admin: false,
        role_id: defaultRoleId,
        status: 'active'
      })
      .select('*')
      .single();
    this.supabaseBridge.throwIfError(result);

    return result.data as PamUserRow;
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

    const result = await supabase
      .from(TABLE)
      .update(patch)
      .eq('id', params.userId)
      .select('*')
      .single();
    this.supabaseBridge.throwIfError(result);

    return result.data as PamUserRow;
  }

  public async deleteById(userId: string): Promise<void> {
    const supabase = await this.supabaseBridge.getAdminSupabase();
    const result = await supabase.from(TABLE).delete().eq('id', userId);
    this.supabaseBridge.throwIfError(result);
  }

  /**
   * Set platform admin via role_id.
   * Does not modify legacy is_platform_admin.
   */
  public async setPlatformAdmin(
    userId: string,
    enabled: boolean,
    actorUserId: string
  ): Promise<PamUserRow> {
    return this.setSystemRole(
      userId,
      enabled ? SystemRole.Admin : SystemRole.User,
      actorUserId
    );
  }

  public async setSystemRole(
    userId: string,
    systemRole: SystemRoleType,
    actorUserId: string
  ): Promise<PamUserRow> {
    const supabase = await this.supabaseBridge.getAdminSupabase();
    const existing = await this.findById(userId);

    if (!existing) {
      const authResult = await supabase.auth.admin.getUserById(userId);
      this.supabaseBridge.throwIfError(authResult);

      if (!authResult.data.user?.id) {
        throw new Error('User not found');
      }

      await this.ensureProfile({
        id: authResult.data.user.id,
        email: toBusinessEmail(authResult.data.user.email),
        phone: authResult.data.user.phone ?? null
      });
    }

    const nextRole = normalizeSystemRole(systemRole);
    const target = await this.findById(userId);
    const prevRole = normalizeSystemRole(
      await this.roles.getRoleKeyById(target?.role_id)
    );

    if (
      prevRole === SystemRole.Admin &&
      nextRole !== SystemRole.Admin &&
      userId === actorUserId
    ) {
      throw new Error('Cannot revoke your own platform admin access');
    }

    if (prevRole === SystemRole.Admin && nextRole !== SystemRole.Admin) {
      const adminCount = await this.countPlatformAdmins();
      if (adminCount <= 1) {
        throw new Error('At least one platform admin is required');
      }
    }

    const nextRoleId = await this.roles.requireRoleIdByKey(nextRole);

    const result = await supabase
      .from(TABLE)
      .update({
        role_id: nextRoleId,
        updated_at: new Date().toISOString()
      })
      .eq('id', userId)
      .select('*')
      .single();
    this.supabaseBridge.throwIfError(result);

    return result.data as PamUserRow;
  }

  /** Counts users with platform admin role key. */
  public async countPlatformAdmins(): Promise<number> {
    const adminRoleId = await this.roles.requireRoleIdByKey(
      PlatformRoleKey.Admin
    );
    const supabase = await this.supabaseBridge.getAdminSupabase();
    const result = await supabase
      .from(TABLE)
      .select('id', { count: 'exact', head: true })
      .eq('role_id', adminRoleId);
    this.supabaseBridge.throwIfError(result);

    return result.count ?? 0;
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
      systemRole: SystemRoleType;
      status: string;
      createdAt: string;
      displayName: string | null;
    }>
  > {
    const supabase = await this.supabaseBridge.getAdminSupabase();
    const authResult = await supabase.rpc('pam_auth_users_search', {
      p_query: params.query?.trim() || '',
      p_exclude_id: null,
      p_limit: params.limit ?? 20,
      p_offset: params.offset ?? 0
    });
    this.supabaseBridge.throwIfError(authResult);

    const users = Array.isArray(authResult.data) ? authResult.data : [];
    if (users.length === 0) {
      return [];
    }

    const ids = users
      .map((row) => String((row as { id?: string }).id ?? ''))
      .filter(Boolean);

    const pamResult = await supabase
      .from(TABLE)
      .select(
        'id, role_id, is_platform_admin, status, created_at, display_name, email, phone'
      )
      .in('id', ids);
    this.supabaseBridge.throwIfError(pamResult);

    const pamById = new Map(
      (pamResult.data ?? []).map((row) => [String(row.id), row as PamUserRow])
    );

    const results = [];
    for (const row of users) {
      const id = String((row as { id?: string }).id ?? '');
      const authEmail = String((row as { email?: string }).email ?? '');
      const pam = pamById.get(id);
      const systemRole = normalizeSystemRole(
        await this.roles.getRoleKeyById(pam?.role_id)
      );
      results.push({
        id,
        email: toBusinessEmail(pam?.email ?? authEmail),
        phone: pam?.phone ?? null,
        displayName: pam?.display_name ?? null,
        systemRole,
        isPlatformAdmin: systemRole === SystemRole.Admin,
        status: pam?.status ?? 'active',
        createdAt: pam?.created_at ?? new Date().toISOString()
      });
    }
    return results;
  }
}
