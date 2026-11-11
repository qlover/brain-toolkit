import { SupabaseRepo } from '@qlover/next-kit/server';
import { inject, injectable } from '@shared/container';
import { PamCiOidcBindingRepo } from '@server/repositorys/PamCiOidcBindingRepo';
import { PamTeamMembersRepo } from '@server/repositorys/PamTeamMembersRepo';

/**
 * 判定 OIDC CI 系统账号（不以邮箱域为身份真源）。
 *
 * 顺序：bindings.ci_user_id → 团队 `ci_runner` 成员 → Auth `user_metadata.pam_ci`。
 */
@injectable()
export class PamCiUserResolver {
  constructor(
    @inject(PamCiOidcBindingRepo)
    protected readonly bindingRepo: PamCiOidcBindingRepo,
    @inject(PamTeamMembersRepo)
    protected readonly membersRepo: PamTeamMembersRepo,
    @inject(SupabaseRepo)
    protected readonly supabaseBridge: SupabaseRepo<unknown>
  ) {}

  /**
   * 批量解析哪些 userId 是 CI 系统账号。
   *
   * @param userIds - 待判定用户 id
   */
  public async resolveCiUserIds(
    userIds: readonly string[]
  ): Promise<ReadonlySet<string>> {
    const out = new Set<string>();
    if (userIds.length === 0) {
      return out;
    }

    const unique = [...new Set(userIds)];
    const bindings = await this.bindingRepo.listByCiUserIds(unique);
    for (const binding of bindings) {
      out.add(binding.ciUserId);
    }

    const remaining = unique.filter((id) => !out.has(id));
    if (remaining.length === 0) {
      return out;
    }

    const fromRole =
      await this.membersRepo.listUserIdsWithCiRunnerAmong(remaining);
    for (const id of fromRole) {
      out.add(id);
    }

    const still = remaining.filter((id) => !out.has(id));
    for (const id of still) {
      if (await this.hasPamCiAuthMetadata(id)) {
        out.add(id);
      }
    }
    return out;
  }

  /**
   * 单个用户是否为 CI 系统账号。
   *
   * @param userId - 用户 id
   */
  public async isCiUser(userId: string): Promise<boolean> {
    const set = await this.resolveCiUserIds([userId]);
    return set.has(userId);
  }

  /**
   * Auth admin：`user_metadata.pam_ci === true`。
   *
   * @param userId - Auth / pam_users id
   */
  protected async hasPamCiAuthMetadata(userId: string): Promise<boolean> {
    const admin = await this.supabaseBridge.getAdminSupabase();
    const result = await admin.auth.admin.getUserById(userId);
    if (result.error || !result.data.user) {
      return false;
    }
    const meta = (result.data.user.user_metadata ?? {}) as Record<
      string,
      unknown
    >;
    return meta.pam_ci === true;
  }
}
