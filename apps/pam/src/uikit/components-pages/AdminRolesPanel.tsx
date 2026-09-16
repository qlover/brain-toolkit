'use client';

import { useStrictEffect } from '@qlover/next-kit/client';
import { clsx } from 'clsx';
import { useCallback, useMemo, useState } from 'react';
import { AdminRolesApi } from '@/impls/appApi/AdminRolesApi';
import { AdminPanelLoading } from '@/uikit/components-pages/AdminPanelLoading';
import { useIOC } from '@/uikit/hook/useIOC';
import { useWarnTranslations } from '@/uikit/hook/useWarnTranslations';
import {
  isPlatformPermissionKey,
  permissionI18nKey
} from '@shared/auth/permissionKeys';
import { PlatformRoleKey, RoleKind, TeamRoleKey } from '@shared/auth/roleKeys';
import type { AdminRolesI18nInterface } from '@config/i18n-mapping/admin18n';
import type {
  PamAdminPermissionItem,
  PamAdminRoleItem,
  PamAdminRolesResponse
} from '@schemas/PamRoleSchema';

const PLATFORM_ORDER = [
  PlatformRoleKey.User,
  PlatformRoleKey.Operator,
  PlatformRoleKey.Admin
] as const;

const TEAM_ORDER = [
  TeamRoleKey.Owner,
  TeamRoleKey.Admin,
  TeamRoleKey.Member
] as const;

function sortByKeyOrder(
  roles: PamAdminRoleItem[],
  order: readonly string[]
): PamAdminRoleItem[] {
  const rank = new Map(order.map((key, index) => [key, index]));
  return [...roles].sort((a, b) => {
    const ai = rank.get(a.key) ?? 999;
    const bi = rank.get(b.key) ?? 999;
    if (ai !== bi) return ai - bi;
    return a.key.localeCompare(b.key);
  });
}

function isPlatformCatalogItem(item: PamAdminPermissionItem): boolean {
  return isPlatformPermissionKey(item.permissionKey);
}

function catalogForRoleKind(
  catalog: PamAdminPermissionItem[],
  kind: string
): PamAdminPermissionItem[] {
  if (kind === RoleKind.Platform) {
    return catalog.filter(isPlatformCatalogItem);
  }
  return catalog.filter((item) => !isPlatformCatalogItem(item));
}

export function AdminRolesPanel({ tt }: { tt: AdminRolesI18nInterface }) {
  const adminRolesApi = useIOC(AdminRolesApi);
  const t = useWarnTranslations();
  const [data, setData] = useState<PamAdminRolesResponse | null>(null);
  const [draft, setDraft] = useState<Record<string, string[]>>({});
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [selectedId, setSelectedId] = useState<string>('');

  const roleLabel = useCallback(
    (role: PamAdminRoleItem) => {
      switch (role.key) {
        case PlatformRoleKey.User:
          return tt.systemUser;
        case PlatformRoleKey.Operator:
          return tt.systemOperator;
        case PlatformRoleKey.Admin:
          return tt.systemAdmin;
        case TeamRoleKey.Member:
          return tt.orgMember;
        case TeamRoleKey.Admin:
          return tt.orgAdmin;
        case TeamRoleKey.Owner:
          return tt.orgOwner;
        default:
          return role.name || role.key;
      }
    },
    [
      tt.orgAdmin,
      tt.orgMember,
      tt.orgOwner,
      tt.systemAdmin,
      tt.systemOperator,
      tt.systemUser
    ]
  );

  const permissionLabel = useCallback(
    (item: PamAdminPermissionItem) => {
      const key = permissionI18nKey(item.permissionKey);
      const translated = t(key);
      return translated === key ? item.permissionKey : translated;
    },
    [t]
  );

  const applyResponse = useCallback((next: PamAdminRolesResponse) => {
    setData(next);
    const nextDraft: Record<string, string[]> = {};
    for (const role of next.roles ?? []) {
      nextDraft[role.id] = [...role.permissionKeys];
    }
    setDraft(nextDraft);
    setSelectedId((prev) => {
      if (prev && next.roles?.some((r) => r.id === prev)) return prev;
      const admin =
        next.roles?.find((r) => r.key === PlatformRoleKey.Admin) ??
        next.roles?.[0];
      return admin?.id ?? '';
    });
  }, []);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    setSuccess(null);
    try {
      const next = await adminRolesApi.list();
      applyResponse(next);
    } catch {
      setError(tt.loadFailed);
    } finally {
      setLoading(false);
    }
  }, [adminRolesApi, applyResponse, tt.loadFailed]);

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
    const scoped = catalogForRoleKind(all, selectedRole.kind);
    const selected = new Set(draft[selectedRole.id] ?? []);
    const extraGranted = all.filter(
      (item) =>
        selected.has(item.permissionKey) &&
        !scoped.some((s) => s.permissionKey === item.permissionKey)
    );
    return [...extraGranted, ...scoped];
  }, [data?.catalog, selectedRole, draft]);

  const selectedKeys = useMemo(
    () => new Set(selectedRole ? (draft[selectedRole.id] ?? []) : []),
    [draft, selectedRole]
  );

  const grantedCatalog = useMemo(
    () => catalog.filter((item) => selectedKeys.has(item.permissionKey)),
    [catalog, selectedKeys]
  );

  const availableCatalog = useMemo(
    () => catalog.filter((item) => !selectedKeys.has(item.permissionKey)),
    [catalog, selectedKeys]
  );

  const platformRoles = useMemo(
    () =>
      sortByKeyOrder(
        (data?.roles ?? []).filter((r) => r.kind === RoleKind.Platform),
        PLATFORM_ORDER
      ),
    [data?.roles]
  );

  const teamRoles = useMemo(
    () =>
      sortByKeyOrder(
        (data?.roles ?? []).filter((r) => r.kind === RoleKind.Team),
        TEAM_ORDER
      ),
    [data?.roles]
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

  const isDirty = (role: PamAdminRoleItem) => {
    const current = draft[role.id] ?? [];
    const saved = role.permissionKeys;
    if (current.length !== saved.length) return true;
    const savedSet = new Set(saved);
    return current.some((key) => !savedSet.has(key));
  };

  const handleSave = async (role: PamAdminRoleItem) => {
    setSavingId(role.id);
    setError(null);
    setSuccess(null);
    try {
      const next = await adminRolesApi.replaceAssignments({
        roleId: role.id,
        permissionKeys: draft[role.id] ?? []
      });
      applyResponse(next);
      setSuccess(tt.saveSuccess);
    } catch {
      setError(tt.saveFailed);
    } finally {
      setSavingId(null);
    }
  };

  const renderRoleNavItem = (role: PamAdminRoleItem) => {
    const selected = draft[role.id]?.length ?? 0;
    const active = selectedId === role.id;
    const dirty = isDirty(role);

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
            {dirty ? (
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
          {tt.selectedCount} {selected}
        </span>
      </button>
    );
  };

  const renderPermissionItems = (items: PamAdminPermissionItem[]) =>
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

  return (
    <div data-testid="AdminRolesPanel" className="flex flex-col gap-4">
      {error ? (
        <p className="text-sm text-(--fe-color-error)">{error}</p>
      ) : null}
      {success ? (
        <p className="text-sm text-secondary-text">{success}</p>
      ) : null}

      {loading && !data ? (
        <AdminPanelLoading testId="AdminRolesLoading" />
      ) : (
        <div className="grid gap-4 lg:grid-cols-[minmax(220px,280px)_minmax(0,1fr)]">
          <aside className="rounded-lg border border-primary-border bg-surface p-3">
            <section className="flex flex-col gap-1">
              <h2 className="px-3 pb-1 text-xs font-semibold tracking-wide text-secondary-text uppercase">
                {tt.sectionSystem}
              </h2>
              {platformRoles.length === 0 ? (
                <p className="px-3 py-2 text-sm text-secondary-text">
                  {tt.empty}
                </p>
              ) : (
                platformRoles.map(renderRoleNavItem)
              )}
            </section>

            <section className="mt-4 flex flex-col gap-1 border-t border-primary-border/70 pt-4">
              <h2 className="px-3 pb-1 text-xs font-semibold tracking-wide text-secondary-text uppercase">
                {tt.sectionOrg}
              </h2>
              {teamRoles.length === 0 ? (
                <p className="px-3 py-2 text-sm text-secondary-text">
                  {tt.empty}
                </p>
              ) : (
                teamRoles.map(renderRoleNavItem)
              )}
            </section>
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
                    <p className="mt-2 text-xs leading-relaxed text-secondary-text">
                      {selectedRole.kind === RoleKind.Platform
                        ? tt.hintPlatform
                        : tt.hintTeam}
                    </p>
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
