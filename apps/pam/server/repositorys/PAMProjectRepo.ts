import {
  ResourceSearchParams,
  ResourceSearchResult
} from '@qlover/corekit-bridge';
import { inject, injectable } from '@shared/container';
import { I } from '@config/ioc-identifiter';
import {
  PAMEnvironmentsTableName,
  PAMPROJECT_TSVECTOR_KEY,
  PAMProjectEnvKey,
  PAMProjectSafeFields,
  PAMProjectSafeSchema,
  PAMProjectSafeSchemaType,
  PAMProjectSchema,
  PAMProjectTableName,
  PAMProjectWithEnvironmentsSchema,
  PAMProjectWithEnvironmentsSchemaType,
  type PAMProjectSchemaType
} from '@schemas/PAMProjectSchema';
import {
  FilterTriple,
  Operators,
  type RepoSearchInterface
} from '@server/interfaces/DBBridgeInterface';
import type { ProjectFilter } from '@server/interfaces/PAMServiceInterface';
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
   * 根据 ID 查询项目
   */
  public async findById(id: string): Promise<PAMProjectSchemaType | null> {
    const supabase = await this.getSupabase();
    const { data, error } = await supabase
      .from(this.repoName)
      .select('*')
      .eq('id', id)
      .maybeSingle();

    if (error) {
      this.logger.error('PAMProjectRepo.findById failed', error);
      throw new Error(`查询项目失败: ${error.message}`);
    }

    return data ? PAMProjectSchema.parse(data) : null;
  }

  /**
   * 根据 slug 查询项目
   */
  public async findBySlug(slug: string): Promise<PAMProjectSchemaType | null> {
    const supabase = await this.getSupabase();
    const { data, error } = await supabase
      .from(this.repoName)
      .select('*')
      .eq('slug', slug)
      .maybeSingle();

    if (error) {
      this.logger.error('PAMProjectRepo.findBySlug failed', error);
      throw new Error(`查询项目失败: ${error.message}`);
    }

    return data ? PAMProjectSchema.parse(data) : null;
  }

  /**
   * 查询项目列表，支持过滤和分页
   */
  public async findAll(
    filter: ProjectFilter = {}
  ): Promise<PAMProjectSchemaType[]> {
    const supabase = await this.getSupabase();
    let query = supabase.from(this.repoName).select('*');

    if (filter.is_public !== undefined) {
      query = query.eq('is_public', filter.is_public);
    }
    if (filter.ownerId) {
      query = query.eq('owner_id', filter.ownerId);
    }
    if (filter.category) {
      query = query.eq('category', filter.category);
    }
    if (filter.search) {
      query = query.or(
        `name.ilike.%${filter.search}%,description.ilike.%${filter.search}%,stack.ilike.%${filter.search}%`
      );
    }
    if (filter.limit) {
      query = query.limit(filter.limit);
    }
    if (filter.offset) {
      query = query.range(
        filter.offset,
        filter.offset + (filter.limit || 10) - 1
      );
    }

    const { data, error } = await query.order('created_at', {
      ascending: false
    });

    if (error) {
      this.logger.error('PAMProjectRepo.findAll failed', error);
      throw new Error(`查询项目列表失败: ${error.message}`);
    }

    return data.map((item) => PAMProjectSchema.parse(item));
  }

  // ------------------------------------------------------------------
  // 写入方法（受 RLS 限制）
  // ------------------------------------------------------------------

  /**
   * 创建新项目（owner_id 由 RLS 自动绑定）
   */
  public async create(
    data: Omit<
      PAMProjectSchemaType,
      'id' | 'created_at' | 'updated_at' | 'owner_id'
    >
  ): Promise<PAMProjectSchemaType> {
    // 可选：使用 Zod 验证输入
    const validated = PAMProjectSchema.omit({
      id: true,
      created_at: true,
      updated_at: true,
      owner_id: true
    }).parse(data);

    const supabase = await this.getSupabase();
    const { data: result, error } = await supabase
      .from(this.repoName)
      .insert(validated)
      .select()
      .single();

    if (error) {
      this.logger.error('PAMProjectRepo.create failed', error);
      throw new Error(`创建项目失败: ${error.message}`);
    }

    return PAMProjectSchema.parse(result);
  }

  /**
   * 更新项目（仅所有者可更新）
   */
  public async update(
    id: string,
    updates: Partial<
      Omit<
        PAMProjectSchemaType,
        'id' | 'created_at' | 'updated_at' | 'owner_id'
      >
    >
  ): Promise<PAMProjectSchemaType> {
    // 可选：使用 Zod 部分验证
    const validated = PAMProjectSchema.partial()
      .omit({ id: true, created_at: true, updated_at: true, owner_id: true })
      .parse(updates);

    const supabase = await this.getSupabase();
    const { data, error } = await supabase
      .from(this.repoName)
      .update(validated)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      this.logger.error('PAMProjectRepo.update failed', error);
      throw new Error(`更新项目失败: ${error.message}`);
    }

    return PAMProjectSchema.parse(data);
  }

  /**
   * 删除项目（仅所有者可删除，级联删除关联环境）
   */
  public async delete(id: string): Promise<void> {
    const supabase = await this.getSupabase();
    const { error } = await supabase.from(this.repoName).delete().eq('id', id);

    if (error) {
      this.logger.error('PAMProjectRepo.delete failed', error);
      throw new Error(`删除项目失败: ${error.message}`);
    }
  }

  // ------------------------------------------------------------------
  // 管理员操作（使用 Service Role，绕过 RLS）
  // ------------------------------------------------------------------

  public async adminFindById(id: string): Promise<PAMProjectSchemaType | null> {
    const supabase = await this.getSupabaseService();
    const { data, error } = await supabase
      .from(this.repoName)
      .select('*')
      .eq('id', id)
      .maybeSingle();

    if (error) {
      this.logger.error('PAMProjectRepo.adminFindById failed', error);
      throw new Error(`管理员查询项目失败: ${error.message}`);
    }

    return data ? PAMProjectSchema.parse(data) : null;
  }

  public async adminDelete(id: string): Promise<void> {
    const supabase = await this.getSupabaseService();
    const { error } = await supabase.from(this.repoName).delete().eq('id', id);

    if (error) {
      this.logger.error('PAMProjectRepo.adminDelete failed', error);
      throw new Error(`管理员删除项目失败: ${error.message}`);
    }
  }

  // ------------------------------------------------------------------
  // 辅助方法
  // ------------------------------------------------------------------

  /**
   * 检查 slug 是否已存在
   */
  public async isSlugExists(slug: string): Promise<boolean> {
    const supabase = await this.getSupabase();
    const { count, error } = await supabase
      .from(this.repoName)
      .select('id', { count: 'exact', head: true })
      .eq('slug', slug);

    if (error) {
      this.logger.error('PAMProjectRepo.isSlugExists failed', error);
      throw new Error(`检查 slug 失败: ${error.message}`);
    }

    return (count ?? 0) > 0;
  }

  /**
   * 获取当前用户的所有项目（快捷方法）
   */
  public async findMyProjects(): Promise<PAMProjectSchemaType[]> {
    // 获取当前用户 ID，可以从 auth 中获取
    const supabase = await this.getSupabase();
    const {
      data: { user }
    } = await supabase.auth.getUser();
    if (!user) return [];
    return this.findAll({ ownerId: user.id });
  }

  /**
   * 获取公开项目列表（快捷方法）
   */
  public async findPublicProjects(): Promise<PAMProjectSchemaType[]> {
    return this.findAll({ is_public: 1 });
  }
}
