'use client';

import { useStrictEffect } from '@qlover/next-kit/client';
import { useCallback, useMemo, useState } from 'react';
import { AdminRolesApi } from '@/impls/appApi/AdminRolesApi';
import { useIOC } from '@/uikit/hook/useIOC';
import { useWarnTranslations } from '@/uikit/hook/useWarnTranslations';
import { OrgRole, type OrgRoleType } from '@shared/auth/orgRole';
import { permissionI18nKey, permissionSlug } from '@shared/auth/permissionUid';
import { SystemRole, type SystemRoleType } from '@shared/auth/systemRole';
import type { AdminRolesI18nInterface } from '@config/i18n-mapping/admin18n';
import type {
  PamAdminPermissionItem,
  PamAdminRolesResponse,
  PamPermissionScope
} from '@schemas/PamRoleSchema';

const SYSTEM_ROLE_KEYS: SystemRoleType[] = [
  SystemRole.User,
  SystemRole.Operator,
  SystemRole.Admin
];

const ORG_ROLE_KEYS: OrgRoleType[] = [
  OrgRole.Member,
  OrgRole.Admin,
  OrgRole.Owner
];

function roleAssignments(
  data: PamAdminRolesResponse | null,
  scope: PamPermissionScope,
  roleKey: string
): string[] {
  if (!data) return [];
  const map = scope === 'system' ? data.system : data.org;
  return [...(map[roleKey] ?? [])];
}

export function AdminRolesPanel({ tt }: { tt: AdminRolesI18nInterface }) {
  const adminRolesApi = useIOC(AdminRolesApi);
  const t = useWarnTranslations();
  const [data, setData] = useState<PamAdminRolesResponse | null>(null);
  const [draft, setDraft] = useState<Record<string, string[]>>({});
  const [loading, setLoading] = useState(true);
  const [savingKey, setSavingKey] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [expanded, setExpanded] = useState<string>('system:admin');

  const draftKey = (scope: PamPermissionScope, roleKey: string) =>
    `${scope}:${roleKey}`;

  const permissionLabel = useCallback(
    (item: PamAdminPermissionItem) => {
      const slug = item.slug || permissionSlug(item.uid);
      const key = permissionI18nKey(slug);
      const translated = t(key);
      return translated === key ? slug : translated;
    },
    [t]
  );

  const systemLabel = useCallback(
    (role: SystemRoleType) => {
      if (role === SystemRole.Admin) return tt.systemAdmin;
      if (role === SystemRole.Operator) return tt.systemOperator;
      return tt.systemUser;
    },
    [tt.systemAdmin, tt.systemOperator, tt.systemUser]
  );

  const orgLabel = useCallback(
    (role: OrgRoleType) => {
      if (role === OrgRole.Owner) return tt.orgOwner;
      if (role === OrgRole.Admin) return tt.orgAdmin;
      return tt.orgMember;
    },
    [tt.orgAdmin, tt.orgMember, tt.orgOwner]
  );

  const applyResponse = useCallback((next: PamAdminRolesResponse) => {
    setData(next);
    const nextDraft: Record<string, string[]> = {};
    for (const role of SYSTEM_ROLE_KEYS) {
      nextDraft[draftKey('system', role)] = [...(next.system[role] ?? [])];
    }
    for (const role of ORG_ROLE_KEYS) {
      nextDraft[draftKey('org', role)] = [...(next.org[role] ?? [])];
    }
    setDraft(nextDraft);
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

  const catalog = useMemo(
    () => [...(data?.catalog ?? [])].sort((a, b) => a.uid.localeCompare(b.uid)),
    [data?.catalog]
  );

  const toggleUid = (
    scope: PamPermissionScope,
    roleKey: string,
    uid: string
  ) => {
    const key = draftKey(scope, roleKey);
    setDraft((prev) => {
      const current = new Set(prev[key] ?? []);
      if (current.has(uid)) {
        current.delete(uid);
      } else {
        current.add(uid);
      }
      return { ...prev, [key]: [...current].sort() };
    });
    setSuccess(null);
  };

  const isDirty = (scope: PamPermissionScope, roleKey: string) => {
    const key = draftKey(scope, roleKey);
    const current = draft[key] ?? [];
    const saved = roleAssignments(data, scope, roleKey);
    if (current.length !== saved.length) return true;
    const savedSet = new Set(saved);
    return current.some((uid) => !savedSet.has(uid));
  };

  const handleSave = async (scope: PamPermissionScope, roleKey: string) => {
    const key = draftKey(scope, roleKey);
    setSavingKey(key);
    setError(null);
    setSuccess(null);
    try {
      const next = await adminRolesApi.replaceAssignments({
        scope,
        roleKey,
        permissionUids: draft[key] ?? []
      });
      applyResponse(next);
      setSuccess(tt.saveSuccess);
    } catch {
      setError(tt.saveFailed);
    } finally {
      setSavingKey(null);
    }
  };

  const renderRoleCard = (
    scope: PamPermissionScope,
    roleKey: string,
    label: string
  ) => {
    const key = draftKey(scope, roleKey);
    const selected = new Set(draft[key] ?? []);
    const open = expanded === key;
    const dirty = isDirty(scope, roleKey);
    const saving = savingKey === key;

    return (
      <div
        key={key}
        data-testid={`AdminRolesCard-${key}`}
        className="rounded-lg border border-primary-border bg-surface"
      >
        <button
          type="button"
          className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left"
          onClick={() => setExpanded(open ? '' : key)}
        >
          <span className="font-medium text-primary-text">{label}</span>
          <span className="text-sm text-secondary-text">
            {tt.selectedCount} {selected.size}
          </span>
        </button>

        {open ? (
          <div className="border-t border-primary-border px-4 py-3">
            {catalog.length === 0 ? (
              <p className="text-sm text-secondary-text">{tt.empty}</p>
            ) : (
              <ul className="flex max-h-80 flex-col gap-2 overflow-y-auto">
                {catalog.map((item: PamAdminPermissionItem) => {
                  const slug = item.slug || permissionSlug(item.uid);
                  return (
                    <li data-testid="renderRoleCard" key={item.uid}>
                      <label className="flex cursor-pointer items-start gap-2 text-sm">
                        <input
                          type="checkbox"
                          className="mt-1"
                          checked={selected.has(item.uid)}
                          onChange={() => toggleUid(scope, roleKey, item.uid)}
                        />
                        <span className="min-w-0">
                          <span className="block text-primary-text">
                            {permissionLabel(item)}
                          </span>
                          <span className="block font-mono text-xs text-secondary-text">
                            {slug}
                          </span>
                        </span>
                      </label>
                    </li>
                  );
                })}
              </ul>
            )}

            <div className="mt-4 flex items-center gap-3">
              <button
                type="button"
                disabled={!dirty || saving || loading}
                onClick={() => void handleSave(scope, roleKey)}
                className="rounded-lg border border-primary-border px-4 py-2 text-sm font-medium text-primary-text hover:bg-elevated disabled:opacity-50"
              >
                {saving ? tt.saving : tt.save}
              </button>
            </div>
          </div>
        ) : null}
      </div>
    );
  };

  return (
    <div data-testid="AdminRolesPanel" className="flex flex-col gap-6">
      {error ? (
        <p className="text-sm text-(--fe-color-error)">{error}</p>
      ) : null}
      {success ? (
        <p className="text-sm text-secondary-text">{success}</p>
      ) : null}

      {loading && !data ? (
        <p className="text-sm text-secondary-text">{tt.description}</p>
      ) : (
        <>
          <section className="flex flex-col gap-3">
            <h2 className="text-base font-semibold text-primary-text">
              {tt.sectionSystem}
            </h2>
            {SYSTEM_ROLE_KEYS.map((role) =>
              renderRoleCard('system', role, systemLabel(role))
            )}
          </section>

          <section className="flex flex-col gap-3">
            <h2 className="text-base font-semibold text-primary-text">
              {tt.sectionOrg}
            </h2>
            {ORG_ROLE_KEYS.map((role) =>
              renderRoleCard('org', role, orgLabel(role))
            )}
          </section>
        </>
      )}
    </div>
  );
}
