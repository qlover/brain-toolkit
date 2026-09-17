import { SupabaseRepo } from '@qlover/next-kit/server';
import {
  legacyTeamRoleFromKey,
  teamRoleKeyFromLegacy,
  TeamRoleKey
} from '@shared/auth/roleKeys';
import { inject, injectable } from '@shared/container';
import type {
  PamTeamMemberItem,
  PamTeamMemberRow,
  PamTeamRole
} from '@schemas/PamTeamSchema';
import { PamRolePermissionsRepo } from '@server/repositorys/PamRolePermissionsRepo';

const TABLE = 'pam_role_team_members';

type MemberRoleJoin = {
  role_id: string;
  pam_roles: { key: string } | null;
};

@injectable()
export class PamTeamMembersRepo {
  constructor(
    @inject(SupabaseRepo)
    protected readonly supabaseBridge: SupabaseRepo<unknown>,
    @inject(PamRolePermissionsRepo)
    protected readonly roles: PamRolePermissionsRepo
  ) {}

  public async getActiveRole(
    teamId: string,
    userId: string
  ): Promise<PamTeamRole | null> {
    const supabase = await this.supabaseBridge.getAdminSupabase();
    const result = await supabase
      .from(TABLE)
      .select('role_id, pam_roles ( key )')
      .eq('team_id', teamId)
      .eq('user_id', userId)
      .eq('status', 'active')
      .maybeSingle();
    this.supabaseBridge.throwIfError(result);

    const row = result.data as unknown as MemberRoleJoin | null;
    return legacyTeamRoleFromKey(row?.pam_roles?.key);
  }

  public async listActiveTeamIdsForUser(userId: string): Promise<string[]> {
    const supabase = await this.supabaseBridge.getAdminSupabase();
    const result = await supabase
      .from(TABLE)
      .select('team_id')
      .eq('user_id', userId)
      .eq('status', 'active');
    this.supabaseBridge.throwIfError(result);

    return (result.data ?? []).map((row) => row.team_id as string);
  }

  public async listByTeamId(teamId: string): Promise<PamTeamMemberItem[]> {
    const supabase = await this.supabaseBridge.getAdminSupabase();
    const result = await supabase
      .from(TABLE)
      .select('*, pam_roles ( key )')
      .eq('team_id', teamId)
      .eq('status', 'active')
      .order('created_at', { ascending: true });
    this.supabaseBridge.throwIfError(result);

    const rows = (result.data ?? []) as unknown as Array<
      PamTeamMemberRow & { pam_roles: { key: string } | null }
    >;
    if (rows.length === 0) {
      return [];
    }

    const userIds = rows.map((r) => r.user_id);
    const usersResult = await supabase
      .from('pam_users')
      .select('id, email, phone, display_name')
      .in('id', userIds);
    this.supabaseBridge.throwIfError(usersResult);

    const byId = new Map(
      (usersResult.data ?? []).map((u) => [
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
      const { pam_roles: _join, ...member } = row;
      return {
        ...member,
        role: legacyTeamRoleFromKey(row.pam_roles?.key) ?? 'member',
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
    const roleId = await this.roles.requireRoleIdByKey(
      teamRoleKeyFromLegacy(input.role)
    );
    const supabase = await this.supabaseBridge.getAdminSupabase();
    const result = await supabase
      .from(TABLE)
      .upsert(
        {
          team_id: input.teamId,
          user_id: input.userId,
          role_id: roleId,
          status: 'active',
          invited_by: input.invitedBy
        },
        { onConflict: 'team_id,user_id' }
      )
      .select('*')
      .single();
    this.supabaseBridge.throwIfError(result);

    return result.data as PamTeamMemberRow;
  }

  public async updateRole(
    teamId: string,
    userId: string,
    role: Exclude<PamTeamRole, 'owner'>
  ): Promise<void> {
    const roleId = await this.roles.requireRoleIdByKey(
      teamRoleKeyFromLegacy(role)
    );
    const ownerRoleId = await this.roles.requireRoleIdByKey(TeamRoleKey.Owner);
    const supabase = await this.supabaseBridge.getAdminSupabase();
    const result = await supabase
      .from(TABLE)
      .update({ role_id: roleId })
      .eq('team_id', teamId)
      .eq('user_id', userId)
      .eq('status', 'active')
      .neq('role_id', ownerRoleId);
    this.supabaseBridge.throwIfError(result);
  }

  public async remove(teamId: string, userId: string): Promise<void> {
    const ownerRoleId = await this.roles.requireRoleIdByKey(TeamRoleKey.Owner);
    const supabase = await this.supabaseBridge.getAdminSupabase();
    const result = await supabase
      .from(TABLE)
      .delete()
      .eq('team_id', teamId)
      .eq('user_id', userId)
      .neq('role_id', ownerRoleId);
    this.supabaseBridge.throwIfError(result);
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
    const projectsResult = await supabase
      .from('pam_projects')
      .select('id, team_id')
      .in('id', projectIds)
      .eq('is_deleted', 0);
    this.supabaseBridge.throwIfError(projectsResult);

    const teamIds = [
      ...new Set(
        (projectsResult.data ?? [])
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

    const membersResult = await supabase
      .from(TABLE)
      .select('team_id, role_id, pam_roles ( key )')
      .eq('user_id', userId)
      .eq('status', 'active')
      .in('team_id', teamIds);
    this.supabaseBridge.throwIfError(membersResult);

    const roleByTeam = new Map(
      (membersResult.data ?? [])
        .map((m) => {
          const join = m as unknown as MemberRoleJoin & { team_id: string };
          const legacy = legacyTeamRoleFromKey(join.pam_roles?.key);
          return legacy ? ([join.team_id, legacy] as const) : null;
        })
        .filter((entry): entry is readonly [string, PamTeamRole] =>
          Boolean(entry)
        )
    );

    for (const p of projectsResult.data ?? []) {
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
    const ownerRoleId = await this.roles.requireRoleIdByKey(TeamRoleKey.Owner);
    const supabase = await this.supabaseBridge.getAdminSupabase();
    const result = await supabase.from(TABLE).upsert(
      {
        team_id: teamId,
        user_id: ownerId,
        role_id: ownerRoleId,
        status: 'active',
        invited_by: ownerId
      },
      { onConflict: 'team_id,user_id' }
    );
    this.supabaseBridge.throwIfError(result);
  }
}
