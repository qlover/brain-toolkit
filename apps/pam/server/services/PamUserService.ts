import { ExecutorError } from '@qlover/fe-corekit/executor';
import { UserRole } from '@qlover/next-kit/common';
import {
  expandSystemPermissions,
  isPlatformAdminRole,
  normalizeSystemRole,
  SystemRole,
  type SystemRoleType
} from '@shared/auth/systemRole';
import { inject, injectable } from '@shared/container';
import { toBusinessEmail } from '@shared/utils/pamUserIdentity';
import { API_PAM_CI_USER_MANAGED } from '@config/i18n-identifier/api';
import type {
  PamAdminCiOidcBinding,
  PamAdminUserListItem,
  PamSessionUser,
  PamUserRow
} from '@schemas/PamUserSchema';
import { PamCiOidcBindingRepo } from '@server/repositorys/PamCiOidcBindingRepo';
import { PAMProjectRepo } from '@server/repositorys/PAMProjectRepo';
import { PamRolePermissionsRepo } from '@server/repositorys/PamRolePermissionsRepo';
import { PamUsersRepo } from '@server/repositorys/PamUsersRepo';
import { PamCiUserResolver } from '@server/services/PamCiUserResolver';
import { PamPermissionService } from '@server/services/PamPermissionService';
import {
  getSystemRoleCache,
  invalidatePlatformAdminCache,
  setSystemRoleCache
} from '@server/utils/platformAdminCache';

export type PamUserEnsureInput = {
  readonly id: string;
  readonly email: string | null;
  readonly displayName?: string | null;
  readonly phone?: string | null;
};

@injectable()
export class PamUserService {
  constructor(
    @inject(PamUsersRepo) protected readonly repo: PamUsersRepo,
    @inject(PamRolePermissionsRepo)
    protected readonly roles: PamRolePermissionsRepo,
    @inject(PamPermissionService)
    protected readonly permissionService: PamPermissionService,
    @inject(PamCiOidcBindingRepo)
    protected readonly ciOidcBindingRepo: PamCiOidcBindingRepo,
    @inject(PAMProjectRepo) protected readonly projectRepo: PAMProjectRepo,
    @inject(PamCiUserResolver)
    protected readonly ciUserResolver: PamCiUserResolver
  ) {}

  protected async systemRoleFromUser(
    pam: Pick<PamUserRow, 'role_id'> | null | undefined
  ): Promise<SystemRoleType> {
    const key = await this.roles.getRoleKeyById(pam?.role_id);
    return normalizeSystemRole(key);
  }

  public async ensurePamUser(input: PamUserEnsureInput): Promise<PamUserRow> {
    const row = await this.repo.ensureProfile({
      ...input,
      email: toBusinessEmail(input.email)
    });
    const role = await this.systemRoleFromUser(row);
    setSystemRoleCache(row.id, role);
    return row;
  }

  public async findById(userId: string): Promise<PamUserRow | null> {
    return this.repo.findById(userId);
  }

  public async findByEmail(email: string): Promise<PamUserRow | null> {
    return this.repo.findByEmail(email);
  }

  public async findByPhone(phone: string): Promise<PamUserRow | null> {
    return this.repo.findByPhone(phone);
  }

  public async getSystemRole(userId: string): Promise<SystemRoleType> {
    const cached = getSystemRoleCache(userId);
    if (cached) {
      return cached;
    }
    const row = await this.repo.findById(userId);
    const role = await this.systemRoleFromUser(row);
    setSystemRoleCache(userId, role);
    return role;
  }

  /** True when platform role has admin console gate uid (operator or admin). */
  public async isPlatformAdmin(userId: string): Promise<boolean> {
    const role = await this.getSystemRole(userId);
    return isPlatformAdminRole(role);
  }

  /** Flat session user payload (system_role + permissions on the user object). */
  public async toSessionUser(
    pam: PamUserRow,
    extras?: { role?: number; created_at?: string }
  ): Promise<PamSessionUser> {
    await this.permissionService.ensureLoaded();
    const system_role = await this.systemRoleFromUser(pam);
    setSystemRoleCache(pam.id, system_role);
    return {
      id: pam.id,
      email: pam.email?.trim() ?? '',
      phone: pam.phone ?? null,
      display_name: pam.display_name ?? null,
      role: extras?.role ?? UserRole.USER,
      system_role,
      permissions: [...expandSystemPermissions(system_role)],
      credential_token: '',
      created_at: extras?.created_at ?? pam.created_at
    };
  }

  public async searchAdminUsers(params: {
    query?: string;
    limit?: number;
    offset?: number;
  }): Promise<PamAdminUserListItem[]> {
    const rows = await this.repo.searchForAdmin(params);
    const userIds = rows.map((row) => row.id);
    const [ciUserIds, bindingsByUser] = await Promise.all([
      this.ciUserResolver.resolveCiUserIds(userIds),
      this.loadCiOidcBindingsByUserIds(userIds)
    ]);

    return rows.map((row) => {
      const isCi = ciUserIds.has(row.id);
      return {
        id: row.id,
        email: row.email,
        phone: row.phone,
        displayName: row.displayName,
        isPlatformAdmin: row.isPlatformAdmin,
        systemRole: row.systemRole,
        status: row.status as 'active' | 'suspended',
        createdAt: row.createdAt,
        isCi,
        ciOidcBindings: isCi ? (bindingsByUser.get(row.id) ?? []) : []
      };
    });
  }

  public async setPlatformAdmin(
    targetUserId: string,
    enabled: boolean,
    actorUserId: string
  ): Promise<PamUserRow> {
    return this.setSystemRole(
      targetUserId,
      enabled ? SystemRole.Admin : SystemRole.User,
      actorUserId
    );
  }

  public async setSystemRole(
    targetUserId: string,
    systemRole: SystemRoleType,
    actorUserId: string
  ): Promise<PamUserRow> {
    if (await this.ciUserResolver.isCiUser(targetUserId)) {
      throw new ExecutorError(API_PAM_CI_USER_MANAGED);
    }

    const row = await this.repo.setSystemRole(
      targetUserId,
      systemRole,
      actorUserId
    );
    invalidatePlatformAdminCache(targetUserId);
    const role = await this.systemRoleFromUser(row);
    setSystemRoleCache(targetUserId, role);
    return row;
  }

  public async updateDisplayName(
    userId: string,
    displayName: string
  ): Promise<PamUserRow> {
    return this.repo.updateEmailAndPhone({
      userId,
      displayName
    });
  }

  /**
   * 批量加载 CI 用户的 OIDC 绑定并附带项目 slug/name。
   *
   * @param userIds - 用户 id 列表
   */
  protected async loadCiOidcBindingsByUserIds(
    userIds: readonly string[]
  ): Promise<Map<string, PamAdminCiOidcBinding[]>> {
    const out = new Map<string, PamAdminCiOidcBinding[]>();
    if (userIds.length === 0) {
      return out;
    }

    const bindings = await this.ciOidcBindingRepo.listByCiUserIds(userIds);
    if (bindings.length === 0) {
      return out;
    }

    const projectIds = [...new Set(bindings.map((b) => b.projectId))];
    const projects = await this.projectRepo.listBasicsByIdsAdmin(projectIds);
    const projectById = new Map(projects.map((p) => [p.id, p]));

    for (const binding of bindings) {
      const project = projectById.get(binding.projectId);
      const item: PamAdminCiOidcBinding = {
        provider: binding.provider,
        repository: binding.repository,
        projectId: binding.projectId,
        projectSlug: project?.slug ?? binding.projectId,
        projectName: project?.name ?? binding.projectId
      };
      const list = out.get(binding.ciUserId) ?? [];
      list.push(item);
      out.set(binding.ciUserId, list);
    }
    return out;
  }
}
