'use client';

import {
  findDuplicateCorsRuleIndexes,
  isValidCorsOrigin,
  isValidCorsPath
} from '@brain-toolkit/next-app-kit/client';
import {
  corsValueSchema,
  isCorsRuleArray,
  type CorsRule
} from '@brain-toolkit/next-app-kit/shared';
import { PlusIcon, TrashIcon } from '@heroicons/react/24/outline';
import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  SiteSettingsApi,
  type AdminSiteSettingRow
} from '@/impls/appApi/SiteSettingsApi';
import { BrainButton } from '@/uikit/components/brain/BrainButton';
import { BrainField } from '@/uikit/components/brain/BrainField';
import { useI18nMapping } from '@/uikit/hook/useI18nMapping';
import { useIOC } from '@/uikit/hook/useIOC';
import {
  adminSettings18n,
  adminShellI18n
} from '@config/i18n-mapping/admin18n';
import { I } from '@config/ioc-identifiter';
import { SITE_SETTING_KEYS } from '@config/siteSettings';
import { AdminBrainApiCard } from './AdminBrainApiCard';
import type { DialogHandler } from '@qlover/next-kit/client';

const CORS_KEY = SITE_SETTING_KEYS.API_CORS_RULES;
const METHODS = ['GET', 'POST', 'OPTIONS', 'PUT', 'DELETE', 'PATCH'] as const;

interface RuleIssues {
  origin: boolean;
  path: boolean;
  methods: boolean;
  duplicate: boolean;
}

function toggleMethod(methods: readonly string[], method: string): string[] {
  if (method === '*') {
    return methods.includes('*') ? [] : ['*'];
  }
  const rest = methods.filter((m) => m !== '*');
  return rest.includes(method)
    ? rest.filter((m) => m !== method)
    : [...rest, method];
}

export function AdminSettingsView() {
  const tt = useI18nMapping(adminSettings18n);
  const shell = useI18nMapping(adminShellI18n);
  const siteSettingsApi = useIOC(SiteSettingsApi);
  const dialogHandler = useIOC(I.DialogHandler) as DialogHandler;
  const [rows, setRows] = useState<AdminSiteSettingRow[] | null>(null);
  const [failed, setFailed] = useState(false);
  const [draft, setDraft] = useState<CorsRule[] | undefined>();
  const [attempted, setAttempted] = useState(false);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setFailed(false);
    try {
      setRows(await siteSettingsApi.list());
      setDraft(undefined);
    } catch (error) {
      console.error('Load site settings error:', error);
      setFailed(true);
    }
  }, [siteSettingsApi]);

  useEffect(() => {
    void load();
  }, [load]);

  const corsEntry = rows?.find((entry) => entry.key === CORS_KEY);
  const rules = useMemo<CorsRule[]>(() => {
    if (draft !== undefined) return draft;
    return isCorsRuleArray(corsEntry?.value) ? corsEntry.value : [];
  }, [corsEntry, draft]);

  const issues = useMemo<RuleIssues[]>(() => {
    const duplicates = findDuplicateCorsRuleIndexes(rules);
    return rules.map((rule, index) => ({
      origin: rule.origin.trim() ? !isValidCorsOrigin(rule.origin) : attempted,
      path: rule.path.trim() ? !isValidCorsPath(rule.path) : attempted,
      methods: attempted && rule.methods.length === 0,
      duplicate: duplicates.has(index)
    }));
  }, [attempted, rules]);

  const updateRule = (index: number, patch: Partial<CorsRule>) => {
    setDraft(
      rules.map((rule, i) => (i === index ? { ...rule, ...patch } : rule))
    );
  };

  const save = async () => {
    const hasEmpty = rules.some(
      (rule) =>
        !rule.origin.trim() || !rule.path.trim() || rule.methods.length === 0
    );
    const hasInvalid = issues.some(
      (issue) => issue.origin || issue.path || issue.duplicate
    );
    const parsed = corsValueSchema.safeParse(rules);
    if (hasEmpty || hasInvalid || !parsed.success) {
      setAttempted(true);
      dialogHandler.error(tt.corsFixErrors);
      return;
    }
    setSaving(true);
    try {
      setRows(await siteSettingsApi.patch({ [CORS_KEY]: parsed.data }));
      setDraft(undefined);
      setAttempted(false);
      dialogHandler.success(tt.saveSuccess);
    } catch (error) {
      console.error('Save site settings error:', error);
      dialogHandler.error(tt.saveFailed);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div data-testid="AdminSettingsView">
      <div className="brain-console-head">
        <div>
          <h1 className="brain-title">{tt.title}</h1>
          <p className="brain-desc">{tt.description}</p>
        </div>
      </div>

      {failed ? (
        <div className="brain-card flat brain-empty">
          <div className="brain-empty-sphere" aria-hidden />
          <p>{tt.loadFailed}</p>
          <BrainButton
            type="button"
            variant="ghost"
            size="sm"
            auto
            onClick={() => void load()}
          >
            {shell.refresh}
          </BrainButton>
        </div>
      ) : !rows ? (
        <div className="brain-empty" aria-busy>
          <span className="brain-spinner" aria-hidden />
        </div>
      ) : (
        <div className="flex flex-col gap-5">
          <div className="brain-card flat">
            <h2 className="brain-card-title mb-1.5">{tt.sectionApi}</h2>
            <p className="brain-sub mb-[22px] mt-0 leading-[1.7]">
              {tt.sectionApiDesc}
            </p>

            <div className="brain-setting-row">
              <span>{tt.corsRules}</span>
              <span className="brain-pill sm purple">
                {corsEntry?.source === 'db' ? tt.sourceDb : tt.sourceDefault}
              </span>
            </div>

            {rules.length === 0 ? (
              <div className="brain-rules-empty">{tt.corsEmpty}</div>
            ) : (
              <div className="brain-rules">
                {rules.map((rule, index) => {
                  const issue = issues[index];
                  const originAny = rule.origin.trim() === '*';
                  const pathAny = rule.path.trim() === '*';
                  const errors = [
                    issue.origin && tt.corsOriginInvalid,
                    issue.path && tt.corsPathInvalid,
                    issue.methods && tt.corsMethodsEmpty,
                    issue.duplicate && tt.corsDuplicate
                  ].filter(Boolean) as string[];
                  return (
                    <div
                      key={index}
                      data-testid="AdminCorsRule"
                      className="brain-inner-card brain-rule"
                    >
                      <BrainField
                        id={`cors-origin-${index}`}
                        label={tt.corsOrigin}
                        value={originAny ? '' : rule.origin}
                        placeholder={
                          originAny ? tt.corsAny : 'https://spa.example.com'
                        }
                        disabled={originAny}
                        invalid={issue.origin || issue.duplicate}
                        onChange={(event) =>
                          updateRule(index, { origin: event.target.value })
                        }
                        action={
                          <button
                            type="button"
                            className="brain-chip toggle mono"
                            aria-pressed={originAny}
                            aria-label={`${tt.corsOrigin} *`}
                            onClick={() =>
                              updateRule(index, {
                                origin: originAny ? '' : '*'
                              })
                            }
                          >
                            *
                          </button>
                        }
                      />
                      <BrainField
                        id={`cors-path-${index}`}
                        label={tt.corsPath}
                        value={pathAny ? '' : rule.path}
                        placeholder={pathAny ? tt.corsAny : '/oauth/token'}
                        disabled={pathAny}
                        invalid={issue.path || issue.duplicate}
                        onChange={(event) =>
                          updateRule(index, { path: event.target.value })
                        }
                        action={
                          <button
                            type="button"
                            className="brain-chip toggle mono"
                            aria-pressed={pathAny}
                            aria-label={`${tt.corsPath} *`}
                            onClick={() =>
                              updateRule(index, { path: pathAny ? '' : '*' })
                            }
                          >
                            *
                          </button>
                        }
                      />
                      <button
                        type="button"
                        className="brain-link danger mb-3"
                        onClick={() =>
                          setDraft(rules.filter((_, i) => i !== index))
                        }
                      >
                        <TrashIcon aria-hidden />
                        {tt.corsRemove}
                      </button>
                      <div
                        className="brain-rule-methods"
                        role="group"
                        aria-label={tt.corsMethods}
                      >
                        <span>{tt.corsMethods}</span>
                        {[...METHODS, '*'].map((method) => (
                          <button
                            data-testid="AdminSettingsView"
                            key={method}
                            type="button"
                            className="brain-chip toggle mono"
                            aria-pressed={rule.methods.includes(method)}
                            onClick={() =>
                              updateRule(index, {
                                methods: toggleMethod(rule.methods, method)
                              })
                            }
                          >
                            {method}
                          </button>
                        ))}
                      </div>
                      {errors.map((message) => (
                        <div
                          data-testid="AdminSettingsView"
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
            )}

            <div className="brain-settings-foot">
              <BrainButton
                type="button"
                variant="ghost"
                size="sm"
                auto
                onClick={() =>
                  setDraft([
                    ...rules,
                    { origin: '', path: '', methods: ['POST'] }
                  ])
                }
              >
                <PlusIcon className="h-4 w-4" aria-hidden />
                {tt.corsAdd}
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
          <AdminBrainApiCard rows={rows} onSaved={setRows} />
        </div>
      )}
    </div>
  );
}
