'use client';

import { useState } from 'react';
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
  BRAIN_API_CUSTOM_ENV,
  BRAIN_API_DEFAULT_ENV,
  BRAIN_API_ENV_OPTIONS,
  BRAIN_API_PRESET_DOMAINS,
  isValidBrainApiBaseUrl,
  resolveBrainApiTarget
} from '@config/brainApi';
import { adminSettings18n } from '@config/i18n-mapping/admin18n';
import { I } from '@config/ioc-identifiter';
import { SITE_SETTING_KEYS } from '@config/siteSettings';
import type { DialogHandler } from '@qlover/next-kit/client';

const ENV_KEY = SITE_SETTING_KEYS.BRAIN_API_ENV;
const BASE_URL_KEY = SITE_SETTING_KEYS.BRAIN_API_BASE_URL;

function stringValue(
  rows: readonly AdminSiteSettingRow[],
  key: string,
  fallback: string
): string {
  const value = rows.find((entry) => entry.key === key)?.value;
  return typeof value === 'string' && value.trim() ? value : fallback;
}

export interface AdminBrainApiCardProps {
  rows: AdminSiteSettingRow[];
  onSaved: (rows: AdminSiteSettingRow[]) => void;
}

export function AdminBrainApiCard({ rows, onSaved }: AdminBrainApiCardProps) {
  const tt = useI18nMapping(adminSettings18n);
  const siteSettingsApi = useIOC(SiteSettingsApi);
  const dialogHandler = useIOC(I.DialogHandler) as DialogHandler;
  const [envDraft, setEnvDraft] = useState<string | undefined>();
  const [baseUrlDraft, setBaseUrlDraft] = useState<string | undefined>();
  const [attempted, setAttempted] = useState(false);
  const [saving, setSaving] = useState(false);

  const env = envDraft ?? stringValue(rows, ENV_KEY, BRAIN_API_DEFAULT_ENV);
  const baseUrl = baseUrlDraft ?? stringValue(rows, BASE_URL_KEY, '');
  const isCustom = env === BRAIN_API_CUSTOM_ENV;
  const baseUrlInvalid =
    isCustom && (baseUrl.trim() ? !isValidBrainApiBaseUrl(baseUrl) : attempted);
  const effective = resolveBrainApiTarget(env, baseUrl).baseURL;
  const fromDb = rows.some(
    (entry) => entry.key === ENV_KEY && entry.source === 'db'
  );

  const save = async () => {
    if (isCustom && !isValidBrainApiBaseUrl(baseUrl)) {
      setAttempted(true);
      dialogHandler.error(tt.brainBaseUrlInvalid);
      return;
    }
    setSaving(true);
    try {
      onSaved(
        await siteSettingsApi.patch({
          [ENV_KEY]: env,
          [BASE_URL_KEY]: baseUrl.trim()
        })
      );
      setEnvDraft(undefined);
      setBaseUrlDraft(undefined);
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
      <h2 className="brain-card-title mb-1.5">{tt.sectionBrain}</h2>
      <p className="brain-sub mb-[22px] mt-0 leading-[1.7]">
        {tt.sectionBrainDesc}
      </p>

      <div className="brain-setting-row">
        <span>{tt.brainEffective}</span>
        <span className="brain-pill sm purple">
          {fromDb ? tt.sourceDb : tt.sourceDefault}
        </span>
      </div>
      <p className="brain-sub mono mb-4 mt-0 break-all">{effective}</p>

      <BrainSelectField
        id="brain-api-env"
        label={tt.brainEnv}
        value={env}
        onChange={(event) => setEnvDraft(event.target.value)}
      >
        {BRAIN_API_ENV_OPTIONS.map((option) => (
          <option data-testid="AdminBrainApiCard" key={option} value={option}>
            {option === BRAIN_API_CUSTOM_ENV
              ? tt.brainEnvCustom
              : `${option} — ${BRAIN_API_PRESET_DOMAINS[option]}`}
          </option>
        ))}
      </BrainSelectField>

      {isCustom && (
        <BrainField
          id="brain-api-base-url"
          label={tt.brainBaseUrl}
          value={baseUrl}
          placeholder="https://api.dev.brain.ai"
          invalid={baseUrlInvalid}
          help={baseUrlInvalid ? tt.brainBaseUrlInvalid : undefined}
          onChange={(event) => setBaseUrlDraft(event.target.value)}
        />
      )}

      <div className="brain-settings-foot">
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
