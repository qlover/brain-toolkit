'use client';

import {
  ArrowUturnLeftIcon,
  ChevronDownIcon,
  PlusIcon,
  TrashIcon
} from '@heroicons/react/24/outline';
import { useMemo, useState } from 'react';
import {
  SiteSettingsApi,
  type AdminSiteSettingRow
} from '@/impls/appApi/SiteSettingsApi';
import { BrainButton } from '@/uikit/components/brain/BrainButton';
import {
  BrainField,
  BrainSelectField
} from '@/uikit/components/brain/BrainField';
import { useI18nMapping } from '@/uikit/hook/useI18nMapping';
import { useIOC } from '@/uikit/hook/useIOC';
import {
  BRAIN_API_DEFAULT_ENDPOINTS,
  BRAIN_API_DEFAULT_ENV,
  BRAIN_API_ENDPOINT_KEYS,
  BRAIN_API_HTTP_METHODS,
  BRAIN_API_PRESET_DOMAINS,
  brainApiFormToSettings,
  isHttpUrl,
  parseBrainApiSettings,
  resolveBrainApiTarget,
  serializeBrainApiSettings,
  settingsToBrainApiForm,
  splitEndpoint,
  type BrainApiDomainRow,
  type BrainApiEndpointKey,
  type BrainApiForm
} from '@config/brainApi';
import { adminSettings18n } from '@config/i18n-mapping/admin18n';
import { I } from '@config/ioc-identifiter';
import { SITE_SETTING_KEYS } from '@config/siteSettings';
import type { DialogHandler } from '@qlover/next-kit/client';

const CONFIG_KEY = SITE_SETTING_KEYS.BRAIN_API_GATEWAY_CONFIG;
const PATH_PATTERN = /^\/\S*$/;
const DEFAULT_FORM = settingsToBrainApiForm({});

function storedForm(rows: readonly AdminSiteSettingRow[]): BrainApiForm {
  const value = rows.find((row) => row.key === CONFIG_KEY)?.value;
  const parsed = parseBrainApiSettings(typeof value === 'string' ? value : '');
  return parsed.success
    ? settingsToBrainApiForm(parsed.settings)
    : DEFAULT_FORM;
}

function isEndpointModified(
  form: BrainApiForm,
  key: BrainApiEndpointKey
): boolean {
  const { method, path } = form.endpoints[key];
  return `${method} ${path.trim()}` !== BRAIN_API_DEFAULT_ENDPOINTS[key];
}

function isDomainModified(row: BrainApiDomainRow): boolean {
  return (
    row.preset &&
    row.url.trim().replace(/\/+$/, '') !== BRAIN_API_PRESET_DOMAINS[row.name]
  );
}

export interface AdminBrainApiCardProps {
  rows: AdminSiteSettingRow[];
  onSaved: (rows: AdminSiteSettingRow[]) => void;
}

export function AdminBrainApiCard({ rows, onSaved }: AdminBrainApiCardProps) {
  const tt = useI18nMapping(adminSettings18n);
  const siteSettingsApi = useIOC(SiteSettingsApi);
  const dialogHandler = useIOC(I.DialogHandler) as DialogHandler;
  const [draft, setDraft] = useState<BrainApiForm | undefined>();
  const [attempted, setAttempted] = useState(false);
  const [saving, setSaving] = useState(false);

  const form = draft ?? storedForm(rows);
  const fromDb = rows.some(
    (row) =>
      row.key === CONFIG_KEY &&
      row.source === 'db' &&
      typeof row.value === 'string' &&
      row.value.trim() !== ''
  );

  const issues = useMemo(() => {
    const names = form.domains.map((row) => row.name.trim());
    const domains = form.domains.map((row, index) => ({
      name: !names[index] ? attempted : names.indexOf(names[index]) !== index,
      url: row.url.trim() ? !isHttpUrl(row.url) : attempted,
      userly: row.userlyUrl.trim() !== '' && !isHttpUrl(row.userlyUrl),
      paths: BRAIN_API_ENDPOINT_KEYS.filter((key) => {
        const path = row.paths[key]?.trim();
        return !!path && !PATH_PATTERN.test(path);
      })
    }));
    const endpoints = Object.fromEntries(
      BRAIN_API_ENDPOINT_KEYS.map((key) => [
        key,
        !PATH_PATTERN.test(form.endpoints[key].path.trim())
      ])
    ) as Record<BrainApiEndpointKey, boolean>;
    const hasError =
      domains.some(
        (issue) =>
          issue.name || issue.url || issue.userly || issue.paths.length > 0
      ) ||
      names.some((name) => !name) ||
      form.domains.some((row) => !isHttpUrl(row.url)) ||
      Object.values(endpoints).some(Boolean);
    return { domains, endpoints, hasError };
  }, [attempted, form]);

  const target = useMemo(() => {
    const parsed = parseBrainApiSettings(
      serializeBrainApiSettings(brainApiFormToSettings(form))
    );
    return parsed.success ? resolveBrainApiTarget(parsed.settings) : null;
  }, [form]);

  const envOptions = form.domains.filter(
    (row, index) =>
      row.name.trim() && !issues.domains[index].name && isHttpUrl(row.url)
  );
  const modifiedEndpoints = BRAIN_API_ENDPOINT_KEYS.filter((key) =>
    isEndpointModified(form, key)
  ).length;

  const update = (patch: Partial<BrainApiForm>) =>
    setDraft({ ...form, ...patch });

  const updateDomain = (index: number, patch: Partial<BrainApiDomainRow>) => {
    const current = form.domains[index];
    const domains = form.domains.map((row, i) =>
      i === index ? { ...row, ...patch } : row
    );
    const env =
      patch.name !== undefined && current.name === form.env
        ? patch.name.trim()
        : form.env;
    update({ domains, env });
  };

  const removeDomain = (index: number) => {
    const removed = form.domains[index];
    update({
      domains: form.domains.filter((_, i) => i !== index),
      env: removed.name === form.env ? BRAIN_API_DEFAULT_ENV : form.env
    });
  };

  const updateEndpoint = (
    key: BrainApiEndpointKey,
    patch: Partial<BrainApiForm['endpoints'][BrainApiEndpointKey]>
  ) =>
    update({
      endpoints: {
        ...form.endpoints,
        [key]: { ...form.endpoints[key], ...patch }
      }
    });

  const save = async () => {
    const value = serializeBrainApiSettings(brainApiFormToSettings(form));
    if (issues.hasError || !parseBrainApiSettings(value).success) {
      setAttempted(true);
      dialogHandler.error(tt.brainConfigInvalid);
      return;
    }
    setSaving(true);
    try {
      onSaved(await siteSettingsApi.patch({ [CONFIG_KEY]: value }));
      setDraft(undefined);
      setAttempted(false);
      dialogHandler.success(tt.saveSuccess);
    } catch (error) {
      console.error('Save Brain API settings error:', error);
      dialogHandler.error(tt.saveFailed);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div data-testid="AdminBrainApiCard" className="brain-card flat">
      <div className="brain-setting-row mb-1.5">
        <h2 className="brain-card-title m-0">{tt.sectionBrain}</h2>
        <span className="brain-pill sm purple">
          {fromDb ? tt.sourceDb : tt.sourceDefault}
        </span>
      </div>
      <p className="brain-sub mb-[22px] mt-0 leading-[1.7]">
        {tt.sectionBrainDesc}
      </p>

      <BrainSelectField
        id="brain-api-env"
        label={tt.brainEnv}
        value={form.env}
        onChange={(event) => update({ env: event.target.value })}
      >
        {envOptions.map((row) => (
          <option
            data-testid="AdminBrainApiCard"
            key={row.name}
            value={row.name.trim()}
          >
            {row.name.trim()} — {row.url.trim()}
          </option>
        ))}
      </BrainSelectField>

      {target && (
        <dl className="brain-sub mono mb-2 mt-0 grid gap-1 break-all text-[13px]">
          <div>
            <dt className="inline">{tt.brainEffective}：</dt>
            <dd className="inline">{target.baseURL}</dd>
          </div>
          <div>
            <dt className="inline">{tt.brainUserlyEffective}：</dt>
            <dd className="inline">{target.userlyBaseURL}</dd>
          </div>
        </dl>
      )}

      <div className="brain-setting-row mt-7">
        <span>{tt.brainDomains}</span>
      </div>
      <div className="brain-rules">
        {form.domains.map((row, index) => {
          const issue = issues.domains[index];
          const modified = isDomainModified(row);
          const errors = [
            issue.name && tt.brainNameInvalid,
            issue.url && tt.brainUrlInvalid,
            issue.paths.length > 0 && tt.brainPathInvalid
          ].filter(Boolean) as string[];
          const overridden = BRAIN_API_ENDPOINT_KEYS.filter(
            (key) => !!row.paths[key]?.trim()
          ).length;
          return (
            <div
              key={index}
              data-testid="AdminBrainDomainRow"
              className="brain-inner-card brain-rule domain"
            >
              <BrainField
                id={`brain-domain-name-${index}`}
                label={tt.brainDomainName}
                value={row.name}
                placeholder="staging"
                disabled={row.preset}
                invalid={issue.name}
                onChange={(event) =>
                  updateDomain(index, { name: event.target.value })
                }
                action={
                  row.preset ? (
                    <span className="brain-pill sm">{tt.brainPreset}</span>
                  ) : undefined
                }
              />
              <BrainField
                id={`brain-domain-url-${index}`}
                label={tt.brainDomainUrl}
                value={row.url}
                placeholder="https://api.example.com"
                invalid={issue.url}
                onChange={(event) =>
                  updateDomain(index, { url: event.target.value })
                }
              />
              {row.preset ? (
                <button
                  type="button"
                  className="brain-link mb-3"
                  disabled={!modified}
                  onClick={() =>
                    updateDomain(index, {
                      url: BRAIN_API_PRESET_DOMAINS[row.name]
                    })
                  }
                >
                  <ArrowUturnLeftIcon aria-hidden />
                  {tt.brainReset}
                </button>
              ) : (
                <button
                  type="button"
                  className="brain-link danger mb-3"
                  onClick={() => removeDomain(index)}
                >
                  <TrashIcon aria-hidden />
                  {tt.brainDomainRemove}
                </button>
              )}
              <div className="brain-rule-full">
                <BrainField
                  id={`brain-domain-userly-${index}`}
                  label={tt.brainUserly}
                  value={row.userlyUrl}
                  placeholder={row.url.trim() || 'https://api.example.com'}
                  invalid={issue.userly}
                  help={issue.userly ? tt.brainUrlInvalid : tt.brainUserlyHelp}
                  onChange={(event) =>
                    updateDomain(index, { userlyUrl: event.target.value })
                  }
                />
              </div>
              <details className="brain-settings-group brain-rule-full">
                <summary>
                  <span>{tt.brainEnvPaths}</span>
                  {overridden > 0 && (
                    <span className="brain-pill sm purple">
                      {tt.brainModified} {overridden}
                    </span>
                  )}
                  <ChevronDownIcon aria-hidden />
                </summary>
                <p className="brain-sub mb-2 mt-2">{tt.brainEnvPathsDesc}</p>
                {BRAIN_API_ENDPOINT_KEYS.map((key) => (
                  <BrainField
                    key={key}
                    id={`brain-domain-path-${index}-${key}`}
                    label={`${key}（${form.endpoints[key].method}）`}
                    className="mono"
                    value={row.paths[key] ?? ''}
                    placeholder={form.endpoints[key].path}
                    invalid={issue.paths.includes(key)}
                    onChange={(event) =>
                      updateDomain(index, {
                        paths: { ...row.paths, [key]: event.target.value }
                      })
                    }
                  />
                ))}
              </details>
              {errors.map((message) => (
                <div
                  data-testid="AdminBrainApiCard"
                  key={message}
                  className="brain-rule-err"
                >
                  {message}
                </div>
              ))}
            </div>
          );
        })}
      </div>
      <BrainButton
        type="button"
        variant="ghost"
        size="sm"
        auto
        onClick={() =>
          update({
            domains: [
              ...form.domains,
              { name: '', url: '', preset: false, userlyUrl: '', paths: {} }
            ]
          })
        }
      >
        <PlusIcon className="h-4 w-4" aria-hidden />
        {tt.brainDomainAdd}
      </BrainButton>

      <details className="brain-settings-group">
        <summary>
          <span>{tt.brainEndpoints}</span>
          {modifiedEndpoints > 0 && (
            <span className="brain-pill sm purple">
              {tt.brainModified} {modifiedEndpoints}
            </span>
          )}
          <ChevronDownIcon aria-hidden />
        </summary>
        <p className="brain-sub mb-0 mt-2">{tt.brainEndpointsDesc}</p>
        <div className="brain-rules">
          {BRAIN_API_ENDPOINT_KEYS.map((key) => {
            const endpoint = form.endpoints[key];
            const invalid = issues.endpoints[key];
            const modified = isEndpointModified(form, key);
            return (
              <div
                key={key}
                data-testid="AdminBrainEndpointRow"
                className="brain-inner-card brain-rule endpoint"
              >
                <span className="brain-rule-key mono">{key}</span>
                <BrainSelectField
                  id={`brain-endpoint-method-${key}`}
                  label="Method"
                  value={endpoint.method}
                  onChange={(event) =>
                    updateEndpoint(key, { method: event.target.value })
                  }
                >
                  {BRAIN_API_HTTP_METHODS.map((method) => (
                    <option
                      data-testid="AdminBrainApiCard"
                      key={method}
                      value={method}
                    >
                      {method}
                    </option>
                  ))}
                </BrainSelectField>
                <BrainField
                  id={`brain-endpoint-path-${key}`}
                  label="Path"
                  className="mono"
                  value={endpoint.path}
                  invalid={invalid}
                  onChange={(event) =>
                    updateEndpoint(key, { path: event.target.value })
                  }
                />
                <button
                  type="button"
                  className="brain-link mb-3"
                  disabled={!modified}
                  onClick={() =>
                    updateEndpoint(
                      key,
                      splitEndpoint(BRAIN_API_DEFAULT_ENDPOINTS[key])
                    )
                  }
                >
                  <ArrowUturnLeftIcon aria-hidden />
                  {tt.brainReset}
                </button>
                {invalid && (
                  <div className="brain-rule-err">{tt.brainPathInvalid}</div>
                )}
              </div>
            );
          })}
        </div>
      </details>

      <div className="brain-settings-foot mt-6">
        <BrainButton
          type="button"
          variant="ghost"
          size="sm"
          auto
          onClick={() => {
            setDraft(DEFAULT_FORM);
            setAttempted(false);
          }}
        >
          {tt.brainResetAll}
        </BrainButton>
        <BrainButton
          type="button"
          size="sm"
          auto
          loading={saving}
          onClick={() => void save()}
        >
          {tt.save}
        </BrainButton>
      </div>
    </div>
  );
}
