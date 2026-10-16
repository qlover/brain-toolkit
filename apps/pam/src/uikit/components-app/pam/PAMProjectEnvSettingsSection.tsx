'use client';

import { ShieldCheckIcon, TrashIcon } from '@heroicons/react/24/outline';
import { clsx } from 'clsx';
import { useEffect, useState } from 'react';
import { PAMApi } from '@/impls/appApi/PAMApi';
import { useIOC } from '@/uikit/hook/useIOC';
import { PermissionKey } from '@shared/auth/permissionKeys';
import type { PAMEnvironmentsI18nInterface } from '@config/i18n-mapping/PAMEnvironmentsI18n';
import { I } from '@config/ioc-identifiter';
import type {
  PAMEnvSettings,
  PAMEnvWriteable
} from '@schemas/PAMEnvironmentSchema';
import {
  pamFormFieldClass,
  pamFormLabelClass
} from '../../components/pam/PAMFormFieldStyles';

export type PAMProjectEnvSettingsSectionProps = {
  readonly projectId: string;
  readonly environment: PAMEnvWriteable;
  /** URL and protected flag (`pam_environments_export`). */
  readonly canEditSettings: boolean;
  readonly canDelete: boolean;
  readonly tt: PAMEnvironmentsI18nInterface;
  readonly onUpdated: (env: PAMEnvWriteable) => void;
  readonly onDelete: (env: PAMEnvWriteable) => void;
};

/**
 * Environment URL, protected flag, and delete (danger zone).
 */
export function PAMProjectEnvSettingsSection({
  projectId,
  environment,
  canEditSettings,
  canDelete,
  tt,
  onUpdated,
  onDelete
}: PAMProjectEnvSettingsSectionProps) {
  const pamApi = useIOC(PAMApi);
  const dialogHandler = useIOC(I.DialogHandler);
  const [saving, setSaving] = useState(false);
  const [url, setUrl] = useState(environment.url ?? '');

  const isProtected = environment.is_protected === true;

  useEffect(() => {
    setUrl(environment.url ?? '');
  }, [environment.id, environment.url]);

  const save = async (settings: PAMEnvSettings): Promise<void> => {
    if (saving) {
      return;
    }
    setSaving(true);
    try {
      const updated = await pamApi.updateEnvironmentSettings(
        projectId,
        environment.id,
        settings
      );
      onUpdated(updated);
      dialogHandler.success(tt.envSettingsSaved);
    } catch {
      // DialogErrorPlugin already toasts API failures.
    } finally {
      setSaving(false);
    }
  };

  const trimmedUrl = url.trim();
  const urlChanged = trimmedUrl !== (environment.url ?? '');

  return (
    <div data-testid="PAMProjectEnvSettingsSection" className="space-y-5">
      {canEditSettings ? (
        <>
          <div className="space-y-1.5">
            <label className={pamFormLabelClass}>{tt.settingsUrlTitle}</label>
            <div className="flex flex-wrap gap-2">
              <input
                value={url}
                onChange={(event) => setUrl(event.target.value)}
                placeholder={tt.placeholderEnvUrl}
                className={clsx(
                  pamFormFieldClass,
                  'min-w-48 flex-1 py-1.5 text-sm'
                )}
              />
              <button
                type="button"
                data-permission={PermissionKey.pam_environments_export}
                disabled={saving || !urlChanged || trimmedUrl === ''}
                onClick={() => void save({ url: trimmedUrl })}
                className="cursor-pointer rounded-lg bg-brand/10 px-3 py-1.5 text-sm text-brand transition hover:bg-brand/15 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {tt.settingsUrlSave}
              </button>
            </div>
          </div>

          <label className="flex cursor-pointer items-start gap-2.5">
            <input
              type="checkbox"
              data-permission={PermissionKey.pam_environments_export}
              checked={isProtected}
              disabled={saving}
              onChange={() => void save({ isProtected: !isProtected })}
              className="mt-0.5 h-4 w-4 cursor-pointer accent-brand disabled:cursor-not-allowed"
            />
            <span className="min-w-0">
              <span className="flex items-center gap-1 text-sm font-medium text-primary-text">
                <ShieldCheckIcon className="h-4 w-4 text-brand" />
                {tt.envProtected}
              </span>
              <span className="mt-0.5 block text-xs text-tertiary-text">
                {tt.envProtectedHint}
              </span>
            </span>
          </label>
        </>
      ) : (
        <p className="text-sm text-tertiary-text">{tt.settingsNoPermission}</p>
      )}

      {canDelete ? (
        <div className="space-y-2 rounded-lg border border-(--fe-color-error)/40 p-3">
          <div className="text-sm font-semibold text-(--fe-color-error)">
            {tt.dangerZone}
          </div>
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="text-xs text-tertiary-text">{tt.envDeleteHint}</p>
            <button
              type="button"
              data-permission={PermissionKey.pam_environments_delete}
              onClick={() => onDelete(environment)}
              className="flex cursor-pointer items-center gap-1 rounded-lg border border-(--fe-color-error)/40 px-3 py-1.5 text-sm text-(--fe-color-error) transition hover:bg-(--fe-color-error)/10"
            >
              <TrashIcon className="h-4 w-4" />
              {tt.envDelete}
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
