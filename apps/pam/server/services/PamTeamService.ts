import { ExecutorError } from '@qlover/fe-corekit/executor';
import { expandOrgPermissions, hasOrgPermission } from '@shared/auth/orgRole';
import { PermissionKey } from '@shared/auth/permissionKeys';
import { inject, injectable } from '@shared/container';
import {
  API_NOT_AUTHORIZED,
  API_PAM_PROJECT_NOT_FOUND,
  API_PAM_SLUG_EXISTS,
  API_PAM_TRANSFER_USER_NOT_FOUND,
  API_SERVER_ERROR
} from '@config/i18n-identifier/api';
import type {
  PamTeamAttachProject,
  PamTeamCreate,
  PamTeamDetail,
  PamTeamMemberAdd,
  PamTeamMemberItem,
  PamTeamMemberUpdate,
  PamTeamRole,
  PamTeamRow
} from '@schemas/PamTeamSchema';
import { PAMProjectRepo } from '@server/repositorys/PAMProjectRepo';
import { PamTeamMembersRepo } from '@server/repositorys/PamTeamMembersRepo';
import { PamTeamsRepo } from '@server/repositorys/PamTeamsRepo';
import { PamUsersRepo } from '@server/repositorys/PamUsersRepo';
import { OAuthUserService } from '@server/services/OAuthUserService';
import { PamPermissionService } from '@server/services/PamPermissionService';

function slugify(input: string): string {
  return input
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 48);
}

@injectable()
export class PamTeamService {
  constructor(
    @inject(PamTeamsRepo) protected readonly teamsRepo: PamTeamsRepo,
    @inject(PamTeamMembersRepo)
    protected readonly membersRepo: PamTeamMembersRepo,
    @inject(PAMProjectRepo) protected readonly projectRepo: PAMProjectRepo,
    @inject(PamUsersRepo) protected readonly pamUsersRepo: PamUsersRepo,
    @inject(OAuthUserService) protected readonly userService: OAuthUserService,
    @inject(PamPermissionService)
    protected readonly permissionService: PamPermissionService
  ) {}

  public async listMyTeams(): Promise<
    Array<PamTeamRow & { my_role: PamTeamRole; permissions: string[] }>
  > {
    await this.permissionService.ensureLoaded();
    const user = await this.userService.getUser(true);
    if (!user) {
      throw new ExecutorError(API_NOT_AUTHORIZED);
    }

    const teamIds = await this.membersRepo.listActiveTeamIdsForUser(user.id);
    const teams = await this.teamsRepo.listByIds(teamIds);
    const out: Array<
      PamTeamRow & { my_role: PamTeamRole; permissions: string[] }
    > = [];

    for (const team of teams) {
      const role = await this.membersRepo.getActiveRole(team.id, user.id);
      if (!role) {
        continue;
      }
      out.push({
        ...team,
        my_role: role,
        permissions: [...expandOrgPermissions(role)]
      });
    }
    return out;
  }

  public async createTeam(input: PamTeamCreate): Promise<PamTeamDetail> {
    await this.permissionService.ensureLoaded();
    const user = await this.userService.getUser(true);
    if (!user) {
      throw new ExecutorError(API_NOT_AUTHORIZED);
    }

    const baseSlug = input.slug?.trim() || slugify(input.name) || 'team';
    let slug = baseSlug;
    for (let i = 0; i < 8; i++) {
      const existing = await this.teamsRepo.findBySlug(slug);
      if (!existing) {
        break;
      }
      if (i === 7) {
        throw new ExecutorError(API_PAM_SLUG_EXISTS, { slug });
      }
      slug = `${baseSlug}-${i + 2}`;
    }

    const team = await this.teamsRepo.create({
      name: input.name.trim(),
      slug,
      ownerId: user.id
    });
    await this.membersRepo.ensureOwnerMember(team.id, user.id);

    return {
      ...team,
      my_role: 'owner',
      members: await this.membersRepo.listByTeamId(team.id),
      permissions: [...expandOrgPermissions('owner')]
    };
  }

  /**
   * Ensures the user has a personal team (slug personal-{userId}).
   * Used when creating projects so team_id can be set.
   */
  public async ensurePersonalTeam(userId: string): Promise<PamTeamRow> {
    const slug = `personal-${userId}`;
    const existing = await this.teamsRepo.findBySlug(slug);
    if (existing) {
      await this.membersRepo.ensureOwnerMember(existing.id, userId);
      return existing;
    }
    const team = await this.teamsRepo.create({
      name: 'Personal',
      slug,
      ownerId: userId
    });
    await this.membersRepo.ensureOwnerMember(team.id, userId);
    return team;
  }

  public async getTeamDetail(teamId: string): Promise<PamTeamDetail> {
    await this.permissionService.ensureLoaded();
    const { role } = await this.assertTeamPermission(
      teamId,
      PermissionKey.pam_teams_read
    );
    const team = await this.teamsRepo.findById(teamId);
    if (!team) {
      throw new ExecutorError(API_PAM_PROJECT_NOT_FOUND);
    }
    return {
      ...team,
      my_role: role,
      members: await this.membersRepo.listByTeamId(teamId),
      permissions: [...expandOrgPermissions(role)]
    };
  }

  public async addMember(
    teamId: string,
    input: PamTeamMemberAdd
  ): Promise<PamTeamMemberItem> {
    const { userId: actorId } = await this.assertTeamPermission(
      teamId,
      PermissionKey.pam_teams_members_create
    );

    const team = await this.teamsRepo.findById(teamId);
    if (!team) {
      throw new ExecutorError(API_PAM_PROJECT_NOT_FOUND);
    }
    if (input.user_id === team.owner_id) {
      throw new ExecutorError(API_NOT_AUTHORIZED);
    }

    const exists = await this.pamUsersRepo.findById(input.user_id);
    if (!exists) {
      throw new ExecutorError(API_PAM_TRANSFER_USER_NOT_FOUND);
    }

    await this.membersRepo.upsertMember({
      teamId,
      userId: input.user_id,
      role: input.role,
      invitedBy: actorId
    });

    const list = await this.membersRepo.listByTeamId(teamId);
    const item = list.find((m) => m.user_id === input.user_id);
    if (!item) {
      throw new ExecutorError(API_SERVER_ERROR);
    }
    return item;
  }

  public async updateMemberRole(
    teamId: string,
    userId: string,
    input: PamTeamMemberUpdate
  ): Promise<PamTeamMemberItem> {
    await this.assertTeamPermission(
      teamId,
      PermissionKey.pam_teams_members_update
    );

    const team = await this.teamsRepo.findById(teamId);
    if (!team) {
      throw new ExecutorError(API_PAM_PROJECT_NOT_FOUND);
    }
    if (userId === team.owner_id) {
      throw new ExecutorError(API_NOT_AUTHORIZED);
    }

    await this.membersRepo.updateRole(teamId, userId, input.role);
    const list = await this.membersRepo.listByTeamId(teamId);
    const item = list.find((m) => m.user_id === userId);
    if (!item) {
      throw new ExecutorError(API_SERVER_ERROR);
    }
    return item;
  }

  public async removeMember(teamId: string, userId: string): Promise<void> {
    await this.assertTeamPermission(
      teamId,
      PermissionKey.pam_teams_members_delete
    );

    const team = await this.teamsRepo.findById(teamId);
    if (!team) {
      throw new ExecutorError(API_PAM_PROJECT_NOT_FOUND);
    }
    if (userId === team.owner_id) {
      throw new ExecutorError(API_NOT_AUTHORIZED);
    }

    await this.membersRepo.remove(teamId, userId);
  }

  public async attachProject(
    teamId: string,
    input: PamTeamAttachProject
  ): Promise<void> {
    const { userId } = await this.assertTeamPermission(
      teamId,
      PermissionKey.pam_teams_projects_attach
    );

    const team = await this.teamsRepo.findById(teamId);
    if (!team) {
      throw new ExecutorError(API_PAM_PROJECT_NOT_FOUND);
    }

    const access = await this.projectRepo.getProjectAccessAdmin(
      input.project_id
    );
    if (!access) {
      throw new ExecutorError(API_PAM_PROJECT_NOT_FOUND);
    }

    // Only project owner (or already same team) may reassign for now.
    if (access.owner_id !== userId && access.owner_id !== team.owner_id) {
      throw new ExecutorError(API_NOT_AUTHORIZED);
    }

    await this.projectRepo.setProjectTeamIdAdmin(input.project_id, teamId);
  }

  public async resolveTeamRoleForProject(
    projectId: string,
    userId: string,
    teamId?: string | null
  ): Promise<PamTeamRole | null> {
    let resolvedTeamId = teamId;
    if (resolvedTeamId === undefined) {
      const access = await this.projectRepo.getProjectAccessAdmin(projectId);
      resolvedTeamId = access?.team_id ?? null;
    }
    if (!resolvedTeamId) {
      return null;
    }
    return this.membersRepo.getActiveRole(resolvedTeamId, userId);
  }

  protected async assertTeamPermission(
    teamId: string,
    permissionKey: string
  ): Promise<{ userId: string; role: PamTeamRole }> {
    await this.permissionService.ensureLoaded();
    const user = await this.userService.getUser(true);
    if (!user) {
      throw new ExecutorError(API_NOT_AUTHORIZED);
    }

    const team = await this.teamsRepo.findById(teamId);
    if (!team) {
      throw new ExecutorError(API_PAM_PROJECT_NOT_FOUND);
    }

    const role = await this.membersRepo.getActiveRole(teamId, user.id);
    if (!role || !hasOrgPermission(role, permissionKey)) {
      throw new ExecutorError(API_NOT_AUTHORIZED);
    }

    return { userId: user.id, role };
  }
}
