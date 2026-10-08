'use client';

import { useMemo, useState } from 'react';
import {
  SiteSettingsApi,
  type AdminSiteSettingRow
} from '@/impls/appApi/SiteSettingsApi';
import { BrainButton } from '@/uikit/components/brain/BrainButton';
import { BrainTextareaField } from '@/uikit/components/brain/BrainField';
import { useI18nMapping } from '@/uikit/hook/useI18nMapping';
import { useIOC } from '@/uikit/hook/useIOC';
import {
  BRAIN_API_SETTINGS_TEMPLATE,
  parseBrainApiSettings,
  resolveBrainApiTarget
} from '@config/brainApi';
import { adminSettings18n } from '@config/i18n-mapping/admin18n';
import { I } from '@config/ioc-identifiter';
import { SITE_SETTING_KEYS } from '@config/siteSettings';
import type { DialogHandler } from '@qlover/next-kit/client';

const CONFIG_KEY = SITE_SETTING_KEYS.BRAIN_API_GATEWAY_CONFIG;

export interface AdminBrainApiCardProps {
  rows: AdminSiteSettingRow[];
  onSaved: (rows: AdminSiteSettingRow[]) => void;
}

export function AdminBrainApiCard({ rows, onSaved }: AdminBrainApiCardProps) {
  const tt = useI18nMapping(adminSettings18n);
  const siteSettingsApi = useIOC(SiteSettingsApi);
  const dialogHandler = useIOC(I.DialogHandler) as DialogHandler;
  const [draft, setDraft] = useState<string | undefined>();
  const [saving, setSaving] = useState(false);

  const entry = rows.find((row) => row.key === CONFIG_KEY);
  const stored = typeof entry?.value === 'string' ? entry.value : '';
  const text = draft ?? (stored.trim() ? stored : BRAIN_API_SETTINGS_TEMPLATE);
  const parsed = useMemo(() => parseBrainApiSettings(text), [text]);
  const target = parsed.success ? resolveBrainApiTarget(parsed.settings) : null;

  const save = async () => {
    if (!parsed.success) {
      dialogHandler.error(tt.brainConfigInvalid);
      return;
    }
    setSaving(true);
    try {
      onSaved(await siteSettingsApi.patch({ [CONFIG_KEY]: text }));
      setDraft(undefined);
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
        <span>{tt.brainConfig}</span>
        <span className="brain-pill sm purple">
          {entry?.source === 'db' && stored.trim()
            ? tt.sourceDb
            : tt.sourceDefault}
        </span>
      </div>

      <BrainTextareaField
        id="brain-api-config"
        label={tt.brainConfig}
        className="mono"
        rows={14}
        spellCheck={false}
        value={text}
        invalid={!parsed.success}
        help={
          parsed.success ? undefined : (
            <span className="whitespace-pre-wrap">{parsed.error}</span>
          )
        }
        onChange={(event) => setDraft(event.target.value)}
      />

      {target && (
        <dl className="brain-sub mono mb-4 mt-3 grid gap-1 break-all">
          <div>
            <dt className="inline">{tt.brainEffective}: </dt>
            <dd className="inline">{target.baseURL}</dd>
          </div>
          <div>
            <dt className="inline">{tt.brainUserlyEffective}: </dt>
            <dd className="inline">{target.userlyBaseURL}</dd>
          </div>
        </dl>
      )}

      <div className="brain-settings-foot">
        <BrainButton
          type="button"
          variant="ghost"
          size="sm"
          auto
          onClick={() => setDraft(BRAIN_API_SETTINGS_TEMPLATE)}
        >
          {tt.brainReset}
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
