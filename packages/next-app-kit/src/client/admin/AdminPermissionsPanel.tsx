'use client';

import { useStrictEffect } from '@qlover/next-kit/client';
import { clsx } from 'clsx';
import { useCallback, useMemo, useState, type ReactNode } from 'react';
import { PERMISSION_KEY_PATTERN } from '../../shared/permissions/permissionKeys';
import type {
  AdminPermissionCreate,
  AdminPermissionItem,
  AdminPermissionType,
  AdminPermissionUpdate,
  AdminPermissionsResponse
} from '../../shared/permissions/adminRoleSchemas';

export interface AdminPermissionsPanelApi {
  list(): Promise<AdminPermissionsResponse>;
  create(body: AdminPermissionCreate): Promise<AdminPermissionsResponse>;
  update(body: AdminPermissionUpdate): Promise<AdminPermissionsResponse>;
}

export interface AdminPermissionsPanelText {
  readonly loadFailed: string;
  readonly saveFailed: string;
  readonly createSuccess: string;
  readonly updateSuccess: string;
  readonly forbidden: string;
  readonly search: string;
  readonly create: string;
  readonly edit: string;
  readonly save: string;
  readonly saving: string;
  readonly cancel: string;
  readonly empty: string;
  readonly keyHint: string;
  readonly fieldKey: string;
  readonly fieldType: string;
  readonly fieldMethod: string;
  readonly fieldPath: string;
  readonly fieldDescription: string;
}

export interface AdminPermissionsPanelProps {
  readonly api: AdminPermissionsPanelApi;
  readonly tt: AdminPermissionsPanelText;
  readonly canRead: boolean;
  readonly canWrite: boolean;
  /** Capability check still resolving. */
  readonly authLoading?: boolean;
  /** `data-permission` value on write buttons. */
  readonly writePermissionKey?: string;
  readonly permissionLabel: (item: AdminPermissionItem) => string;
  readonly renderLoading?: () => ReactNode;
}

type EditorMode = 'idle' | 'create' | 'edit';

type DraftPermission = {
  permissionKey: string;
  type: AdminPermissionType;
  method: string;
  path: string;
  description: string;
};

const EMPTY_DRAFT: DraftPermission = {
  permissionKey: '',
  type: 'api',
  method: '',
  path: '',
  description: ''
};

function toDraft(item: AdminPermissionItem): DraftPermission {
  return {
    permissionKey: item.permissionKey,
    type: item.type === 'page' || item.type === 'feature' ? item.type : 'api',
    method: item.method ?? '',
    path: item.path ?? '',
    description: item.description ?? ''
  };
}

/**
 * Permission catalog editor: list / create / update permission rows.
 */
export function AdminPermissionsPanel({
  api,
  tt,
  canRead,
  canWrite,
  authLoading = false,
  writePermissionKey,
  permissionLabel,
  renderLoading
}: AdminPermissionsPanelProps) {
  const [catalog, setCatalog] = useState<AdminPermissionItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [query, setQuery] = useState('');
  const [mode, setMode] = useState<EditorMode>('idle');
  const [draft, setDraft] = useState<DraftPermission>(EMPTY_DRAFT);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      setCatalog((await api.list()).catalog);
    } catch {
      setError(tt.loadFailed);
    } finally {
      setLoading(false);
    }
  }, [api, tt.loadFailed]);

  useStrictEffect(() => {
    if (authLoading) {
      return;
    }
    if (!canRead) {
      setCatalog([]);
      setLoading(false);
      return;
    }
    void load();
  }, [authLoading, canRead, load]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return catalog;
    return catalog.filter(
      (item) =>
        item.permissionKey.toLowerCase().includes(q) ||
        (item.path ?? '').toLowerCase().includes(q) ||
        (item.description ?? '').toLowerCase().includes(q)
    );
  }, [catalog, query]);

  const openEditor = (nextMode: EditorMode, next: DraftPermission): void => {
    setMode(nextMode);
    setDraft(next);
    setSuccess(null);
    setError(null);
  };

  const cancelEditor = (): void => {
    setMode('idle');
    setDraft(EMPTY_DRAFT);
  };

  const onSave = async (): Promise<void> => {
    if (!canWrite || saving) return;
    const key = draft.permissionKey.trim();
    if (!PERMISSION_KEY_PATTERN.test(key)) {
      setError(tt.keyHint);
      return;
    }
    setSuccess(null);
    setError(null);
    setSaving(true);
    const body = {
      permissionKey: key,
      type: draft.type,
      method: draft.method.trim() || null,
      path: draft.path.trim() || null,
      description: draft.description.trim() || null
    };
    try {
      const next = await (mode === 'create'
        ? api.create(body)
        : api.update(body));
      setCatalog(next.catalog);
      setSuccess(mode === 'create' ? tt.createSuccess : tt.updateSuccess);
      setMode('idle');
      setDraft(EMPTY_DRAFT);
    } catch {
      setError(tt.saveFailed);
    } finally {
      setSaving(false);
    }
  };

  if (authLoading || loading) {
    return <>{renderLoading?.() ?? null}</>;
  }

  if (!canRead) {
    return (
      <p
        className="rounded-lg border border-primary-border bg-elevated px-4 py-3 text-sm text-secondary-text"
        data-testid="AdminPermissionsForbidden"
      >
        {tt.forbidden}
      </p>
    );
  }

  const inputClass =
    'w-full rounded-lg border border-primary-border bg-bg-container px-3 py-2 text-sm';

  return (
    <div className="space-y-4" data-testid="AdminPermissionsPanel">
      <div className="flex flex-wrap items-center gap-2">
        <input
          type="search"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder={tt.search}
          className="min-w-[12rem] flex-1 rounded-lg border border-primary-border bg-bg-container px-3 py-2 text-sm text-primary-text"
        />
        {canWrite ? (
          <button
            type="button"
            data-permission={writePermissionKey}
            onClick={() => openEditor('create', EMPTY_DRAFT)}
            className="rounded-lg bg-brand px-3 py-2 text-sm font-medium text-on-brand transition hover:bg-brand-hover"
          >
            {tt.create}
          </button>
        ) : null}
      </div>

      {error ? (
        <p className="text-sm text-(--fe-color-error)">{error}</p>
      ) : null}
      {success ? <p className="text-sm text-brand">{success}</p> : null}

      {mode !== 'idle' ? (
        <div className="space-y-3 rounded-xl border border-primary-border bg-secondary p-4">
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="space-y-1 text-sm">
              <span className="text-secondary-text">{tt.fieldKey}</span>
              <input
                value={draft.permissionKey}
                disabled={mode === 'edit'}
                onChange={(event) =>
                  setDraft((prev) => ({
                    ...prev,
                    permissionKey: event.target.value
                  }))
                }
                className={clsx(inputClass, 'font-mono disabled:opacity-60')}
              />
              <span className="block text-xs text-tertiary-text">
                {tt.keyHint}
              </span>
            </label>
            <label className="space-y-1 text-sm">
              <span className="text-secondary-text">{tt.fieldType}</span>
              <select
                value={draft.type}
                onChange={(event) =>
                  setDraft((prev) => ({
                    ...prev,
                    type: event.target.value as AdminPermissionType
                  }))
                }
                className={inputClass}
              >
                <option value="api">api</option>
                <option value="page">page</option>
                <option value="feature">feature</option>
              </select>
            </label>
            <label className="space-y-1 text-sm">
              <span className="text-secondary-text">{tt.fieldMethod}</span>
              <input
                value={draft.method}
                onChange={(event) =>
                  setDraft((prev) => ({ ...prev, method: event.target.value }))
                }
                placeholder="get / post / patch / delete"
                className={clsx(inputClass, 'font-mono')}
              />
            </label>
            <label className="space-y-1 text-sm">
              <span className="text-secondary-text">{tt.fieldPath}</span>
              <input
                value={draft.path}
                onChange={(event) =>
                  setDraft((prev) => ({ ...prev, path: event.target.value }))
                }
                placeholder="/api/..."
                className={clsx(inputClass, 'font-mono')}
              />
            </label>
            <label className="space-y-1 text-sm sm:col-span-2">
              <span className="text-secondary-text">{tt.fieldDescription}</span>
              <input
                value={draft.description}
                onChange={(event) =>
                  setDraft((prev) => ({
                    ...prev,
                    description: event.target.value
                  }))
                }
                className={inputClass}
              />
            </label>
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              data-permission={writePermissionKey}
              disabled={saving}
              onClick={() => void onSave()}
              className="rounded-lg bg-brand px-3 py-2 text-sm font-medium text-on-brand transition hover:bg-brand-hover disabled:opacity-50"
            >
              {saving ? tt.saving : tt.save}
            </button>
            <button
              type="button"
              disabled={saving}
              onClick={cancelEditor}
              className="rounded-lg border border-primary-border px-3 py-2 text-sm text-secondary-text transition hover:bg-elevated"
            >
              {tt.cancel}
            </button>
          </div>
        </div>
      ) : null}

      {filtered.length === 0 ? (
        <p className="text-sm text-secondary-text">{tt.empty}</p>
      ) : (
        <ul className="divide-y divide-primary-border overflow-hidden rounded-xl border border-primary-border bg-secondary">
          {filtered.map((item) => (
            <li
              data-testid="AdminPermissionsItem"
              key={item.permissionKey}
              className="flex flex-col gap-2 px-3 py-3 sm:flex-row sm:items-center sm:justify-between"
            >
              <div className="min-w-0 space-y-0.5">
                <p className="truncate font-mono text-sm font-semibold text-primary-text">
                  {item.permissionKey}
                </p>
                <p className="truncate text-xs text-secondary-text">
                  {permissionLabel(item)}
                  {item.method || item.path
                    ? ` · ${(item.method ?? '').toUpperCase()} ${item.path ?? ''}`.trim()
                    : ''}
                </p>
              </div>
              {canWrite ? (
                <button
                  type="button"
                  data-permission={writePermissionKey}
                  onClick={() => openEditor('edit', toDraft(item))}
                  className="shrink-0 rounded-lg border border-primary-border px-2.5 py-1.5 text-xs font-medium text-secondary-text transition hover:bg-elevated hover:text-primary-text"
                >
                  {tt.edit}
                </button>
              ) : null}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
