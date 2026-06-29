import { ResourceSearchResult } from '@qlover/corekit-bridge';
import { ExecutorError } from '@qlover/fe-corekit';
import { isEmpty } from 'lodash';
import { inject, injectable } from '@shared/container';
import {
  PAMEnvWriteable,
  PAMEnvRaw,
  PAMEnvTableName
} from '@shared/schemas/PAMEnvironmentSchema';
import { Join } from '@shared/type';
import {
  API_NOT_AUTHORIZED,
  API_PAM_ENV_NOT_FOUND,
  API_PAM_PROJECT_NOT_FOUND
} from '@config/i18n-identifier/api';
import { I } from '@config/ioc-identifiter';
import { DeleteStatus } from '@schemas/common';
import {
  PAMProjectEnvKey,
  SearchPAMProjectFields,
  PAMProjectTableName,
  PAMPROJECT_TSVECTOR_KEY,
  SearchPAMRawProject,
  PAMProjectRaw,
  SearchPAMProject,
  PAMProjectDetail,
  PAMUpdateSQLFunctionName,
  PAMProjectUpdate,
  PAMProjectCreate
} from '@schemas/PAMProjectSchema';
import {
  FilterTriple,
  Operators,
  RepoInsertGetParams,
  RepoInsertParams,
  RepoSearchParams
} from '@server/interfaces/DBBridgeInterface';
import { BaseRepository } from './BaseRepository';
import { SupabaseRepo } from './SupabaseRepo';
import type { LoggerInterface } from '@qlover/logger';

interface PAMProjectSearchParams extends RepoSearchParams<PAMProjectRaw> {
  /**
   * 用户 ID，如果提供id则查询用户相关的(rls)数据，否则查询 public 数据
   */
  user_id?: string;
}

type EnvField = keyof PAMEnvWriteable;

type JoinEnvFieldsResult<T extends '*' | readonly EnvField[]> = T extends '*'
  ? `${typeof PAMProjectEnvKey}: ${typeof PAMEnvTableName}(*)`
  : T extends readonly EnvField[]
    ? `${typeof PAMProjectEnvKey}: ${typeof PAMEnvTableName}(${Join<T>})`
    : never;

@injectable()
export class PAMProjectRepo extends BaseRepository<
  PAMProjectRaw,
  SearchPAMRawProject
> {
  @inject(I.Logger)
  protected logger!: LoggerInterface;

  constructor(
    @inject(SupabaseRepo)
    protected supabaseRepo: SupabaseRepo<PAMProjectRaw>
  ) {
    super(PAMProjectTableName);
  }

  /**
   * @override
   */
  public insert(params: RepoInsertParams<PAMProjectRaw>): Promise<void>;
  /**
   * @override
   */
  public insert(
    params: RepoInsertGetParams<PAMProjectRaw>
  ): Promise<SearchPAMRawProject>;
  /**
   * @override
   */
  public async insert(
    params: RepoInsertParams<PAMProjectRaw> | RepoInsertGetParams<PAMProjectRaw>
  ): Promise<SearchPAMRawProject | void> {
    return await this.supabaseRepo.insert(params);
  }

  /**
   * search 方法可能返回除了 is_deleted 的所有属性
   *
   * @override
   */
  public async search(
    params: PAMProjectSearchParams
  ): Promise<ResourceSearchResult<SearchPAMRawProject>> {
    const { page = 1, pageSize = 20, user_id, fields } = params;

    const orConditions: FilterTriple<PAMProjectRaw>[] = [
      ['is_public', Operators.eq, 1]
    ];

    if (user_id) {
      orConditions.push(['owner_id', Operators.eq, user_id]);
    }

    return await this.supabaseRepo.search({
      table: this.getRepoName(),
      fields: fields ?? SearchPAMProjectFields,
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
      where: [['is_deleted', Operators.eq, DeleteStatus.UNDELETE]],
      whereOr: orConditions
    });
  }

  /**
   * 搜索项目列表
   *
   * - params.fields 默认 {@link SearchPAMProjectFields} 所有属性
   *
   * @param params
   * @returns
   */
  public searchProjects(
    params: PAMProjectSearchParams
  ): Promise<ResourceSearchResult<SearchPAMProject>> {
    // 如果没有传递 user_id 则，不需要查询在 fields 中增加 user_id
    let fields: (keyof SearchPAMRawProject)[] = [];

    // NOTE: 默认查询所有字段
    const excludedFields = params.user_id ? [] : ['owner_id'];

    fields = SearchPAMProjectFields.filter(
      (field) => !excludedFields.includes(field)
    );

    // search list 带上环境信息，但不查询环境变量
    // 环境变量单独查询
    const envField = this.buildJoinEnvFields(['id', 'name', 'url'] as const);

    fields.push(envField as keyof SearchPAMRawProject);

    return this.search({
      ...params,
      fields
    }) as Promise<ResourceSearchResult<SearchPAMProject>>;
  }

  /**
   * 获取项目及其所有环境（联表查询）
   *
   * 获取用户的一个 project, 包含 RLS 包含 env
   *
   */
  public async getProjectWithEnvironments(
    id: string
  ): Promise<PAMProjectDetail | null> {
    const supabase = await this.supabaseRepo.getSupabase();
    const result = await supabase
      .from(this.getRepoName())
      .select(
        SearchPAMProjectFields.join(',') +
          `,${PAMProjectEnvKey}: ${PAMEnvTableName}(*)`
      )
      .eq('id', id)
      .eq('is_deleted', DeleteStatus.UNDELETE) // 新增过滤
      .maybeSingle();

    this.supabaseRepo.throwIfError(result);

    if (!result.data) {
      return null;
    }

    return result.data as never;
  }

  /**
   * 获取用户的一个 project, 包含 RLS 不包含 env
   * @param id
   * @returns
   */
  public async getProjectById(id: string): Promise<SearchPAMRawProject | null> {
    const supabase = await this.supabaseRepo.getSupabase();

    const result = await supabase
      .from(this.getRepoName())
      .select(SearchPAMProjectFields.join(','))
      .eq('id', id)
      .eq('is_deleted', DeleteStatus.UNDELETE) // 新增过滤
      .maybeSingle();

    this.supabaseRepo.throwIfError(result);

    return result.data as never;
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
      .eq('is_deleted', DeleteStatus.UNDELETE) // 新增过滤
      .maybeSingle();

    this.supabaseRepo.throwIfError(result);
    return !isEmpty(result.data);
  }

  public async getEnvIdAndNamesByProjectId(
    id: string
  ): Promise<Pick<PAMEnvRaw, 'id' | 'name'>[]> {
    // 环境表本身没有 is_deleted，但通过 project_id 关联的项目需存在且未删除
    // 此处我们信任调用者已检查项目存在，暂不添加额外查询
    const supabase = await this.supabaseRepo.getSupabase();

    const result = await supabase
      .from(PAMEnvTableName)
      .select('id,name')
      .eq('project_id', id);

    this.supabaseRepo.throwIfError(result);

    return result.data || [];
  }

  /**
   * 更新项目基本信息（仅字段）
   */
  private async updateProjectFields(
    id: string,
    updates: Partial<PAMProjectUpdate>
  ): Promise<void> {
    if (Object.keys(updates).length === 0) return;

    const supabase = await this.supabaseRepo.getSupabase();
    const result = await supabase
      .from(this.getRepoName())
      .update(updates)
      .eq('id', id)
      .eq('is_deleted', DeleteStatus.UNDELETE); // 防止更新已删除项目

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
    requestEnvs: Partial<PAMEnvRaw>[]
  ): Promise<void> {
    const supabase = await this.supabaseRepo.getSupabase();

    // 1. 获取当前数据库中该项目的所有环境（仅 id）
    const existingResult = await supabase
      .from(PAMEnvTableName)
      .select('id')
      .eq('project_id', projectId);
    this.supabaseRepo.throwIfError(existingResult);
    const existingIds = new Set(existingResult.data?.map((e) => e.id) || []);

    // 2. 区分请求中的更新和新增
    const toUpdate = requestEnvs.filter((env) => env.id);
    const toInsert = requestEnvs.filter((env) => !env.id);

    // 3. 计算需要删除的 id：existingIds - (更新环境的id集合)
    const updateIds = new Set(toUpdate.map((env) => env.id!));
    const toDeleteIds = Array.from(existingIds).filter(
      (id) => !updateIds.has(id)
    );

    // 4. 执行删除
    if (toDeleteIds.length > 0) {
      const deleteResult = await supabase
        .from(PAMEnvTableName)
        .delete()
        .eq('project_id', projectId)
        .in('id', toDeleteIds);
      this.supabaseRepo.throwIfError(deleteResult);
    }

    // 5. 执行更新（确保 id 存在，但可以在更新时用 project_id 限制）
    for (const env of toUpdate) {
      const updateData: Partial<Pick<PAMEnvRaw, 'name' | 'url' | 'variables'>> =
        {};
      if (env.name !== undefined) updateData.name = env.name;
      if (env.url !== undefined) updateData.url = env.url;
      if (env.variables !== undefined) updateData.variables = env.variables;
      if (Object.keys(updateData).length === 0) continue;

      const updateResult = await supabase
        .from(PAMEnvTableName)
        .update(updateData)
        .eq('id', env.id)
        .eq('project_id', projectId); // 防止跨项目更新
      this.supabaseRepo.throwIfError(updateResult);

      if (updateResult.count !== undefined && updateResult.count === 0) {
        throw new ExecutorError(
          API_PAM_ENV_NOT_FOUND,
          `Environment ${env.id} not found in this project`
        );
      }
    }

    // 6. 执行新增
    if (toInsert.length > 0) {
      const insertData = toInsert.map((env) => ({
        project_id: projectId,
        name: env.name!,
        url: env.url!,
        variables: env.variables || {}
      }));
      const insertResult = await supabase
        .from(PAMEnvTableName)
        .insert(insertData)
        .select();
      this.supabaseRepo.throwIfError(insertResult);
    }
  }

  protected buildJoinEnvFields(fields: '*'): JoinEnvFieldsResult<'*'>;

  protected buildJoinEnvFields<T extends readonly EnvField[]>(
    fields: T
  ): JoinEnvFieldsResult<T>;

  protected buildJoinEnvFields(
    fields: '*' | readonly EnvField[]
  ): JoinEnvFieldsResult<'*' | readonly EnvField[]> {
    if (fields === '*') {
      fields = ['id', 'name', 'url', 'variables'];
    }

    const joinedFields = Array.isArray(fields) ? fields.join(',') : fields;

    return `${PAMProjectEnvKey}: ${PAMEnvTableName}(${joinedFields})` as JoinEnvFieldsResult<
      '*' | readonly EnvField[]
    >;
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
    updates: Omit<PAMProjectUpdate, 'id'>
  ): Promise<PAMProjectDetail> {
    const { [PAMProjectEnvKey]: envUpdates, ...projectUpdates } = updates;

    // 检查项目是否存在且未删除
    const project = await this.getProjectById(id);
    if (!project) {
      throw new ExecutorError(API_PAM_PROJECT_NOT_FOUND);
    }

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
          ? SearchPAMProjectFields.join(',')
          : [SearchPAMProjectFields, this.buildJoinEnvFields('*')].join(',')
      )
      .eq('id', id)
      .eq('is_deleted', DeleteStatus.UNDELETE)
      .maybeSingle();

    this.supabaseRepo.throwIfError(result);

    if (!result.data) {
      throw new ExecutorError(API_PAM_PROJECT_NOT_FOUND);
    }

    this.logger.info(
      `[PAMProjectRepo] update project ${id} success`,
      result.data
    );

    return result.data as never;
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
    updates: Omit<PAMProjectUpdate, 'id'>
  ): Promise<PAMProjectDetail> {
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

    return {
      ...result.data.project,
      environments: result.data.environments || []
    };
  }

  public async hasProjectWithSlug(slug: string): Promise<boolean> {
    const result = await this.getProjectWithSlug(slug);
    return !isEmpty(result);
  }

  public async getProjectWithSlug(
    slug: string
  ): Promise<Pick<PAMProjectDetail, 'id' | 'slug'> | null> {
    const supabase = await this.supabaseRepo.getSupabase();

    const result = await supabase
      .from(this.getRepoName())
      .select('id')
      .eq('slug', slug)
      .eq('is_deleted', DeleteStatus.UNDELETE) // 新增过滤
      .maybeSingle();
    this.supabaseRepo.throwIfError(result);

    return result.data as PAMProjectDetail;
  }

  /**
   * 创建项目（含环境）
   * - 项目字段由 RLS 自动填充 owner_id
   * - 环境批量插入，自动生成 id
   * - 返回完整的项目及环境列表
   */
  public async createProject(
    params: PAMProjectCreate & {
      owner_id: string;
    }
  ): Promise<PAMProjectDetail> {
    const supabase = await this.supabaseRepo.getSupabase();

    // 分离环境和项目字段
    const { [PAMProjectEnvKey]: envs, ...projectData } = params;

    // 1. 创建项目（RLS 自动设置 owner_id）
    const project = await this.insert({
      table: this.getRepoName(),
      data: projectData as PAMProjectRaw,
      fields: SearchPAMProjectFields
    });

    this.logger.info(
      `[PAMProjectRepo] create project ${projectData.name} success`,
      projectData
    );

    // 2. 创建环境（如果有）
    let createdEnvs: PAMEnvWriteable[] = [];

    this.logger.debug('[PAMProjectRepo] create envs length:', envs?.length);

    if (Array.isArray(envs) && envs.length > 0) {
      const envsToInsert = envs.map((env) => ({
        project_id: project.id,
        name: env.name,
        url: env.url,
        variables: env.variables || {}
      }));

      const envResult = await supabase
        .from(PAMEnvTableName)
        .insert(envsToInsert)
        .select('*');

      this.supabaseRepo.throwIfError(envResult);

      if (envResult.data) {
        createdEnvs = envResult.data;
      }
    }

    // 3. 组装返回（符合 PAMProjectWithEnvironmentsSchema）
    return {
      ...project,
      [PAMProjectEnvKey]: createdEnvs
    } as never;
  }

  /**
   * 软删除项目（仅标记为删除，不实际删除数据）
   * @param id 项目ID
   * @throws 若项目不存在或已删除，则抛出异常
   */
  public async deleteProject(id: string): Promise<void> {
    const supabase = await this.supabaseRepo.getSupabase();
    const result = await supabase
      .from(this.getRepoName())
      .update({ is_deleted: DeleteStatus.DELETE })
      .eq('id', id)
      .eq('is_deleted', DeleteStatus.UNDELETE); // 只允许删除未删除的

    this.supabaseRepo.throwIfError(result);

    if (result.count === 0) {
      throw new ExecutorError(API_PAM_PROJECT_NOT_FOUND);
    }

    this.logger.info(`[PAMProjectRepo] soft deleted project ${id}`);
  }
}
