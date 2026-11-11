import { randomBytes } from 'node:crypto';
import { ExecutorError } from '@qlover/fe-corekit/executor';
import { SupabaseRepo } from '@qlover/next-kit/server';
import { PermissionKey } from '@shared/auth/permissionKeys';
import { TeamRoleKey } from '@shared/auth/roleKeys';
import { inject, injectable } from '@shared/container';
import { CI_USER_EMAIL_DOMAIN } from '@shared/utils/pamUserIdentity';
import {
  API_NOT_AUTHORIZED,
  API_PAM_PROJECT_NOT_FOUND,
  API_REQUEST_BODY_EMPTY,
  API_SERVER_ERROR
} from '@config/i18n-identifier/api';
import {
  PAM_SITE_SETTING_KEYS,
  type PamSiteSettingKey
} from '@config/pamSiteSettings';
import type {
  PamCiOidcBinding,
  PamCiOidcBindingUpsert,
  PamCiOidcProviderType,
  PamCliOidcExchangeRequest
} from '@schemas/PamCiOidcSchema';
import type { PamCliTokenResponse } from '@schemas/PamCliSchema';
import type { SeedServerConfigInterface } from '@interfaces/SeedConfigInterface';
import { PamGithubOidcVerifier } from '@server/impls/PamGithubOidcVerifier';
import { PamVercelOidcVerifier } from '@server/impls/PamVercelOidcVerifier';
import type { PamCiOidcVerifierInterface } from '@server/interfaces/PamCiOidcVerifierInterface';
import { PamCiOidcBindingRepo } from '@server/repositorys/PamCiOidcBindingRepo';
import { PAMProjectRepo } from '@server/repositorys/PAMProjectRepo';
import { PamRolePermissionsRepo } from '@server/repositorys/PamRolePermissionsRepo';
import { PamUsersRepo } from '@server/repositorys/PamUsersRepo';
import { ServerConfig } from '@server/ServerConfig';
import { PamCliTokenService } from '@server/services/PamCliTokenService';
import { PAMService } from '@server/services/PAMService';
import { SiteSettingsService } from '@server/services/SiteSettingsService';
import type { UserSchema } from '@qlover/next-kit/common';
import type { NextRequest } from 'next/server';

const OIDC_LOGIN_METHOD = {
  github: 'oidc_github',
  vercel: 'oidc_vercel'
} as const;

const OIDC_AUDIENCE_ENV = {
  github: 'PAM_OIDC_GITHUB_AUDIENCE',
  vercel: 'PAM_OIDC_VERCEL_AUDIENCE'
} as const;

const OIDC_AUDIENCE_SETTING = {
  github: PAM_SITE_SETTING_KEYS.AUTH_OIDC_GITHUB_AUDIENCE,
  vercel: PAM_SITE_SETTING_KEYS.AUTH_OIDC_VERCEL_AUDIENCE
} as const;

/**
 * 项目 CI OIDC 绑定与换票（GitHub / Vercel）。
 *
 * 绑定时懒创建 CI 用户并加入 `team_ci_runner`；
 * 同一项目各 provider 共用同一 CI 用户；
 * exchange 按 provider 选 verifier：peek → 查绑定 → verify → 发 15m pam_cli。
 */
@injectable()
export class PamCiOidcService {
  protected readonly verifiers: Readonly<
    Record<PamCiOidcProviderType, PamCiOidcVerifierInterface>
  >;

  constructor(
    @inject(PAMService)
    protected readonly pamService: PAMService,
    @inject(PAMProjectRepo)
    protected readonly projectRepo: PAMProjectRepo,
    @inject(PamCiOidcBindingRepo)
    protected readonly bindingRepo: PamCiOidcBindingRepo,
    @inject(PamUsersRepo)
    protected readonly pamUsersRepo: PamUsersRepo,
    @inject(PamRolePermissionsRepo)
    protected readonly rolesRepo: PamRolePermissionsRepo,
    @inject(SupabaseRepo)
    protected readonly supabaseBridge: SupabaseRepo<unknown>,
    @inject(PamGithubOidcVerifier)
    githubVerifier: PamGithubOidcVerifier,
    @inject(PamVercelOidcVerifier)
    vercelVerifier: PamVercelOidcVerifier,
    @inject(PamCliTokenService)
    protected readonly cliTokenService: PamCliTokenService,
    @inject(SiteSettingsService)
    protected readonly siteSettings: SiteSettingsService,
    @inject(ServerConfig)
    protected readonly serverConfig: SeedServerConfigInterface
  ) {
    this.verifiers = {
      github: githubVerifier,
      vercel: vercelVerifier
    };
  }

  /**
   * 读取项目某 provider 的 OIDC 绑定（需项目管理权）。
   */
  public async getBinding(
    projectId: string,
    provider: PamCiOidcProviderType = 'github'
  ): Promise<PamCiOidcBinding | null> {
    await this.pamService.assertOrgPermission(
      projectId,
      PermissionKey.pam_project_edit
    );
    const access = await this.requireProjectAccess(projectId);
    return this.bindingRepo.findByProjectProvider(access.id, provider);
  }

  /**
   * Upsert 绑定：确保 CI 用户 + team_ci_runner 成员。
   */
  public async upsertBinding(
    projectId: string,
    input: PamCiOidcBindingUpsert
  ): Promise<PamCiOidcBinding> {
    const provider = input.provider ?? 'github';
    const { userId } = await this.pamService.assertOrgPermission(
      projectId,
      PermissionKey.pam_project_edit
    );
    const access = await this.requireProjectAccess(projectId);
    if (!access.team_id) {
      throw new ExecutorError(API_PAM_PROJECT_NOT_FOUND);
    }

    const repository = input.repository.trim();
    const existingByRepo = await this.bindingRepo.findByProviderRepository(
      provider,
      repository
    );
    if (existingByRepo && existingByRepo.projectId !== access.id) {
      throw new ExecutorError(API_NOT_AUTHORIZED);
    }

    const existing = await this.bindingRepo.findByProjectProvider(
      access.id,
      provider
    );
    const siblingProvider: PamCiOidcProviderType =
      provider === 'github' ? 'vercel' : 'github';
    const sibling = await this.bindingRepo.findByProjectProvider(
      access.id,
      siblingProvider
    );
    const ciUserId =
      existing?.ciUserId ??
      sibling?.ciUserId ??
      (await this.ensureCiUser(access.id, access.team_id, userId));

    await this.ensureCiRunnerMembership(access.team_id, ciUserId, userId);

    return this.bindingRepo.upsert({
      projectId: access.id,
      provider,
      repository,
      ciUserId,
      audience: input.audience?.trim() || null,
      createdBy: existing?.createdBy ?? userId
    });
  }

  /**
   * 删除项目某 provider 的 OIDC 绑定（保留 CI 用户，便于再绑）。
   */
  public async deleteBinding(
    projectId: string,
    provider: PamCiOidcProviderType = 'github'
  ): Promise<void> {
    await this.pamService.assertOrgPermission(
      projectId,
      PermissionKey.pam_project_edit
    );
    const access = await this.requireProjectAccess(projectId);
    await this.bindingRepo.deleteByProjectProvider(access.id, provider);
  }

  /**
   * 平台 id_token → 15m pam_cli。
   *
   * 单路径：按 provider 取 verifier → peek 查绑定 → verify → 发票。
   */
  public async exchange(
    body: PamCliOidcExchangeRequest,
    request: NextRequest
  ): Promise<PamCliTokenResponse> {
    if (!body.idToken?.trim()) {
      throw new ExecutorError(API_REQUEST_BODY_EMPTY);
    }

    const verifier = this.verifiers[body.provider];
    if (!verifier) {
      throw new ExecutorError(API_NOT_AUTHORIZED);
    }

    const resourceHint = verifier.peekResourceKey(body.idToken);
    if (!resourceHint) {
      throw new ExecutorError(API_NOT_AUTHORIZED);
    }

    const binding = await this.bindingRepo.findByProviderRepository(
      body.provider,
      resourceHint
    );
    if (!binding) {
      throw new ExecutorError(API_NOT_AUTHORIZED);
    }

    const audience =
      binding.audience?.trim() || (await this.resolveAudience(body.provider));
    const claims = await verifier.verify(body.idToken, audience);
    if (claims.resourceKey !== binding.repository) {
      throw new ExecutorError(API_NOT_AUTHORIZED);
    }

    return this.issueCiToken(
      binding.ciUserId,
      OIDC_LOGIN_METHOD[body.provider],
      request
    );
  }

  /**
   * 按 provider 解析默认 audience（绑定未覆盖时）。
   */
  public async resolveAudience(
    provider: PamCiOidcProviderType = 'github'
  ): Promise<string> {
    return this.resolveAudienceFrom(
      process.env[OIDC_AUDIENCE_ENV[provider]],
      OIDC_AUDIENCE_SETTING[provider]
    );
  }

  /**
   * @deprecated 使用 {@link resolveAudience}；保留兼容旧调用。
   */
  public async resolveDefaultAudience(): Promise<string> {
    return this.resolveAudience('github');
  }

  protected async issueCiToken(
    ciUserId: string,
    loginMethod: (typeof OIDC_LOGIN_METHOD)[PamCiOidcProviderType],
    request: NextRequest
  ): Promise<PamCliTokenResponse> {
    const user = await this.loadCiUserSchema(ciUserId);
    const issued = await this.cliTokenService.createCiToken(user, {
      loginMethod,
      userAgent: request.headers.get('user-agent'),
      ipAddress:
        request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || null
    });

    return {
      token: issued.token,
      expiresAt: issued.expiresAt,
      user: {
        id: user.id,
        email: user.email
      }
    };
  }

  protected async resolveAudienceFrom(
    envRaw: string | undefined,
    settingKey: PamSiteSettingKey
  ): Promise<string> {
    const fromEnv = envRaw?.trim();
    if (fromEnv) {
      return fromEnv.replace(/\/$/, '');
    }
    const fromSettings = (
      await this.siteSettings.getString(settingKey)
    )?.trim();
    if (fromSettings) {
      return fromSettings.replace(/\/$/, '');
    }
    return this.serverConfig.siteUrl.replace(/\/$/, '');
  }

  protected async requireProjectAccess(projectId: string): Promise<{
    id: string;
    team_id: string | null;
    owner_id: string;
  }> {
    const access = await this.projectRepo.getProjectAccessAdmin(projectId);
    if (!access) {
      throw new ExecutorError(API_PAM_PROJECT_NOT_FOUND);
    }
    return {
      id: access.id,
      owner_id: access.owner_id,
      team_id: access.team_id ?? null
    };
  }

  protected ciEmailForProject(projectId: string): string {
    return `ci+${projectId}@${CI_USER_EMAIL_DOMAIN}`;
  }

  protected async ensureCiUser(
    projectId: string,
    teamId: string,
    invitedBy: string
  ): Promise<string> {
    const email = this.ciEmailForProject(projectId);
    const existing = await this.pamUsersRepo.findByEmail(email);
    if (existing) {
      await this.ensureCiRunnerMembership(teamId, existing.id, invitedBy);
      return existing.id;
    }

    const admin = await this.supabaseBridge.getAdminSupabase();
    const password = randomBytes(32).toString('base64url');
    const created = await admin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: {
        pam_ci: true,
        pam_ci_project_id: projectId
      }
    });

    let userId = created.data.user?.id ?? null;
    if (!userId && created.error) {
      const again = await this.pamUsersRepo.findByEmail(email);
      if (again) {
        userId = again.id;
      } else {
        this.supabaseBridge.throwIfError(created);
        throw new ExecutorError(API_SERVER_ERROR);
      }
    }
    if (!userId) {
      throw new ExecutorError(API_SERVER_ERROR);
    }

    await this.pamUsersRepo.ensureProfile({
      id: userId,
      email,
      displayName: `CI ${projectId.slice(0, 8)}`
    });
    await this.ensureCiRunnerMembership(teamId, userId, invitedBy);
    return userId;
  }

  protected async ensureCiRunnerMembership(
    teamId: string,
    userId: string,
    invitedBy: string
  ): Promise<void> {
    const roleId = await this.rolesRepo.requireRoleIdByKey(
      TeamRoleKey.CiRunner
    );
    const supabase = await this.supabaseBridge.getAdminSupabase();
    const result = await supabase.from('pam_role_team_members').upsert(
      {
        team_id: teamId,
        user_id: userId,
        role_id: roleId,
        status: 'active',
        invited_by: invitedBy
      },
      { onConflict: 'team_id,user_id' }
    );
    this.supabaseBridge.throwIfError(result);
  }

  protected async loadCiUserSchema(userId: string): Promise<UserSchema> {
    const row = await this.pamUsersRepo.findById(userId);
    if (!row) {
      throw new ExecutorError(API_NOT_AUTHORIZED);
    }
    return {
      id: row.id,
      email: row.email ?? this.ciEmailForProject(row.id)
    } as UserSchema;
  }
}
