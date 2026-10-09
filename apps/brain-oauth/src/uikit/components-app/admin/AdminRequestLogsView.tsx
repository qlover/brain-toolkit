'use client';

import {
  ArrowPathIcon,
  ChevronDownIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline';
import { useLocale } from 'next-intl';
import { useCallback, useEffect, useRef, useState } from 'react';
import { RequestLogsApi } from '@/impls/appApi/RequestLogsApi';
import { BrainCode } from '@/uikit/components/brain/BrainCode';
import { BrainModal } from '@/uikit/components/brain/BrainModal';
import { useI18nMapping } from '@/uikit/hook/useI18nMapping';
import { useIOC } from '@/uikit/hook/useIOC';
import { useUserAuth } from '@/uikit/hook/useUserAuth';
import type { RequestLogFilters } from '@shared/admin/adminDashboard';
import { isBrainAdminUser } from '@shared/auth/brainAdmin';
import { defaultSearchParams } from '@config/common';
import {
  adminRequestLogs18n,
  adminShellI18n
} from '@config/i18n-mapping/admin18n';
import { I } from '@config/ioc-identifiter';
import { formatDateTime, loginMethodLabel, readLog } from './adminFormat';
import {
  AdminSearch,
  LogMethod,
  ResultPill,
  useDebouncedValue
} from './AdminLogBits';
import { AdminPager } from './AdminPager';
import type { ResourceSearchResult } from '@qlover/corekit-bridge';
import type { DialogHandler } from '@qlover/next-kit/client';
import type { RequestLogRow } from '@qlover/next-kit/common';

const CATEGORIES = ['auth', 'api'] as const;
const PAGE_SIZES = [15, 20, 50, 100] as const;

type ResultFilter = 'all' | 'success' | 'failed';

export function AdminRequestLogsView() {
  const tt = useI18nMapping(adminRequestLogs18n);
  const shell = useI18nMapping(adminShellI18n);
  const locale = useLocale();
  const requestLogsApi = useIOC(RequestLogsApi);
  const dialogHandler = useIOC(I.DialogHandler) as DialogHandler;
  const { user } = useUserAuth();
  const isAdmin = isBrainAdminUser(user);
  const [keyword, setKeyword] = useState('');
  const [category, setCategory] = useState('');
  const [result, setResult] = useState<ResultFilter>('all');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState<number>(PAGE_SIZES[0]);
  const [data, setData] = useState<ResourceSearchResult<RequestLogRow> | null>(
    null
  );
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState(false);
  const [selected, setSelected] = useState<RequestLogRow | null>(null);
  const searchKeyword = useDebouncedValue(keyword.trim());
  const seqRef = useRef(0);

  const load = useCallback(async (): Promise<boolean> => {
    const seq = ++seqRef.current;
    setLoading(true);
    setFailed(false);
    const filters: RequestLogFilters = {};
    if (category) filters.category = category;
    if (result !== 'all') filters.success = result === 'success';
    try {
      const next = await requestLogsApi.search({
        page,
        pageSize,
        sort: [...defaultSearchParams.sort],
        ...(searchKeyword ? { keyword: searchKeyword } : {}),
        ...(Object.keys(filters).length ? { filters } : {})
      });
      if (seq === seqRef.current) setData(next);
      return true;
    } catch (error) {
      console.error('Load request logs error:', error);
      if (seq === seqRef.current) setFailed(true);
      return false;
    } finally {
      if (seq === seqRef.current) setLoading(false);
    }
  }, [category, page, pageSize, requestLogsApi, result, searchKeyword]);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    setPage(1);
  }, [searchKeyword, category, result]);

  const refresh = async () => {
    if (await load()) dialogHandler.success(shell.refreshed);
  };

  const copy = (value: string) =>
    navigator.clipboard.writeText(value).then(
      () => dialogHandler.success(shell.copied),
      () => undefined
    );

  const rows = data?.items ?? [];
  const resultChips: { value: ResultFilter; label: string }[] = [
    { value: 'all', label: shell.all },
    { value: 'success', label: tt.success },
    { value: 'failed', label: tt.failed }
  ];
  const selectedLog = selected ? readLog(selected) : null;

  return (
    <div data-testid="AdminRequestLogsView">
      <div className="brain-console-head">
        <div>
          <h1 className="brain-title">{tt.title}</h1>
          <p className="brain-desc">{tt.description}</p>
        </div>
      </div>

      <div className="brain-card flat">
        <div className="brain-toolbar">
          <AdminSearch
            value={keyword}
            placeholder={tt.searchPlaceholder}
            aria-label={tt.searchPlaceholder}
            onChange={(event) => setKeyword(event.target.value)}
          />
          <label className="brain-toolbar-select">
            <select
              value={category}
              aria-label={tt.categoryLabel}
              onChange={(event) => setCategory(event.target.value)}
            >
              <option value="">{tt.allCategories}</option>
              {CATEGORIES.map((value) => (
                <option
                  data-testid="AdminRequestLogsView"
                  key={value}
                  value={value}
                >
                  {value}
                </option>
              ))}
            </select>
            <ChevronDownIcon className="brain-field-chevron" aria-hidden />
          </label>
          <div className="brain-chips" role="group">
            {resultChips.map((chip) => (
              <button
                data-testid="AdminRequestLogsView"
                key={chip.value}
                type="button"
                className="brain-chip toggle"
                aria-pressed={result === chip.value}
                onClick={() => setResult(chip.value)}
              >
                {chip.label}
              </button>
            ))}
          </div>
          <button
            type="button"
            className="brain-link"
            disabled={loading}
            onClick={() => void refresh()}
          >
            <ArrowPathIcon aria-hidden />
            {shell.refresh}
          </button>
        </div>

        {loading && !data ? (
          <div className="brain-empty" aria-busy>
            <span className="brain-spinner" aria-hidden />
          </div>
        ) : failed ? (
          <div className="brain-empty">
            <div className="brain-empty-sphere" aria-hidden />
            <p>{shell.loadFailed}</p>
          </div>
        ) : rows.length === 0 ? (
          <div className="brain-empty">
            <div className="brain-empty-sphere" aria-hidden />
            <p>{tt.empty}</p>
          </div>
        ) : (
          <div aria-busy={loading || undefined}>
            <div className="brain-table-wrap">
              <table className="brain-table">
                <thead>
                  <tr>
                    <th>{tt.thTime}</th>
                    <th>{tt.thRequest}</th>
                    <th>{tt.thEvent}</th>
                    <th>{tt.thResult}</th>
                    <th>{tt.thDuration}</th>
                    <th>{tt.thIp}</th>
                    <th>{tt.thLoginMethod}</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((row) => {
                    const log = readLog(row);
                    return (
                      <tr
                        data-testid="AdminRequestLogsView"
                        key={row.id}
                        className="clickable"
                        onClick={() => setSelected(row)}
                      >
                        <td>{formatDateTime(row.created_at, locale)}</td>
                        <td>
                          <LogMethod method={log.method} />
                          <span className="brain-mono strong">{log.path}</span>
                        </td>
                        <td>
                          {row.event_category} · {row.event_type}
                        </td>
                        <td>
                          <ResultPill
                            success={row.success}
                            status={log.status}
                          />
                        </td>
                        <td>
                          {log.durationMs == null
                            ? '—'
                            : `${log.durationMs} ms`}
                        </td>
                        <td className="brain-mono">{log.ip ?? '—'}</td>
                        <td>{loginMethodLabel(log.loginMethod, shell)}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            <AdminPager
              page={page}
              pageSize={pageSize}
              total={data?.total ?? 0}
              pageSizeOptions={PAGE_SIZES}
              onChange={(nextPage, nextSize) => {
                setPage(nextPage);
                setPageSize(nextSize);
              }}
              tt={shell}
            />
          </div>
        )}
      </div>

      <BrainModal
        open={selected != null}
        title={tt.detailTitle}
        onClose={() => setSelected(null)}
        wide
        data-testid="AdminRequestLogModal"
      >
        {selected && selectedLog && (
          <>
            <dl className="brain-detail">
              <dt>{tt.detailRequestId}</dt>
              <dd>
                {selected.request_id ? (
                  <BrainCode
                    value={selected.request_id}
                    onCopy={copy}
                    copyLabel={shell.copy}
                  />
                ) : (
                  '—'
                )}
              </dd>
              <dt>{tt.thTime}</dt>
              <dd>{formatDateTime(selected.created_at, locale)}</dd>
              <dt>{tt.thRequest}</dt>
              <dd>
                <BrainCode
                  value={[selectedLog.method, selectedLog.path]
                    .filter(Boolean)
                    .join(' ')}
                />
              </dd>
              <dt>{tt.thEvent}</dt>
              <dd>
                {selected.event_category} · {selected.event_type}
              </dd>
              <dt>{tt.thResult}</dt>
              <dd>
                <ResultPill
                  success={selected.success}
                  status={selectedLog.status}
                />
              </dd>
              <dt>{tt.thDuration}</dt>
              <dd>
                {selectedLog.durationMs == null
                  ? '—'
                  : `${selectedLog.durationMs} ms`}
              </dd>
              <dt>{tt.thIp}</dt>
              <dd>{selectedLog.ip ?? '—'}</dd>
              <dt>{tt.thLoginMethod}</dt>
              <dd>{loginMethodLabel(selectedLog.loginMethod, shell)}</dd>
              {isAdmin && selected.user_id && (
                <>
                  <dt>{tt.thUser}</dt>
                  <dd>
                    <span className="brain-mono">{selected.user_id}</span>
                  </dd>
                </>
              )}
            </dl>
            {selectedLog.error && (
              <div className="brain-note danger">
                <ExclamationTriangleIcon aria-hidden />
                <span>{selectedLog.error}</span>
              </div>
            )}
          </>
        )}
      </BrainModal>
    </div>
  );
}
