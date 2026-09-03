import {
  ResourceSearchParams,
  ResourceSearchResult
} from '@qlover/corekit-bridge';
import { ExecutorError } from '@qlover/fe-corekit/executor';
import { uuidSchema } from '@qlover/next-kit/common';
import { headers } from 'next/headers';
import { v4 as uuid } from 'uuid';
import { inject, injectable } from '@shared/container';
import { PAMEnvDotenvSerializeUtil } from '@shared/utils/PAMEnvDotenvSerializeUtil';
import { PAMEnvVariableMergeUtil } from '@shared/utils/PAMEnvVariableMergeUtil';
import { PAMEnvVariableNormalizeUtil } from '@shared/utils/PAMEnvVariableNormalizeUtil';
import { PAMEnvVariableRedactUtil } from '@shared/utils/PAMEnvVariableRedactUtil';
import { PAMProjectForkUtil } from '@shared/utils/PAMProjectForkUtil';
import { parsePAMSiteUrl } from '@shared/utils/PAMSiteIconUtil';
import {
  API_NOT_AUTHORIZED,
  API_PAM_COLLABORATOR_EXISTS,
  API_PAM_COLLABORATOR_IS_OWNER,
  API_PAM_COLLABORATOR_NOT_FOUND,
  API_PAM_ENV_ID_NOT_EXISTS,
  API_PAM_ENV_NAME_EXISTS,
  API_PAM_ENV_NOT_FOUND,
  API_PAM_PROJECT_NOT_FOUND,
  API_PAM_SLUG_EXISTS,
  API_PAM_TRANSFER_TO_SELF,
  API_PAM_TRANSFER_USER_NOT_FOUND,
  API_PAM_PREVIEW_CAPTURE_FAILED,
  API_PAM_PREVIEW_URL_MISSING,
  API_PAM_SITE_URL_INVALID,
  API_PAM_VARIABLE_KEY_DUPLICATE,
  API_PAM_VARIABLE_VALUE_REQUIRED
} from '@config/i18n-identifier/api';
import { PAM_SITE_SETTING_KEYS } from '@config/pamSiteSettings';
import type {
  PAMEnvCreate,
  PAMEnvReplaceVariables,
  PAMEnvWriteable,
  PAMVariable
} from '@schemas/PAMEnvironmentSchema';
import type {
  PAMProjectCollaboratorAdd,
  PAMProjectCollaboratorItem,
  PAMProjectCollaboratorUpdate,
  PAMProjectAccessRole
} from '@schemas/PAMProjectCollaboratorSchema';
import {
  SearchPAMProject,
  PAMProjectEnvKey,
  PAMProjectDetail,
  PAMProjectUpdate,
  PAMProjectCreate,
  PAMPublicType,
  PAMCreateSourceType,
  type PAMCreateSource,
  type PAMProjectFork,
  type PAMProjectTransfer,
  type PAMAuthUserSummary
} from '@schemas/PAMProjectSchema';
import type { SeedServerConfigInterface } from '@interfaces/SeedConfigInterface';
import type {
  PAMServiceInterface,
  ProjectDetailParams
} from '@server/interfaces/PAMServiceInterface';
import { PamProjectCollaboratorsRepo } from '@server/repositorys/PamProjectCollaboratorsRepo';
import { PAMProjectRepo } from '@server/repositorys/PAMProjectRepo';
import { ServerConfig } from '@server/ServerConfig';
import { SiteSettingsService } from '@server/services/SiteSettingsService';
import { PAMEnvSecretEncryption } from '@server/utils/PAMEnvSecretEncryption';
import {
  capturePageScreenshot,
  resolveProjectCaptureUrl
} from '@server/utils/PAMPreviewCaptureUtil';
import { fetchSiteLogoForUrl } from '@server/utils/PAMSiteLogoFetchUtil';
import type { FetchedSiteLogo } from '@server/utils/PAMSiteLogoFetchUtil';
import {
  hasMinProjectAccess,
  projectAccessFlags
} from '@server/utils/projectAccessRole';
import { MemoryKvCacheService } from './MemoryKvCacheService';
import { OAuthUserService } from './OAuthUserService';
import { PAMCategoryCacheService } from './PAMCategoryCacheService';
import { PamCliTokenService } from './PamCliTokenService';

const AUTH_USERS_SEARCH_CACHE_TTL_MS = 45_000;
const AUTH_USERS_SEARCH_LIMIT = 20;

@injectable()
export class PAMService implements PAMServiceInterface {
  @inject(PAMProjectRepo)
  protected readonly projectRepo!: PAMProjectRepo;

  @inject(PamProjectCollaboratorsRepo)
  protected readonly collaboratorsRepo!: PamProjectCollaboratorsRepo;

  @inject(OAuthUserService)
  protected readonly userService!: OAuthUserService;

  @inject(ServerConfig)
  protected readonly serverConfig!: SeedServerConfigInterface;

  @inject(SiteSettingsService)
  protected readonly siteSettings!: SiteSettingsService;

  @inject(MemoryKvCacheService)
  protected readonly kv!: MemoryKvCacheService;

  @inject(PamCliTokenService)
  protected readonly cliTokenService!: PamCliTokenService;

  @inject(PAMCategoryCacheService)
  protected readonly categoryCache!: PAMCategoryCacheService;

  /** Coalesce identical in-flight searches (real-time; not a result cache). */
  private readonly searchInflight = new Map<
    string,
    Promise<ResourceSearchResult<SearchPAMProject>>
  >();

  protected secretEncryption: PAMEnvSecretEncryption | null = null;

  protected async attachSearchAccess(
    user: { id: string } | null | undefined,
    result: ResourceSearchResult<SearchPAMProject>
  ): Promise<ResourceSearchResult<SearchPAMProject>> {
    if (!user?.id || !result.items?.length) {
      return result;
    }

    const projectIds = result.items.map((item) => item.id);
    const collabRoles = await this.collaboratorsRepo.listActiveRolesForUser(
      user.id,
      projectIds
    );

    const items = result.items.map((item) => {
      let role: PAMProjectAccessRole = 'none';
      if (item.owner_id && user.id === item.owner_id) {
        role = 'owner';
      } else {
        role = collabRoles.get(item.id) ?? 'none';
      }
      return Object.assign({}, item, projectAccessFlags(role));
    });

    return Object.assign({}, result, { items });
  }

  /**
   * Resolves effective project role for a user.
   */
  protected async resolveAccessRole(
    projectId: string,
    userId: string,
    ownerId?: string | null
  ): Promise<PAMProjectAccessRole> {
    if (ownerId && userId === ownerId) {
      return 'owner';
    }

    if (!ownerId) {
      const owned = await this.projectRepo.isProjectOwnedByUser(
        projectId,
        userId
      );
      if (owned) {
        return 'owner';
      }
    }

    const collabRole = await this.collaboratorsRepo.getActiveRole(
      projectId,
      userId
    );
    return collabRole ?? 'none';
  }

  /**
   * Ensures the current user has at least `minRole` on the project.
   */
  protected async assertProjectAccess(
    projectId: string,
    minRole: Exclude<PAMProjectAccessRole, 'none'>
  ): Promise<{ userId: string; role: PAMProjectAccessRole }> {
    const user = await this.userService.getUser(true);
    if (!user) {
      throw new ExecutorError(API_NOT_AUTHORIZED);
    }

    const access = await this.projectRepo.getProjectAccessAdmin(projectId);
    if (!access) {
      throw new ExecutorError(API_PAM_PROJECT_NOT_FOUND);
    }

    const role = await this.resolveAccessRole(
      projectId,
      user.id,
      access.owner_id
    );

    if (!hasMinProjectAccess(role, minRole)) {
      // Prefer explicit owner check fallback for legacy RLS cookie sessions.
      if (minRole === 'owner') {
        const hasAuth = await this.projectRepo.hasAuthProject(projectId);
        if (hasAuth) {
          return { userId: user.id, role: 'owner' };
        }
      }
      throw new ExecutorError(API_NOT_AUTHORIZED);
    }

    return { userId: user.id, role };
  }

  /**
   * Ensures the current user is at least project admin (owner included).
   *
   * @param projectId - Project id
   * @throws When the user lacks admin access
   */
  protected async assertProjectOwner(projectId: string): Promise<void> {
    await this.assertProjectAccess(projectId, 'admin');
  }

  protected buildSearchInflightKey(
    userId: string | undefined,
    params: ResourceSearchParams
  ): string {
    return JSON.stringify({
      userId: userId ?? null,
      page: params.page ?? 1,
      pageSize: params.pageSize ?? 10,
      keyword: (params.keyword || '').trim(),
      filters: params.filters ?? null,
      sort: params.sort ?? null
    });
  }

  /**
   * Lazy AES helper for sensitive env values at rest.
   *
   * @returns Shared {@link PAMEnvSecretEncryption} instance
   */
  protected getSecretEncryption(): PAMEnvSecretEncryption {
    if (!this.secretEncryption) {
      this.secretEncryption = new PAMEnvSecretEncryption(
        this.serverConfig.pamEnvSecretKey
      );
    }
    return this.secretEncryption;
  }

  /**
   * Encrypts sensitive variable values on environments about to be persisted.
   *
   * @param environments - Environments after merge / validation
   * @returns Environments with sensitive values encrypted
   */
  protected encryptEnvironmentsForStorage<
    T extends { variables?: PAMVariable[] }
  >(environments: T[] | undefined): T[] | undefined {
    if (!environments) {
      return environments;
    }

    const encryption = this.getSecretEncryption();
    return environments.map(
      (env: T): T => ({
        ...env,
        variables:
          env.variables === undefined
            ? env.variables
            : encryption.encryptSensitiveVariables(
                PAMEnvVariableNormalizeUtil.normalizeVariables(env.variables)
              )
      })
    );
  }

  /**
   * Redacts sensitive values before returning project detail.
   *
   * @param detail - Project detail that may include environments
   * @returns Detail safe for API responses
   */
  protected redactProjectDetail(detail: PAMProjectDetail): PAMProjectDetail {
    const environments = detail[PAMProjectEnvKey];
    if (!environments) {
      return detail;
    }

    return {
      ...detail,
      [PAMProjectEnvKey]:
        PAMEnvVariableRedactUtil.redactEnvironments(environments)
    };
  }

  /**
   * Rejects sensitive variables that still have an empty value after merge.
   *
   * @param environments - Environments about to be persisted
   * @throws ExecutorError when a sensitive value is missing
   */
  protected assertSensitiveValuesPresent(
    environments: { name: string; variables?: PAMVariable[] }[] | undefined
  ): void {
    for (const env of environments || []) {
      for (const variable of env.variables || []) {
        if (variable.sensitive && variable.value.trim() === '') {
          throw new ExecutorError(
            API_PAM_VARIABLE_VALUE_REQUIRED,
            `Sensitive variable "${variable.key}" in environment "${env.name}" requires a value`
          );
        }
      }
    }
  }

  /**
   * Merges request environment variables with stored ones.
   *
   * @param projectId - Project id
   * @param requestEnvs - Environments from the update request
   * @returns Environments with secrets preserved where requested
   */
  protected async mergeRequestEnvironments(
    projectId: string,
    requestEnvs: NonNullable<PAMProjectUpdate['environments']>
  ): Promise<NonNullable<PAMProjectUpdate['environments']>> {
    const existingEnvs =
      await this.projectRepo.getEnvironmentsByProjectId(projectId);
    const existingById = new Map(
      existingEnvs.map((env) => [env.id, env] as const)
    );

    return requestEnvs.map((env) => {
      if (env.variables === undefined) {
        return env;
      }

      const previous = env.id ? existingById.get(env.id) : undefined;
      const merged = PAMEnvVariableMergeUtil.mergeVariables(
        previous?.variables,
        env.variables
      );

      return {
        ...env,
        variables: merged
      };
    });
  }

  /**
   * @override
   */
  public async searchProjects(
    params: ResourceSearchParams
  ): Promise<ResourceSearchResult<SearchPAMProject>> {
    const user = await this.userService.getSessionUser();
    const userId = user?.id;
    const inflightKey = this.buildSearchInflightKey(userId, params);
    const pending = this.searchInflight.get(inflightKey);
    if (pending) {
      return pending;
    }

    const promise = this.projectRepo
      .searchProjects({
        ...params,
        user_id: userId
      })
      .then((result) => this.attachSearchAccess(user, result))
      .finally(() => {
        this.searchInflight.delete(inflightKey);
      });

    this.searchInflight.set(inflightKey, promise);
    return promise;
  }

  /**
   * @override
   */
  public async listCategories(): Promise<string[]> {
    const user = await this.userService.getSessionUser();
    const userId = user?.id;
    const cached = await this.categoryCache.get(userId);
    if (cached) {
      return cached;
    }

    const collabIds = userId
      ? await this.collaboratorsRepo.listActiveProjectIdsForUser(userId)
      : [];
    const categories = await this.projectRepo.listDistinctCategories(
      userId,
      collabIds
    );
    await this.categoryCache.set(userId, categories);
    return categories;
  }

  /**
   * @override
   */
  public async fetchSiteLogo(siteUrl: string): Promise<FetchedSiteLogo | null> {
    const trimmed = siteUrl.trim();
    if (!trimmed || !parsePAMSiteUrl(trimmed)) {
      throw new ExecutorError(API_PAM_SITE_URL_INVALID);
    }
    return fetchSiteLogoForUrl(trimmed);
  }

  /**
   * @override
   */
  public async getProjectDetail(
    params: ProjectDetailParams
  ): Promise<PAMProjectDetail | null> {
    const { id: idOrSlug, withEnvironments } = params;

    const [user, rawDetail] = await Promise.all([
      this.userService.getUser(),
      withEnvironments
        ? this.projectRepo.getProjectDetailWithEnvironmentsAdmin(idOrSlug)
        : this.projectRepo.getProjectDetailAdmin(idOrSlug)
    ]);

    const detail: PAMProjectDetail | null = rawDetail
      ? withEnvironments
        ? this.redactProjectDetail(rawDetail as PAMProjectDetail)
        : (rawDetail as PAMProjectDetail)
      : null;

    if (!detail) {
      return null;
    }

    const role = user
      ? await this.resolveAccessRole(detail.id, user.id, detail.owner_id)
      : ('none' as const);

    if (role === 'none' && detail.is_public !== PAMPublicType.public) {
      return null;
    }

    return Object.assign({}, detail, projectAccessFlags(role));
  }

  /**
   * Resolves a project UUID from a path/API id-or-slug segment.
   */
  protected async resolveProjectId(idOrSlug: string): Promise<string | null> {
    const asUuid = uuidSchema.safeParse(idOrSlug);
    if (asUuid.success) {
      const byId = await this.projectRepo.getProjectByIdAdmin(asUuid.data);
      return byId?.id ?? null;
    }

    const bySlug = await this.projectRepo.getProjectWithSlugAdmin(idOrSlug);
    return bySlug?.id ?? null;
  }

  /**
   * 校验项目环境名称的唯一性（含修改、新增、互换场景）
   * @param existingEnvs 数据库中现有的环境列表 [{ id, name }]
   * @param requestEnvs  请求中的环境列表（PAMEnvWriteable[]）
   * @throws ExecutorError 当存在名称冲突时
   */
  private validateEnvironmentNames(
    existingEnvs: { id: string; name: string }[],
    requestEnvs: { id?: string; name: string }[]
  ): void {
    const idToName = new Map(existingEnvs.map((e) => [e.id, e.name]));
    const allExistingNames = new Set(idToName.values());

    // 1. 检查请求内部重复名称
    const nameCount = new Map<string, number>();
    for (const env of requestEnvs) {
      if (!env.name) continue;
      nameCount.set(env.name, (nameCount.get(env.name) || 0) + 1);
    }
    for (const [name, count] of nameCount) {
      if (count > 1) {
        throw new ExecutorError(
          API_PAM_ENV_NAME_EXISTS,
          `Duplicate environment name "${name}" in request`
        );
      }
    }

    // 2. 构建占用名称集合并释放所有被修改环境的旧名称（无条件）
    const occupied = new Set(allExistingNames);
    for (const env of requestEnvs) {
      if (env.id && idToName.has(env.id)) {
        const oldName = idToName.get(env.id)!;
        occupied.delete(oldName); // 关键：无论是否改名都释放
      }
    }

    // 3. 校验新名称是否与占用集合冲突
    for (const env of requestEnvs) {
      if (env.name && occupied.has(env.name)) {
        throw new ExecutorError(
          API_PAM_ENV_NAME_EXISTS,
          `Environment name "${env.name}" already exists in this project`
        );
      }
    }

    // 4. 校验修改的环境 id 必须存在
    for (const env of requestEnvs) {
      if (env.id && !idToName.has(env.id)) {
        throw new ExecutorError(
          API_PAM_ENV_ID_NOT_EXISTS,
          `Environment ID ${env.id} not exists in this project`
        );
      }
    }
  }

  /**
   * Validates environment variable keys are unique within each environment.
   *
   * @param environments - Environments from create/update
   * @throws ExecutorError when keys collide
   */
  private validateVariableKeys(
    environments: { name: string; variables?: PAMVariable[] }[] | undefined
  ): void {
    for (const env of environments || []) {
      if (env.variables && env.variables.length > 0) {
        const keys = env.variables.map((v) => v.key);
        if (new Set(keys).size !== keys.length) {
          throw new ExecutorError(
            API_PAM_VARIABLE_KEY_DUPLICATE,
            `Duplicate variable keys in environment "${env.name}"`
          );
        }
      }
    }
  }

  /**
   * @override
   */
  public async updateProject(
    params: PAMProjectUpdate,
    extra?: { useRPC?: boolean }
  ): Promise<PAMProjectDetail> {
    const { id } = params;
    const { role } = await this.assertProjectAccess(id, 'member');

    // --- 补充 slug 唯一性校验 ---
    if (params.slug) {
      const existing = await this.projectRepo.getProjectWithSlugAdmin(
        params.slug
      );
      if (existing && existing.id !== id) {
        throw new ExecutorError(API_PAM_SLUG_EXISTS, { slug: params.slug });
      }
    }

    let nextParams = params;

    // --- 环境校验 ---
    if (Array.isArray(params.environments) && params.environments.length > 0) {
      // 获取现有环境（仅需 id 和 name）
      const existingEnvs =
        await this.projectRepo.getEnvIdAndNamesByProjectIdAdmin(id);
      this.validateEnvironmentNames(existingEnvs, params.environments);

      const mergedEnvironments = await this.mergeRequestEnvironments(
        id,
        params.environments
      );
      this.validateVariableKeys(mergedEnvironments);
      this.assertSensitiveValuesPresent(mergedEnvironments);
      nextParams = {
        ...params,
        environments: this.encryptEnvironmentsForStorage(mergedEnvironments)
      };
    }

    const detail = extra?.useRPC
      ? await this.projectRepo.rpc_updateProject(id, nextParams)
      : await this.projectRepo.updateProject(id, nextParams);

    await this.categoryCache.invalidateAll();

    return Object.assign(
      {},
      this.redactProjectDetail(detail),
      projectAccessFlags(role)
    );
  }

  /**
   * @override
   */
  public async createProject(
    params: PAMProjectCreate,
    options?: {
      allowEmptySensitive?: boolean;
      createSource?: PAMCreateSource;
    }
  ): Promise<PAMProjectDetail> {
    const { slug, [PAMProjectEnvKey]: envs } = params;
    // slug 不能重复
    const pamWithSlug = await this.projectRepo.hasProjectWithSlug(slug);

    if (pamWithSlug) {
      throw new ExecutorError(API_PAM_SLUG_EXISTS, { slug });
    }

    // env 不能重复
    // FIXME: scheam 可能已经验证
    if (Array.isArray(envs)) {
      const len = envs.length;
      const names = new Set(envs.map(({ name }) => name));
      if (names.size !== len) {
        throw new ExecutorError(API_PAM_ENV_NAME_EXISTS, { names });
      }
    }

    this.validateVariableKeys(envs);
    const normalizedEnvs = envs?.map((env) => ({
      ...env,
      variables: PAMEnvVariableNormalizeUtil.normalizeVariables(env.variables)
    }));
    if (!options?.allowEmptySensitive) {
      this.assertSensitiveValuesPresent(normalizedEnvs);
    }

    const user = await this.userService.getUser(true);
    if (!user) {
      throw new ExecutorError(API_NOT_AUTHORIZED);
    }
    const create_source = await this.resolveCreateSource(options?.createSource);

    // Admin write: CLI bearer auth has no Supabase RLS session (auth.uid()).
    // Ownership is enforced by setting owner_id from the authenticated user.
    const detail = await this.projectRepo.createProjectAdmin({
      ...params,
      [PAMProjectEnvKey]: this.encryptEnvironmentsForStorage(normalizedEnvs),
      owner_id: user.id,
      create_source
    });

    await this.categoryCache.invalidateAll();

    return Object.assign(
      {},
      this.redactProjectDetail(detail),
      projectAccessFlags('owner')
    );
  }

  /**
   * Resolves create_source: explicit override, else CLI bearer → 1, else web → 0.
   *
   * @param explicit - Optional caller-forced source (e.g. fork → 2)
   */
  protected async resolveCreateSource(
    explicit?: PAMCreateSource
  ): Promise<PAMCreateSource> {
    if (explicit !== undefined) {
      return explicit;
    }

    const authorization = (await headers()).get('authorization');
    if (!authorization?.toLowerCase().startsWith('bearer ')) {
      return PAMCreateSourceType.web;
    }

    const token = authorization.slice('bearer '.length).trim();
    if (!token) {
      return PAMCreateSourceType.web;
    }

    const session = await this.cliTokenService.verifyToken(token);
    return session?.userId ? PAMCreateSourceType.cli : PAMCreateSourceType.web;
  }

  /**
   * @override
   */
  public async forkProject(
    sourceId: string,
    options?: PAMProjectFork
  ): Promise<PAMProjectDetail> {
    const user = await this.userService.getUser(true);
    if (!user) {
      throw new ExecutorError(API_NOT_AUTHORIZED);
    }

    const resolvedId = await this.resolveProjectId(sourceId);
    if (!resolvedId) {
      throw new ExecutorError(API_PAM_PROJECT_NOT_FOUND);
    }

    const source =
      await this.projectRepo.getProjectWithEnvironmentsAdmin(resolvedId);
    if (!source) {
      throw new ExecutorError(API_PAM_PROJECT_NOT_FOUND);
    }

    if (source.owner_id === user.id) {
      throw new ExecutorError(API_NOT_AUTHORIZED);
    }
    if (source.is_public !== PAMPublicType.public) {
      throw new ExecutorError(API_NOT_AUTHORIZED);
    }

    const preferredSlug =
      options?.slug?.trim() || PAMProjectForkUtil.defaultSlug(source.slug);
    const slug = await this.resolveAvailableForkSlug(preferredSlug);
    const name =
      options?.name?.trim() || PAMProjectForkUtil.defaultName(source.name);

    const createPayload = PAMProjectForkUtil.buildCreatePayload(source, {
      slug,
      name
    });

    return this.createProject(createPayload, {
      allowEmptySensitive: true,
      createSource: PAMCreateSourceType.fork
    });
  }

  /**
   * Picks the first unused slug from fork candidates.
   *
   * @param preferredSlug - Preferred slug
   * @returns Available slug
   * @throws When every candidate is taken
   */
  protected async resolveAvailableForkSlug(
    preferredSlug: string
  ): Promise<string> {
    const candidates = PAMProjectForkUtil.slugCandidates(preferredSlug);
    for (const candidate of candidates) {
      const exists = await this.projectRepo.hasProjectWithSlug(candidate);
      if (!exists) {
        return candidate;
      }
    }

    throw new ExecutorError(API_PAM_SLUG_EXISTS, { slug: preferredSlug });
  }

  /**
   * @override
   */
  public async deleteProject(id: string): Promise<void> {
    // Admin+ may delete (owner included via role rank).
    await this.assertProjectAccess(id, 'admin');

    await this.projectRepo.deleteProjectAdmin(id);
    await this.categoryCache.invalidateAll();
  }

  /**
   * @override
   */
  public async transferProject(
    id: string,
    params: PAMProjectTransfer
  ): Promise<void> {
    await this.assertProjectAccess(id, 'admin');

    const currentUser = await this.userService.getUser(true);
    if (!currentUser) {
      throw new ExecutorError(API_NOT_AUTHORIZED);
    }

    const newOwnerId = await this.resolveTransferTargetUserId(params);
    if (newOwnerId === currentUser.id) {
      throw new ExecutorError(API_PAM_TRANSFER_TO_SELF);
    }

    await this.projectRepo.transferProjectOwnerAdmin(id, newOwnerId);
    await this.collaboratorsRepo.deleteAllForProject(id);
    await this.categoryCache.invalidateAll();
  }

  /**
   * Lists Auth users for the transfer recipient picker.
   *
   * Uses cookie session (no Supabase refresh) + short TTL KV cache.
   *
   * @override
   * @param query - Optional email filter
   */
  public async searchUsersForTransfer(
    query?: string
  ): Promise<PAMAuthUserSummary[]> {
    const user =
      (await this.userService.getSessionUser()) ??
      (await this.userService.getUser(true));
    if (!user) {
      throw new ExecutorError(API_NOT_AUTHORIZED);
    }

    const normalizedQuery = query?.trim().toLowerCase() || '';
    const cacheKey = `pam:auth-users:search:${user.id}:${normalizedQuery}`;
    const cached = await this.kv.getItem<PAMAuthUserSummary[]>(cacheKey);
    if (cached) {
      return cached;
    }

    const rows = await this.projectRepo.searchAuthUsers({
      query: normalizedQuery,
      excludeUserId: user.id,
      limit: AUTH_USERS_SEARCH_LIMIT,
      offset: 0
    });

    await this.kv.setItem(cacheKey, rows, {
      ttlMs: AUTH_USERS_SEARCH_CACHE_TTL_MS
    });
    return rows;
  }

  /**
   * Captures the project primary URL once, stores it in Storage, updates cover.
   *
   * @override
   * @param id - Project id
   * @returns Updated project detail
   */
  public async refreshPreviewImage(id: string): Promise<PAMProjectDetail> {
    await this.assertProjectAccess(id, 'member');

    const detail = await this.projectRepo.getProjectWithEnvironmentsAdmin(id);
    if (!detail) {
      throw new ExecutorError(API_PAM_PROJECT_NOT_FOUND);
    }

    const captureUrl = resolveProjectCaptureUrl({
      environments: detail.environments,
      repoUrl: detail.repo_url
    });
    if (!captureUrl || !/^https?:\/\//i.test(captureUrl)) {
      throw new ExecutorError(API_PAM_PREVIEW_URL_MISSING);
    }

    let shot: { bytes: Uint8Array; contentType: string };
    try {
      const screenshotTemplate = await this.siteSettings.getString(
        PAM_SITE_SETTING_KEYS.STORAGE_SCREENSHOT_URL_TEMPLATE
      );
      shot = await capturePageScreenshot(captureUrl, screenshotTemplate);
    } catch (error) {
      throw new ExecutorError(API_PAM_PREVIEW_CAPTURE_FAILED, { cause: error });
    }

    const previewBucket = await this.siteSettings.getString(
      PAM_SITE_SETTING_KEYS.STORAGE_PREVIEW_BUCKET
    );
    const publicUrl = await this.projectRepo.uploadProjectPreviewImage({
      projectId: id,
      bytes: shot.bytes,
      contentType: shot.contentType,
      bucket: previewBucket || this.serverConfig.pamPreviewBucket
    });

    const updated = await this.projectRepo.updateProject(id, {
      preview_image_url: publicUrl
    });

    await this.categoryCache.invalidateAll();

    return Object.assign({}, this.redactProjectDetail(updated), {
      ...projectAccessFlags('owner')
    });
  }

  /**
   * Lists project collaborators (any member+ may view).

   * @override
      */
  public async listCollaborators(
    projectId: string
  ): Promise<PAMProjectCollaboratorItem[]> {
    await this.assertProjectAccess(projectId, 'member');
    return this.collaboratorsRepo.listByProjectId(projectId);
  }

  /**
   * Adds a collaborator (admin+).

   * @override
      */
  public async addCollaborator(
    projectId: string,
    params: PAMProjectCollaboratorAdd
  ): Promise<PAMProjectCollaboratorItem> {
    const { userId: actorId } = await this.assertProjectAccess(
      projectId,
      'admin'
    );

    const access = await this.projectRepo.getProjectAccessAdmin(projectId);
    if (!access) {
      throw new ExecutorError(API_PAM_PROJECT_NOT_FOUND);
    }

    if (params.user_id === access.owner_id) {
      throw new ExecutorError(API_PAM_COLLABORATOR_IS_OWNER);
    }

    const exists = await this.projectRepo.authUserExistsById(params.user_id);
    if (!exists) {
      throw new ExecutorError(API_PAM_TRANSFER_USER_NOT_FOUND);
    }

    const existingRole = await this.collaboratorsRepo.getActiveRole(
      projectId,
      params.user_id
    );
    if (existingRole) {
      throw new ExecutorError(API_PAM_COLLABORATOR_EXISTS);
    }

    await this.collaboratorsRepo.insert({
      projectId,
      userId: params.user_id,
      role: params.role,
      invitedBy: actorId
    });

    await this.categoryCache.invalidateAll();

    const list = await this.collaboratorsRepo.listByProjectId(projectId);
    const item = list.find((row) => row.user_id === params.user_id);
    if (!item) {
      throw new ExecutorError(API_PAM_COLLABORATOR_NOT_FOUND);
    }
    return item;
  }

  /**
   * Updates collaborator role (admin+).

   * @override
      */
  public async updateCollaboratorRole(
    projectId: string,
    userId: string,
    params: PAMProjectCollaboratorUpdate
  ): Promise<PAMProjectCollaboratorItem> {
    await this.assertProjectAccess(projectId, 'admin');

    const access = await this.projectRepo.getProjectAccessAdmin(projectId);
    if (!access) {
      throw new ExecutorError(API_PAM_PROJECT_NOT_FOUND);
    }
    if (userId === access.owner_id) {
      throw new ExecutorError(API_PAM_COLLABORATOR_IS_OWNER);
    }

    await this.collaboratorsRepo.updateRole(projectId, userId, params.role);

    const list = await this.collaboratorsRepo.listByProjectId(projectId);
    const item = list.find((row) => row.user_id === userId);
    if (!item) {
      throw new ExecutorError(API_PAM_COLLABORATOR_NOT_FOUND);
    }
    return item;
  }

  /**
   * Removes a collaborator (admin+). Cuts future access only.

   * @override
      */
  public async removeCollaborator(
    projectId: string,
    userId: string
  ): Promise<void> {
    await this.assertProjectAccess(projectId, 'admin');

    const access = await this.projectRepo.getProjectAccessAdmin(projectId);
    if (!access) {
      throw new ExecutorError(API_PAM_PROJECT_NOT_FOUND);
    }
    if (userId === access.owner_id) {
      throw new ExecutorError(API_PAM_COLLABORATOR_IS_OWNER);
    }

    await this.collaboratorsRepo.remove(projectId, userId);
    await this.categoryCache.invalidateAll();
  }

  /**
   * Resolves transfer recipient from email (Auth Admin) or explicit user id.
   */
  protected async resolveTransferTargetUserId(
    params: PAMProjectTransfer
  ): Promise<string> {
    const userId = params.user_id?.trim() || '';
    if (userId) {
      const id = uuidSchema.parse(userId);
      const exists = await this.projectRepo.authUserExistsById(id);
      if (!exists) {
        throw new ExecutorError(API_PAM_TRANSFER_USER_NOT_FOUND);
      }
      return id;
    }

    const email = params.email?.trim().toLowerCase() || '';
    if (!email) {
      throw new ExecutorError(API_PAM_TRANSFER_USER_NOT_FOUND);
    }

    const foundId = await this.projectRepo.findAuthUserIdByEmail(email);
    if (!foundId) {
      throw new ExecutorError(API_PAM_TRANSFER_USER_NOT_FOUND);
    }
    return foundId;
  }

  /**
   * Assigns ids to variables that omit them.
   *
   * @param variables - Variables to prepare for storage
   * @returns Variables with stable ids
   */
  protected ensureVariableIds(variables: PAMVariable[]): PAMVariable[] {
    return variables.map(
      (variable: PAMVariable): PAMVariable => ({
        ...variable,
        id: variable.id || uuid()
      })
    );
  }

  /**
   * Redacts sensitive values on a single environment response.
   *
   * @param environment - Environment loaded from storage
   * @returns Environment safe for API responses
   */
  protected redactEnvironment(environment: PAMEnvWriteable): PAMEnvWriteable {
    return {
      ...environment,
      variables: PAMEnvVariableRedactUtil.redactVariables(environment.variables)
    };
  }

  /**
   * @override
   */
  public async updateProjectBasics(
    params: Omit<PAMProjectUpdate, 'environments'>
  ): Promise<PAMProjectDetail> {
    return this.updateProject({
      ...params,
      [PAMProjectEnvKey]: undefined
    });
  }

  /**
   * @override
   */
  public async listEnvironments(projectId: string): Promise<PAMEnvWriteable[]> {
    const [user, access] = await Promise.all([
      this.userService.getUser(),
      this.projectRepo.getProjectAccessAdmin(projectId)
    ]);

    if (!access) {
      throw new ExecutorError(API_PAM_PROJECT_NOT_FOUND);
    }

    const role = user
      ? await this.resolveAccessRole(projectId, user.id, access.owner_id)
      : ('none' as const);

    if (role === 'none' && access.is_public !== PAMPublicType.public) {
      throw new ExecutorError(API_PAM_PROJECT_NOT_FOUND);
    }

    const envs = await this.projectRepo.getEnvironmentsByProjectId(projectId);
    return PAMEnvVariableRedactUtil.redactEnvironments(
      envs as PAMEnvWriteable[]
    );
  }

  /**
   * @override
   */
  public async createEnvironment(
    projectId: string,
    params: PAMEnvCreate
  ): Promise<PAMEnvWriteable> {
    await this.assertProjectAccess(projectId, 'member');

    // Admin read/write: CLI bearer auth has no Supabase RLS session.
    const existingEnvs =
      await this.projectRepo.getEnvIdAndNamesByProjectIdAdmin(projectId);
    this.validateEnvironmentNames(existingEnvs, [{ name: params.name }]);

    const normalizedVariables = this.ensureVariableIds(
      PAMEnvVariableNormalizeUtil.normalizeVariables(params.variables)
    );
    this.validateVariableKeys([
      { name: params.name, variables: normalizedVariables }
    ]);
    this.assertSensitiveValuesPresent([
      { name: params.name, variables: normalizedVariables }
    ]);

    const encryptedVariables =
      this.getSecretEncryption().encryptSensitiveVariables(normalizedVariables);

    const created = await this.projectRepo.createEnvironmentAdmin(projectId, {
      name: params.name,
      url: params.url,
      variables: encryptedVariables
    });

    return this.redactEnvironment(created);
  }

  /**
   * @override
   */
  public async deleteEnvironment(
    projectId: string,
    envId: string
  ): Promise<void> {
    // Deleting an environment affects all collaborators — admin+ only.
    await this.assertProjectAccess(projectId, 'admin');

    // Admin read/write: CLI bearer auth has no Supabase RLS session.
    await this.projectRepo.deleteEnvironmentAdmin(projectId, envId);
  }

  /**
   * @override
   */
  public async replaceEnvironmentVariables(
    projectId: string,
    envId: string,
    params: PAMEnvReplaceVariables
  ): Promise<PAMEnvWriteable> {
    await this.assertProjectAccess(projectId, 'member');

    // Admin read/write: CLI bearer auth has no Supabase RLS session.
    const existing = await this.projectRepo.getEnvironmentByIdAdmin(
      projectId,
      envId
    );
    if (!existing) {
      throw new ExecutorError(API_PAM_ENV_NOT_FOUND);
    }

    const merged = this.ensureVariableIds(
      PAMEnvVariableMergeUtil.mergeVariables(
        existing.variables,
        params.variables
      )
    );

    this.validateVariableKeys([{ name: existing.name, variables: merged }]);
    this.assertSensitiveValuesPresent([
      { name: existing.name, variables: merged }
    ]);

    const encrypted =
      this.getSecretEncryption().encryptSensitiveVariables(merged);

    const updated = await this.projectRepo.updateEnvironmentVariablesAdmin(
      projectId,
      envId,
      encrypted
    );

    return this.redactEnvironment(updated);
  }

  /**
   * @override
   */
  public async exportEnvironment(
    projectId: string,
    envId: string
  ): Promise<{
    projectId: string;
    projectSlug: string;
    environmentId: string;
    environmentName: string;
    content: string;
    sensitiveKeys: string[];
    variables: Array<{
      key: string;
      value: string;
      sensitive: boolean;
      comments?: string[];
    }>;
  }> {
    await this.assertProjectAccess(projectId, 'member');

    const owned = await this.projectRepo.getEnvironmentForExport(
      projectId,
      envId
    );

    if (!owned) {
      throw new ExecutorError(API_PAM_ENV_NOT_FOUND);
    }

    const normalized = PAMEnvVariableNormalizeUtil.normalizeVariables(
      owned.environment.variables
    );
    const sensitiveKeys = normalized
      .filter((variable) => variable.sensitive === true)
      .map((variable) => variable.key);
    const decrypted =
      this.getSecretEncryption().decryptSensitiveVariables(normalized);
    const content = PAMEnvDotenvSerializeUtil.serialize(decrypted);
    const variables = decrypted.map((variable) => ({
      key: variable.key,
      value: variable.value,
      sensitive: variable.sensitive === true,
      ...(variable.comments && variable.comments.length > 0
        ? { comments: [...variable.comments] }
        : {})
    }));

    return {
      projectId,
      projectSlug: owned.projectSlug,
      environmentId: owned.environment.id,
      environmentName: owned.environment.name,
      content,
      sensitiveKeys,
      variables
    };
  }
}
