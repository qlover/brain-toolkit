import type { AdminShellI18nInterface } from '@config/i18n-mapping/admin18n';
import type { RequestLogRow } from '@qlover/next-kit/common';

export function localeTag(locale: string): string {
  return locale === 'zh' ? 'zh-CN' : 'en-US';
}

export function formatDateTime(
  iso: string | null | undefined,
  locale: string
): string {
  if (!iso) return '—';
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return '—';
  return date.toLocaleString(localeTag(locale), {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false
  });
}

export function formatDate(
  iso: string | null | undefined,
  locale: string
): string {
  if (!iso) return '—';
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return '—';
  return date.toLocaleDateString(localeTag(locale), {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  });
}

export function formatTime(iso: string, locale: string): string {
  return new Date(iso).toLocaleTimeString(localeTag(locale), {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false
  });
}

export function loginMethodLabel(
  method: string | null | undefined,
  tt: Pick<AdminShellI18nInterface, 'loginPhoneOtp' | 'loginPassword'>
): string {
  if (!method) return '—';
  if (method === 'phone_otp') return tt.loginPhoneOtp;
  if (method === 'password') return tt.loginPassword;
  return method;
}

export function fill(
  template: string,
  values: Record<string, string | number>
): string {
  return template.replace(/\{(\w+)\}/g, (match, key: string) =>
    key in values ? String(values[key]) : match
  );
}

export interface LogView {
  method: string;
  path: string;
  status: number | null;
  durationMs: number | null;
  ip: string | null;
  loginMethod: string | null;
  error: string | null;
}

export function readLog(row: RequestLogRow): LogView {
  const p = row.payload && typeof row.payload === 'object' ? row.payload : {};
  const str = (v: unknown) => (typeof v === 'string' && v !== '' ? v : null);
  const num = (v: unknown) =>
    typeof v === 'number' && !Number.isNaN(v) ? v : null;
  const errorParts = [str(p.error_code), str(p.error_message)].filter(Boolean);
  return {
    method: str(p.http_method) ?? '',
    path: str(p.http_path) ?? (row.record_type || row.event_type),
    status: num(p.http_status),
    durationMs: num(p.duration_ms),
    ip: str(p.ip_address),
    loginMethod: str(p.login_method),
    error: errorParts.length ? errorParts.join(' · ') : null
  };
}
