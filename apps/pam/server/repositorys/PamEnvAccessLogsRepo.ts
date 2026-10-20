import { SupabaseRepo } from '@qlover/next-kit/server';
import { inject, injectable } from '@shared/container';
import { PamTables } from '@config/pamTables';
import type {
  PAMEnvAccessAction,
  PAMEnvAccessLog
} from '@schemas/PAMEnvironmentSchema';

type AccessLogRow = Omit<PAMEnvAccessLog, 'user_label'>;

/**
 * Environment variable access audit (`pam_env_access_logs`, service-role only).
 * Never stores variable keys or values.
 */
@injectable()
export class PamEnvAccessLogsRepo {
  constructor(
    @inject(SupabaseRepo)
    protected readonly supabaseBridge: SupabaseRepo<unknown>
  ) {}

  public async insert(input: {
    userId: string | null;
    projectId: string;
    environmentId: string;
    environmentName: string;
    action: PAMEnvAccessAction;
    keyCount: number;
    client: string | null;
    ip: string | null;
  }): Promise<void> {
    const supabase = await this.supabaseBridge.getAdminSupabase();
    const result = await supabase.from(PamTables.envAccessLogs).insert({
      user_id: input.userId,
      project_id: input.projectId,
      environment_id: input.environmentId,
      environment_name: input.environmentName,
      action: input.action,
      key_count: input.keyCount,
      client: input.client,
      ip: input.ip
    });
    this.supabaseBridge.throwIfError(result);
  }

  public async listByEnvironment(
    projectId: string,
    environmentId: string,
    limit = 50
  ): Promise<PAMEnvAccessLog[]> {
    const supabase = await this.supabaseBridge.getAdminSupabase();
    const result = await supabase
      .from(PamTables.envAccessLogs)
      .select(
        'id,user_id,environment_id,environment_name,action,key_count,client,ip,created_at'
      )
      .eq('project_id', projectId)
      .eq('environment_id', environmentId)
      .order('created_at', { ascending: false })
      .limit(Math.min(Math.max(limit, 1), 200));
    this.supabaseBridge.throwIfError(result);

    const rows = (result.data ?? []) as AccessLogRow[];
    const userIds = [
      ...new Set(rows.map((r) => r.user_id).filter((id): id is string => !!id))
    ];
    if (userIds.length === 0) {
      return rows.map((row) => ({ ...row, user_label: null }));
    }

    const usersResult = await supabase
      .from('pam_users')
      .select('id, email, phone, display_name')
      .in('id', userIds);
    this.supabaseBridge.throwIfError(usersResult);

    const labels = new Map(
      (usersResult.data ?? []).map((u) => {
        const user = u as {
          id: string;
          email?: string | null;
          phone?: string | null;
          display_name?: string | null;
        };
        return [
          user.id,
          user.display_name || user.email || user.phone || null
        ] as const;
      })
    );

    return rows.map((row) => ({
      ...row,
      user_label: row.user_id ? (labels.get(row.user_id) ?? null) : null
    }));
  }
}
