'use client';

import {
  ArrowPathIcon,
  CheckIcon,
  PlusIcon,
  TrashIcon
} from '@heroicons/react/24/outline';
import { isAbortError } from '@qlover/fe-corekit/aborter';
import {
  Loading,
  useStrictEffect,
  usePageI18nMapping
} from '@qlover/next-kit/client';
import { clsx } from 'clsx';
import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState
} from 'react';
import { v4 as uuid } from 'uuid';
import { PAMAbortId, PAMApi } from '@/impls/appApi/PAMApi';
import { usePAMProjectDetail } from '@/uikit/components-app/pam/PAMProjectDetailShell';
import { useIOC } from '@/uikit/hook/useIOC';
import { PAMEnvDotenvParseUtil } from '@shared/utils/PAMEnvDotenvParseUtil';
import type { PAMEnvironmentsI18nInterface } from '@config/i18n-mapping/PAMEnvironmentsI18n';
import { I } from '@config/ioc-identifiter';
import type {
  PAMEnvWriteable,
  PAMVariable
} from '@schemas/PAMEnvironmentSchema';
import { PAMFormEnvImportPanel } from '../../components/pam/PAMFormEnvImportPanel';
import { PAMFormEnvironmentVarRow } from '../../components/pam/PAMFormEnvironmentVarRow';
import {
  pamFormFieldClass,
  pamFormLabelClass,
  pamFormMonoFieldClass
} from '../../components/pam/PAMFormFieldStyles';

export type PAMProjectEnvironmentsPanelProps = {
  readonly projectId: string;
};

function formatImportResult(
  template: string,
  imported: number,
  skipped: number
): string {
  return template
    .replaceAll('%imported%', String(imported))
    .replaceAll('%skipped%', String(skipped));
}

/**
 * Project environments tab — list, select, edit variables, import.
 *
 * Significance: Full environment management outside the create modal.
 * Core idea: Select one env, mutate variables, persist via PAMApi env methods.
 * Main function: CRUD env + variables with sensitive lock and dotenv import.
 * Main purpose: Dedicated environments UX for project detail pages.
 *
 * @example
 * <PAMProjectEnvironmentsPanel projectId={projectId} />
 */
export function PAMProjectEnvironmentsPanel({
  projectId
}: PAMProjectEnvironmentsPanelProps) {
  const tt = usePageI18nMapping<PAMEnvironmentsI18nInterface>();
  const pamApi = useIOC(PAMApi);
  const dialogHandler = useIOC(I.DialogHandler);
  const { canEdit } = usePAMProjectDetail();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [environments, setEnvironments] = useState<PAMEnvWriteable[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [selectedEnvId, setSelectedEnvId] = useState<string | null>(null);
  const [draftVariables, setDraftVariables] = useState<PAMVariable[]>([]);
  const [showImport, setShowImport] = useState(false);
  const [newEnvName, setNewEnvName] = useState('');
  const [newEnvUrl, setNewEnvUrl] = useState('');

  const lockedSensitiveIds = useMemo(() => {
    const ids = new Set<string>();
    for (const env of environments) {
      for (const variable of env.variables || []) {
        if (variable.id) {
          ids.add(variable.id);
        }
      }
    }
    return ids;
  }, [environments]);

  const selectedEnv = useMemo(
    () => environments.find((env) => env.id === selectedEnvId) ?? null,
    [environments, selectedEnvId]
  );

  const upsertEnvironment = useCallback((env: PAMEnvWriteable): void => {
    setEnvironments((prev) => {
      const index = prev.findIndex((item) => item.id === env.id);
      if (index === -1) {
        return [...prev, env];
      }
      const next = [...prev];
      next[index] = env;
      return next;
    });
    setSelectedEnvId(env.id);
  }, []);

  useStrictEffect(() => {
    setLoading(true);

    void pamApi
      .listEnvironments(projectId)
      .then((list) => {
        setEnvironments(list);
        setSelectedEnvId((prev) => {
          if (prev && list.some((env) => env.id === prev)) {
            return prev;
          }
          return list[0]?.id ?? null;
        });
        setLoading(false);
      })
      .catch((error) => {
        if (isAbortError(error)) {
          return;
        }
        // DialogErrorPlugin already toasts API failures.
        setEnvironments([]);
        setLoading(false);
      });

    return () => {
      pamApi.stop(PAMAbortId.listEnvironments(projectId));
    };
  }, [pamApi, projectId]);

  useEffect(() => {
    if (!selectedEnv) {
      setDraftVariables([]);
      return;
    }
    setDraftVariables(
      (selectedEnv.variables ?? []).map((item) => ({ ...item }))
    );
    setShowImport(false);
  }, [selectedEnv]);

  const persistVariables = async (
    environmentId: string,
    variables: PAMVariable[]
  ): Promise<void> => {
    if (!canEdit) {
      return;
    }
    setSaving(true);
    try {
      const updated = await pamApi.setEnvironmentVariables(
        projectId,
        environmentId,
        variables
      );
      upsertEnvironment(updated);
      dialogHandler.success(tt.envVarsSaved);
    } catch {
      // DialogErrorPlugin already toasts API failures.
    } finally {
      setSaving(false);
    }
  };

  const onAddVariable = (): void => {
    if (!canEdit) {
      return;
    }
    const hasIncomplete = draftVariables.some((item) => {
      if (item.key.trim() === '') {
        return true;
      }
      if (item.sensitive) {
        return false;
      }
      return item.value.trim() === '';
    });
    if (hasIncomplete) {
      dialogHandler.warn(tt.tipEnvVariables);
      return;
    }
    setDraftVariables((prev) => [
      ...prev,
      { id: uuid(), key: '', value: '', sensitive: false }
    ]);
  };

  const onUpdateVariable = (
    _envIndex: number,
    oldKey: string,
    newKey: string,
    value: string,
    sensitive?: boolean
  ): void => {
    setDraftVariables((prev) => {
      const index = prev.findIndex((item) => item.key === oldKey);
      if (index === -1) {
        return prev;
      }
      if (newKey.trim() === '' && oldKey.trim() !== '') {
        return prev.filter((item) => item.key !== oldKey);
      }
      const oldItem = prev[index];
      const nextSensitive =
        oldItem.id && lockedSensitiveIds.has(oldItem.id)
          ? oldItem.sensitive === true
          : (sensitive ?? oldItem.sensitive ?? false);
      const next = [...prev];
      next[index] = {
        ...oldItem,
        key: newKey.trim(),
        value,
        sensitive: nextSensitive
      };
      return next;
    });
  };

  const onRemoveVariable = (_envIndex: number, key: string): void => {
    dialogHandler.confirm({
      okType: 'danger',
      title: tt.delete,
      content: tt.envVarDeleteConfirm.replace('[key]', key || '—'),
      onOk: () => {
        setDraftVariables((prev) => prev.filter((item) => item.key !== key));
      }
    });
  };

  /**
   * Client-side parse into draft only. User must click Save to persist.
   * New keys default to sensitive (editable until first save); existing keys keep theirs.
   */
  const onImportText = (text: string): void => {
    if (!selectedEnvId) {
      return;
    }
    const parsed = PAMEnvDotenvParseUtil.parse(text);
    if (parsed.length === 0) {
      dialogHandler.warn(tt.envVarImportEmpty);
      return;
    }

    const byKey = new Map(draftVariables.map((item) => [item.key, item]));
    let imported = 0;
    let overwritten = 0;

    for (const item of parsed) {
      const existing = byKey.get(item.key);
      if (existing) {
        byKey.set(item.key, {
          ...existing,
          value: item.value,
          sensitive: existing.sensitive === true,
          ...(item.comments !== undefined && item.comments.length > 0
            ? { comments: [...item.comments] }
            : {})
        });
        overwritten += 1;
      } else {
        byKey.set(item.key, {
          id: uuid(),
          key: item.key,
          value: item.value,
          sensitive: true,
          ...(item.comments !== undefined && item.comments.length > 0
            ? { comments: [...item.comments] }
            : {})
        });
        imported += 1;
      }
    }

    const next = Array.from(byKey.values());
    setDraftVariables(next);
    setShowImport(false);
    dialogHandler.success(
      formatImportResult(tt.envVarImportResult, imported + overwritten, 0)
    );
  };

  const onImportFileChange = (
    event: React.ChangeEvent<HTMLInputElement>
  ): void => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) {
      return;
    }
    if (!PAMEnvDotenvParseUtil.isAllowedImportFileName(file.name)) {
      dialogHandler.warn(tt.envVarImportInvalid);
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      const text = typeof reader.result === 'string' ? reader.result : '';
      if (PAMEnvDotenvParseUtil.parse(text).length === 0) {
        dialogHandler.warn(tt.envVarImportInvalid);
        return;
      }
      onImportText(text);
    };
    reader.readAsText(file);
  };

  const onCreateEnvironment = async (): Promise<void> => {
    if (!canEdit) {
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
      setNewEnvName('');
      setNewEnvUrl('');
    } catch {
      // DialogErrorPlugin already toasts API failures.
    } finally {
      setSaving(false);
    }
  };

  const onDeleteEnvironment = (env: PAMEnvWriteable): void => {
    if (!canEdit) {
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
            const next = prev.filter((item) => item.id !== env.id);
            setSelectedEnvId((current) => {
              if (current !== env.id) {
                return current;
              }
              return next[0]?.id ?? null;
            });
            return next;
          });
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
        <Loading />
        <span className="text-sm text-tertiary-text">{tt.loadingText}</span>
      </div>
    );
  }

  return (
    <div
      data-testid="PAMProjectEnvironmentsPanel"
      className="grid grid-cols-1 gap-4 lg:grid-cols-[16rem_1fr]"
    >
      <aside className="space-y-3 rounded-2xl border border-primary-border bg-secondary p-3 sm:p-4">
        <div className="flex items-center justify-between gap-2">
          <h2 className="text-sm font-bold text-primary-text">{tt.mulitEnv}</h2>
          <span className="text-xs text-tertiary-text">
            ({environments.length})
          </span>
        </div>

        <ul className="space-y-1">
          {environments.map((env) => (
            <li
              data-testid="PAMProjectEnvironmentsPanel"
              key={env.id}
              className={clsx(
                'flex items-center gap-1 rounded-lg',
                selectedEnvId === env.id ? 'bg-brand/10' : 'hover:bg-elevated'
              )}
            >
              <button
                type="button"
                onClick={() => setSelectedEnvId(env.id)}
                className={clsx(
                  'min-w-0 flex-1 truncate rounded-lg px-2.5 py-2 text-left font-mono text-sm transition',
                  selectedEnvId === env.id
                    ? 'font-semibold text-brand'
                    : 'text-secondary-text hover:text-primary-text'
                )}
              >
                {env.name}
              </button>
              {canEdit ? (
                <button
                  type="button"
                  title={tt.envDelete}
                  aria-label={tt.envDelete}
                  onClick={() => onDeleteEnvironment(env)}
                  className="mr-1 shrink-0 rounded p-1 text-(--fe-color-error) transition hover:bg-(--fe-color-error)/10"
                >
                  <TrashIcon className="h-3.5 w-3.5" />
                </button>
              ) : null}
            </li>
          ))}
        </ul>

        {canEdit ? (
          <div className="space-y-2 border-t border-primary-border pt-3">
            <label className={pamFormLabelClass}>{tt.labelEnvName}</label>
            <input
              value={newEnvName}
              onChange={(event) => setNewEnvName(event.target.value)}
              placeholder={tt.placeholerEnvName}
              className={clsx(pamFormMonoFieldClass, 'py-1.5 text-sm')}
            />
            <label className={pamFormLabelClass}>{tt.labelEnvUrl}</label>
            <input
              value={newEnvUrl}
              onChange={(event) => setNewEnvUrl(event.target.value)}
              placeholder={tt.placeholderEnvUrl}
              className={clsx(pamFormFieldClass, 'py-1.5 text-sm')}
            />
            <button
              type="button"
              disabled={saving}
              onClick={() => void onCreateEnvironment()}
              className="flex w-full cursor-pointer items-center justify-center gap-1.5 rounded-lg bg-brand/10 px-3 py-2 text-xs font-medium text-brand transition hover:bg-brand/15 disabled:opacity-50 sm:text-sm"
            >
              <PlusIcon className="h-4 w-4" />
              {tt.envAdd}
            </button>
          </div>
        ) : null}
      </aside>

      <section className="rounded-2xl border border-primary-border bg-secondary p-3 sm:p-4">
        {!selectedEnv ? (
          <p className="py-8 text-center text-sm text-tertiary-text">
            {tt.envSelectHint}
          </p>
        ) : (
          <div className="space-y-4">
            <div className="flex flex-wrap items-start justify-between gap-2">
              <div>
                <h3 className="font-mono text-base font-bold text-primary-text">
                  {selectedEnv.name}
                </h3>
                <p className="mt-0.5 truncate text-xs text-tertiary-text">
                  {selectedEnv.url}
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                {canEdit ? (
                  <>
                    <button
                      type="button"
                      onClick={() => setShowImport((prev) => !prev)}
                      className="cursor-pointer rounded-lg border border-primary-border px-2.5 py-1.5 text-xs text-secondary-text transition hover:bg-elevated sm:text-sm"
                    >
                      {tt.envVarImport}
                    </button>
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="cursor-pointer rounded-lg border border-primary-border px-2.5 py-1.5 text-xs text-secondary-text transition hover:bg-elevated sm:text-sm"
                    >
                      {tt.envVarImportFile}
                    </button>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept=".env,.txt,text/plain"
                      className="hidden"
                      onChange={onImportFileChange}
                    />
                    <button
                      type="button"
                      onClick={onAddVariable}
                      className="flex cursor-pointer items-center gap-1 rounded-lg bg-brand/10 px-2.5 py-1.5 text-xs text-brand transition hover:bg-brand/15 sm:text-sm"
                    >
                      <PlusIcon className="h-3.5 w-3.5" />
                      {tt.envVarAddLabel}
                    </button>
                  </>
                ) : null}
              </div>
            </div>

            {canEdit && showImport ? (
              <PAMFormEnvImportPanel
                tt={tt}
                onImport={onImportText}
                onCancel={() => setShowImport(false)}
              />
            ) : null}

            <div className="space-y-2">
              <div className="text-xs font-bold tracking-wide text-tertiary-text uppercase">
                {tt.envVarTitle}
              </div>
              {draftVariables.length === 0 ? (
                <p className="text-sm text-tertiary-text">{tt.noEnvVar}</p>
              ) : (
                <div className="space-y-2.5">
                  {draftVariables.map((item) => (
                    <PAMFormEnvironmentVarRow
                      key={item.id ?? item.key}
                      envIndex={0}
                      item={item}
                      tt={tt}
                      readOnly={!canEdit}
                      sensitiveLocked={Boolean(
                        item.id && lockedSensitiveIds.has(item.id)
                      )}
                      onUpdateVariable={onUpdateVariable}
                      onRemoveVariable={onRemoveVariable}
                    />
                  ))}
                </div>
              )}
            </div>

            {canEdit ? (
              <div className="flex justify-end border-t border-primary-border pt-3">
                <button
                  type="button"
                  disabled={saving || !selectedEnvId}
                  onClick={() => {
                    if (selectedEnvId) {
                      void persistVariables(selectedEnvId, draftVariables);
                    }
                  }}
                  className={clsx(
                    'flex cursor-pointer items-center justify-center gap-2 rounded-[10px] bg-brand px-4 py-2.5 text-sm font-medium text-on-brand shadow-sm transition',
                    'hover:bg-brand-hover active:bg-brand-active disabled:cursor-not-allowed disabled:opacity-50'
                  )}
                >
                  {saving ? (
                    <>
                      <ArrowPathIcon className="h-4 w-4 animate-spin" />
                      {tt.formSaveing}
                    </>
                  ) : (
                    <>
                      <CheckIcon className="h-4 w-4" />
                      {tt.settingsSave}
                    </>
                  )}
                </button>
              </div>
            ) : null}
          </div>
        )}
      </section>
    </div>
  );
}
