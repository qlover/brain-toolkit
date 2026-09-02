'use client';

import { useStrictEffect } from '@qlover/next-kit/client';
import { clsx } from 'clsx';
import { useCallback, useMemo, useState, type ReactNode } from 'react';
import { SiteSettingsApi } from '@/impls/appApi/SiteSettingsApi';
import { invalidatePublicConfigCache } from '@/impls/fetchPublicConfig';
import { pamFormFieldClass } from '@/uikit/components/pam/PAMFormFieldStyles';
import { PAMSettingsCard } from '@/uikit/components/pam/PAMSettingsCard';
import { useIOC } from '@/uikit/hook/useIOC';
import type { AdminSettingsI18nInterface } from '@config/i18n-mapping/admin18n';
import { I } from '@config/ioc-identifiter';
import {
  PAM_SITE_SETTING_KEYS,
  PAM_SITE_SETTING_SECRET_UNCHANGED,
  type PamSiteSettingKey
} from '@config/pamSiteSettings';
import type { PamAdminSiteSettingEntry } from '@schemas/PamSiteSettingsSchema';

type DraftState = Partial<
  Record<PamSiteSettingKey, string | boolean | string[]>
>;

function entryMap(
  entries: PamAdminSiteSettingEntry[]
): Map<PamSiteSettingKey, PamAdminSiteSettingEntry> {
  return new Map(entries.map((entry) => [entry.key, entry]));
}

function getDraftValue(
  draft: DraftState,
  entry: PamAdminSiteSettingEntry | undefined,
  key: PamSiteSettingKey
): string | boolean | string[] {
  if (draft[key] !== undefined) {
    return draft[key] as string | boolean | string[];
  }
  return entry?.value ?? '';
}

function formatDraftValue(
  value: string | boolean | string[] | undefined
): string {
  if (Array.isArray(value)) {
    return value.join(',');
  }
  if (typeof value === 'boolean') {
    return value ? 'true' : 'false';
  }
  return value ?? '';
}

function sourceLabel(
  source: PamAdminSiteSettingEntry['source'] | undefined,
  tt: AdminSettingsI18nInterface
): string {
  if (source === 'db') {
    return tt.sourceDb;
  }
  return tt.sourceDefault;
}

function SourceBadge({
  source,
  tt
}: {
  source: PamAdminSiteSettingEntry['source'] | undefined;
  tt: AdminSettingsI18nInterface;
}) {
  if (!source) {
    return null;
  }

  return (
    <span
      data-testid="SourceBadge"
      className={clsx(
        'rounded-full px-2 py-0.5 text-[11px] font-medium',
        source === 'db'
          ? 'bg-brand/10 text-brand'
          : 'bg-elevated text-tertiary-text'
      )}
    >
      {sourceLabel(source, tt)}
    </span>
  );
}

function ToggleSwitch({
  checked,
  onChange
}: {
  checked: boolean;
  onChange: (checked: boolean) => void;
}) {
  return (
    <button
      data-testid="ToggleSwitch"
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className={clsx(
        'relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200',
        checked ? 'bg-brand' : 'bg-elevated'
      )}
    >
      <span
        className={clsx(
          'pointer-events-none inline-block h-5 w-5 rounded-full bg-white shadow-sm transition-transform duration-200',
          checked ? 'translate-x-5' : 'translate-x-0'
        )}
      />
    </button>
  );
}

function SettingRow({
  entry,
  tt,
  children,
  controlClassName,
  layout = 'stacked'
}: {
  entry: PamAdminSiteSettingEntry | undefined;
  tt: AdminSettingsI18nInterface;
  children: ReactNode;
  controlClassName?: string;
  layout?: 'stacked' | 'inline';
}) {
  if (!entry) {
    return null;
  }

  const isInline = layout === 'inline';

  return (
    <div
      data-testid="SettingRow"
      className={clsx(
        'gap-3 border-b border-primary-border/50 py-4 last:border-b-0',
        isInline
          ? 'flex items-start justify-between'
          : 'flex flex-col md:flex-row md:items-start md:justify-between md:gap-8'
      )}
    >
      <div className={clsx('min-w-0', isInline ? 'flex-1 pr-3' : 'flex-1')}>
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-sm font-semibold text-primary-text">
            {entry.label}
          </span>
          <SourceBadge source={entry.source} tt={tt} />
        </div>
        <p className="mt-1 text-sm leading-relaxed text-secondary-text">
          {entry.description}
        </p>
      </div>
      <div
        className={clsx(
          'shrink-0',
          isInline ? 'pt-0.5' : 'w-full md:w-72 lg:w-80',
          controlClassName
        )}
      >
        {children}
      </div>
    </div>
  );
}

export function AdminSiteSettingsPanel({
  tt
}: {
  tt: AdminSettingsI18nInterface;
}) {
  const siteSettingsApi = useIOC(SiteSettingsApi);
  const dialogHandler = useIOC(I.DialogHandler);
  const [entries, setEntries] = useState<PamAdminSiteSettingEntry[]>([]);
  const [draft, setDraft] = useState<DraftState>({});
  const [loading, setLoading] = useState(true);
  const [savingSection, setSavingSection] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const byKey = useMemo(() => entryMap(entries), [entries]);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const rows = await siteSettingsApi.list();
      setEntries(rows);
      setDraft({});
    } catch {
      setError(tt.loadFailed);
    } finally {
      setLoading(false);
    }
  }, [siteSettingsApi, tt.loadFailed]);

  useStrictEffect(() => {
    void load();
  }, [load]);

  const patchSection = useCallback(
    async (section: string, keys: PamSiteSettingKey[]) => {
      setSavingSection(section);
      setError(null);
      const payload: DraftState = {};
      for (const key of keys) {
        const value = getDraftValue(draft, byKey.get(key), key);
        if (byKey.get(key)?.isSensitive) {
          if (typeof value === 'string' && value.trim()) {
            payload[key] = value.trim();
          }
          continue;
        }
        payload[key] = value;
      }
      try {
        const rows = await siteSettingsApi.patch(payload);
        setEntries(rows);
        setDraft((current) => {
          const next = { ...current };
          for (const key of keys) {
            delete next[key];
          }
          return next;
        });
        if (section === 'auth') {
          invalidatePublicConfigCache();
        }
        dialogHandler.success(tt.saveSuccess);
      } catch {
        setError(tt.saveFailed);
      } finally {
        setSavingSection(null);
      }
    },
    [
      byKey,
      dialogHandler,
      draft,
      siteSettingsApi,
      tt.saveFailed,
      tt.saveSuccess
    ]
  );

  const setDraftValue = useCallback(
    (key: PamSiteSettingKey, value: string | boolean | string[]) => {
      setDraft((current) => ({ ...current, [key]: value }));
    },
    []
  );

  if (loading) {
    return (
      <p
        className="text-sm text-secondary-text"
        data-testid="AdminSiteSettingsLoading"
      >
        {tt.loading}
      </p>
    );
  }

  const cliKey = PAM_SITE_SETTING_KEYS.AUTH_CLI_TOKEN_EXPIRES_IN;

  const authToggleKeys = [
    PAM_SITE_SETTING_KEYS.AUTH_PHONE_LOGIN_ENABLED,
    PAM_SITE_SETTING_KEYS.AUTH_GOOGLE_OAUTH_ENABLED,
    PAM_SITE_SETTING_KEYS.AUTH_BRAIN_PKCE_ENABLED,
    PAM_SITE_SETTING_KEYS.AUTH_BRAIN_SUPABASE_ENABLED
  ] as const;

  const brainKeys = [
    PAM_SITE_SETTING_KEYS.BRAIN_OAUTH_SITE_URL,
    PAM_SITE_SETTING_KEYS.BRAIN_OAUTH_CLIENT_ID,
    PAM_SITE_SETTING_KEYS.BRAIN_OAUTH_CLIENT_SECRET,
    PAM_SITE_SETTING_KEYS.BRAIN_OAUTH_REDIRECT_URI,
    PAM_SITE_SETTING_KEYS.BRAIN_OAUTH_SCOPES,
    PAM_SITE_SETTING_KEYS.BRAIN_OAUTH_LOCALE
  ] as const;

  const openaiKeys = [
    PAM_SITE_SETTING_KEYS.OPENAI_BASE_URL,
    PAM_SITE_SETTING_KEYS.OPENAI_API_KEY
  ] as const;

  const apiKeys = [
    PAM_SITE_SETTING_KEYS.API_CORS_ORIGINS,
    PAM_SITE_SETTING_KEYS.API_CORS_METHODS
  ] as const;

  const storageKeys = [
    PAM_SITE_SETTING_KEYS.STORAGE_PREVIEW_BUCKET,
    PAM_SITE_SETTING_KEYS.STORAGE_SCREENSHOT_URL_TEMPLATE
  ] as const;

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

      <PAMSettingsCard
        title={tt.sectionAuth}
        description={tt.sectionAuthDesc}
        saveLabel={tt.save}
        savingLabel={tt.saving}
        saving={savingSection === 'auth'}
        onSave={() => patchSection('auth', [...authToggleKeys, cliKey])}
      >
        <div>
          {authToggleKeys.map((key) => (
            <SettingRow
              key={key}
              entry={byKey.get(key)}
              tt={tt}
              layout="inline"
            >
              <ToggleSwitch
                checked={Boolean(
                  getDraftValue(draft, byKey.get(key), key) === true
                )}
                onChange={(checked) => setDraftValue(key, checked)}
              />
            </SettingRow>
          ))}
          <SettingRow entry={byKey.get(cliKey)} tt={tt}>
            <input
              type="text"
              value={String(getDraftValue(draft, byKey.get(cliKey), cliKey))}
              onChange={(event) => setDraftValue(cliKey, event.target.value)}
              placeholder="30d"
              className={pamFormFieldClass}
            />
          </SettingRow>
        </div>
      </PAMSettingsCard>

      <PAMSettingsCard
        title={tt.sectionBrainOAuth}
        description={tt.sectionBrainOAuthDesc}
        saveLabel={tt.save}
        savingLabel={tt.saving}
        saving={savingSection === 'brain'}
        onSave={() => patchSection('brain', [...brainKeys])}
      >
        <div>
          {brainKeys.map((key) => {
            const entry = byKey.get(key);
            const value = String(getDraftValue(draft, entry, key));
            const isSensitive = entry?.isSensitive;
            return (
              <SettingRow key={key} entry={entry} tt={tt}>
                <input
                  type={isSensitive ? 'password' : 'text'}
                  value={
                    isSensitive && value === PAM_SITE_SETTING_SECRET_UNCHANGED
                      ? ''
                      : value
                  }
                  placeholder={isSensitive ? tt.secretHint : undefined}
                  onChange={(event) => setDraftValue(key, event.target.value)}
                  className={pamFormFieldClass}
                />
              </SettingRow>
            );
          })}
        </div>
      </PAMSettingsCard>

      <PAMSettingsCard
        title={tt.sectionOpenai}
        description={tt.sectionOpenaiDesc}
        saveLabel={tt.save}
        savingLabel={tt.saving}
        saving={savingSection === 'openai'}
        onSave={() => patchSection('openai', [...openaiKeys])}
      >
        <div>
          {openaiKeys.map((key) => {
            const entry = byKey.get(key);
            const raw = getDraftValue(draft, entry, key);
            const isSensitive = entry?.isSensitive;
            const value =
              isSensitive && raw === PAM_SITE_SETTING_SECRET_UNCHANGED
                ? ''
                : String(raw);
            return (
              <SettingRow key={key} entry={entry} tt={tt}>
                <input
                  type={isSensitive ? 'password' : 'text'}
                  value={value}
                  placeholder={
                    isSensitive ? tt.secretHint : 'https://api.openai.com/v1'
                  }
                  onChange={(event) => setDraftValue(key, event.target.value)}
                  className={pamFormFieldClass}
                />
              </SettingRow>
            );
          })}
        </div>
      </PAMSettingsCard>

      <PAMSettingsCard
        title={tt.sectionApi}
        description={tt.sectionApiDesc}
        saveLabel={tt.save}
        savingLabel={tt.saving}
        saving={savingSection === 'api'}
        onSave={() => patchSection('api', [...apiKeys])}
      >
        <div>
          <SettingRow
            entry={byKey.get(PAM_SITE_SETTING_KEYS.API_CORS_ORIGINS)}
            tt={tt}
          >
            <input
              type="text"
              value={formatDraftValue(
                getDraftValue(
                  draft,
                  byKey.get(PAM_SITE_SETTING_KEYS.API_CORS_ORIGINS),
                  PAM_SITE_SETTING_KEYS.API_CORS_ORIGINS
                )
              )}
              onChange={(event) =>
                setDraftValue(
                  PAM_SITE_SETTING_KEYS.API_CORS_ORIGINS,
                  event.target.value
                    .split(',')
                    .map((item) => item.trim())
                    .filter(Boolean)
                )
              }
              placeholder="https://example.com,https://app.example.com"
              className={pamFormFieldClass}
            />
          </SettingRow>
          <SettingRow
            entry={byKey.get(PAM_SITE_SETTING_KEYS.API_CORS_METHODS)}
            tt={tt}
          >
            <input
              type="text"
              value={formatDraftValue(
                getDraftValue(
                  draft,
                  byKey.get(PAM_SITE_SETTING_KEYS.API_CORS_METHODS),
                  PAM_SITE_SETTING_KEYS.API_CORS_METHODS
                )
              )}
              onChange={(event) =>
                setDraftValue(
                  PAM_SITE_SETTING_KEYS.API_CORS_METHODS,
                  event.target.value
                    .split(',')
                    .map((item) => item.trim())
                    .filter(Boolean)
                )
              }
              placeholder="GET,POST,OPTIONS"
              className={pamFormFieldClass}
            />
          </SettingRow>
        </div>
      </PAMSettingsCard>

      <PAMSettingsCard
        title={tt.sectionStorage}
        description={tt.sectionStorageDesc}
        saveLabel={tt.save}
        savingLabel={tt.saving}
        saving={savingSection === 'storage'}
        onSave={() => patchSection('storage', [...storageKeys])}
      >
        <div>
          {storageKeys.map((key) => (
            <SettingRow key={key} entry={byKey.get(key)} tt={tt}>
              <input
                type="text"
                value={String(getDraftValue(draft, byKey.get(key), key))}
                onChange={(event) => setDraftValue(key, event.target.value)}
                className={pamFormFieldClass}
              />
            </SettingRow>
          ))}
        </div>
      </PAMSettingsCard>
    </div>
  );
}
