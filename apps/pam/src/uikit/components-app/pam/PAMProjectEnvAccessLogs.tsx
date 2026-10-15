'use client';

import { clsx } from 'clsx';
import dayjs from 'dayjs';
import { useEffect, useMemo, useState } from 'react';
import { PAMApi } from '@/impls/appApi/PAMApi';
import { PamLoadingIndicator } from '@/uikit/components/PamLoadingIndicator';
import { useIOC } from '@/uikit/hook/useIOC';
import type { PAMEnvironmentsI18nInterface } from '@config/i18n-mapping/PAMEnvironmentsI18n';
import type { PAMEnvAccessLog } from '@schemas/PAMEnvironmentSchema';
import { pamFormFieldClass } from '../../components/pam/PAMFormFieldStyles';

export type PAMProjectEnvAccessLogsProps = {
  readonly projectId: string;
  readonly envId: string;
  readonly tt: PAMEnvironmentsI18nInterface;
};

type ActionFilter = 'all' | PAMEnvAccessLog['action'];

const PAGE_SIZE = 20;

/**
 * Recent `run` / `pull` / `render` records for one environment, filtered
 * and paged client-side (`pam_environments_export` holders only).
 */
export function PAMProjectEnvAccessLogs({
  projectId,
  envId,
  tt
}: PAMProjectEnvAccessLogsProps) {
  const pamApi = useIOC(PAMApi);
  const [logs, setLogs] = useState<PAMEnvAccessLog[] | null>(null);
  const [action, setAction] = useState<ActionFilter>('all');
  const [user, setUser] = useState('');
  const [page, setPage] = useState(1);

  useEffect(() => {
    let cancelled = false;
    setLogs(null);
    pamApi
      .listEnvironmentAccessLogs(projectId, envId)
      .then((result) => {
        if (!cancelled) {
          setLogs(result);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setLogs([]);
        }
      });
    return () => {
      cancelled = true;
    };
  }, [pamApi, projectId, envId]);

  const filtered = useMemo(() => {
    const query = user.trim().toLowerCase();
    return (logs ?? []).filter(
      (log) =>
        (action === 'all' || log.action === action) &&
        (!query || (log.user_label ?? '').toLowerCase().includes(query))
    );
  }, [logs, action, user]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const pageLogs = filtered.slice(
    (currentPage - 1) * PAGE_SIZE,
    currentPage * PAGE_SIZE
  );

  const actionOptions: { value: ActionFilter; label: string }[] = [
    { value: 'all', label: tt.accessFilterAll },
    { value: 'resolve', label: tt.accessActionResolve },
    { value: 'export', label: tt.accessActionExport }
  ];

  return (
    <div data-testid="PAMProjectEnvAccessLogs" className="space-y-3">
      <p className="text-xs text-tertiary-text">{tt.accessLogsHint}</p>
      <div className="flex flex-wrap gap-2">
        <select
          value={action}
          onChange={(event) => {
            setAction(event.target.value as ActionFilter);
            setPage(1);
          }}
          className={clsx(pamFormFieldClass, 'w-auto py-1.5 text-sm')}
        >
          {actionOptions.map((option) => (
            <option
              data-testid="PAMProjectEnvAccessLogs"
              key={option.value}
              value={option.value}
            >
              {option.label}
            </option>
          ))}
        </select>
        <input
          value={user}
          onChange={(event) => {
            setUser(event.target.value);
            setPage(1);
          }}
          placeholder={tt.accessFilterUser}
          className={clsx(pamFormFieldClass, 'min-w-40 flex-1 py-1.5 text-sm')}
        />
      </div>

      {logs === null ? (
        <div className="flex justify-center py-6">
          <PamLoadingIndicator />
        </div>
      ) : filtered.length === 0 ? (
        <p className="py-6 text-center text-sm text-tertiary-text">
          {tt.accessLogsEmpty}
        </p>
      ) : (
        <>
          <ul className="divide-y divide-primary-border rounded-lg border border-primary-border">
            {pageLogs.map((log) => (
              <li
                data-testid="PAMProjectEnvAccessLogs"
                key={log.id}
                className="flex flex-wrap items-center gap-x-3 gap-y-1 px-3 py-2 text-xs"
              >
                <span className="font-medium text-primary-text">
                  {log.user_label ?? tt.accessUnknownUser}
                </span>
                <span
                  className={clsx(
                    'rounded px-1.5 py-0.5',
                    log.action === 'export'
                      ? 'bg-(--fe-color-warning)/10 text-(--fe-color-warning)'
                      : 'bg-brand/10 text-brand'
                  )}
                >
                  {log.action === 'export'
                    ? tt.accessActionExport
                    : tt.accessActionResolve}
                </span>
                <span className="text-secondary-text">
                  {tt.accessKeyCount.replace('%count%', String(log.key_count))}
                </span>
                {log.client ? (
                  <span
                    className="max-w-48 truncate text-tertiary-text"
                    title={log.client}
                  >
                    {log.client}
                  </span>
                ) : null}
                {log.ip ? (
                  <span className="font-mono text-tertiary-text">{log.ip}</span>
                ) : null}
                <span className="ml-auto text-tertiary-text">
                  {dayjs(log.created_at).format('YYYY-MM-DD HH:mm:ss')}
                </span>
              </li>
            ))}
          </ul>
          <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-tertiary-text">
            <span>
              {tt.pageInfo
                .replace('%page%', String(currentPage))
                .replace('%total%', String(totalPages))
                .replace('%count%', String(filtered.length))}
            </span>
            <div className="flex gap-2">
              <button
                type="button"
                disabled={currentPage <= 1}
                onClick={() => setPage(currentPage - 1)}
                className="cursor-pointer rounded-lg border border-primary-border px-2.5 py-1 text-secondary-text transition hover:bg-elevated disabled:cursor-not-allowed disabled:opacity-50"
              >
                {tt.pagePrev}
              </button>
              <button
                type="button"
                disabled={currentPage >= totalPages}
                onClick={() => setPage(currentPage + 1)}
                className="cursor-pointer rounded-lg border border-primary-border px-2.5 py-1 text-secondary-text transition hover:bg-elevated disabled:cursor-not-allowed disabled:opacity-50"
              >
                {tt.pageNext}
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
