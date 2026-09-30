'use client';

import {
  ArrowPathIcon,
  InformationCircleIcon
} from '@heroicons/react/24/outline';
import { useLocale } from 'next-intl';
import { useCallback, useEffect, useRef, useState } from 'react';
import { BrainAvatar } from '@/uikit/components/brain/BrainAvatar';
import { BrainButton } from '@/uikit/components/brain/BrainButton';
import { BrainCode } from '@/uikit/components/brain/BrainCode';
import { BrainModal } from '@/uikit/components/brain/BrainModal';
import { readAppApiJson } from '@/uikit/components-app/developer/apps/readAppApiJson';
import { useI18nMapping } from '@/uikit/hook/useI18nMapping';
import { useIOC } from '@/uikit/hook/useIOC';
import type {
  AdminUserList,
  AdminUserListItem,
  AdminUserRole
} from '@shared/admin/adminDashboard';
import { adminShellI18n, adminUsers18n } from '@config/i18n-mapping/admin18n';
import { I } from '@config/ioc-identifiter';
import { API_ADMIN_USERS } from '@config/route';
import { formatDate, formatDateTime, loginMethodLabel } from './adminFormat';
import { AdminSearch, useDebouncedValue } from './AdminLogBits';
import { AdminPager } from './AdminPager';
import type { DialogHandler } from '@qlover/next-kit/client';

const PAGE_SIZE = 15;

export function AdminUsersView() {
  const tt = useI18nMapping(adminUsers18n);
  const shell = useI18nMapping(adminShellI18n);
  const locale = useLocale();
  const dialogHandler = useIOC(I.DialogHandler) as DialogHandler;
  const [keyword, setKeyword] = useState('');
  const [role, setRole] = useState<AdminUserRole | 'all'>('all');
  const [page, setPage] = useState(1);
  const [data, setData] = useState<AdminUserList | null>(null);
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState(false);
  const [selected, setSelected] = useState<AdminUserListItem | null>(null);
  const searchKeyword = useDebouncedValue(keyword.trim());
  const seqRef = useRef(0);

  const load = useCallback(async (): Promise<boolean> => {
    const seq = ++seqRef.current;
    setLoading(true);
    setFailed(false);
    try {
      const params = new URLSearchParams({
        page: String(page),
        pageSize: String(PAGE_SIZE)
      });
      if (searchKeyword) params.set('keyword', searchKeyword);
      if (role !== 'all') params.set('role', role);
      const response = await fetch(`${API_ADMIN_USERS}?${params}`, {
        credentials: 'include'
      });
      const result = await readAppApiJson<AdminUserList>(response);
      if (seq === seqRef.current) setData(result);
      return true;
    } catch (error) {
      console.error('Load admin users error:', error);
      if (seq === seqRef.current) setFailed(true);
      return false;
    } finally {
      if (seq === seqRef.current) setLoading(false);
    }
  }, [page, role, searchKeyword]);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    setPage(1);
  }, [searchKeyword, role]);

  const refresh = async () => {
    if (await load()) dialogHandler.success(shell.refreshed);
  };

  const copy = (value: string) =>
    navigator.clipboard.writeText(value).then(
      () => dialogHandler.success(shell.copied),
      () => undefined
    );

  const roleLabel = (value: AdminUserRole) =>
    value === 'admin' ? (
      <span className="brain-pill sm purple">{tt.roleAdmin}</span>
    ) : (
      <span className="brain-pill sm soft">{tt.roleUser}</span>
    );

  const items = data?.items ?? [];
  const roleChips: { value: AdminUserRole | 'all'; label: string }[] = [
    { value: 'all', label: shell.all },
    { value: 'admin', label: tt.roleAdmin },
    { value: 'user', label: tt.roleUser }
  ];

  return (
    <div data-testid="AdminUsersView">
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
          <div className="brain-chips" role="group">
            {roleChips.map((chip) => (
              <button
                data-testid="AdminUsersView"
                key={chip.value}
                type="button"
                className="brain-chip toggle"
                aria-pressed={role === chip.value}
                onClick={() => setRole(chip.value)}
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
        ) : items.length === 0 ? (
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
                    <th>{tt.thUser}</th>
                    <th>{tt.thRole}</th>
                    <th>{tt.thLoginMethod}</th>
                    <th>{tt.thApps}</th>
                    <th>{tt.thCreated}</th>
                    <th>{tt.thLastLogin}</th>
                    <th />
                  </tr>
                </thead>
                <tbody>
                  {items.map((item) => (
                    <tr
                      data-testid="AdminUsersView"
                      key={item.id}
                      className="clickable"
                      onClick={() => setSelected(item)}
                    >
                      <td>
                        <div className="brain-user-cell">
                          <BrainAvatar
                            name={item.name || item.email}
                            size="sm"
                          />
                          <span className="strong">
                            {item.name || tt.unnamed}
                            <small>{item.email || item.phone || '—'}</small>
                          </span>
                        </div>
                      </td>
                      <td>{roleLabel(item.role)}</td>
                      <td>{loginMethodLabel(item.loginMethod, shell)}</td>
                      <td>{item.apps}</td>
                      <td>{formatDate(item.created_at, locale)}</td>
                      <td>{formatDateTime(item.last_login_at, locale)}</td>
                      <td>
                        <button
                          type="button"
                          className="brain-link"
                          onClick={(event) => {
                            event.stopPropagation();
                            setSelected(item);
                          }}
                        >
                          {shell.detail}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <AdminPager
              page={page}
              pageSize={PAGE_SIZE}
              total={data?.total ?? 0}
              onChange={(next) => setPage(next)}
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
        data-testid="AdminUserDetailModal"
      >
        {selected && (
          <>
            <div className="brain-who mb-[22px]">
              <BrainAvatar name={selected.name || selected.email} />
              <div className="min-w-0">
                <div className="brain-name">{selected.name || tt.unnamed}</div>
                <div className="brain-sub">{selected.email || '—'}</div>
              </div>
            </div>
            <dl className="brain-detail">
              <dt>ID</dt>
              <dd>
                <BrainCode
                  value={selected.id}
                  onCopy={copy}
                  copyLabel={shell.copy}
                />
              </dd>
              <dt>{tt.thRole}</dt>
              <dd>{roleLabel(selected.role)}</dd>
              <dt>{tt.detailEmail}</dt>
              <dd>{selected.email || '—'}</dd>
              <dt>{tt.detailPhone}</dt>
              <dd>{selected.phone || '—'}</dd>
              <dt>{tt.thLoginMethod}</dt>
              <dd>{loginMethodLabel(selected.loginMethod, shell)}</dd>
              <dt>{tt.thApps}</dt>
              <dd>{selected.apps}</dd>
              <dt>{tt.thCreated}</dt>
              <dd>{formatDateTime(selected.created_at, locale)}</dd>
              <dt>{tt.thLastLogin}</dt>
              <dd>{formatDateTime(selected.last_login_at, locale)}</dd>
              <dt>{tt.detailUpdated}</dt>
              <dd>{formatDateTime(selected.updated_at, locale)}</dd>
            </dl>
            <div className="brain-note mb-5">
              <InformationCircleIcon aria-hidden />
              <span>{tt.detailNote}</span>
            </div>
            <div className="brain-modal-actions">
              <BrainButton
                type="button"
                variant="ghost"
                size="sm"
                auto
                onClick={() => setSelected(null)}
              >
                {shell.close}
              </BrainButton>
            </div>
          </>
        )}
      </BrainModal>
    </div>
  );
}
