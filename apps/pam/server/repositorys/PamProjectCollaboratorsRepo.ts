import { ExecutorError } from '@qlover/fe-corekit/executor';
import { SupabaseRepo } from '@qlover/next-kit/server';
import { inject, injectable } from '@shared/container';
import {
  API_PAM_COLLABORATOR_NOT_FOUND,
  API_SERVER_ERROR
} from '@config/i18n-identifier/api';
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
    const { data, error } = await admin
      .from(TABLE)
      .select('project_id')
      .eq('user_id', userId)
      .eq('status', 'active');

    if (error) {
      this.logger.error(
        'PamProjectCollaboratorsRepo.listActiveProjectIdsForUser',
        {
          error
        }
      );
      throw new ExecutorError(API_SERVER_ERROR, { cause: error });
    }

    return (data ?? [])
      .map((row) => (typeof row.project_id === 'string' ? row.project_id : ''))
      .filter(Boolean);
  }

  public async getActiveRole(
    projectId: string,
    userId: string
  ): Promise<PAMProjectCollaboratorRole | null> {
    const admin = this.supabaseBridge.getAdminSupabase();
    const { data, error } = await admin
      .from(TABLE)
      .select('role')
      .eq('project_id', projectId)
      .eq('user_id', userId)
      .eq('status', 'active')
      .maybeSingle();

    if (error) {
      this.logger.error('PamProjectCollaboratorsRepo.getActiveRole', { error });
      throw new ExecutorError(API_SERVER_ERROR, { cause: error });
    }

    const role = data?.role;
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
    const { data, error } = await admin
      .from(TABLE)
      .select('project_id,role')
      .eq('user_id', userId)
      .eq('status', 'active')
      .in('project_id', projectIds);

    if (error) {
      this.logger.error('PamProjectCollaboratorsRepo.listActiveRolesForUser', {
        error
      });
      throw new ExecutorError(API_SERVER_ERROR, { cause: error });
    }

    for (const row of data ?? []) {
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
    const { data, error } = await admin
      .from(TABLE)
      .select(
        'id,project_id,user_id,role,status,invited_by,created_at,updated_at'
      )
      .eq('project_id', projectId)
      .eq('status', 'active')
      .order('created_at', { ascending: true });

    if (error) {
      this.logger.error('PamProjectCollaboratorsRepo.listByProjectId', {
        error
      });
      throw new ExecutorError(API_SERVER_ERROR, { cause: error });
    }

    const rows = (data ?? []) as PAMProjectCollaboratorRow[];
    if (rows.length === 0) {
      return [];
    }

    const userIds = [...new Set(rows.map((row) => row.user_id))];
    const emailById = await this.loadEmailsByUserIds(userIds);

    return rows.map((row) => ({
      ...row,
      email: emailById.get(row.user_id) ?? '',
      display_name: null
    }));
  }

  public async insert(input: {
    projectId: string;
    userId: string;
    role: PAMProjectCollaboratorRole;
    invitedBy: string | null;
  }): Promise<PAMProjectCollaboratorRow> {
    const admin = this.supabaseBridge.getAdminSupabase();
    const { data, error } = await admin
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

    if (error) {
      this.logger.error('PamProjectCollaboratorsRepo.insert', { error });
      throw new ExecutorError(API_SERVER_ERROR, { cause: error });
    }

    return data as PAMProjectCollaboratorRow;
  }

  public async updateRole(
    projectId: string,
    userId: string,
    role: PAMProjectCollaboratorRole
  ): Promise<PAMProjectCollaboratorRow> {
    const admin = this.supabaseBridge.getAdminSupabase();
    const { data, error } = await admin
      .from(TABLE)
      .update({ role })
      .eq('project_id', projectId)
      .eq('user_id', userId)
      .eq('status', 'active')
      .select('*')
      .maybeSingle();

    if (error) {
      this.logger.error('PamProjectCollaboratorsRepo.updateRole', { error });
      throw new ExecutorError(API_SERVER_ERROR, { cause: error });
    }

    if (!data) {
      throw new ExecutorError(API_PAM_COLLABORATOR_NOT_FOUND);
    }

    return data as PAMProjectCollaboratorRow;
  }

  public async remove(projectId: string, userId: string): Promise<void> {
    const admin = this.supabaseBridge.getAdminSupabase();
    const { data, error } = await admin
      .from(TABLE)
      .delete()
      .eq('project_id', projectId)
      .eq('user_id', userId)
      .select('id');

    if (error) {
      this.logger.error('PamProjectCollaboratorsRepo.remove', { error });
      throw new ExecutorError(API_SERVER_ERROR, { cause: error });
    }

    if (!data?.length) {
      throw new ExecutorError(API_PAM_COLLABORATOR_NOT_FOUND);
    }
  }

  public async deleteAllForProject(projectId: string): Promise<void> {
    const admin = this.supabaseBridge.getAdminSupabase();
    const { error } = await admin
      .from(TABLE)
      .delete()
      .eq('project_id', projectId);

    if (error) {
      this.logger.error('PamProjectCollaboratorsRepo.deleteAllForProject', {
        error
      });
      throw new ExecutorError(API_SERVER_ERROR, { cause: error });
    }
  }

  protected async loadEmailsByUserIds(
    userIds: string[]
  ): Promise<Map<string, string>> {
    const map = new Map<string, string>();
    if (userIds.length === 0) {
      return map;
    }

    const admin = this.supabaseBridge.getAdminSupabase();

    const { data: pamUsers, error: pamError } = await admin
      .from('pam_users')
      .select('id,email')
      .in('id', userIds);

    if (pamError) {
      this.logger.warn('PamProjectCollaboratorsRepo.loadEmails pam_users', {
        error: pamError
      });
    } else {
      for (const row of pamUsers ?? []) {
        if (typeof row.id === 'string') {
          map.set(row.id, typeof row.email === 'string' ? row.email : '');
        }
      }
    }

    const missing = userIds.filter((id) => !map.has(id) || !map.get(id));
    for (const userId of missing) {
      try {
        const { data, error } = await admin.auth.admin.getUserById(userId);
        if (!error && data.user) {
          map.set(userId, data.user.email ?? '');
        }
      } catch (error) {
        this.logger.warn('PamProjectCollaboratorsRepo.loadEmails auth', {
          userId,
          error
        });
      }
    }

    return map;
  }
}
