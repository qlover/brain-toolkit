'use client';

import { useStrictEffect } from '@qlover/next-kit/client';
import { clsx } from 'clsx';
import { useCallback, useMemo, useState, type ReactNode } from 'react';
import type {
  AdminPermissionItem,
  AdminRoleAssignmentsPatch,
  AdminRoleItem,
  AdminRolesResponse
} from '../../shared/permissions/adminRoleSchemas';

export interface AdminRolesPanelApi {
  list(): Promise<AdminRolesResponse>;
  replaceAssignments(
    body: AdminRoleAssignmentsPatch
  ): Promise<AdminRolesResponse>;
}

export interface AdminRolesPanelText {
  readonly loadFailed: string;
  readonly saveFailed: string;
  readonly saveSuccess: string;
  readonly empty: string;
  readonly selectedCount: string;
  readonly permissionLabel: string;
  readonly save: string;
  readonly saving: string;
  readonly sectionGranted: string;
  readonly sectionAvailable: string;
}

export interface AdminRolesPanelSection {
  /** Matches `role.kind`. */
  readonly kind: string;
  readonly title: string;
  readonly hint?: string;
  /** Role keys shown first, in this order. */
  readonly order?: readonly string[];
  /** Catalog entries offered for roles of this kind (default: all). */
  readonly filterCatalog?: (item: AdminPermissionItem) => boolean;
}

export interface AdminRolesPanelProps {
  readonly api: AdminRolesPanelApi;
  readonly tt: AdminRolesPanelText;
  readonly sections: readonly AdminRolesPanelSection[];
  readonly permissionLabel: (item: AdminPermissionItem) => string;
  readonly roleLabel?: (role: AdminRoleItem) => string;
  /** Role selected on first load (falls back to the first role). */
  readonly defaultRoleKey?: string;
  readonly renderLoading?: () => ReactNode;
}

function sortByKeyOrder(
  roles: AdminRoleItem[],
  order: readonly string[] = []
): AdminRoleItem[] {
  const rank = new Map(order.map((key, index) => [key, index]));
  return [...roles].sort((a, b) => {
    const ai = rank.get(a.key) ?? 999;
    const bi = rank.get(b.key) ?? 999;
    if (ai !== bi) return ai - bi;
    return a.key.localeCompare(b.key);
  });
}

function sameKeys(a: readonly string[], b: readonly string[]): boolean {
  if (a.length !== b.length) return false;
  const set = new Set(b);
  return a.every((key) => set.has(key));
}

/**
 * Role -> permission_key assignment editor (roles grouped by `kind`).
 */
export function AdminRolesPanel({
  api,
  tt,
  sections,
  permissionLabel,
  roleLabel = (role) => role.name || role.key,
  defaultRoleKey,
  renderLoading
}: AdminRolesPanelProps) {
  const [data, setData] = useState<AdminRolesResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [draft, setDraft] = useState<Record<string, string[]>>({});
  const [selectedId, setSelectedId] = useState('');

  const applyResponse = useCallback(
    (next: AdminRolesResponse) => {
      setData(next);
      const nextDraft: Record<string, string[]> = {};
      for (const role of next.roles) {
        nextDraft[role.id] = [...role.permissionKeys];
      }
      setDraft(nextDraft);
      setSelectedId((prev) => {
        if (prev && next.roles.some((r) => r.id === prev)) return prev;
        const preferred =
          next.roles.find((r) => r.key === defaultRoleKey) ?? next.roles[0];
        return preferred?.id ?? '';
      });
    },
    [defaultRoleKey]
  );

  const load = useCallback(async () => {
    setSuccess(null);
    setError(null);
    setLoading(true);
    try {
      applyResponse(await api.list());
    } catch {
      setError(tt.loadFailed);
    } finally {
      setLoading(false);
    }
  }, [api, applyResponse, tt.loadFailed]);

  useStrictEffect(() => {
    void load();
  }, [load]);

  const selectedRole = useMemo(
    () => (data?.roles ?? []).find((r) => r.id === selectedId) ?? null,
    [data?.roles, selectedId]
  );

  const catalog = useMemo(() => {
    const all = [...(data?.catalog ?? [])].sort((a, b) =>
      a.permissionKey.localeCompare(b.permissionKey)
    );
    if (!selectedRole) return all;
    const filter = sections.find(
      (s) => s.kind === selectedRole.kind
    )?.filterCatalog;
    if (!filter) return all;
    const scoped = all.filter(filter);
    const selected = new Set(draft[selectedRole.id] ?? []);
    const extraGranted = all.filter(
      (item) =>
        selected.has(item.permissionKey) &&
        !scoped.some((s) => s.permissionKey === item.permissionKey)
    );
    return [...extraGranted, ...scoped];
  }, [data?.catalog, selectedRole, sections, draft]);

  const selectedKeys = useMemo(
    () => new Set(selectedRole ? (draft[selectedRole.id] ?? []) : []),
    [draft, selectedRole]
  );

  const grantedCatalog = catalog.filter((item) =>
    selectedKeys.has(item.permissionKey)
  );
  const availableCatalog = catalog.filter(
    (item) => !selectedKeys.has(item.permissionKey)
  );

  const togglePermissionKey = (roleId: string, permissionKey: string) => {
    setDraft((prev) => {
      const current = new Set(prev[roleId] ?? []);
      if (current.has(permissionKey)) {
        current.delete(permissionKey);
      } else {
        current.add(permissionKey);
      }
      return { ...prev, [roleId]: [...current].sort() };
    });
    setSuccess(null);
  };

  const isDirty = (role: AdminRoleItem) =>
    !sameKeys(draft[role.id] ?? [], role.permissionKeys);

  const handleSave = async (role: AdminRoleItem) => {
    setSavingId(role.id);
    setSuccess(null);
    setError(null);
    try {
      applyResponse(
        await api.replaceAssignments({
          roleId: role.id,
          permissionKeys: draft[role.id] ?? []
        })
      );
      setSuccess(tt.saveSuccess);
    } catch {
      setError(tt.saveFailed);
    } finally {
      setSavingId(null);
    }
  };

  const renderRoleNavItem = (role: AdminRoleItem) => {
    const active = selectedId === role.id;
    return (
      <button
        key={role.id}
        type="button"
        data-testid={`AdminRolesNav-${role.key}`}
        onClick={() => {
          setSelectedId(role.id);
          setSuccess(null);
        }}
        className={clsx(
          'flex w-full items-start justify-between gap-2 rounded-lg px-3 py-2.5 text-left transition-colors',
          active
            ? 'bg-elevated text-primary-text ring-1 ring-primary-border'
            : 'text-secondary-text hover:bg-elevated/60 hover:text-primary-text'
        )}
      >
        <span className="min-w-0">
          <span className="block text-sm font-medium text-primary-text">
            {roleLabel(role)}
            {isDirty(role) ? (
              <span className="ml-1 text-xs font-normal text-secondary-text">
                ·
              </span>
            ) : null}
          </span>
          <span className="mt-0.5 block font-mono text-xs text-secondary-text">
            {role.key}
          </span>
        </span>
        <span className="shrink-0 text-xs tabular-nums text-secondary-text">
          {tt.selectedCount} {draft[role.id]?.length ?? 0}
        </span>
      </button>
    );
  };

  const renderPermissionItems = (items: AdminPermissionItem[]) =>
    items.map((item) => (
      <li
        data-testid="renderPermissionItems"
        key={item.permissionKey}
        data-permission={item.permissionKey}
      >
        <label className="flex cursor-pointer items-start gap-2 rounded-md px-2 py-1.5 text-sm hover:bg-elevated/50">
          <input
            type="checkbox"
            className="mt-1"
            data-permission={item.permissionKey}
            checked={selectedKeys.has(item.permissionKey)}
            onChange={() =>
              togglePermissionKey(selectedRole!.id, item.permissionKey)
            }
          />
          <span className="min-w-0">
            <span className="block text-primary-text">
              {permissionLabel(item)}
            </span>
            <span className="block font-mono text-xs text-secondary-text">
              {item.permissionKey}
            </span>
          </span>
        </label>
      </li>
    ));

  const dirty = selectedRole ? isDirty(selectedRole) : false;
  const saving = selectedRole ? savingId === selectedRole.id : false;
  const selectedHint = selectedRole
    ? sections.find((s) => s.kind === selectedRole.kind)?.hint
    : undefined;

  return (
    <div data-testid="AdminRolesPanel" className="flex flex-col gap-4">
      {error ? (
        <p className="text-sm text-(--fe-color-error)">{error}</p>
      ) : null}
      {success ? (
        <p className="text-sm text-secondary-text">{success}</p>
      ) : null}

      {loading && !data ? (
        (renderLoading?.() ?? null)
      ) : (
        <div className="grid gap-4 lg:grid-cols-[minmax(220px,280px)_minmax(0,1fr)]">
          <aside className="rounded-lg border border-primary-border bg-surface p-3">
            {sections.map((section, index) => {
              const roles = sortByKeyOrder(
                (data?.roles ?? []).filter((r) => r.kind === section.kind),
                section.order
              );
              return (
                <section
                  data-testid="AdminRolesPanel" key={section.kind}
                  className={clsx(
                    'flex flex-col gap-1',
                    index > 0 &&
                      'mt-4 border-t border-primary-border/70 pt-4'
                  )}
                >
                  <h2 className="px-3 pb-1 text-xs font-semibold tracking-wide text-secondary-text uppercase">
                    {section.title}
                  </h2>
                  {roles.length === 0 ? (
                    <p className="px-3 py-2 text-sm text-secondary-text">
                      {tt.empty}
                    </p>
                  ) : (
                    roles.map(renderRoleNavItem)
                  )}
                </section>
              );
            })}
          </aside>

          <section className="rounded-lg border border-primary-border bg-surface">
            {!selectedRole ? (
              <p className="px-4 py-6 text-sm text-secondary-text">
                {tt.empty}
              </p>
            ) : (
              <>
                <header className="flex flex-wrap items-start justify-between gap-3 border-b border-primary-border px-4 py-3">
                  <div className="min-w-0">
                    <h2 className="text-base font-semibold text-primary-text">
                      {roleLabel(selectedRole)}
                    </h2>
                    <p className="mt-1 font-mono text-xs text-secondary-text">
                      {selectedRole.key}
                      {selectedRole.description
                        ? ` · ${selectedRole.description}`
                        : ''}
                    </p>
                    <p className="mt-1 text-xs text-secondary-text">
                      {tt.permissionLabel} · {tt.selectedCount}{' '}
                      {selectedKeys.size}
                    </p>
                    {selectedHint ? (
                      <p className="mt-2 text-xs leading-relaxed text-secondary-text">
                        {selectedHint}
                      </p>
                    ) : null}
                  </div>
                  <button
                    type="button"
                    disabled={!dirty || saving || loading}
                    onClick={() => void handleSave(selectedRole)}
                    className="rounded-lg border border-primary-border px-4 py-2 text-sm font-medium text-primary-text hover:bg-elevated disabled:opacity-50"
                  >
                    {saving ? tt.saving : tt.save}
                  </button>
                </header>

                <div className="px-4 py-3">
                  {catalog.length === 0 ? (
                    <p className="text-sm text-secondary-text">{tt.empty}</p>
                  ) : (
                    <div className="flex max-h-[min(70vh,640px)] flex-col gap-4 overflow-y-auto">
                      {grantedCatalog.length > 0 ? (
                        <section>
                          <h3 className="px-2 pb-1 text-xs font-semibold tracking-wide text-secondary-text uppercase">
                            {tt.sectionGranted}
                          </h3>
                          <ul className="flex flex-col gap-1">
                            {renderPermissionItems(grantedCatalog)}
                          </ul>
                        </section>
                      ) : null}
                      {availableCatalog.length > 0 ? (
                        <section>
                          <h3 className="px-2 pb-1 text-xs font-semibold tracking-wide text-secondary-text uppercase">
                            {tt.sectionAvailable}
                          </h3>
                          <ul className="flex flex-col gap-1">
                            {renderPermissionItems(availableCatalog)}
                          </ul>
                        </section>
                      ) : null}
                    </div>
                  )}
                </div>
              </>
            )}
          </section>
        </div>
      )}
    </div>
  );
}
