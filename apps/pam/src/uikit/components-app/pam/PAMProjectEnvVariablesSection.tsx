'use client';

import {
  ArrowUpTrayIcon,
  DocumentArrowUpIcon,
  LockClosedIcon,
  MagnifyingGlassIcon,
  PlusIcon,
  TrashIcon
} from '@heroicons/react/24/outline';
import { clsx } from 'clsx';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { v4 as uuid } from 'uuid';
import { useIOC } from '@/uikit/hook/useIOC';
import { PermissionKey } from '@shared/auth/permissionKeys';
import { PAMEnvDotenvParseUtil } from '@shared/utils/PAMEnvDotenvParseUtil';
import {
  PAMEnvVariableDraftUtil,
  type PAMEnvImportEntry,
  type PAMEnvImportStatus
} from '@shared/utils/PAMEnvVariableDraftUtil';
import type { PAMEnvironmentsI18nInterface } from '@config/i18n-mapping/PAMEnvironmentsI18n';
import { I } from '@config/ioc-identifiter';
import type { PAMVariable } from '@schemas/PAMEnvironmentSchema';
import { pamFormMonoFieldClass } from '../../components/pam/PAMFormFieldStyles';

export type PAMProjectEnvVariablesSectionProps = {
  readonly draft: PAMVariable[];
  readonly setDraft: React.Dispatch<React.SetStateAction<PAMVariable[]>>;
  /** Ids of saved variables: sensitivity fixed, sensitive values hidden. */
  readonly lockedIds: ReadonlySet<string>;
  readonly canWrite: boolean;
  readonly tt: PAMEnvironmentsI18nInterface;
};

type ImportState =
  | { readonly mode: 'closed' }
  | { readonly mode: 'paste' }
  | { readonly mode: 'preview'; readonly entries: PAMEnvImportEntry[] };

const toolbarButtonClass =
  'flex cursor-pointer items-center gap-1 rounded-lg border border-primary-border px-2.5 py-1.5 text-xs text-secondary-text transition hover:bg-elevated sm:text-sm';

const statusStyles: Record<PAMEnvImportStatus, string> = {
  added: 'bg-brand/10 text-brand',
  changed: 'bg-(--fe-color-warning)/10 text-(--fe-color-warning)',
  unchanged: 'bg-elevated text-tertiary-text',
  skipped: 'bg-(--fe-color-error)/10 text-(--fe-color-error)'
};

function commentText(comments: string[] | undefined): string {
  return (comments ?? [])
    .map((line) => line.trimStart().replace(/^#\s?/, ''))
    .filter((line) => line.trim() !== '')
    .join('\n');
}

/**
 * Variables table for one environment: search, inline edit, sensitive
 * replace, and dotenv import with a diff preview. Edits stay in the draft
 * until the parent saves.
 */
export function PAMProjectEnvVariablesSection({
  draft,
  setDraft,
  lockedIds,
  canWrite,
  tt
}: PAMProjectEnvVariablesSectionProps) {
  const dialogHandler = useIOC(I.DialogHandler);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [search, setSearch] = useState('');
  const [replacingIds, setReplacingIds] = useState<ReadonlySet<string>>(
    () => new Set()
  );
  const [importState, setImportState] = useState<ImportState>({
    mode: 'closed'
  });
  const [importText, setImportText] = useState('');

  useEffect(() => {
    setReplacingIds(new Set());
  }, [lockedIds]);

  const statusLabels: Record<PAMEnvImportStatus, string> = {
    added: tt.importAdded,
    changed: tt.importChanged,
    unchanged: tt.importUnchanged,
    skipped: tt.envVarImportInvalid
  };

  const visible = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) {
      return draft;
    }
    return draft.filter((item) => item.key.toLowerCase().includes(query));
  }, [draft, search]);

  const isLocked = (item: PAMVariable): boolean =>
    Boolean(item.id && lockedIds.has(item.id));

  const patchVariable = (id: string, patch: Partial<PAMVariable>): void => {
    setDraft((prev) =>
      prev.map((item) => (item.id === id ? { ...item, ...patch } : item))
    );
  };

  const setReplacing = (id: string, on: boolean): void => {
    setReplacingIds((prev) => {
      const next = new Set(prev);
      if (on) {
        next.add(id);
      } else {
        next.delete(id);
      }
      return next;
    });
  };

  const onAdd = (): void => {
    setSearch('');
    setDraft((prev) => [
      ...prev,
      { id: uuid(), key: '', value: '', sensitive: false }
    ]);
  };

  const onRemove = (item: PAMVariable): void => {
    const remove = (): void =>
      setDraft((prev) => prev.filter((row) => row.id !== item.id));
    if (!isLocked(item) && item.key.trim() === '' && item.value === '') {
      remove();
      return;
    }
    dialogHandler.confirm({
      okType: 'danger',
      title: tt.delete,
      content: tt.envVarDeleteConfirm.replace('[key]', item.key || '—'),
      onOk: remove
    });
  };

  const openPreview = (text: string): void => {
    const parsed = PAMEnvDotenvParseUtil.parse(text);
    if (parsed.length === 0) {
      dialogHandler.warn(tt.envVarImportEmpty);
      return;
    }
    setImportState({
      mode: 'preview',
      entries: PAMEnvVariableDraftUtil.previewImport(draft, parsed, lockedIds)
    });
  };

  const onApplyImport = (entries: PAMEnvImportEntry[]): void => {
    setDraft((prev) =>
      PAMEnvVariableDraftUtil.applyImport(prev, entries, uuid)
    );
    const applied = entries.filter(
      (entry) => entry.status === 'added' || entry.status === 'changed'
    ).length;
    const skipped = entries.filter(
      (entry) => entry.status === 'skipped'
    ).length;
    setImportState({ mode: 'closed' });
    setImportText('');
    dialogHandler.success(
      tt.envVarImportResult
        .replaceAll('%imported%', String(applied))
        .replaceAll('%skipped%', String(skipped))
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
      setImportText(text);
      openPreview(text);
    };
    reader.readAsText(file);
  };

  return (
    <div data-testid="PAMProjectEnvVariablesSection" className="space-y-3">
      <div className="flex flex-wrap items-center gap-2">
        <label className="relative min-w-40 flex-1">
          <MagnifyingGlassIcon className="pointer-events-none absolute top-1/2 left-2.5 h-4 w-4 -translate-y-1/2 text-tertiary-text" />
          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder={tt.searchPlaceholder}
            className={clsx(
              pamFormMonoFieldClass,
              'w-full py-1.5 pl-8 text-xs sm:text-sm'
            )}
          />
        </label>
        {canWrite ? (
          <>
            <button
              type="button"
              data-permission={PermissionKey.pam_environments_variables_write}
              onClick={() =>
                setImportState((prev) =>
                  prev.mode === 'closed'
                    ? { mode: 'paste' }
                    : { mode: 'closed' }
                )
              }
              className={toolbarButtonClass}
            >
              <ArrowUpTrayIcon className="h-3.5 w-3.5" />
              {tt.envVarImport}
            </button>
            <button
              type="button"
              data-permission={PermissionKey.pam_environments_variables_write}
              onClick={() => fileInputRef.current?.click()}
              className={toolbarButtonClass}
            >
              <DocumentArrowUpIcon className="h-3.5 w-3.5" />
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
              data-permission={PermissionKey.pam_environments_variables_write}
              onClick={onAdd}
              className="flex cursor-pointer items-center gap-1 rounded-lg bg-brand/10 px-2.5 py-1.5 text-xs text-brand transition hover:bg-brand/15 sm:text-sm"
            >
              <PlusIcon className="h-3.5 w-3.5" />
              {tt.envVarAddLabel}
            </button>
          </>
        ) : null}
      </div>

      {!canWrite ? (
        <p className="rounded-lg bg-elevated/60 px-3 py-2 text-xs text-tertiary-text">
          {tt.readOnlyHint}
        </p>
      ) : null}

      {canWrite && importState.mode === 'paste' ? (
        <div className="space-y-2 rounded-lg border border-primary-border bg-elevated/60 p-2">
          <textarea
            value={importText}
            onChange={(event) => setImportText(event.target.value)}
            placeholder={tt.envVarImportPlaceholder}
            rows={5}
            className={clsx(
              pamFormMonoFieldClass,
              'w-full resize-y py-1.5 text-xs sm:text-sm'
            )}
          />
          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setImportState({ mode: 'closed' })}
              className="cursor-pointer rounded-lg px-2 py-1 text-xs text-secondary-text transition hover:bg-elevated sm:text-sm"
            >
              {tt.envVarImportCancel}
            </button>
            <button
              type="button"
              onClick={() => openPreview(importText)}
              className="cursor-pointer rounded-lg bg-brand/10 px-2 py-1 text-xs text-brand transition hover:bg-brand/15 sm:text-sm"
            >
              {tt.envVarImportConfirm}
            </button>
          </div>
        </div>
      ) : null}

      {canWrite && importState.mode === 'preview' ? (
        <div className="space-y-2 rounded-lg border border-brand/30 bg-brand/5 p-3">
          <div className="text-sm font-semibold text-primary-text">
            {tt.importPreviewTitle}
          </div>
          <div className="flex flex-wrap gap-2 text-xs">
            {(['added', 'changed', 'unchanged', 'skipped'] as const).map(
              (status) => {
                const count = importState.entries.filter(
                  (entry) => entry.status === status
                ).length;
                return count > 0 ? (
                  <span
                    key={status}
                    className={clsx(
                      'rounded px-1.5 py-0.5',
                      statusStyles[status]
                    )}
                  >
                    {statusLabels[status]} {count}
                  </span>
                ) : null;
              }
            )}
          </div>
          <ul className="max-h-60 divide-y divide-primary-border overflow-y-auto rounded-lg border border-primary-border bg-secondary">
            {importState.entries.map((entry) => (
              <li
                data-testid="PAMProjectEnvVariablesSection"
                key={entry.key}
                className="flex items-center justify-between gap-2 px-3 py-1.5 text-xs sm:text-sm"
              >
                <span className="min-w-0 truncate font-mono text-primary-text">
                  {entry.key}
                </span>
                <span
                  className={clsx(
                    'shrink-0 rounded px-1.5 py-0.5 text-[11px]',
                    statusStyles[entry.status]
                  )}
                >
                  {statusLabels[entry.status]}
                </span>
              </li>
            ))}
          </ul>
          <p className="text-[11px] text-tertiary-text sm:text-xs">
            {tt.importSensitiveNote}
          </p>
          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setImportState({ mode: 'paste' })}
              className="cursor-pointer rounded-lg px-2 py-1 text-xs text-secondary-text transition hover:bg-elevated sm:text-sm"
            >
              {tt.importBack}
            </button>
            <button
              type="button"
              onClick={() => onApplyImport(importState.entries)}
              className="cursor-pointer rounded-lg bg-brand px-3 py-1 text-xs font-medium text-on-brand transition hover:bg-brand-hover sm:text-sm"
            >
              {tt.importApply}
            </button>
          </div>
        </div>
      ) : null}

      {canWrite ? (
        <p className="text-[11px] leading-snug text-tertiary-text sm:text-xs">
          {tt.sensitiveHint}
        </p>
      ) : null}

      {draft.length === 0 ? (
        <p className="py-4 text-center text-sm text-tertiary-text">
          {tt.noEnvVar}
        </p>
      ) : visible.length === 0 ? (
        <p className="py-4 text-center text-sm text-tertiary-text">
          {tt.searchEmpty}
        </p>
      ) : (
        <div className="overflow-hidden rounded-lg border border-primary-border">
          <div className="hidden grid-cols-[minmax(0,1fr)_minmax(0,1.4fr)_5.5rem_2rem] gap-2 bg-elevated/60 px-3 py-2 text-xs font-semibold text-tertiary-text sm:grid">
            <span>{tt.colKey}</span>
            <span>{tt.colValue}</span>
            <span>{tt.colType}</span>
            <span />
          </div>
          <ul className="divide-y divide-primary-border">
            {visible.map((item) => {
              const id = item.id!;
              const locked = isLocked(item);
              const sensitive = item.sensitive === true;
              const hidden = locked && sensitive;
              const replacing = replacingIds.has(id);
              const comment = commentText(item.comments);
              const typeControl =
                locked || !canWrite ? (
                  <span
                    title={sensitive ? tt.envVarSensitiveLocked : undefined}
                    className={clsx(
                      'inline-flex items-center gap-1 rounded px-1.5 py-0.5 text-[11px] sm:text-xs',
                      sensitive
                        ? 'bg-brand/10 text-brand'
                        : 'bg-elevated text-tertiary-text'
                    )}
                  >
                    {sensitive ? <LockClosedIcon className="h-3 w-3" /> : null}
                    {sensitive ? tt.envVarSensitive : tt.typePlain}
                  </span>
                ) : (
                  <label
                    title={tt.sensitiveHint}
                    className="flex cursor-pointer items-center gap-1 text-[11px] text-secondary-text sm:text-xs"
                  >
                    <input
                      type="checkbox"
                      checked={sensitive}
                      onChange={(event) =>
                        patchVariable(id, { sensitive: event.target.checked })
                      }
                      className="h-3.5 w-3.5 accent-brand"
                    />
                    {tt.envVarSensitive}
                  </label>
                );
              const valueControl =
                hidden && !replacing ? (
                  <div className="flex min-w-0 items-center gap-2">
                    <span className="inline-flex min-w-0 items-center gap-1.5 rounded-lg bg-elevated px-2 py-1 text-xs text-secondary-text sm:px-2.5 sm:py-1.5 sm:text-sm">
                      <span className="tracking-widest">●●●●</span>
                      <span>{tt.sensitiveEncrypted}</span>
                    </span>
                    {canWrite ? (
                      <button
                        type="button"
                        onClick={() => setReplacing(id, true)}
                        className="cursor-pointer rounded px-1.5 py-1 text-xs text-brand transition hover:bg-brand/10"
                      >
                        {tt.sensitiveReplace}
                      </button>
                    ) : null}
                  </div>
                ) : (
                  <div className="flex min-w-0 items-center gap-2">
                    <input
                      type={sensitive ? 'password' : 'text'}
                      value={item.value}
                      readOnly={!canWrite}
                      disabled={!canWrite}
                      autoComplete="new-password"
                      placeholder={
                        hidden
                          ? tt.sensitiveReplacePlaceholder
                          : sensitive
                            ? tt.envVarSensitivePlaceholder
                            : tt.placehoderEnvValue
                      }
                      onChange={(event) =>
                        patchVariable(id, { value: event.target.value })
                      }
                      className={clsx(
                        pamFormMonoFieldClass,
                        'min-w-0 flex-1 py-1.5 text-xs sm:text-sm',
                        !canWrite && 'cursor-default opacity-90'
                      )}
                    />
                    {replacing ? (
                      <button
                        type="button"
                        onClick={() => {
                          patchVariable(id, { value: '' });
                          setReplacing(id, false);
                        }}
                        className="shrink-0 cursor-pointer rounded px-1.5 py-1 text-xs text-secondary-text transition hover:bg-elevated"
                      >
                        {tt.sensitiveReplaceCancel}
                      </button>
                    ) : null}
                  </div>
                );
              return (
                <li
                  data-testid="PAMProjectEnvVariablesSection"
                  key={id}
                  className="grid grid-cols-[minmax(0,1fr)_auto] gap-x-2 gap-y-1.5 px-2.5 py-2 sm:grid-cols-[minmax(0,1fr)_minmax(0,1.4fr)_5.5rem_2rem] sm:items-center sm:px-3"
                >
                  <div className="min-w-0">
                    <input
                      value={item.key}
                      readOnly={!canWrite}
                      disabled={!canWrite}
                      placeholder={tt.placeholderEnvVar}
                      onChange={(event) =>
                        patchVariable(id, { key: event.target.value.trim() })
                      }
                      className={clsx(
                        pamFormMonoFieldClass,
                        'w-full py-1.5 text-xs sm:text-sm',
                        !canWrite && 'cursor-default opacity-90'
                      )}
                    />
                    {comment ? (
                      <p
                        title={comment}
                        className="mt-0.5 truncate text-[11px] text-tertiary-text"
                      >
                        {comment}
                      </p>
                    ) : null}
                  </div>

                  <div className="flex items-start justify-end sm:order-last">
                    {canWrite ? (
                      <button
                        type="button"
                        title={tt.delete}
                        aria-label={tt.delete}
                        onClick={() => onRemove(item)}
                        className="cursor-pointer rounded p-1 text-(--fe-color-error) transition hover:bg-(--fe-color-error)/10"
                      >
                        <TrashIcon className="h-4 w-4" />
                      </button>
                    ) : null}
                  </div>

                  <div className="col-span-2 flex min-w-0 items-center gap-2 sm:contents">
                    <div className="min-w-0 flex-1">{valueControl}</div>
                    <div className="shrink-0">{typeControl}</div>
                  </div>
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </div>
  );
}
