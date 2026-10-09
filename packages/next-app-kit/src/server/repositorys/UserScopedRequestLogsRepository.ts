import { Operators, RequestLogsRepository } from '@qlover/next-kit/server';
import type { ResourceSearchParams } from '@qlover/corekit-bridge';
export type AuthLogParams = Parameters<
  RequestLogsRepository['insertWithAuth']
>[0];

/**
 * Request logs with an explicit `user_id` column owner.
 *
 * Apps without Supabase Auth sessions cannot rely on the `auth.uid()` column
 * default, and `search()` runs on the service-role client (RLS bypassed), so
 * ownership must be written and filtered explicitly.
 */
export class UserScopedRequestLogsRepository extends RequestLogsRepository {
  /**
   * @override Persists `params.user_id` (base implementation drops it).
   *
   * Written with the service-role client: RLS on the cookie client only
   * accepts `user_id = auth.uid()`, which is null for non-Supabase sessions.
   */
  public override async insertWithAuth(params: AuthLogParams): Promise<void> {
    const data = {
      event_category: 'auth',
      event_type: params.event_type,
      success: true,
      request_id: this.serverContext.getState('uid'),
      record_type: 'auth',
      payload: {
        auth_provider: params.auth_provider,
        user_agent: params.userAgent,
        ip_address: params.ipAddress,
        login_method: params.login_method
      },
      ...(params.user_id ? { user_id: params.user_id } : {})
    };
    const { error } = await this.getAdminSupabase()
      .from(this.getRepoName())
      .insert(data);
    if (error) {
      throw new Error(`Failed to write auth log: ${error.message}`);
    }
  }

  /**
   * Search rows owned by `userId`; caller-provided `where` is discarded.
   */
  public searchForUser(
    userId: string,
    criteria: ResourceSearchParams
  ): ReturnType<RequestLogsRepository['search']> {
    return this.search({
      ...criteria,
      where: [['user_id', Operators.eq, userId]]
    });
  }
}
