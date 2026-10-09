import { SupabaseRepo } from '@qlover/next-kit/server';
import {
  isUuid,
  localDayStarts,
  sanitizeSearchKeyword,
  type AdminOverview,
  type AdminUserList,
  type AdminUserListItem,
  type AdminUserListQuery
} from '@shared/admin/adminDashboard';
import { inject, injectable } from '@shared/container';
import { oauthLocalUserConfig } from '@config/oauthLocalUser';
import type { RequestLogRow } from '@qlover/next-kit/common';

const CLIENTS_TABLE = 'brain_oauth_clients';
const CODES_TABLE = 'brain_oauth_authorization_codes';
const DAY_MS = 24 * 60 * 60 * 1000;
const RECENT_LIMIT = 5;

const { usersTable, requestLogsTable } = oauthLocalUserConfig;

type Supabase = Awaited<ReturnType<SupabaseRepo<unknown>['getAdminSupabase']>>;

interface UserRow {
  id: string;
  email: string | null;
  phone: string | null;
  name: string | null;
  extra: Record<string, unknown> | null;
  created_at: string;
  updated_at: string | null;
  last_login_at: string | null;
}

/**
 * Read-only aggregates for the admin console (service-role client).
 */
@injectable()
export class AdminDashboardService {
  constructor(
    @inject(SupabaseRepo)
    protected readonly supabaseRepo: SupabaseRepo<unknown>
  ) {}

  /**
   * @param ownerUserId `null` for site-wide numbers (admins only).
   * @param tzOffsetMinutes `Date#getTimezoneOffset()` of the viewer.
   */
  public async getOverview(
    ownerUserId: string | null,
    tzOffsetMinutes: number
  ): Promise<AdminOverview> {
    const supabase = await this.supabaseRepo.getAdminSupabase();
    const days = localDayStarts(Date.now(), tzOffsetMinutes, 8);
    const todayStart = days[days.length - 1];
    const yesterdayStart = days[days.length - 2];

    const clientIds = ownerUserId
      ? await this.listOwnClientIds(supabase, ownerUserId)
      : null;

    const countCodes = (from: number, to: number) =>
      clientIds && clientIds.length === 0
        ? Promise.resolve(0)
        : count(
            (() => {
              let q = supabase
                .from(CODES_TABLE)
                .select('code', { count: 'exact', head: true })
                .gte('created_at', new Date(from).toISOString())
                .lt('created_at', new Date(to).toISOString());
              if (clientIds) q = q.in('client_id', clientIds);
              return q;
            })()
          );

    const countLogs = (from: number, to: number, failedOnly: boolean) => {
      let q = supabase
        .from(requestLogsTable)
        .select('id', { count: 'exact', head: true })
        .gte('created_at', new Date(from).toISOString())
        .lt('created_at', new Date(to).toISOString());
      if (ownerUserId) q = q.eq('user_id', ownerUserId);
      if (failedOnly) q = q.eq('success', false);
      return count(q);
    };

    const countApps = (publicOnly: boolean) => {
      let q = supabase
        .from(CLIENTS_TABLE)
        .select('client_id', { count: 'exact', head: true });
      if (ownerUserId) q = q.eq('owner_user_id', ownerUserId);
      if (publicOnly) q = q.eq('confidential', false);
      return count(q);
    };

    const tomorrowStart = todayStart + DAY_MS;
    const chartStarts = days.slice(1);

    const [
      dailyCounts,
      appsTotal,
      appsPublic,
      logsToday,
      failedToday,
      logsYesterday,
      failedYesterday,
      users,
      recent
    ] = await Promise.all([
      Promise.all(
        chartStarts.map((start) => countCodes(start, start + DAY_MS))
      ),
      countApps(false),
      countApps(true),
      countLogs(todayStart, tomorrowStart, false),
      countLogs(todayStart, tomorrowStart, true),
      countLogs(yesterdayStart, todayStart, false),
      countLogs(yesterdayStart, todayStart, true),
      ownerUserId ? Promise.resolve(null) : this.countUsers(supabase),
      this.listRecentLogs(supabase, ownerUserId)
    ]);

    return {
      scope: ownerUserId ? 'own' : 'all',
      users,
      apps: { total: appsTotal, public: appsPublic },
      authorizations: {
        today: dailyCounts[dailyCounts.length - 1],
        yesterday: dailyCounts[dailyCounts.length - 2]
      },
      failureRate: {
        today: rate(failedToday, logsToday),
        yesterday: rate(failedYesterday, logsYesterday)
      },
      daily: chartStarts.map((start, index) => ({
        date: new Date(start).toISOString(),
        count: dailyCounts[index]
      })),
      recent
    };
  }

  public async listUsers(query: AdminUserListQuery): Promise<AdminUserList> {
    const supabase = await this.supabaseRepo.getAdminSupabase();
    const { page, pageSize } = query;
    const from = (page - 1) * pageSize;

    let q = supabase
      .from(usersTable)
      .select('id,email,phone,name,extra,created_at,updated_at,last_login_at', {
        count: 'exact'
      })
      .order('created_at', { ascending: false })
      .order('id', { ascending: false })
      .range(from, from + pageSize - 1);

    const groups: string[] = [];
    const keyword = sanitizeSearchKeyword(query.keyword);
    if (keyword) {
      groups.push(
        isUuid(keyword)
          ? `id.eq.${keyword}`
          : `email.ilike.*${keyword}*,phone.ilike.*${keyword}*,name.ilike.*${keyword}*`
      );
    }
    if (query.role === 'admin') {
      q = q.eq('extra->>brainAdmin', 'true');
    } else if (query.role === 'user') {
      groups.push(
        'extra.is.null,extra->>brainAdmin.is.null,extra->>brainAdmin.neq.true'
      );
    }
    if (groups.length === 1) {
      q = q.or(groups[0]);
    } else if (groups.length > 1) {
      q = q.or(`and(${groups.map((g) => `or(${g})`).join(',')})`);
    }

    const { data, error, count: total } = await q;
    if (error) {
      throw new Error(`Failed to list ${usersTable}: ${error.message}`);
    }

    const rows = (data ?? []) as UserRow[];
    const ids = rows.map((row) => String(row.id));
    const [appCounts, loginMethods] = await Promise.all([
      this.countAppsByOwner(supabase, ids),
      this.lastLoginMethods(supabase, ids)
    ]);

    const items: AdminUserListItem[] = rows.map((row) => ({
      id: String(row.id),
      email: row.email,
      phone: row.phone,
      name: row.name,
      role: row.extra?.brainAdmin === true ? 'admin' : 'user',
      loginMethod: loginMethods.get(String(row.id)) ?? null,
      apps: appCounts.get(String(row.id)) ?? 0,
      created_at: row.created_at,
      updated_at: row.updated_at,
      last_login_at: row.last_login_at
    }));

    return { items, total: total ?? 0, page, pageSize };
  }

  protected async listOwnClientIds(
    supabase: Supabase,
    ownerUserId: string
  ): Promise<string[]> {
    const { data, error } = await supabase
      .from(CLIENTS_TABLE)
      .select('client_id')
      .eq('owner_user_id', ownerUserId);
    if (error) {
      throw new Error(`Failed to list ${CLIENTS_TABLE}: ${error.message}`);
    }
    return (data ?? []).map((row) => String(row.client_id));
  }

  protected async countUsers(
    supabase: Supabase
  ): Promise<{ total: number; newThisWeek: number }> {
    const weekAgo = new Date(Date.now() - 7 * DAY_MS).toISOString();
    const [total, newThisWeek] = await Promise.all([
      count(
        supabase.from(usersTable).select('id', { count: 'exact', head: true })
      ),
      count(
        supabase
          .from(usersTable)
          .select('id', { count: 'exact', head: true })
          .gte('created_at', weekAgo)
      )
    ]);
    return { total, newThisWeek };
  }

  protected async listRecentLogs(
    supabase: Supabase,
    ownerUserId: string | null
  ): Promise<RequestLogRow[]> {
    let q = supabase
      .from(requestLogsTable)
      .select('*')
      .order('created_at', { ascending: false })
      .limit(RECENT_LIMIT);
    if (ownerUserId) q = q.eq('user_id', ownerUserId);
    const { data, error } = await q;
    if (error) {
      throw new Error(`Failed to list ${requestLogsTable}: ${error.message}`);
    }
    return (data ?? []) as RequestLogRow[];
  }

  protected async countAppsByOwner(
    supabase: Supabase,
    ids: string[]
  ): Promise<Map<string, number>> {
    const counts = new Map<string, number>();
    if (ids.length === 0) return counts;
    const { data, error } = await supabase
      .from(CLIENTS_TABLE)
      .select('owner_user_id')
      .in('owner_user_id', ids);
    if (error) {
      throw new Error(`Failed to list ${CLIENTS_TABLE}: ${error.message}`);
    }
    for (const row of data ?? []) {
      const owner = String(row.owner_user_id);
      counts.set(owner, (counts.get(owner) ?? 0) + 1);
    }
    return counts;
  }

  protected async lastLoginMethods(
    supabase: Supabase,
    ids: string[]
  ): Promise<Map<string, string>> {
    const methods = new Map<string, string>();
    if (ids.length === 0) return methods;
    const { data, error } = await supabase
      .from(requestLogsTable)
      .select('user_id,payload')
      .eq('event_category', 'auth')
      .eq('event_type', 'login')
      .in('user_id', ids)
      .order('created_at', { ascending: false })
      .limit(ids.length * 20);
    if (error) {
      throw new Error(`Failed to list ${requestLogsTable}: ${error.message}`);
    }
    for (const row of data ?? []) {
      const userId = String(row.user_id);
      const payload = row.payload as Record<string, unknown> | null;
      const method = payload?.login_method;
      if (!methods.has(userId) && typeof method === 'string' && method) {
        methods.set(userId, method);
      }
    }
    return methods;
  }
}

async function count(
  query: PromiseLike<{
    count: number | null;
    error: { message: string } | null;
  }>
): Promise<number> {
  const { count: value, error } = await query;
  if (error) {
    throw new Error(`Count query failed: ${error.message}`);
  }
  return value ?? 0;
}

function rate(failed: number, total: number): number | null {
  return total > 0 ? failed / total : null;
}
