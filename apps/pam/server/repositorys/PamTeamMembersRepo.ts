import { SupabaseRepo } from '@qlover/next-kit/server';
import { inject, injectable } from '@shared/container';
import { I } from '@config/ioc-identifiter';
import type {
  PamTeamMemberItem,
  PamTeamMemberRow,
  PamTeamRole
} from '@schemas/PamTeamSchema';
import type { LoggerInterface } from '@qlover/logger';

const TABLE = 'pam_role_team_members';

@injectable()
export class PamTeamMembersRepo {
  constructor(
    @inject(SupabaseRepo)
    protected readonly supabaseBridge: SupabaseRepo<unknown>,
    @inject(I.Logger)
    protected readonly logger: LoggerInterface
  ) {}

  public async getActiveRole(
    teamId: string,
    userId: string
  ): Promise<PamTeamRole | null> {
    const supabase = await this.supabaseBridge.getAdminSupabase();
    const { data, error } = await supabase
      .from(TABLE)
      .select('role')
      .eq('team_id', teamId)
      .eq('user_id', userId)
      .eq('status', 'active')
      .maybeSingle();

    if (error) {
      this.logger.error('PamTeamMembersRepo.getActiveRole', error);
      throw error;
    }
    return (data?.role as PamTeamRole | undefined) ?? null;
  }

  public async listActiveTeamIdsForUser(userId: string): Promise<string[]> {
    const supabase = await this.supabaseBridge.getAdminSupabase();
    const { data, error } = await supabase
      .from(TABLE)
      .select('team_id')
      .eq('user_id', userId)
      .eq('status', 'active');

    if (error) {
      this.logger.error('PamTeamMembersRepo.listActiveTeamIdsForUser', error);
      throw error;
    }
    return (data ?? []).map((row) => row.team_id as string);
  }

  public async listByTeamId(teamId: string): Promise<PamTeamMemberItem[]> {
    const supabase = await this.supabaseBridge.getAdminSupabase();
    const { data, error } = await supabase
      .from(TABLE)
      .select('*')
      .eq('team_id', teamId)
      .eq('status', 'active')
      .order('created_at', { ascending: true });

    if (error) {
      this.logger.error('PamTeamMembersRepo.listByTeamId', error);
      throw error;
    }

    const rows = (data ?? []) as PamTeamMemberRow[];
    if (rows.length === 0) {
      return [];
    }

    const userIds = rows.map((r) => r.user_id);
    const { data: users, error: usersError } = await supabase
      .from('pam_users')
      .select('id, email, phone, display_name')
      .in('id', userIds);

    if (usersError) {
      this.logger.warn(
        'PamTeamMembersRepo.listByTeamId users lookup',
        usersError
      );
    }

    const byId = new Map(
      (users ?? []).map((u) => [
        u.id as string,
        u as {
          email?: string | null;
          phone?: string | null;
          display_name?: string | null;
        }
      ])
    );

    return rows.map((row) => {
      const u = byId.get(row.user_id);
      return {
        ...row,
        email: u?.email ?? '',
        phone: u?.phone ?? null,
        display_name: u?.display_name ?? null
      };
    });
  }

  public async upsertMember(input: {
    teamId: string;
    userId: string;
    role: Exclude<PamTeamRole, 'owner'>;
    invitedBy: string;
  }): Promise<PamTeamMemberRow> {
    const supabase = await this.supabaseBridge.getAdminSupabase();
    const { data, error } = await supabase
      .from(TABLE)
      .upsert(
        {
          team_id: input.teamId,
          user_id: input.userId,
          role: input.role,
          status: 'active',
          invited_by: input.invitedBy
        },
        { onConflict: 'team_id,user_id' }
      )
      .select('*')
      .single();

    if (error) {
      this.logger.error('PamTeamMembersRepo.upsertMember', error);
      throw error;
    }
    return data as PamTeamMemberRow;
  }

  public async updateRole(
    teamId: string,
    userId: string,
    role: Exclude<PamTeamRole, 'owner'>
  ): Promise<void> {
    const supabase = await this.supabaseBridge.getAdminSupabase();
    const { error } = await supabase
      .from(TABLE)
      .update({ role })
      .eq('team_id', teamId)
      .eq('user_id', userId)
      .eq('status', 'active')
      .neq('role', 'owner');

    if (error) {
      this.logger.error('PamTeamMembersRepo.updateRole', error);
      throw error;
    }
  }

  public async remove(teamId: string, userId: string): Promise<void> {
    const supabase = await this.supabaseBridge.getAdminSupabase();
    const { error } = await supabase
      .from(TABLE)
      .delete()
      .eq('team_id', teamId)
      .eq('user_id', userId)
      .neq('role', 'owner');

    if (error) {
      this.logger.error('PamTeamMembersRepo.remove', error);
      throw error;
    }
  }

  public async listActiveRolesForProjects(
    userId: string,
    projectIds: string[]
  ): Promise<{
    roleByProject: Map<string, PamTeamRole>;
    projectIdsWithTeam: Set<string>;
  }> {
    const roleByProject = new Map<string, PamTeamRole>();
    const projectIdsWithTeam = new Set<string>();
    if (projectIds.length === 0) {
      return { roleByProject, projectIdsWithTeam };
    }

    const supabase = await this.supabaseBridge.getAdminSupabase();
    const { data: projects, error: projectsError } = await supabase
      .from('pam_projects')
      .select('id, team_id')
      .in('id', projectIds)
      .eq('is_deleted', 0);

    if (projectsError) {
      this.logger.error(
        'PamTeamMembersRepo.listActiveRolesForProjects projects',
        projectsError
      );
      throw projectsError;
    }

    const teamIds = [
      ...new Set(
        (projects ?? [])
          .map((p) => {
            const teamId = p.team_id as string | null;
            if (teamId) {
              projectIdsWithTeam.add(p.id as string);
            }
            return teamId;
          })
          .filter((id): id is string => Boolean(id))
      )
    ];
    if (teamIds.length === 0) {
      return { roleByProject, projectIdsWithTeam };
    }

    const { data: members, error: membersError } = await supabase
      .from(TABLE)
      .select('team_id, role')
      .eq('user_id', userId)
      .eq('status', 'active')
      .in('team_id', teamIds);

    if (membersError) {
      this.logger.error(
        'PamTeamMembersRepo.listActiveRolesForProjects members',
        membersError
      );
      throw membersError;
    }

    const roleByTeam = new Map(
      (members ?? []).map((m) => [m.team_id as string, m.role as PamTeamRole])
    );

    for (const p of projects ?? []) {
      const teamId = p.team_id as string | null;
      if (!teamId) {
        continue;
      }
      const role = roleByTeam.get(teamId);
      if (role) {
        roleByProject.set(p.id as string, role);
      }
    }

    return { roleByProject, projectIdsWithTeam };
  }

  public async ensureOwnerMember(
    teamId: string,
    ownerId: string
  ): Promise<void> {
    const supabase = await this.supabaseBridge.getAdminSupabase();
    const { error } = await supabase.from(TABLE).upsert(
      {
        team_id: teamId,
        user_id: ownerId,
        role: 'owner',
        status: 'active',
        invited_by: ownerId
      },
      { onConflict: 'team_id,user_id' }
    );

    if (error) {
      this.logger.error('PamTeamMembersRepo.ensureOwnerMember', error);
      throw error;
    }
  }
}
