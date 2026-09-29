'use client';

import {
  CorsRulesEditor,
  SettingsCard,
  SiteSettingRow
} from '@brain-toolkit/next-app-kit/client';
import {
  corsValueSchema,
  isCorsRuleArray,
  type CorsRule
} from '@brain-toolkit/next-app-kit/shared';
import {
  runAsyncStore,
  useAsyncStore,
  usePendingAsyncStore,
  type AsyncState
} from '@brain-toolkit/react-kit';
import { useStrictEffect } from '@qlover/next-kit/client';
import { useCallback, useMemo, useState } from 'react';
import {
  SiteSettingsApi,
  type AdminSiteSettingRow
} from '@/impls/appApi/SiteSettingsApi';
import { useIOC } from '@/uikit/hook/useIOC';
import type { AdminSettingsI18nInterface } from '@config/i18n-mapping/admin18n';
import { I } from '@config/ioc-identifiter';
import { SITE_SETTING_KEYS } from '@config/siteSettings';

const CORS_KEY = SITE_SETTING_KEYS.API_CORS_RULES;

export function AdminSiteSettingsPanel({
  tt
}: {
  tt: AdminSettingsI18nInterface;
}) {
  const siteSettingsApi = useIOC(SiteSettingsApi);
  const dialogHandler = useIOC(I.DialogHandler);
  const [draftCors, setDraftCors] = useState<CorsRule[] | undefined>();

  const [list, listStore] =
    usePendingAsyncStore<AsyncState<AdminSiteSettingRow[]>>();
  const [save, saveStore] = useAsyncStore<AsyncState<AdminSiteSettingRow[]>>();

  const corsEntry = useMemo(
    () => (list.result ?? []).find((entry) => entry.key === CORS_KEY),
    [list.result]
  );
  const corsRules = useMemo<CorsRule[]>(() => {
    if (draftCors !== undefined) {
      return draftCors;
    }
    return isCorsRuleArray(corsEntry?.value) ? corsEntry.value : [];
  }, [corsEntry, draftCors]);

  const error =
    list.status === 'failed'
      ? tt.loadFailed
      : save.status === 'failed'
        ? tt.saveFailed
        : null;

  const load = useCallback(async () => {
    const rows = await runAsyncStore(listStore, siteSettingsApi.list(), {
      keep: true
    });
    if (listStore.isSuccess() && rows !== undefined) {
      setDraftCors(undefined);
    }
  }, [listStore, siteSettingsApi]);

  useStrictEffect(() => {
    void load();
  }, [load]);

  const handleSave = useCallback(async () => {
    const parsed = corsValueSchema.safeParse(corsRules);
    if (!parsed.success) {
      const isDuplicate = parsed.error.issues.some((issue) =>
        issue.message.toLowerCase().includes('duplicate')
      );
      dialogHandler.error(
        isDuplicate ? tt.corsDuplicate : tt.corsOriginInvalid
      );
      return;
    }
    const rows = await runAsyncStore(
      saveStore,
      siteSettingsApi.patch({ [CORS_KEY]: parsed.data })
    );
    if (!saveStore.isSuccess() || rows === undefined) {
      return;
    }
    listStore.success(rows);
    setDraftCors(undefined);
    dialogHandler.success(tt.saveSuccess);
  }, [
    corsRules,
    dialogHandler,
    listStore,
    saveStore,
    siteSettingsApi,
    tt.corsDuplicate,
    tt.corsOriginInvalid,
    tt.saveSuccess
  ]);

  if (list.loading && !list.result) {
    return (
      <div
        data-testid="AdminSiteSettingsLoading"
        className="py-10 text-center text-sm text-secondary-text"
      >
        …
      </div>
    );
  }

  return (
    <div
      data-testid="AdminSiteSettingsPanel"
      className="flex w-full flex-col gap-4 sm:gap-5"
    >
      {error ? (
        <div
          role="alert"
          className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600 dark:border-red-900/50 dark:bg-red-950/40 dark:text-red-300"
        >
          {error}
        </div>
      ) : null}

      <SettingsCard
        title={tt.sectionApi}
        description={tt.sectionApiDesc}
        saveLabel={tt.save}
        savingLabel={tt.saving}
        saving={save.loading}
        onSave={() => void handleSave()}
        footerActions={
          <button
            type="button"
            onClick={() =>
              setDraftCors([
                ...corsRules,
                { origin: '', path: '', methods: [] }
              ])
            }
            className="inline-flex cursor-pointer items-center justify-center rounded-lg border border-dashed border-primary-border px-3.5 py-2.5 text-sm font-medium text-primary-text transition hover:bg-elevated"
          >
            {tt.corsAdd}
          </button>
        }
      >
        <SiteSettingRow layout="block" entry={corsEntry} labels={tt}>
          <CorsRulesEditor
            rules={corsRules}
            onChange={setDraftCors}
            labels={{
              origin: tt.corsOrigin,
              path: tt.corsPath,
              methods: tt.corsMethods,
              remove: tt.corsRemove,
              empty: tt.corsEmpty,
              originInvalid: tt.corsOriginInvalid,
              duplicate: tt.corsDuplicate
            }}
          />
        </SiteSettingRow>
      </SettingsCard>
    </div>
  );
}
