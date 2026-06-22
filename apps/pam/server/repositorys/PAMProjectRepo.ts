import {
  ResourceSearchParams,
  ResourceSearchResult
} from '@qlover/corekit-bridge';
import { ExecutorError } from '@qlover/fe-corekit';
import { isEmpty } from 'lodash';
import { inject, injectable } from '@shared/container';
import {
  API_NOT_AUTHORIZED,
  API_PAM_ENV_NOT_FOUND,
  API_PAM_PROJECT_NOT_FOUND
} from '@config/i18n-identifier/api';
import { I } from '@config/ioc-identifiter';
import {
  PAMEnvironmentEditSchemaType,
  PAMEnvironmentsSchemaType,
  PAMEnvironmentsTableName,
  PAMPROJECT_TSVECTOR_KEY,
  PAMProjectCreateWithEnvSchemaType,
  PAMProjectEnvKey,
  PAMProjectSafeFields,
  PAMProjectSafeSchema,
  PAMProjectSafeSchemaType,
  PAMProjectTableName,
  PAMProjectUpdateSchemaType,
  PAMProjectWithEnvironmentsSchema,
  PAMProjectWithEnvironmentsSchemaType,
  PAMUpdateSQLFunctionName,
  type PAMProjectSchemaType
} from '@schemas/PAMProjectSchema';
import {
  FilterTriple,
  Operators,
  RepoInsertGetParams,
  RepoInsertParams
} from '@server/interfaces/DBBridgeInterface';
import { BaseRepository } from './BaseRepository';
import { SupabaseRepo } from './SupabaseRepo';
import type { LoggerInterface } from '@qlover/logger';

@injectable()
export class PAMProjectRepo extends BaseRepository<PAMProjectSchemaType> {
  @inject(I.Logger)
  protected logger!: LoggerInterface;

  constructor(
    @inject(SupabaseRepo)
    protected supabaseRepo: SupabaseRepo<PAMProjectSchemaType>
  ) {
    super(PAMProjectTableName);
  }

  /**
   * @override
   */
  public insert(params: RepoInsertParams<PAMProjectSchemaType>): Promise<void>;
  /**
   * @override
   */
  public insert(
    params: RepoInsertGetParams<PAMProjectSchemaType>
  ): Promise<PAMProjectSchemaType>;
  /**
   * @override
   */
  public async insert(
    params:
      | RepoInsertParams<PAMProjectSchemaType>
      | RepoInsertGetParams<PAMProjectSchemaType>
  ): Promise<PAMProjectSchemaType | void> {
    return await this.supabaseRepo.insert(params);
  }

  /**
   * @override
   */
  public async search(
    params: ResourceSearchParams & {
      /**
       * 用户 ID，如果提供id则查询用户相关的(rls)数据，否则查询 public 数据
       */
      user_id?: string;
    }
  ): Promise<ResourceSearchResult<PAMProjectSchemaType>> {
    const { page = 1, pageSize = 20, user_id } = params;

    const orConditions: FilterTriple<PAMProjectSchemaType>[] = [
      ['is_public', Operators.eq, 1]
    ];
    if (user_id) {
      orConditions.push(['owner_id', Operators.eq, user_id]);
    }

    return await this.supabaseRepo.search({
      table: this.getRepoName(),
      fields: PAMProjectSafeFields,
      page: page,
      pageSize: pageSize,
      sort: params.sort,
      fullTextSearch: params.keyword
        ? {
            column: PAMPROJECT_TSVECTOR_KEY,
            query: params.keyword,
            config: 'english'
          }
        : undefined,
      whereOr: orConditions
    });
  }

  /**
   * 搜索项目列表
   * @param params
   * @returns
   */
  public searchProjects(
    params: ResourceSearchParams & {
      user_id?: string;
    }
  ): Promise<ResourceSearchResult<PAMProjectSchemaType>> {
    return this.search(params);
  }

  /**
   * 获取项目及其所有环境（联表查询）
   *
   * 获取用户的一个 project, 包含 RLS 包含 env
   *
   */
  public async getProjectWithEnvironments(
    id: string
  ): Promise<PAMProjectWithEnvironmentsSchemaType | null> {
    // 一定是 rls 的 api
    const supabase = await this.supabaseRepo.getSupabase();
    const result = await supabase
      .from(this.getRepoName())
      .select(
        PAMProjectSafeFields.join(',') +
          `,${PAMProjectEnvKey}: ${PAMEnvironmentsTableName}(*)`
      )
      .eq('id', id)
      // 启用了rls 就不需要 owner_id
      .maybeSingle();

    this.supabaseRepo.throwIfError(result);

    // 可能受 rls 限制，这里直接返回 null
    if (!result.data) {
      return null;
    }

    return PAMProjectWithEnvironmentsSchema.parse(result.data);
  }

  /**
   * 获取用户的一个 project, 包含 RLS 不包含 env
   * @param id
   * @returns
   */
  public async getProjectById(
    id: string
  ): Promise<PAMProjectSafeSchemaType | null> {
    const supabase = await this.supabaseRepo.getSupabase();

    const result = await supabase
      .from(this.getRepoName())
      .select(PAMProjectSafeFields.join(','))
      .eq('id', id)
      // 启用了rls 就不需要 owner_id
      .maybeSingle();

    this.supabaseRepo.throwIfError(result);

    return PAMProjectSafeSchema.parse(result.data);
  }

  /**
   * 检查项目是否有权限
   *
   * id 只能是自己的，不论是 public 还是 private
   *
   * @param id
   * @returns
   */
  public async hasAuthProject(id: string): Promise<boolean> {
    const supabase = await this.supabaseRepo.getSupabase();

    const userResult = await supabase.auth.getUser();
    this.supabaseRepo.throwIfError(userResult);

    const userId = userResult.data.user?.id;

    if (!userId) {
      throw new ExecutorError(API_NOT_AUTHORIZED);
    }

    const result = await supabase
      .from(this.getRepoName())
      .select('id')
      .eq('id', id)
      .eq('owner_id', userId)
      .maybeSingle();

    this.supabaseRepo.throwIfError(result);
    return !isEmpty(result.data);
  }

  /**
   * 更新项目基本信息（仅字段）
   */
  private async updateProjectFields(
    id: string,
    updates: Partial<PAMProjectSchemaType>
  ): Promise<void> {
    if (Object.keys(updates).length === 0) return;

    const supabase = await this.supabaseRepo.getSupabase();
    const result = await supabase
      .from(this.getRepoName())
      .update(updates)
      .eq('id', id);

    this.supabaseRepo.throwIfError(result);
  }

  /**
   * 更新现有环境（仅更新传入的字段）
   * - 每个环境对象必须包含 id
   * - 所有 id 必须已存在于数据库中
   * - 不会新增或删除环境
   * @throws 若缺少 id 或 id 不存在，则抛出异常
   */
  private async syncEnvironments(
    projectId: string,
    envUpdates: PAMEnvironmentEditSchemaType[]
  ): Promise<void> {
    if (!envUpdates || envUpdates.length === 0) return;

    // 1. 验证都有 id
    const missingId = envUpdates.some((env) => !env.id);
    if (missingId) {
      throw new ExecutorError(API_PAM_ENV_NOT_FOUND);
    }

    const supabase = await this.supabaseRepo.getSupabase();

    // 2. 获取现有环境 ID
    const existResult = await supabase
      .from(PAMEnvironmentsTableName)
      .select('id')
      .eq('project_id', projectId);
    this.supabaseRepo.throwIfError(existResult);

    const existing = existResult.data || [];
    const existingIds = new Set(existing.map((e) => e.id));
    const incomingIds = new Set(envUpdates.map((env) => env.id));

    // 3. 检查是否有不存在的 id
    const invalidIds = Array.from(incomingIds).filter(
      (id) => !existingIds.has(id)
    );
    if (invalidIds.length > 0) {
      throw new ExecutorError(API_PAM_ENV_NOT_FOUND, invalidIds);
    }

    // 4. 逐个更新，只更新传入的字段
    for (const env of envUpdates) {
      const updateData: Partial<
        Pick<PAMEnvironmentEditSchemaType, 'name' | 'url' | 'variables'>
      > = {};
      if (env.name !== undefined) updateData.name = env.name;
      if (env.url !== undefined) updateData.url = env.url;
      if (env.variables !== undefined) updateData.variables = env.variables;

      if (Object.keys(updateData).length === 0) continue; // 无字段跳过

      const result = await supabase
        .from(PAMEnvironmentsTableName)
        .update(updateData)
        .eq('id', env.id);
      this.supabaseRepo.throwIfError(result);
    }
  }

  /**
   * 更新项目（含环境）
   *
   * TODO: 更新后的 env name 需要去重
   *
   * 但是逻辑分离，并不支持事务
   */
  public async updateProject(
    id: string,
    updates: PAMProjectUpdateSchemaType
  ): Promise<PAMProjectWithEnvironmentsSchemaType> {
    const { [PAMProjectEnvKey]: envUpdates, ...projectUpdates } = updates;

    await this.getProjectById(id);

    // 1. 更新项目字段
    await this.updateProjectFields(id, projectUpdates);

    // 2. 更新环境（如果提供了）
    if (envUpdates !== undefined) {
      await this.syncEnvironments(id, envUpdates);
    }

    // 3. 返回最新数据
    const supabase = await this.supabaseRepo.getSupabase();
    const result = await supabase
      .from(this.getRepoName())
      .select(
        !envUpdates
          ? PAMProjectSafeFields.join(',')
          : PAMProjectSafeFields.join(',') +
              `,${PAMProjectEnvKey}: ${PAMEnvironmentsTableName}(*)`
      )
      .eq('id', id)
      .maybeSingle();

    this.supabaseRepo.throwIfError(result);

    if (!result.data) {
      throw new ExecutorError(API_PAM_PROJECT_NOT_FOUND);
    }

    this.logger.info(
      `[PAMProjectRepo] update project ${id} success`,
      result.data
    );
    return PAMProjectWithEnvironmentsSchema.parse(result.data);
  }

  /**
   * 更新项目（含环境）
   *
   * 该方式使用 rpc 更新支持事务
   *
   * @param id
   * @param updates
   * @returns
   */
  public async rpc_updateProject(
    id: string,
    updates: PAMProjectUpdateSchemaType
  ): Promise<PAMProjectWithEnvironmentsSchemaType> {
    const supabase = await this.supabaseRepo.getSupabase();

    // 准备参数
    const { [PAMProjectEnvKey]: envUpdates, ...projectUpdates } = updates;

    // 转换环境数组为 JSONB 格式（Supabase 自动处理）
    const envJson = envUpdates ? envUpdates : null;

    // 调用 RPC
    const result = await supabase.rpc(PAMUpdateSQLFunctionName, {
      p_project_id: id,
      p_updates: projectUpdates,
      p_environments: envJson
    });

    this.supabaseRepo.throwIfError(result);

    // data 是 JSONB 对象，需要解析
    const parsed = PAMProjectWithEnvironmentsSchema.parse({
      ...result.data.project,
      environments: result.data.environments || []
    });

    return parsed;
  }

  public async hasProjectWithSlug(slug: string): Promise<boolean> {
    const supabase = await this.supabaseRepo.getSupabase();

    const result = await supabase
      .from(this.getRepoName())
      .select('id')
      .eq('slug', slug)
      .maybeSingle();
    this.supabaseRepo.throwIfError(result);

    return !isEmpty(result.data);
  }

  /**
   * 创建项目（含环境）
   * - 项目字段由 RLS 自动填充 owner_id
   * - 环境批量插入，自动生成 id
   * - 返回完整的项目及环境列表
   */
  public async createProject(
    params: PAMProjectCreateWithEnvSchemaType & {
      owner_id: string;
    }
  ): Promise<PAMProjectWithEnvironmentsSchemaType> {
    const supabase = await this.supabaseRepo.getSupabase();

    // 分离环境和项目字段
    const { [PAMProjectEnvKey]: envs, ...projectData } = params;

    // 1. 创建项目（RLS 自动设置 owner_id）
    const createResult = await this.insert({
      table: this.getRepoName(),
      data: projectData as PAMProjectSchemaType,
      fields: PAMProjectSafeFields
    });

    this.logger.info(
      `[PAMProjectRepo] create project ${projectData.name} success`,
      projectData
    );

    const project = PAMProjectSafeSchema.parse(createResult);

    // 2. 创建环境（如果有）
    let createdEnvs: PAMEnvironmentsSchemaType[] = [];

    this.logger.debug('[PAMProjectRepo] create envs length:', envs?.length);

    if (Array.isArray(envs) && envs.length > 0) {
      const envsToInsert = envs.map((env) => ({
        project_id: project.id,
        name: env.name,
        url: env.url,
        variables: env.variables || {}
      }));

      const envResult = await supabase
        .from(PAMEnvironmentsTableName)
        .insert(envsToInsert)
        .select('*');

      this.supabaseRepo.throwIfError(envResult);

      if (envResult.data) {
        createdEnvs = envResult.data;
      }
    }

    // 3. 组装返回（符合 PAMProjectWithEnvironmentsSchema）
    return PAMProjectWithEnvironmentsSchema.parse({
      ...project,
      [PAMProjectEnvKey]: createdEnvs
    });
  }
}
