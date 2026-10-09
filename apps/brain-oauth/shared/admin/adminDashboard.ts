import type { RequestLogRow } from '@qlover/next-kit/common';

export type AdminUserRole = 'admin' | 'user';

export interface AdminOverview {
  /** `all` for Brain admins; `own` limits numbers to the caller's apps/logs. */
  scope: 'all' | 'own';
  /** Only present for `all`. */
  users: { total: number; newThisWeek: number } | null;
  apps: { total: number; public: number };
  authorizations: { today: number; yesterday: number };
  failureRate: { today: number | null; yesterday: number | null };
  /** Last 7 local days, oldest first; `date` is the local day start (ISO). */
  daily: { date: string; count: number }[];
  recent: RequestLogRow[];
}

export interface AdminUserListItem {
  id: string;
  email: string | null;
  phone: string | null;
  name: string | null;
  role: AdminUserRole;
  loginMethod: string | null;
  apps: number;
  created_at: string;
  updated_at: string | null;
  last_login_at: string | null;
}

export interface AdminUserList {
  items: AdminUserListItem[];
  total: number;
  page: number;
  pageSize: number;
}

export interface AdminUserListQuery {
  page: number;
  pageSize: number;
  keyword?: string;
  role?: AdminUserRole;
}

export interface RequestLogFilters {
  category?: string;
  success?: boolean;
}

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export function isUuid(value: string): boolean {
  return UUID_RE.test(value);
}

/**
 * Strips characters that would break a PostgREST `or=(...)` expression.
 */
export function sanitizeSearchKeyword(value: unknown): string {
  if (typeof value !== 'string') return '';
  return value
    .replace(/[,()"'\\*%:]/g, ' ')
    .trim()
    .slice(0, 100);
}

const DAY_MS = 24 * 60 * 60 * 1000;

/**
 * UTC timestamps of the last `n` local midnights (oldest first, today last).
 */
export function localDayStarts(
  nowMs: number,
  tzOffsetMinutes: number,
  n: number
): number[] {
  const offsetMs = tzOffsetMinutes * 60 * 1000;
  const localNow = nowMs - offsetMs;
  const todayStart = Math.floor(localNow / DAY_MS) * DAY_MS + offsetMs;
  return Array.from(
    { length: n },
    (_, index) => todayStart - (n - 1 - index) * DAY_MS
  );
}
