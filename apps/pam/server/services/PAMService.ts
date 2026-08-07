import {
  ResourceSearchParams,
  ResourceSearchResult
} from '@qlover/corekit-bridge';
import { ExecutorError } from '@qlover/fe-corekit/executor';
import { uuidSchema } from '@qlover/next-kit/common';
import { v4 as uuid } from 'uuid';
import { inject, injectable } from '@shared/container';
import { PAMEnvDotenvSerializeUtil } from '@shared/utils/PAMEnvDotenvSerializeUtil';
import { PAMEnvVariableMergeUtil } from '@shared/utils/PAMEnvVariableMergeUtil';
import { PAMEnvVariableNormalizeUtil } from '@shared/utils/PAMEnvVariableNormalizeUtil';
import { PAMEnvVariableRedactUtil } from '@shared/utils/PAMEnvVariableRedactUtil';
import { PAMProjectForkUtil } from '@shared/utils/PAMProjectForkUtil';
import {
  API_NOT_AUTHORIZED,
  API_PAM_ENV_ID_NOT_EXISTS,
  API_PAM_ENV_NAME_EXISTS,
  API_PAM_ENV_NOT_FOUND,
  API_PAM_PROJECT_NOT_FOUND,
  API_PAM_SLUG_EXISTS,
  API_PAM_VARIABLE_KEY_DUPLICATE,
  API_PAM_VARIABLE_VALUE_REQUIRED
} from '@config/i18n-identifier/api';
import type {
  PAMEnvCreate,
  PAMEnvReplaceVariables,
  PAMEnvWriteable,
  PAMVariable
} from '@schemas/PAMEnvironmentSchema';
import {
  SearchPAMProject,
  PAMProjectEnvKey,
  PAMProjectDetail,
  PAMProjectUpdate,
  PAMProjectCreate,
  PAMPublicType,
  PAMCreateSourceType,
  type PAMCreateSource,
  type PAMProjectFork
} from '@schemas/PAMProjectSchema';
import type { SeedServerConfigInterface } from '@interfaces/SeedConfigInterface';
import type {
  PAMServiceInterface,
  ProjectDetailParams
} from '@server/interfaces/PAMServiceInterface';
import { PAMProjectRepo } from '@server/repositorys/PAMProjectRepo';
import { ServerConfig } from '@server/ServerConfig';
import { PAMEnvSecretEncryption } from '@server/utils/PAMEnvSecretEncryption';
import { OAuthUserService } from './OAuthUserService';
import { PamCliTokenService } from './PamCliTokenService';
import type { ServerAuthInterface } from '@qlover/next-kit/server';
import { headers } from 'next/headers';

@injectable()
export class PAMService implements PAMServiceInterface {
  @inject(PAMProjectRepo)
  protected readonly projectRepo!: PAMProjectRepo;

  @inject(OAuthUserService)
  protected readonly userService!: ServerAuthInterface;

  @inject(ServerConfig)
  protected readonly serverConfig!: SeedServerConfigInterface;

  @inject(PamCliTokenService)
  protected readonly cliTokenService!: PamCliTokenService;

  protected secretEncryption: PAMEnvSecretEncryption | null = null;

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
    const user = await this.userService.getUser();

    const result = await this.projectRepo.searchProjects({
      ...params,
      // 如果已经登陆则查询包含用户本身的
      // 如果没有登陆则查询公开项目
      user_id: user?.id
    });

    if (user && result.items && result.items.length > 0) {
      const newItems = result.items.map((item) =>
        Object.assign({}, item, {
          is_owner: user.id === item.owner_id
        } as SearchPAMProject)
      );

      return Object.assign(result, { items: newItems });
    }

    return result;
  }

  /**
   * @override
   */
  public async getProjectDetail(
    params: ProjectDetailParams
  ): Promise<PAMProjectDetail | null> {
    const { id: idOrSlug, withEnvironments } = params;
    const user = await this.userService.getUser();

    const resolvedId = await this.resolveProjectId(idOrSlug);
    if (!resolvedId) {
      return null;
    }

    let detail: PAMProjectDetail | null;
    if (withEnvironments) {
      const withEnvs =
        await this.projectRepo.getProjectWithEnvironments(resolvedId);
      detail = withEnvs ? this.redactProjectDetail(withEnvs) : null;
    } else {
      detail = await this.projectRepo.getProjectById(resolvedId);
    }

    if (!detail) {
      return null;
    }

    return Object.assign({}, detail, {
      is_owner: Boolean(user && user.id === detail.owner_id)
    });
  }

  /**
   * Resolves a project UUID from a path/API id-or-slug segment.
   */
  protected async resolveProjectId(idOrSlug: string): Promise<string | null> {
    const asUuid = uuidSchema.safeParse(idOrSlug);
    if (asUuid.success) {
      const byId = await this.projectRepo.getProjectById(asUuid.data);
      return byId?.id ?? null;
    }

    const bySlug = await this.projectRepo.getProjectWithSlug(idOrSlug);
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
    // 权限校验
    const project = await this.projectRepo.hasAuthProject(id);
    if (!project) throw new ExecutorError(API_NOT_AUTHORIZED);

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
        await this.projectRepo.getEnvIdAndNamesByProjectId(id);
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

    return Object.assign({}, this.redactProjectDetail(detail), {
      is_owner: true
    });
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
    const create_source = await this.resolveCreateSource(options?.createSource);

    // Admin write: CLI bearer auth has no Supabase RLS session (auth.uid()).
    // Ownership is enforced by setting owner_id from the authenticated user.
    const detail = await this.projectRepo.createProjectAdmin({
      ...params,
      [PAMProjectEnvKey]: this.encryptEnvironmentsForStorage(normalizedEnvs),
      owner_id: user.id,
      create_source
    });

    return this.redactProjectDetail(detail);
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
      await this.projectRepo.getProjectWithEnvironments(resolvedId);
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
    // 权限校验
    const project = await this.projectRepo.hasAuthProject(id);
    if (!project) throw new ExecutorError(API_NOT_AUTHORIZED);

    await this.projectRepo.deleteProject(id);
  }

  /**
   * Ensures the current user owns the project.
   *
   * @param projectId - Project id
   * @throws When the user is not the owner
   */
  protected async assertProjectOwner(projectId: string): Promise<void> {
    const user = await this.userService.getUser(true);
    if (!user) {
      throw new ExecutorError(API_NOT_AUTHORIZED);
    }

    // Prefer explicit owner check (works for CLI bearer tokens without
    // a Supabase Auth session). Falls back to RLS session check.
    const owned = await this.projectRepo.isProjectOwnedByUser(
      projectId,
      user.id
    );
    if (owned) {
      return;
    }

    const hasAuth = await this.projectRepo.hasAuthProject(projectId);
    if (!hasAuth) {
      throw new ExecutorError(API_NOT_AUTHORIZED);
    }
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
    const detail = await this.getProjectDetail({
      id: projectId,
      withEnvironments: true
    });

    if (!detail) {
      throw new ExecutorError(API_PAM_PROJECT_NOT_FOUND);
    }

    return detail[PAMProjectEnvKey] || [];
  }

  /**
   * @override
   */
  public async createEnvironment(
    projectId: string,
    params: PAMEnvCreate
  ): Promise<PAMEnvWriteable> {
    await this.assertProjectOwner(projectId);

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
    await this.assertProjectOwner(projectId);

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
    await this.assertProjectOwner(projectId);

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
    const user = await this.userService.getUser(true);
    if (!user) {
      throw new ExecutorError(API_NOT_AUTHORIZED);
    }

    const owned = await this.projectRepo.getOwnedEnvironmentForExport(
      projectId,
      envId,
      user.id
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
