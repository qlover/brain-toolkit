import { SupabaseRepo } from '@qlover/next-kit/server';
import { inject, injectable } from '@shared/container';
import { defaultSearchParams } from '@config/common';
import { I } from '@config/ioc-identifiter';
import type {
  ResourceSearchParams,
  ResourceSearchResult
} from '@qlover/corekit-bridge';
import type { LoggerInterface } from '@qlover/logger';
import type { RequestLogRow } from '@qlover/next-kit/common';

const TABLE = 'request_logs';

@injectable()
export class RequestLogsAdminRepo {
  constructor(
    @inject(SupabaseRepo)
    protected readonly supabaseBridge: SupabaseRepo<unknown>,
    @inject(I.Logger)
    protected readonly logger: LoggerInterface
  ) {}

  public async searchAll(
    criteria: ResourceSearchParams
  ): Promise<ResourceSearchResult<RequestLogRow>> {
    const page = criteria.page ?? defaultSearchParams.page;
    const pageSize = criteria.pageSize ?? defaultSearchParams.pageSize;
    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;

    const sort = criteria.sort?.[0];
    const orderBy =
      typeof sort?.orderBy === 'string' ? sort.orderBy : 'created_at';
    const ascending = sort?.order === 'asc';

    const supabase = await this.supabaseBridge.getAdminSupabase();
    let query = supabase.from(TABLE).select('*', { count: 'exact' });

    const filters = criteria.filters;
    if (
      filters != null &&
      typeof filters === 'object' &&
      !Array.isArray(filters) &&
      'userId' in filters &&
      typeof (filters as { userId?: unknown }).userId === 'string'
    ) {
      query = query.eq('user_id', (filters as { userId: string }).userId);
    }

    if (criteria.keyword?.trim()) {
      query = query.or(
        `event_type.ilike.%${criteria.keyword.trim()}%,event_category.ilike.%${criteria.keyword.trim()}%`
      );
    }

    const { data, error, count } = await query
      .order(orderBy, { ascending })
      .range(from, to);

    if (error) {
      this.logger.error('RequestLogsAdminRepo.searchAll failed', { error });
      throw new Error(error.message);
    }

    const items = (data ?? []) as RequestLogRow[];
    const total = count ?? items.length;

    return {
      items,
      total,
      page,
      pageSize,
      hasMore: from + items.length < total
    };
  }
}
