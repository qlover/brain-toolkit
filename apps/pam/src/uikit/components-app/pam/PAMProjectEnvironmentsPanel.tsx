'use client';

import {
  ArrowPathIcon,
  CheckIcon,
  PlusIcon,
  ShieldCheckIcon
} from '@heroicons/react/24/outline';
import { useStrictEffect, usePageI18nMapping } from '@qlover/next-kit/client';
import { clsx } from 'clsx';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { PAMApi } from '@/impls/appApi/PAMApi';
import { PamLoadingIndicator } from '@/uikit/components/PamLoadingIndicator';
import { usePAMProjectDetail } from '@/uikit/components-app/pam/PAMProjectDetailShell';
import { PAMProjectEnvAccessLogs } from '@/uikit/components-app/pam/PAMProjectEnvAccessLogs';
import { PAMProjectEnvSettingsSection } from '@/uikit/components-app/pam/PAMProjectEnvSettingsSection';
import { PAMProjectEnvUsageCard } from '@/uikit/components-app/pam/PAMProjectEnvUsageCard';
import { PAMProjectEnvVariablesSection } from '@/uikit/components-app/pam/PAMProjectEnvVariablesSection';
import { useIOC } from '@/uikit/hook/useIOC';
import { PermissionKey } from '@shared/auth/permissionKeys';
import { PAMEnvVariableDraftUtil } from '@shared/utils/PAMEnvVariableDraftUtil';
import type { PAMEnvironmentsI18nInterface } from '@config/i18n-mapping/PAMEnvironmentsI18n';
import { I } from '@config/ioc-identifiter';
import type {
  PAMEnvWriteable,
  PAMVariable
} from '@schemas/PAMEnvironmentSchema';
import {
  pamFormFieldClass,
  pamFormLabelClass,
  pamFormMonoFieldClass
} from '../../components/pam/PAMFormFieldStyles';

export type PAMProjectEnvironmentsPanelProps = {
  readonly projectId: string;
};

type EnvSubTab = 'variables' | 'settings' | 'logs';

/**
 * Project environments tab — env tabs, usage commands, variables table,
 * settings, and access records.
 *
 * Significance: Full environment management outside the create modal.
 * Core idea: One selected env; variable edits stay in a draft until saved,
 * and switching env with unsaved edits asks first.
 * Main function: CRUD env + variables with sensitive lock and dotenv import.
 * Main purpose: Dedicated environments UX for project detail pages.
 *
 * @example
 * <PAMProjectEnvironmentsPanel projectId={projectId} />
 */
export function PAMProjectEnvironmentsPanel({
  projectId: _routeProjectId
}: PAMProjectEnvironmentsPanelProps) {
  const tt = usePageI18nMapping<PAMEnvironmentsI18nInterface>();
  const pamApi = useIOC(PAMApi);
  const dialogHandler = useIOC(I.DialogHandler);
  const {
    projectId,
    project,
    hasPermission,
    environments,
    ensureEnvironments,
    ensureEnvironmentDetail,
    environmentDetailLoadedIds,
    markEnvironmentDetailLoaded,
    setEnvironments
  } = usePAMProjectDetail();
  const canCreateEnv = hasPermission(PermissionKey.pam_environments_create);
  const canDeleteEnv = hasPermission(PermissionKey.pam_environments_delete);
  const canWriteVars = hasPermission(
    PermissionKey.pam_environments_variables_write
  );
  const canExportEnv = hasPermission(PermissionKey.pam_environments_export);

  const [saving, setSaving] = useState(false);
  const [selectedEnvId, setSelectedEnvId] = useState<string | null>(null);
  const [envDetailLoading, setEnvDetailLoading] = useState(false);
  const [subTab, setSubTab] = useState<EnvSubTab>('variables');
  const [draftVariables, setDraftVariables] = useState<PAMVariable[]>([]);
  /** Create mode replaces the detail panel (same idea as switching env tabs). */
  const [showCreate, setShowCreate] = useState(false);
  const [newEnvName, setNewEnvName] = useState('');
  const [newEnvUrl, setNewEnvUrl] = useState('');
  /** Keep access-logs mounted after first visit so tab switches don't refetch. */
  const [logsVisited, setLogsVisited] = useState(false);
  const detailRef = useRef<HTMLElement>(null);

  const envList = useMemo(() => environments ?? [], [environments]);

  const selectedEnv = useMemo(
    () => envList.find((env) => env.id === selectedEnvId) ?? null,
    [envList, selectedEnvId]
  );

  /** Saved variables; legacy rows without an id get a stable deterministic id. */
  const baselineVariables = useMemo(() => {
    const envId = selectedEnv?.id ?? '';
    return (selectedEnv?.variables ?? []).map((item) => ({
      ...item,
      id: item.id ?? `legacy:${envId}:${item.key}`
    }));
  }, [selectedEnv?.id, selectedEnv?.variables]);

  const lockedIds = useMemo(() => {
    const ids = new Set<string>();
    for (const item of baselineVariables) {
      if (item.id) {
        ids.add(item.id);
      }
    }
    return ids;
  }, [baselineVariables]);

  const changeCount = useMemo(
    () =>
      PAMEnvVariableDraftUtil.countChanges(baselineVariables, draftVariables),
    [baselineVariables, draftVariables]
  );
  const dirty = canWriteVars && changeCount > 0;

  useEffect(() => {
    setDraftVariables(baselineVariables.map((item) => ({ ...item })));
  }, [baselineVariables]);

  useEffect(() => {
    if (!dirty) {
      return;
    }
    const onBeforeUnload = (event: BeforeUnloadEvent): void => {
      event.preventDefault();
    };
    window.addEventListener('beforeunload', onBeforeUnload);
    return () => window.removeEventListener('beforeunload', onBeforeUnload);
  }, [dirty]);

  const upsertEnvironment = useCallback(
    (env: PAMEnvWriteable): void => {
      markEnvironmentDetailLoaded(env.id);
      setEnvironments((prev) => {
        const list = prev ?? [];
        const index = list.findIndex((item) => item.id === env.id);
        if (index === -1) {
          return [...list, env];
        }
        const next = [...list];
        next[index] = env;
        return next;
      });
      setSelectedEnvId(env.id);
    },
    [markEnvironmentDetailLoaded, setEnvironments]
  );

  useStrictEffect(() => {
    if (!projectId) {
      return;
    }
    void ensureEnvironments();
  }, [projectId, ensureEnvironments]);

  useEffect(() => {
    if (environments === null) {
      return;
    }
    setSelectedEnvId((prev) => {
      if (prev && environments.some((env) => env.id === prev)) {
        return prev;
      }
      return environments[0]?.id ?? null;
    });
  }, [environments]);

  useEffect(() => {
    if (!projectId || !selectedEnvId || showCreate) {
      return;
    }
    if (environmentDetailLoadedIds.has(selectedEnvId)) {
      setEnvDetailLoading(false);
      return;
    }

    let cancelled = false;
    setEnvDetailLoading(true);
    void ensureEnvironmentDetail(selectedEnvId).finally(() => {
      if (!cancelled) {
        setEnvDetailLoading(false);
      }
    });

    return () => {
      cancelled = true;
    };
  }, [
    projectId,
    selectedEnvId,
    showCreate,
    environmentDetailLoadedIds,
    ensureEnvironmentDetail
  ]);

  const loading = Boolean(projectId) && environments === null;
  const selectedEnvDetailReady =
    selectedEnvId != null && environmentDetailLoadedIds.has(selectedEnvId);

  const confirmDiscard = (onOk: () => void): void => {
    if (!dirty) {
      onOk();
      return;
    }
    dialogHandler.confirm({
      okType: 'danger',
      title: tt.discardChanges,
      content: tt.discardConfirm,
      onOk
    });
  };

  const onSelectEnv = (envId: string): void => {
    if (envId === selectedEnvId && !showCreate) {
      return;
    }
    confirmDiscard(() => {
      setShowCreate(false);
      setSelectedEnvId(envId);
      setSubTab('variables');
      setLogsVisited(false);
    });
  };

  const onOpenCreate = (): void => {
    if (showCreate) {
      setShowCreate(false);
      return;
    }
    confirmDiscard(() => {
      setShowCreate(true);
      setSubTab('variables');
    });
  };

  const onChangeSubTab = (tab: EnvSubTab): void => {
    setSubTab(tab);
    if (tab === 'logs') {
      setLogsVisited(true);
    }
    requestAnimationFrame(() => {
      detailRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  };

  const onDiscard = (): void => {
    confirmDiscard(() =>
      setDraftVariables(baselineVariables.map((item) => ({ ...item })))
    );
  };

  const onSave = async (): Promise<void> => {
    if (!canWriteVars || !selectedEnvId) {
      return;
    }
    const issue = PAMEnvVariableDraftUtil.findIssue(draftVariables, lockedIds);
    if (issue) {
      dialogHandler.warn(
        issue.kind === 'key_required'
          ? tt.validationKeyRequired
          : issue.kind === 'key_duplicate'
            ? tt.validationKeyDuplicate.replace('[key]', issue.key)
            : tt.validationSensitiveValue.replace('[key]', issue.key)
      );
      return;
    }
    const patch = PAMEnvVariableDraftUtil.buildPatch(
      baselineVariables,
      draftVariables
    );
    if (patch.upsert.length === 0 && patch.deleteIds.length === 0) {
      return;
    }
    setSaving(true);
    try {
      const updated = await pamApi.setEnvironmentVariables(
        projectId,
        selectedEnvId,
        patch
      );
      upsertEnvironment(updated);
      dialogHandler.success(tt.envVarsSaved);
    } catch {
      // DialogErrorPlugin already toasts API failures.
    } finally {
      setSaving(false);
    }
  };

  const onEnvSettingsUpdated = useCallback(
    (env: PAMEnvWriteable): void => {
      setEnvironments((prev) =>
        prev
          ? prev.map((item) =>
              item.id === env.id
                ? { ...item, is_protected: env.is_protected, url: env.url }
                : item
            )
          : prev
      );
    },
    [setEnvironments]
  );

  const onCreateEnvironment = async (): Promise<void> => {
    if (!canCreateEnv) {
      return;
    }
    const name = newEnvName.trim();
    const url = newEnvUrl.trim();
    if (!name || !url) {
      dialogHandler.warn(tt.envTip);
      return;
    }
    setSaving(true);
    try {
      const created = await pamApi.createEnvironment(projectId, {
        name,
        url,
        variables: []
      });
      upsertEnvironment(created);
      setSubTab('variables');
      setLogsVisited(false);
      setNewEnvName('');
      setNewEnvUrl('');
      setShowCreate(false);
    } catch {
      // DialogErrorPlugin already toasts API failures.
    } finally {
      setSaving(false);
    }
  };

  const onDeleteEnvironment = (env: PAMEnvWriteable): void => {
    if (!canDeleteEnv) {
      return;
    }
    dialogHandler.confirm({
      okType: 'danger',
      title: tt.envDelete,
      content: tt.envDeleteConfirm.replace('[name]', env.name),
      onOk: async () => {
        setSaving(true);
        try {
          await pamApi.deleteEnvironment(projectId, env.id);
          setEnvironments((prev) => {
            const list = prev ?? [];
            const next = list.filter((item) => item.id !== env.id);
            setSelectedEnvId((current) => {
              if (current !== env.id) {
                return current;
              }
              return next[0]?.id ?? null;
            });
            return next;
          });
          setSubTab('variables');
        } catch {
          // DialogErrorPlugin already toasts API failures.
        } finally {
          setSaving(false);
        }
      }
    });
  };

  if (loading) {
    return (
      <div
        data-testid="PAMProjectEnvironmentsPanel"
        className="flex min-h-40 flex-col items-center justify-center gap-2 rounded-2xl border border-primary-border bg-secondary py-10"
      >
        <PamLoadingIndicator />
        <span className="text-sm text-tertiary-text">{tt.loadingText}</span>
      </div>
    );
  }

  const subTabs: { id: EnvSubTab; label: string }[] = [
    { id: 'variables', label: tt.tabVariables },
    ...(canExportEnv || canDeleteEnv
      ? [{ id: 'settings' as const, label: tt.tabSettings }]
      : []),
    ...(canExportEnv ? [{ id: 'logs' as const, label: tt.tabAccessLogs }] : [])
  ];

  return (
    <div data-testid="PAMProjectEnvironmentsPanel" className="space-y-4">
      <div className="space-y-3 rounded-2xl border border-primary-border bg-secondary p-3 sm:p-4">
        <div className="flex flex-wrap items-center gap-2">
          <h2 className="mr-1 text-sm font-bold text-primary-text">
            {tt.mulitEnv}
            <span className="ml-1 text-xs font-normal text-tertiary-text">
              ({envList.length})
            </span>
          </h2>
          {envList.map((env) => (
            <button
              data-testid="PAMProjectEnvironmentsPanel"
              key={env.id}
              type="button"
              onClick={() => onSelectEnv(env.id)}
              className={clsx(
                'flex cursor-pointer items-center gap-1.5 rounded-lg border px-3 py-1.5 font-mono text-sm transition',
                !showCreate && selectedEnvId === env.id
                  ? 'border-brand/40 bg-brand/10 font-semibold text-brand'
                  : 'border-primary-border text-secondary-text hover:bg-elevated hover:text-primary-text'
              )}
            >
              {env.name}
              {env.is_protected ? (
                <span
                  title={tt.envProtected}
                  className="inline-flex items-center gap-0.5 rounded bg-brand/10 px-1 py-0.5 font-sans text-[10px] font-medium text-brand"
                >
                  <ShieldCheckIcon className="h-3 w-3" />
                  {tt.envProtectedBadge}
                </span>
              ) : null}
            </button>
          ))}
          {canCreateEnv ? (
            <button
              type="button"
              data-permission={PermissionKey.pam_environments_create}
              onClick={onOpenCreate}
              className={clsx(
                'flex cursor-pointer items-center gap-1 rounded-lg border px-3 py-1.5 text-sm transition',
                showCreate
                  ? 'border-brand/40 bg-brand/10 font-semibold text-brand'
                  : 'border-dashed border-primary-border text-secondary-text hover:bg-elevated hover:text-primary-text'
              )}
            >
              <PlusIcon className="h-4 w-4" />
              {tt.envAdd}
            </button>
          ) : null}
        </div>
      </div>

      <section
        ref={detailRef}
        className="rounded-2xl border border-primary-border bg-secondary p-3 sm:p-4"
      >
        {showCreate && canCreateEnv ? (
          <div className="space-y-4">
            <div>
              <h3 className="text-base font-bold text-primary-text">
                {tt.envAdd}
              </h3>
              <p className="mt-0.5 text-xs text-tertiary-text">{tt.envTip}</p>
            </div>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-[1fr_1.5fr]">
              <div className="space-y-1">
                <label className={pamFormLabelClass}>{tt.labelEnvName}</label>
                <input
                  value={newEnvName}
                  onChange={(event) => setNewEnvName(event.target.value)}
                  placeholder={tt.placeholerEnvName}
                  autoFocus
                  className={clsx(pamFormMonoFieldClass, 'py-1.5 text-sm')}
                />
              </div>
              <div className="space-y-1">
                <label className={pamFormLabelClass}>{tt.labelEnvUrl}</label>
                <input
                  value={newEnvUrl}
                  onChange={(event) => setNewEnvUrl(event.target.value)}
                  placeholder={tt.placeholderEnvUrl}
                  className={clsx(pamFormFieldClass, 'py-1.5 text-sm')}
                />
              </div>
            </div>
            <div className="flex justify-end gap-2 border-t border-primary-border pt-3">
              <button
                type="button"
                onClick={() => setShowCreate(false)}
                className="cursor-pointer rounded-lg px-3 py-2 text-sm text-secondary-text transition hover:bg-elevated"
              >
                {tt.envAddCancel}
              </button>
              <button
                type="button"
                data-permission={PermissionKey.pam_environments_create}
                disabled={saving}
                onClick={() => void onCreateEnvironment()}
                className="cursor-pointer rounded-lg bg-brand px-3 py-2 text-sm font-medium text-on-brand transition hover:bg-brand-hover disabled:opacity-50"
              >
                {tt.envAdd}
              </button>
            </div>
          </div>
        ) : !selectedEnv ? (
          <p className="py-8 text-center text-sm text-tertiary-text">
            {tt.envSelectHint}
          </p>
        ) : (
          <div className="space-y-3 sm:space-y-4">
            <div className="min-w-0">
              <h3 className="font-mono text-base font-bold text-primary-text">
                {selectedEnv.name}
              </h3>
              {selectedEnv.url ? (
                <a
                  href={selectedEnv.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  title={selectedEnv.url}
                  className="mt-0.5 block truncate text-xs text-tertiary-text no-underline transition hover:text-secondary-text hover:underline"
                >
                  {selectedEnv.url}
                </a>
              ) : null}
            </div>

            {project?.slug ? (
              <PAMProjectEnvUsageCard
                projectSlug={project.slug}
                envName={selectedEnv.name}
                canExport={canExportEnv}
                tt={tt}
              />
            ) : null}

            {subTabs.length > 1 ? (
              <div className="flex gap-1 border-b border-primary-border">
                {subTabs.map((tab) => (
                  <button
                    data-testid="PAMProjectEnvironmentsPanel"
                    key={tab.id}
                    type="button"
                    onClick={() => onChangeSubTab(tab.id)}
                    className={clsx(
                      '-mb-px cursor-pointer border-b-2 px-3 py-2 text-sm transition',
                      subTab === tab.id
                        ? 'border-brand font-medium text-brand'
                        : 'border-transparent text-secondary-text hover:text-primary-text'
                    )}
                  >
                    {tab.label}
                    {tab.id === 'variables' && dirty ? (
                      <span className="ml-1 inline-block h-1.5 w-1.5 rounded-full bg-(--fe-color-warning) align-middle" />
                    ) : null}
                  </button>
                ))}
              </div>
            ) : null}

            {subTab === 'variables' ? (
              envDetailLoading || !selectedEnvDetailReady ? (
                <div className="flex min-h-32 flex-col items-center justify-center gap-2 py-8">
                  <PamLoadingIndicator />
                  <span className="text-sm text-tertiary-text">
                    {tt.loadingText}
                  </span>
                </div>
              ) : (
                <PAMProjectEnvVariablesSection
                  key={selectedEnv.id}
                  draft={draftVariables}
                  setDraft={setDraftVariables}
                  lockedIds={lockedIds}
                  canWrite={canWriteVars}
                  tt={tt}
                />
              )
            ) : null}

            {subTab === 'settings' ? (
              <PAMProjectEnvSettingsSection
                projectId={projectId}
                environment={selectedEnv}
                canEditSettings={canExportEnv}
                canDelete={canDeleteEnv}
                tt={tt}
                onUpdated={onEnvSettingsUpdated}
                onDelete={onDeleteEnvironment}
              />
            ) : null}

            {logsVisited && canExportEnv ? (
              <div className={subTab === 'logs' ? undefined : 'hidden'}>
                <PAMProjectEnvAccessLogs
                  projectId={projectId}
                  envId={selectedEnv.id}
                  tt={tt}
                />
              </div>
            ) : null}
          </div>
        )}
      </section>

      {dirty && selectedEnvDetailReady ? (
        <div className="sticky bottom-3 z-10 flex flex-wrap items-center justify-between gap-2 rounded-xl border border-(--fe-color-warning)/40 bg-elevated px-4 py-2.5 shadow-lg">
          <span className="text-sm text-primary-text">
            {tt.unsavedChanges.replace('%count%', String(changeCount))}
          </span>
          <div className="flex gap-2">
            <button
              type="button"
              disabled={saving}
              onClick={onDiscard}
              className="cursor-pointer rounded-lg px-3 py-1.5 text-sm text-secondary-text transition hover:bg-secondary disabled:opacity-50"
            >
              {tt.discardChanges}
            </button>
            <button
              type="button"
              data-permission={PermissionKey.pam_environments_variables_write}
              disabled={saving}
              onClick={() => void onSave()}
              className="flex cursor-pointer items-center gap-1.5 rounded-lg bg-brand px-4 py-1.5 text-sm font-medium text-on-brand transition hover:bg-brand-hover disabled:cursor-not-allowed disabled:opacity-50"
            >
              {saving ? (
                <ArrowPathIcon className="h-4 w-4 animate-spin" />
              ) : (
                <CheckIcon className="h-4 w-4" />
              )}
              {saving ? tt.formSaveing : tt.settingsSave}
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
