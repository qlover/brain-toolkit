import {
  ResourceSearchParams,
  ResourceSearchResult
} from '@qlover/corekit-bridge';
import { ExecutorError } from '@qlover/fe-corekit';
import { inject, injectable } from '@shared/container';
import { API_PAM_PROJECT_NOT_FOUND } from '@config/i18n-identifier/api';
import { I } from '@config/ioc-identifiter';
import {
  PAMEnvironmentUpdateSchemaType,
  PAMEnvironmentsTableName,
  PAMPROJECT_TSVECTOR_KEY,
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
  type RepoSearchInterface
} from '@server/interfaces/DBBridgeInterface';
import { BaseRepository } from './BaseRepository';
import { SupabaseRepo } from './SupabaseRepo';
import { SupabaseServiceRoleBridge } from './SupabaseServiceRoleBridge';
import type { LoggerInterface } from '@qlover/logger';

@injectable()
export class PAMProjectRepo extends BaseRepository<PAMProjectSchemaType> {
  @inject(I.Logger)
  protected logger!: LoggerInterface;

  constructor(
    @inject(SupabaseServiceRoleBridge)
    protected supabaseServiceBridge: RepoSearchInterface<PAMProjectSchemaType>,
    @inject(SupabaseRepo)
    protected supabaseRepo: SupabaseRepo<PAMProjectSchemaType>
  ) {
    super(PAMProjectTableName);
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
      table: this.getName(),
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
      .from(this.getName())
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
    // 一定是 rls 的 api
    const supabase = await this.supabaseRepo.getSupabase();
    const result = await supabase
      .from(this.getName())
      .select(PAMProjectSafeFields.join(','))
      .eq('id', id)
      // 启用了rls 就不需要 owner_id
      .maybeSingle();

    this.supabaseRepo.throwIfError(result);

    return PAMProjectSafeSchema.parse(result.data);
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
      .from(this.getName())
      .update(updates)
      .eq('id', id);

    this.supabaseRepo.throwIfError(result);

    this.logger.debug(
      `[PAMProjectRepo] update project ${id} success`,
      result.data
    );
  }

  /**
   * 同步环境列表（仅新增/更新，不删除）
   * - 若传入的环境对象包含 id，则更新对应记录；
   * - 若不包含 id，则插入新记录（Supabase 自动生成 UUID）。
   */
  private async syncEnvironments(
    projectId: string,
    envUpdates: PAMEnvironmentUpdateSchemaType[]
  ): Promise<void> {
    if (!envUpdates || envUpdates.length === 0) return;

    const supabase = await this.supabaseRepo.getSupabase();

    // 准备 upsert 数据
    const upsertData = envUpdates.map((env) => ({
      id: 'id' in env ? env.id : undefined, // 如果有 id 则更新，否则由 Supabase 生成新 id
      project_id: projectId,
      name: env.name,
      url: env.url,
      variables: env.variables || {}
    }));

    const result = await supabase
      .from(PAMEnvironmentsTableName)
      .upsert(upsertData, { onConflict: 'id' });

    this.supabaseRepo.throwIfError(result);

    this.logger.debug(
      `[PAMProjectRepo] upsert environments success`,
      result.data
    );
  }

  /**
   * 更新项目（含环境）
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
      .from(this.getName())
      .select(
        PAMProjectSafeFields.join(',') +
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
  public async updateProjectWithEnvironments(
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
}
