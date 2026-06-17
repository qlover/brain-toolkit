import {
  ResourceSearchParams,
  ResourceSearchResult
} from '@qlover/corekit-bridge';
import { inject, injectable } from '@shared/container';
import {
  PAMEnvironmentsSchema,
  PAMProjectSchema,
  PAMPublicType,
  type PAMEnvironmentsSchemaType,
  type PAMProjectSchemaType
} from '@schemas/PAMProjectSchema';
import { searchResultSchema } from '@schemas/SearchResultSchema';
import type {
  ProjectFilter,
  ProjectWithEnvironments
} from '@server/interfaces/PAMServiceInterface';
import { BaseRepo } from './BaseRepo';
import { SupabaseBridge } from './SupabaseBridge';
import { SupabaseServiceRoleBridge } from './SupabaseServiceRoleBridge';
import type { SupabaseClient } from '@supabase/supabase-js';

// ============================================================
// Repo 实现
// ============================================================
@injectable()
export class PAMProjectRepo extends BaseRepo {
  constructor(
    @inject(SupabaseServiceRoleBridge)
    protected supabaseServiceBridge: SupabaseBridge,
    @inject(SupabaseBridge)
    protected supabaseBridge: SupabaseBridge
  ) {
    super(supabaseBridge, 'pam_projects');
  }

  /**
   * 获取 Service Role 客户端（绕过 RLS，用于管理操作）
   */
  protected async getSupabaseService(): Promise<SupabaseClient> {
    return this.supabaseServiceBridge.getSupabase();
  }

  /**
   * 搜索项目列表
   * @param params
   * @returns
   */
  public async searchProjects(
    params: ResourceSearchParams & {
      user_id?: string;
    }
  ): Promise<ResourceSearchResult<PAMProjectSchemaType>> {
    const { page = 1, pageSize = 20, user_id } = params;
    const supabase = await this.supabaseServiceBridge.getSupabase();

    const builder = supabase
      .from('pam_projects')
      .select('*')
      .eq('is_public', PAMPublicType.public);

    if (user_id) {
      builder.or(`owner_id.eq.${user_id}`);
    }

    builder.range((page - 1) * pageSize, page * pageSize - 1);

    const result = await builder;

    // const result = await this.supabaseServiceBridge.pagination({
    //   table: 'pam_projects',
    //   fields: '*',
    //   page: page,
    //   pageSize: pageSize,
    //   // TODO: 排序还需要修改
    //   // orderBy: [],
    //   where: [['is_public', '=', PAMPublicType.public]]
    // });

    // this.supabaseServiceBridge.throwIfError(result);

    const raw = (result.data ?? []) as PAMProjectSchemaType[];

    return searchResultSchema(PAMProjectSchema).parse({
      items: raw,
      total: result.count ?? 0,
      page: page,
      pageSize: pageSize
    });
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

  /**
   * 获取项目及其所有环境（联表查询）
   */
  public async getProjectWithEnvironments(
    id: string
  ): Promise<ProjectWithEnvironments | null> {
    const supabase = await this.getSupabase();
    const { data, error } = await supabase
      .from(this.repoName)
      .select(
        `
          *,
          environments: pam_environments(*)
        `
      )
      .eq('id', id)
      .maybeSingle();

    if (error) {
      this.logger.error(
        'PAMProjectRepo.getProjectWithEnvironments failed',
        error
      );
      throw new Error(`查询项目及环境失败: ${error.message}`);
    }

    if (!data) return null;

    const project = PAMProjectSchema.parse(data);
    const environments = (
      (data.environments || []) as PAMEnvironmentsSchemaType[]
    ).map((env) => PAMEnvironmentsSchema.parse(env));

    return { ...project, environments };
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
