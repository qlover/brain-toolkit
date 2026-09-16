import { ExecutorError } from '@qlover/fe-corekit/executor';
import { SupabaseRepo } from '@qlover/next-kit/server';
import { inject, injectable } from '@shared/container';
import { API_PAM_COLLABORATOR_NOT_FOUND } from '@config/i18n-identifier/api';
import { I } from '@config/ioc-identifiter';
import type {
  PAMProjectCollaboratorItem,
  PAMProjectCollaboratorRole,
  PAMProjectCollaboratorRow
} from '@schemas/PAMProjectCollaboratorSchema';
import type { LoggerInterface } from '@qlover/logger';

const TABLE = 'pam_project_collaborators';

@injectable()
export class PamProjectCollaboratorsRepo {
  constructor(
    @inject(SupabaseRepo)
    protected readonly supabaseBridge: SupabaseRepo<unknown>,
    @inject(I.Logger)
    protected readonly logger: LoggerInterface
  ) {}

  public async listActiveProjectIdsForUser(userId: string): Promise<string[]> {
    const admin = this.supabaseBridge.getAdminSupabase();
    const result = await admin
      .from(TABLE)
      .select('project_id')
      .eq('user_id', userId)
      .eq('status', 'active');
    this.supabaseBridge.throwIfError(result);

    return (result.data ?? [])
      .map((row) => (typeof row.project_id === 'string' ? row.project_id : ''))
      .filter(Boolean);
  }

  public async getActiveRole(
    projectId: string,
    userId: string
  ): Promise<PAMProjectCollaboratorRole | null> {
    const admin = this.supabaseBridge.getAdminSupabase();
    const result = await admin
      .from(TABLE)
      .select('role')
      .eq('project_id', projectId)
      .eq('user_id', userId)
      .eq('status', 'active')
      .maybeSingle();
    this.supabaseBridge.throwIfError(result);

    const role = result.data?.role;
    if (role === 'admin' || role === 'member') {
      return role;
    }
    return null;
  }

  /**
   * Batch-load active collaborator roles for one user across projects.
   */
  public async listActiveRolesForUser(
    userId: string,
    projectIds: string[]
  ): Promise<Map<string, PAMProjectCollaboratorRole>> {
    const map = new Map<string, PAMProjectCollaboratorRole>();
    if (projectIds.length === 0) {
      return map;
    }

    const admin = this.supabaseBridge.getAdminSupabase();
    const result = await admin
      .from(TABLE)
      .select('project_id,role')
      .eq('user_id', userId)
      .eq('status', 'active')
      .in('project_id', projectIds);
    this.supabaseBridge.throwIfError(result);

    for (const row of result.data ?? []) {
      const projectId =
        typeof row.project_id === 'string' ? row.project_id : '';
      const role = row.role;
      if (projectId && (role === 'admin' || role === 'member')) {
        map.set(projectId, role);
      }
    }

    return map;
  }

  public async listByProjectId(
    projectId: string
  ): Promise<PAMProjectCollaboratorItem[]> {
    const admin = this.supabaseBridge.getAdminSupabase();
    const result = await admin
      .from(TABLE)
      .select(
        'id,project_id,user_id,role,status,invited_by,created_at,updated_at'
      )
      .eq('project_id', projectId)
      .eq('status', 'active')
      .order('created_at', { ascending: true });
    this.supabaseBridge.throwIfError(result);

    const rows = (result.data ?? []) as PAMProjectCollaboratorRow[];
    if (rows.length === 0) {
      return [];
    }

    const userIds = [...new Set(rows.map((row) => row.user_id))];
    const profileById = await this.loadProfilesByUserIds(userIds);

    return rows.map((row) => {
      const profile = profileById.get(row.user_id);
      return {
        ...row,
        email: profile?.email ?? '',
        phone: profile?.phone ?? null,
        display_name: profile?.displayName ?? null
      };
    });
  }

  /**
   * Moves collaborator rows from one user to another (merge accounts).
   * When both users are on the same project, keeps the higher role on target.
   */
  public async reassignUserId(
    fromUserId: string,
    toUserId: string
  ): Promise<void> {
    if (fromUserId === toUserId) {
      return;
    }

    const admin = this.supabaseBridge.getAdminSupabase();
    const result = await admin
      .from(TABLE)
      .select('id,project_id,role')
      .eq('user_id', fromUserId);
    this.supabaseBridge.throwIfError(result);

    for (const row of result.data ?? []) {
      const projectId =
        typeof row.project_id === 'string' ? row.project_id : '';
      if (!projectId) {
        continue;
      }

      const existingRole = await this.getActiveRole(projectId, toUserId);
      if (existingRole) {
        const nextRole =
          existingRole === 'admin' || row.role === 'admin' ? 'admin' : 'member';
        if (nextRole !== existingRole) {
          await this.updateRole(projectId, toUserId, nextRole);
        }
        await this.remove(projectId, fromUserId);
        continue;
      }

      const updateResult = await admin
        .from(TABLE)
        .update({
          user_id: toUserId,
          updated_at: new Date().toISOString()
        })
        .eq('id', row.id);
      this.supabaseBridge.throwIfError(updateResult);
    }
  }

  public async insert(input: {
    projectId: string;
    userId: string;
    role: PAMProjectCollaboratorRole;
    invitedBy: string | null;
  }): Promise<PAMProjectCollaboratorRow> {
    const admin = this.supabaseBridge.getAdminSupabase();
    const result = await admin
      .from(TABLE)
      .insert({
        project_id: input.projectId,
        user_id: input.userId,
        role: input.role,
        status: 'active',
        invited_by: input.invitedBy
      })
      .select('*')
      .single();
    this.supabaseBridge.throwIfError(result);

    return result.data as PAMProjectCollaboratorRow;
  }

  public async updateRole(
    projectId: string,
    userId: string,
    role: PAMProjectCollaboratorRole
  ): Promise<PAMProjectCollaboratorRow> {
    const admin = this.supabaseBridge.getAdminSupabase();
    const result = await admin
      .from(TABLE)
      .update({ role })
      .eq('project_id', projectId)
      .eq('user_id', userId)
      .eq('status', 'active')
      .select('*')
      .maybeSingle();
    this.supabaseBridge.throwIfError(result);

    if (!result.data) {
      throw new ExecutorError(API_PAM_COLLABORATOR_NOT_FOUND);
    }

    return result.data as PAMProjectCollaboratorRow;
  }

  public async remove(projectId: string, userId: string): Promise<void> {
    const admin = this.supabaseBridge.getAdminSupabase();
    const result = await admin
      .from(TABLE)
      .delete()
      .eq('project_id', projectId)
      .eq('user_id', userId)
      .select('id');
    this.supabaseBridge.throwIfError(result);

    if (!result.data?.length) {
      throw new ExecutorError(API_PAM_COLLABORATOR_NOT_FOUND);
    }
  }

  public async deleteAllForProject(projectId: string): Promise<void> {
    const admin = this.supabaseBridge.getAdminSupabase();
    const result = await admin.from(TABLE).delete().eq('project_id', projectId);
    this.supabaseBridge.throwIfError(result);
  }

  protected async loadProfilesByUserIds(
    userIds: string[]
  ): Promise<
    Map<
      string,
      { email: string; phone: string | null; displayName: string | null }
    >
  > {
    const map = new Map<
      string,
      { email: string; phone: string | null; displayName: string | null }
    >();
    if (userIds.length === 0) {
      return map;
    }

    const admin = this.supabaseBridge.getAdminSupabase();

    const pamUsersResult = await admin
      .from('pam_users')
      .select('id,email,phone,display_name')
      .in('id', userIds);
    this.supabaseBridge.throwIfError(pamUsersResult);

    for (const row of pamUsersResult.data ?? []) {
      if (typeof row.id !== 'string') {
        continue;
      }
      const emailRaw = typeof row.email === 'string' ? row.email : '';
      const email = emailRaw.toLowerCase().endsWith('@phone.pam.local')
        ? ''
        : emailRaw;
      map.set(row.id, {
        email,
        phone: typeof row.phone === 'string' ? row.phone : null,
        displayName:
          typeof row.display_name === 'string' ? row.display_name : null
      });
    }

    const missing = userIds.filter((id) => !map.has(id));
    for (const userId of missing) {
      try {
        const { data, error } = await admin.auth.admin.getUserById(userId);
        if (!error && data.user) {
          const emailRaw = data.user.email ?? '';
          const email = emailRaw.toLowerCase().endsWith('@phone.pam.local')
            ? ''
            : emailRaw;
          map.set(userId, {
            email,
            phone: data.user.phone ?? null,
            displayName: null
          });
        }
      } catch (error) {
        this.logger.warn('PamProjectCollaboratorsRepo.loadProfiles auth', {
          userId,
          error
        });
      }
    }

    return map;
  }
}
