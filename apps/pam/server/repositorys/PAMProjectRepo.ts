import { ResourceSearchResult } from '@qlover/corekit-bridge';
import { ExecutorError } from '@qlover/fe-corekit/executor';
import { DeleteStatus, uuidSchema } from '@qlover/next-kit/common';
import {
  BaseRepository,
  FilterTriple,
  Operators,
  RepoInsertGetParams,
  RepoInsertParams,
  RepoSearchParams
} from '@qlover/next-kit/server';
import { isEmpty } from 'lodash-es';
import { inject, injectable } from '@shared/container';
import {
  PAMEnvWriteable,
  PAMEnvRaw,
  PAMEnvTableName,
  PAMVariable
} from '@shared/schemas/PAMEnvironmentSchema';
import { Join } from '@shared/type';
import {
  API_NOT_AUTHORIZED,
  API_PAM_ENV_NOT_FOUND,
  API_PAM_PREVIEW_CAPTURE_FAILED,
  API_PAM_PROJECT_NOT_FOUND
} from '@config/i18n-identifier/api';
import { I } from '@config/ioc-identifiter';
import {
  resolvePamListSortBy,
  resolvePamListSortOrder
} from '@config/pamListSort';
import {
  PAMProjectEnvKey,
  SearchPAMProjectFields,
  PAMProjectTableName,
  SearchPAMRawProject,
  PAMProjectRaw,
  SearchPAMProject,
  PAMProjectDetail,
  PAMUpdateSQLFunctionName,
  PAMSearchProjectsSQLFunctionName,
  PAMProjectUpdate,
  PAMProjectCreate,
  PAMPublicType
} from '@schemas/PAMProjectSchema';
import { isPamSearchRpcUnavailable } from '@server/utils/postgrestError';
import { PAMSupabaseRepo } from './PAMSupabaseRepo';
import type { LoggerInterface } from '@qlover/logger';

interface PAMProjectSearchParams extends RepoSearchParams<PAMProjectRaw> {
  /**
   * 用户 ID，如果提供id则查询用户相关的(rls)数据，否则查询 public 数据
   */
  user_id?: string;
  /** Structured filters from ResourceSearchParams (e.g. `{ category }`). */
  filters?: unknown;
  /** When set, overrides automatic exact vs planned count selection. */
  exactCount?: boolean;
  /** When false, skip row count (used for page 2+). */
  includeCount?: boolean;
}

type EnvField = keyof PAMEnvWriteable;

/**
 * Reads `category` from ResourceSearchParams.filters (object or ignored).
 *
 * @param filters - Parsed search filters from query string
 * @returns Trimmed category or undefined when not filtering
 */
function resolveCategoryFilter(filters: unknown): string | undefined {
  if (!filters || typeof filters !== 'object' || Array.isArray(filters)) {
    return undefined;
  }
  const category = (filters as { category?: unknown }).category;
  if (typeof category !== 'string') {
    return undefined;
  }
  const trimmed = category.trim();
  return trimmed.length > 0 ? trimmed : undefined;
}

type VisibilityFilterType = 'public' | 'private';

/**
 * Reads `visibility` from ResourceSearchParams.filters.
 *
 * @param filters - Parsed search filters from query string
 * @returns `public` / `private`, or undefined for default (public + own)
 */
function resolveVisibilityFilter(
  filters: unknown
): VisibilityFilterType | undefined {
  if (!filters || typeof filters !== 'object' || Array.isArray(filters)) {
    return undefined;
  }
  const visibility = (filters as { visibility?: unknown }).visibility;
  if (visibility === 'public' || visibility === 'private') {
    return visibility;
  }
  return undefined;
}

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
    @inject(PAMSupabaseRepo)
    protected supabaseRepo: PAMSupabaseRepo<PAMProjectRaw>
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
    const keyword = params.keyword?.trim();
    const categoryFilter = resolveCategoryFilter(params.filters);
    const visibilityFilter = resolveVisibilityFilter(params.filters);

    if (visibilityFilter === 'private' && !user_id) {
      return {
        page,
        pageSize,
        total: 0,
        items: [],
        hasMore: false
      };
    }

    const where: FilterTriple<PAMProjectRaw>[] = [
      ['is_deleted', Operators.eq, DeleteStatus.UNDELETE]
    ];
    if (categoryFilter) {
      where.push(['category', Operators.eq, categoryFilter]);
    }

    let whereOr: FilterTriple<PAMProjectRaw>[] | undefined;

    if (visibilityFilter === 'public') {
      where.push(['is_public', Operators.eq, PAMPublicType.public]);
    } else if (visibilityFilter === 'private') {
      where.push(['is_public', Operators.eq, PAMPublicType.private]);
      where.push(['owner_id', Operators.eq, user_id!]);
    } else {
      whereOr = [['is_public', Operators.eq, PAMPublicType.public]];
      if (user_id) {
        whereOr.push(['owner_id', Operators.eq, user_id]);
      }
    }

    return await this.supabaseRepo.search({
      table: this.getRepoName(),
      fields: fields ?? SearchPAMProjectFields,
      page: page,
      pageSize: pageSize,
      sort: params.sort,
      includeCount: params.includeCount ?? page <= 1,
      exactCount: params.exactCount,
      // Substring match across project text fields (not FTS / search_vector).
      ilikeOr: keyword
        ? {
            columns: [
              'name',
              'slug',
              'description',
              'stack',
              'category',
              'repo_url'
            ],
            query: keyword
          }
        : undefined,
      where,
      whereOr
    });
  }

  /**
   * Batch-load env summaries for list cards (keeps pagination on projects only).
   */
  private async listEnvironmentsForProjectIds(
    projectIds: readonly string[]
  ): Promise<Map<string, Pick<PAMEnvWriteable, 'id' | 'name' | 'url'>[]>> {
    const map = new Map<
      string,
      Pick<PAMEnvWriteable, 'id' | 'name' | 'url'>[]
    >();
    if (projectIds.length === 0) {
      return map;
    }

    const admin = this.supabaseRepo.getAdminSupabase();
    const result = await admin
      .from(PAMEnvTableName)
      .select('id,name,url,project_id')
      .in('project_id', [...projectIds]);

    this.supabaseRepo.throwIfError(result);

    for (const row of result.data ?? []) {
      const projectId = String(row.project_id);
      const env = {
        id: row.id,
        name: row.name,
        url: row.url
      } as Pick<PAMEnvWriteable, 'id' | 'name' | 'url'>;
      const list = map.get(projectId);
      if (list) {
        list.push(env);
      } else {
        map.set(projectId, [env]);
      }
    }

    return map;
  }

  /**
   * 搜索项目列表 — prefers `pam_search_projects` RPC (one DB round-trip).
   *
   * @param params
   * @returns
   */
  public async searchProjects(
    params: PAMProjectSearchParams
  ): Promise<ResourceSearchResult<SearchPAMProject>> {
    try {
      return await this.rpcSearchProjects(params);
    } catch (error) {
      if (isPamSearchRpcUnavailable(error)) {
        this.logger.warn(
          '[PAMProjectRepo] pam_search_projects unavailable, using legacy search'
        );
        return this.searchProjectsLegacy(params);
      }
      throw error;
    }
  }

  private async rpcSearchProjects(
    params: PAMProjectSearchParams
  ): Promise<ResourceSearchResult<SearchPAMProject>> {
    const { page = 1, pageSize = 20, user_id } = params;
    const keyword = params.keyword?.trim();
    const categoryFilter = resolveCategoryFilter(params.filters);
    const visibilityFilter = resolveVisibilityFilter(params.filters);

    const admin = this.supabaseRepo.getAdminSupabase();
    const sortBy = resolvePamListSortBy(params.sort);
    const sortOrder = resolvePamListSortOrder(params.sort);
    const { data, error } = await admin.rpc(PAMSearchProjectsSQLFunctionName, {
      p_user_id: user_id ?? null,
      p_visibility: visibilityFilter ?? null,
      p_category: categoryFilter ?? null,
      p_keyword: keyword ?? null,
      p_page: page,
      p_page_size: pageSize,
      p_include_count: params.includeCount ?? page <= 1,
      p_include_owner_id: Boolean(user_id),
      p_sort_by: sortBy,
      p_sort_order: sortOrder
    });

    this.supabaseRepo.throwIfError({ data, error });

    const payload = data as ResourceSearchResult<SearchPAMProject>;
    return {
      page: payload.page ?? page,
      pageSize: payload.pageSize ?? pageSize,
      total: payload.total ?? 0,
      hasMore: payload.hasMore ?? false,
      items: (payload.items ?? []) as SearchPAMProject[]
    };
  }

  /**
   * Legacy: PostgREST search + batch env load (two round-trips).
   */
  private async searchProjectsLegacy(
    params: PAMProjectSearchParams
  ): Promise<ResourceSearchResult<SearchPAMProject>> {
    const excludedFields = params.user_id ? [] : ['owner_id'];

    const fields = SearchPAMProjectFields.filter(
      (field) => !excludedFields.includes(field)
    );

    const result = await this.search({
      ...params,
      fields
    });

    const items = result.items ?? [];
    if (items.length === 0) {
      return result as ResourceSearchResult<SearchPAMProject>;
    }

    const envMap = await this.listEnvironmentsForProjectIds(
      items.map((item) => item.id)
    );

    const withEnvs = items.map((project) =>
      Object.assign({}, project, {
        [PAMProjectEnvKey]: envMap.get(project.id) ?? []
      })
    ) as SearchPAMProject[];

    return Object.assign({}, result, { items: withEnvs });
  }

  /**
   * Loads project basics by UUID or slug (admin; access checked in service).
   */
  public async getProjectDetailAdmin(
    idOrSlug: string
  ): Promise<SearchPAMRawProject | null> {
    const admin = this.supabaseRepo.getAdminSupabase();
    const column = uuidSchema.safeParse(idOrSlug).success ? 'id' : 'slug';
    const result = await admin
      .from(this.getRepoName())
      .select(SearchPAMProjectFields.join(','))
      .eq(column, idOrSlug)
      .eq('is_deleted', DeleteStatus.UNDELETE)
      .maybeSingle();

    this.supabaseRepo.throwIfError(result);

    return result.data as SearchPAMRawProject | null;
  }

  /**
   * Loads project + environments by UUID or slug (admin; access checked in service).
   */
  public async getProjectDetailWithEnvironmentsAdmin(
    idOrSlug: string
  ): Promise<PAMProjectDetail | null> {
    const admin = this.supabaseRepo.getAdminSupabase();
    const column = uuidSchema.safeParse(idOrSlug).success ? 'id' : 'slug';
    const result = await admin
      .from(this.getRepoName())
      .select(
        SearchPAMProjectFields.join(',') +
          `,${PAMProjectEnvKey}: ${PAMEnvTableName}(*)`
      )
      .eq(column, idOrSlug)
      .eq('is_deleted', DeleteStatus.UNDELETE)
      .maybeSingle();

    this.supabaseRepo.throwIfError(result);

    if (!result.data) {
      return null;
    }

    return result.data as never;
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
   * Loads project + environments via admin (Brain / CLI; access checked in service).
   *
   * @param id - Project id
   */
  public async getProjectWithEnvironmentsAdmin(
    id: string
  ): Promise<PAMProjectDetail | null> {
    const admin = this.supabaseRepo.getAdminSupabase();
    const result = await admin
      .from(this.getRepoName())
      .select(
        SearchPAMProjectFields.join(',') +
          `,${PAMProjectEnvKey}: ${PAMEnvTableName}(*)`
      )
      .eq('id', id)
      .eq('is_deleted', DeleteStatus.UNDELETE)
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
   * Loads project basics via admin (Brain / CLI; access checked in service).
   *
   * @param id - Project id
   */
  public async getProjectByIdAdmin(
    id: string
  ): Promise<SearchPAMRawProject | null> {
    const admin = this.supabaseRepo.getAdminSupabase();
    const result = await admin
      .from(this.getRepoName())
      .select(SearchPAMProjectFields.join(','))
      .eq('id', id)
      .eq('is_deleted', DeleteStatus.UNDELETE)
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
   * Loads environments with variables for merge/write workflows.
   *
   * @param projectId - Project id
   * @returns Environments including JSONB variables
   */
  public async getEnvironmentsByProjectId(
    projectId: string
  ): Promise<Pick<PAMEnvRaw, 'id' | 'name' | 'url' | 'variables'>[]> {
    // Admin: used after ownership assert (Brain / CLI have no RLS session).
    const admin = this.supabaseRepo.getAdminSupabase();

    const result = await admin
      .from(PAMEnvTableName)
      .select('id,name,url,variables')
      .eq('project_id', projectId);

    this.supabaseRepo.throwIfError(result);

    return result.data || [];
  }

  /**
   * Distinct non-empty categories from visible projects (public + owned).
   *
   * Single admin select of `category` only — no env join, no exact count,
   * no paginated `searchProjects` (that path was 2s+ for a few strings).
   *
   * @param userId - Optional authenticated user id
   */
  public async listDistinctCategories(userId?: string): Promise<string[]> {
    const supabase = this.supabaseRepo.getAdminSupabase();
    let query = supabase
      .from(this.getRepoName())
      .select('category')
      .eq('is_deleted', DeleteStatus.UNDELETE)
      .not('category', 'is', null);

    if (userId) {
      query = query.or(`is_public.eq.1,owner_id.eq.${userId}`);
    } else {
      query = query.eq('is_public', 1);
    }

    const result = await query.limit(1000);
    this.supabaseRepo.throwIfError(result);

    return this.normalizeCategoryList(
      (result.data ?? []).map((row) =>
        typeof row.category === 'string' ? row.category : ''
      )
    );
  }

  /**
   * Dedupes, trims, and sorts category labels (zh).
   *
   * @param raw - RPC text[] or select column values
   */
  protected normalizeCategoryList(raw: unknown): string[] {
    const unique = new Set<string>();
    const list = Array.isArray(raw) ? raw : [];
    for (const item of list) {
      const value = typeof item === 'string' ? item.trim() : '';
      if (value.length > 0) {
        unique.add(value);
      }
    }
    return Array.from(unique).sort((a, b) => a.localeCompare(b, 'zh'));
  }

  /**
   * Minimal project row for read-access checks (admin).
   */
  public async getProjectAccessAdmin(
    projectId: string
  ): Promise<Pick<PAMProjectRaw, 'id' | 'is_public' | 'owner_id'> | null> {
    const admin = this.supabaseRepo.getAdminSupabase();
    const result = await admin
      .from(this.getRepoName())
      .select('id,is_public,owner_id')
      .eq('id', projectId)
      .eq('is_deleted', DeleteStatus.UNDELETE)
      .maybeSingle();

    this.supabaseRepo.throwIfError(result);

    return result.data as Pick<
      PAMProjectRaw,
      'id' | 'is_public' | 'owner_id'
    > | null;
  }

  /**
   * Owner check via admin client (no Supabase Auth session required).
   *
   * @param projectId - Project id
   * @param ownerId - User id
   */
  public async isProjectOwnedByUser(
    projectId: string,
    ownerId: string
  ): Promise<boolean> {
    const admin = this.supabaseRepo.getAdminSupabase();
    const result = await admin
      .from(this.getRepoName())
      .select('id')
      .eq('id', projectId)
      .eq('owner_id', ownerId)
      .eq('is_deleted', DeleteStatus.UNDELETE)
      .maybeSingle();

    this.supabaseRepo.throwIfError(result);
    return !isEmpty(result.data);
  }

  /**
   * Loads a single environment with admin client (CLI / owner-checked paths).
   *
   * @param projectId - Project id
   * @param envId - Environment id
   */
  public async getEnvironmentByIdAdmin(
    projectId: string,
    envId: string
  ): Promise<Pick<PAMEnvRaw, 'id' | 'name' | 'url' | 'variables'> | null> {
    const admin = this.supabaseRepo.getAdminSupabase();
    const result = await admin
      .from(PAMEnvTableName)
      .select('id,name,url,variables')
      .eq('project_id', projectId)
      .eq('id', envId)
      .maybeSingle();

    this.supabaseRepo.throwIfError(result);

    return result.data as Pick<
      PAMEnvRaw,
      'id' | 'name' | 'url' | 'variables'
    > | null;
  }

  /**
   * Updates environment variables with admin client.
   *
   * @param projectId - Project id
   * @param envId - Environment id
   * @param variables - Variables to persist
   */
  public async updateEnvironmentVariablesAdmin(
    projectId: string,
    envId: string,
    variables: PAMVariable[]
  ): Promise<PAMEnvWriteable> {
    const admin = this.supabaseRepo.getAdminSupabase();
    const result = await admin
      .from(PAMEnvTableName)
      .update({ variables })
      .eq('id', envId)
      .eq('project_id', projectId)
      .select('id,name,url,variables')
      .maybeSingle();

    this.supabaseRepo.throwIfError(result);

    if (!result.data) {
      throw new ExecutorError(API_PAM_ENV_NOT_FOUND);
    }

    return result.data as PAMEnvWriteable;
  }

  /**
   * Loads a single environment for a project (including variables).
   *
   * @param projectId - Project id
   * @param envId - Environment id
   * @returns Environment row or null when missing
   */
  public async getEnvironmentById(
    projectId: string,
    envId: string
  ): Promise<Pick<PAMEnvRaw, 'id' | 'name' | 'url' | 'variables'> | null> {
    const supabase = await this.supabaseRepo.getSupabase();

    const result = await supabase
      .from(PAMEnvTableName)
      .select('id,name,url,variables')
      .eq('project_id', projectId)
      .eq('id', envId)
      .maybeSingle();

    this.supabaseRepo.throwIfError(result);

    return result.data as Pick<
      PAMEnvRaw,
      'id' | 'name' | 'url' | 'variables'
    > | null;
  }

  /**
   * Loads an environment for CLI export using the admin client.
   * Enforces ownership in the query (bypasses cookie-based RLS).
   *
   * @param projectId - Project id
   * @param envId - Environment id
   * @param ownerId - Authenticated owner user id
   * @returns Project slug + environment row, or null when missing / not owned
   */
  public async getOwnedEnvironmentForExport(
    projectId: string,
    envId: string,
    ownerId: string
  ): Promise<{
    projectSlug: string;
    environment: Pick<PAMEnvRaw, 'id' | 'name' | 'url' | 'variables'>;
  } | null> {
    const admin = this.supabaseRepo.getAdminSupabase();

    const projectResult = await admin
      .from(this.getRepoName())
      .select('id,slug')
      .eq('id', projectId)
      .eq('owner_id', ownerId)
      .eq('is_deleted', DeleteStatus.UNDELETE)
      .maybeSingle();

    this.supabaseRepo.throwIfError(projectResult);
    if (!projectResult.data) {
      return null;
    }

    const envResult = await admin
      .from(PAMEnvTableName)
      .select('id,name,url,variables')
      .eq('project_id', projectId)
      .eq('id', envId)
      .maybeSingle();

    this.supabaseRepo.throwIfError(envResult);
    if (!envResult.data) {
      return null;
    }

    return {
      projectSlug: (projectResult.data as { slug: string }).slug,
      environment: envResult.data as Pick<
        PAMEnvRaw,
        'id' | 'name' | 'url' | 'variables'
      >
    };
  }

  /**
   * Inserts a new environment row under a project.
   *
   * @param projectId - Project id
   * @param data - Name, url, variables to persist
   * @returns Created environment
   */
  public async createEnvironment(
    projectId: string,
    data: {
      name: string;
      url: string;
      variables?: PAMVariable[];
    }
  ): Promise<PAMEnvWriteable> {
    const supabase = await this.supabaseRepo.getSupabase();

    const result = await supabase
      .from(PAMEnvTableName)
      .insert({
        project_id: projectId,
        name: data.name,
        url: data.url,
        variables: data.variables || []
      })
      .select('id,name,url,variables')
      .single();

    this.supabaseRepo.throwIfError(result);

    return result.data as PAMEnvWriteable;
  }

  /**
   * Inserts an environment with admin client (CLI / owner-checked paths).
   * Callers must assert project ownership in the service layer first.
   *
   * @param projectId - Project id
   * @param data - Name, url, variables to persist
   * @returns Created environment
   */
  public async createEnvironmentAdmin(
    projectId: string,
    data: {
      name: string;
      url: string;
      variables?: PAMVariable[];
    }
  ): Promise<PAMEnvWriteable> {
    const admin = this.supabaseRepo.getAdminSupabase();

    const result = await admin
      .from(PAMEnvTableName)
      .insert({
        project_id: projectId,
        name: data.name,
        url: data.url,
        variables: data.variables || []
      })
      .select('id,name,url,variables')
      .single();

    this.supabaseRepo.throwIfError(result);

    return result.data as PAMEnvWriteable;
  }

  /**
   * Lists env id/name pairs with admin client (CLI duplicate checks).
   *
   * @param projectId - Project id
   */
  public async getEnvIdAndNamesByProjectIdAdmin(
    projectId: string
  ): Promise<Pick<PAMEnvRaw, 'id' | 'name'>[]> {
    const admin = this.supabaseRepo.getAdminSupabase();

    const result = await admin
      .from(PAMEnvTableName)
      .select('id,name')
      .eq('project_id', projectId);

    this.supabaseRepo.throwIfError(result);

    return result.data || [];
  }

  /**
   * Deletes an environment belonging to a project.
   *
   * @param projectId - Project id
   * @param envId - Environment id
   */
  public async deleteEnvironment(
    projectId: string,
    envId: string
  ): Promise<void> {
    const existing = await this.getEnvironmentById(projectId, envId);
    if (!existing) {
      throw new ExecutorError(API_PAM_ENV_NOT_FOUND);
    }

    const supabase = await this.supabaseRepo.getSupabase();
    const result = await supabase
      .from(PAMEnvTableName)
      .delete()
      .eq('id', envId)
      .eq('project_id', projectId);

    this.supabaseRepo.throwIfError(result);
  }

  /**
   * Deletes an environment with admin client (CLI / owner-checked paths).
   *
   * @param projectId - Project id
   * @param envId - Environment id
   */
  public async deleteEnvironmentAdmin(
    projectId: string,
    envId: string
  ): Promise<void> {
    const existing = await this.getEnvironmentByIdAdmin(projectId, envId);
    if (!existing) {
      throw new ExecutorError(API_PAM_ENV_NOT_FOUND);
    }

    const admin = this.supabaseRepo.getAdminSupabase();
    const result = await admin
      .from(PAMEnvTableName)
      .delete()
      .eq('id', envId)
      .eq('project_id', projectId);

    this.supabaseRepo.throwIfError(result);
  }

  /**
   * Replaces the JSONB variables array for one environment.
   *
   * @param projectId - Project id
   * @param envId - Environment id
   * @param variables - Variables to persist (already encrypted if needed)
   * @returns Updated environment
   */
  public async updateEnvironmentVariables(
    projectId: string,
    envId: string,
    variables: PAMVariable[]
  ): Promise<PAMEnvWriteable> {
    const supabase = await this.supabaseRepo.getSupabase();
    const result = await supabase
      .from(PAMEnvTableName)
      .update({ variables })
      .eq('id', envId)
      .eq('project_id', projectId)
      .select('id,name,url,variables')
      .maybeSingle();

    this.supabaseRepo.throwIfError(result);

    if (!result.data) {
      throw new ExecutorError(API_PAM_ENV_NOT_FOUND);
    }

    return result.data as PAMEnvWriteable;
  }

  /**
   * 更新项目基本信息（仅字段）
   */
  private async updateProjectFields(
    id: string,
    updates: Partial<PAMProjectUpdate>
  ): Promise<void> {
    if (Object.keys(updates).length === 0) return;

    // Admin write: caller must have asserted ownership (CLI / Brain session).
    const admin = this.supabaseRepo.getAdminSupabase();
    const result = await admin
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
    // Admin write: caller must have asserted ownership (CLI / Brain session).
    const supabase = this.supabaseRepo.getAdminSupabase();

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
        variables: env.variables || []
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
    updates: Partial<Omit<PAMProjectUpdate, 'id'>>
  ): Promise<PAMProjectDetail> {
    const { [PAMProjectEnvKey]: envUpdates, ...projectUpdates } = updates;

    // Admin read: ownership already asserted in service (Brain / CLI).
    const project = await this.getProjectByIdAdmin(id);
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
    const supabase = this.supabaseRepo.getAdminSupabase();
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
    // Global uniqueness must bypass RLS so CLI (no auth.uid) and private
    // projects owned by others are still detected.
    const result = await this.getProjectWithSlugAdmin(slug);
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
   * Slug lookup with admin client (global uniqueness / CLI).
   *
   * @param slug - Project slug
   */
  public async getProjectWithSlugAdmin(
    slug: string
  ): Promise<Pick<PAMProjectDetail, 'id' | 'slug'> | null> {
    const admin = this.supabaseRepo.getAdminSupabase();

    const result = await admin
      .from(this.getRepoName())
      .select('id,slug')
      .eq('slug', slug)
      .eq('is_deleted', DeleteStatus.UNDELETE)
      .maybeSingle();
    this.supabaseRepo.throwIfError(result);

    return result.data as Pick<PAMProjectDetail, 'id' | 'slug'> | null;
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
        variables: env.variables || []
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
   * Creates a project (+ envs) with admin client.
   * Callers must set `owner_id` from an authenticated user (cookie or CLI).
   * Needed because CLI bearer auth has no Supabase RLS session (`auth.uid()`).
   *
   * @param params - Project create payload including owner_id
   */
  public async createProjectAdmin(
    params: PAMProjectCreate & {
      owner_id: string;
      create_source: PAMProjectRaw['create_source'];
    }
  ): Promise<PAMProjectDetail> {
    const admin = this.supabaseRepo.getAdminSupabase();
    const { [PAMProjectEnvKey]: envs, ...projectData } = params;

    const projectResult = await admin
      .from(this.getRepoName())
      .insert(projectData as PAMProjectRaw)
      .select(SearchPAMProjectFields.join(','))
      .single();

    this.supabaseRepo.throwIfError(projectResult);

    // Dynamic `.select(fields.join(','))` widens PostgREST typings to GenericStringError.
    const project = projectResult.data as unknown as SearchPAMRawProject;

    this.logger.info(
      `[PAMProjectRepo] create project (admin) ${projectData.name} success`,
      projectData
    );

    let createdEnvs: PAMEnvWriteable[] = [];

    this.logger.debug(
      '[PAMProjectRepo] create envs (admin) length:',
      envs?.length
    );

    if (Array.isArray(envs) && envs.length > 0) {
      const envsToInsert = envs.map((env) => ({
        project_id: project.id,
        name: env.name,
        url: env.url,
        variables: env.variables || []
      }));

      const envResult = await admin
        .from(PAMEnvTableName)
        .insert(envsToInsert)
        .select('*');

      this.supabaseRepo.throwIfError(envResult);

      if (envResult.data) {
        createdEnvs = envResult.data;
      }
    }

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

  /**
   * Soft-delete via admin client (CLI / Brain session after ownership assert).
   *
   * @param id - Project id
   */
  public async deleteProjectAdmin(id: string): Promise<void> {
    const admin = this.supabaseRepo.getAdminSupabase();
    const result = await admin
      .from(this.getRepoName())
      .update({ is_deleted: DeleteStatus.DELETE })
      .eq('id', id)
      .eq('is_deleted', DeleteStatus.UNDELETE)
      .select('id');

    this.supabaseRepo.throwIfError(result);

    if (!result.data?.length) {
      throw new ExecutorError(API_PAM_PROJECT_NOT_FOUND);
    }

    this.logger.info(`[PAMProjectRepo] soft deleted project (admin) ${id}`);
  }

  /**
   * Transfers ownership via admin client after ownership assert.
   *
   * @param id - Project id
   * @param newOwnerId - New owner user id
   */
  public async transferProjectOwnerAdmin(
    id: string,
    newOwnerId: string
  ): Promise<void> {
    const admin = this.supabaseRepo.getAdminSupabase();
    const result = await admin
      .from(this.getRepoName())
      .update({
        owner_id: newOwnerId,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .eq('is_deleted', DeleteStatus.UNDELETE)
      .select('id');

    this.supabaseRepo.throwIfError(result);

    if (!result.data?.length) {
      throw new ExecutorError(API_PAM_PROJECT_NOT_FOUND);
    }

    this.logger.info(
      `[PAMProjectRepo] transferred project ${id} to ${newOwnerId}`
    );
  }

  /**
   * Looks up a Supabase Auth user id by email (service role RPC).
   *
   * @param email - Normalized email
   * @returns User id or null when not found
   * @see makes/sql/008-pam-preview-image.sql `pam_auth_user_id_by_email`
   */
  public async findAuthUserIdByEmail(email: string): Promise<string | null> {
    const admin = this.supabaseRepo.getAdminSupabase();
    const { data, error } = await admin.rpc('pam_auth_user_id_by_email', {
      p_email: email
    });
    if (error || typeof data !== 'string' || !data) {
      return null;
    }
    return data;
  }

  /**
   * Returns whether an Auth user id exists (service role).
   *
   * @param userId - Auth user uuid
   */
  public async authUserExistsById(userId: string): Promise<boolean> {
    const admin = this.supabaseRepo.getAdminSupabase();
    const { data, error } = await admin.auth.admin.getUserById(userId);
    return !error && Boolean(data.user?.id);
  }

  /**
   * Searches Auth users for transfer picker (service role RPC).
   *
   * @param query - Email substring (empty = first page)
   * @param excludeUserId - Omit current user
   * @param limit - Page size (max 50)
   * @param offset - Offset
   * @see makes/sql/009-pam-users-search-and-storage.sql
   */
  public async searchAuthUsers(params: {
    query?: string;
    excludeUserId?: string;
    limit?: number;
    offset?: number;
  }): Promise<{ id: string; email: string }[]> {
    const admin = this.supabaseRepo.getAdminSupabase();
    const { data, error } = await admin.rpc('pam_auth_users_search', {
      p_query: params.query?.trim() || '',
      p_exclude_id: params.excludeUserId || null,
      p_limit: params.limit ?? 20,
      p_offset: params.offset ?? 0
    });
    if (error) {
      this.logger.warn('[PAMProjectRepo] searchAuthUsers failed', { error });
      return [];
    }
    if (!Array.isArray(data)) {
      return [];
    }
    return data
      .map((row) => ({
        id: String((row as { id?: string }).id || ''),
        email: String((row as { email?: string }).email || '')
      }))
      .filter((row) => row.id.length > 0);
  }

  /**
   * Uploads cover bytes to Storage and returns a public URL (cache-busted).
   *
   * @param projectId - Project id (object path prefix)
   * @param bytes - Image bytes
   * @param contentType - MIME type
   * @param bucket - Storage bucket id
   */
  public async uploadProjectPreviewImage(params: {
    projectId: string;
    bytes: ArrayBuffer | Buffer | Uint8Array;
    contentType: string;
    bucket: string;
  }): Promise<string> {
    const admin = this.supabaseRepo.getAdminSupabase();
    const ext = params.contentType.includes('png')
      ? 'png'
      : params.contentType.includes('webp')
        ? 'webp'
        : 'jpg';
    const objectPath = `projects/${params.projectId}/cover.${ext}`;
    const body =
      params.bytes instanceof ArrayBuffer
        ? new Uint8Array(params.bytes)
        : params.bytes;

    const upload = await admin.storage
      .from(params.bucket)
      .upload(objectPath, body, {
        contentType: params.contentType,
        upsert: true,
        cacheControl: '3600'
      });

    if (upload.error) {
      throw new ExecutorError(API_PAM_PREVIEW_CAPTURE_FAILED, {
        cause: upload.error
      });
    }

    const { data } = admin.storage.from(params.bucket).getPublicUrl(objectPath);
    const bust = Date.now();
    return `${data.publicUrl}${data.publicUrl.includes('?') ? '&' : '?'}v=${bust}`;
  }
}
