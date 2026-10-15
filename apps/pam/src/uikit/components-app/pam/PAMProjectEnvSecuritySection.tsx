'use client';

import { ShieldCheckIcon } from '@heroicons/react/24/outline';
import { clsx } from 'clsx';
import dayjs from 'dayjs';
import { useCallback, useEffect, useState } from 'react';
import { PAMApi } from '@/impls/appApi/PAMApi';
import { PamLoadingIndicator } from '@/uikit/components/PamLoadingIndicator';
import { useIOC } from '@/uikit/hook/useIOC';
import { PermissionKey } from '@shared/auth/permissionKeys';
import type { PAMEnvironmentsI18nInterface } from '@config/i18n-mapping/PAMEnvironmentsI18n';
import { I } from '@config/ioc-identifiter';
import type {
  PAMEnvAccessLog,
  PAMEnvWriteable
} from '@schemas/PAMEnvironmentSchema';

export type PAMProjectEnvSecuritySectionProps = {
  readonly projectId: string;
  readonly environment: PAMEnvWriteable;
  readonly tt: PAMEnvironmentsI18nInterface;
  readonly onUpdated: (env: PAMEnvWriteable) => void;
};

/**
 * Protected flag and access records for one environment
 * (`pam_environments_export` holders only).
 */
export function PAMProjectEnvSecuritySection({
  projectId,
  environment,
  tt,
  onUpdated
}: PAMProjectEnvSecuritySectionProps) {
  const pamApi = useIOC(PAMApi);
  const dialogHandler = useIOC(I.DialogHandler);
  const [saving, setSaving] = useState(false);
  const [showLogs, setShowLogs] = useState(false);
  const [logs, setLogs] = useState<PAMEnvAccessLog[] | null>(null);

  const envId = environment.id;
  const isProtected = environment.is_protected === true;

  useEffect(() => {
    setShowLogs(false);
    setLogs(null);
  }, [envId]);

  const loadLogs = useCallback(async (): Promise<void> => {
    try {
      setLogs(await pamApi.listEnvironmentAccessLogs(projectId, envId));
    } catch {
      setLogs([]);
    }
  }, [pamApi, projectId, envId]);

  const onToggleLogs = (): void => {
    const next = !showLogs;
    setShowLogs(next);
    if (next && logs === null) {
      void loadLogs();
    }
  };

  const onToggleProtected = async (): Promise<void> => {
    setSaving(true);
    try {
      const updated = await pamApi.updateEnvironmentSettings(projectId, envId, {
        isProtected: !isProtected
      });
      onUpdated(updated);
      dialogHandler.success(tt.envSettingsSaved);
    } catch {
      // DialogErrorPlugin already toasts API failures.
    } finally {
      setSaving(false);
    }
  };

  return (
    <div
      data-testid="PAMProjectEnvSecuritySection"
      className="space-y-3 border-t border-primary-border pt-3"
    >
      <label className="flex cursor-pointer items-start gap-2.5">
        <input
          type="checkbox"
          data-permission={PermissionKey.pam_environments_export}
          checked={isProtected}
          disabled={saving}
          onChange={() => void onToggleProtected()}
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

      <div className="space-y-2">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <div className="text-xs font-bold tracking-wide text-tertiary-text uppercase">
              {tt.accessLogsTitle}
            </div>
            <p className="mt-0.5 text-xs text-tertiary-text">
              {tt.accessLogsHint}
            </p>
          </div>
          <button
            type="button"
            data-permission={PermissionKey.pam_environments_export}
            onClick={onToggleLogs}
            className="cursor-pointer rounded-lg border border-primary-border px-2.5 py-1.5 text-xs text-secondary-text transition hover:bg-elevated"
          >
            {showLogs ? tt.accessLogsHide : tt.accessLogsShow}
          </button>
        </div>

        {showLogs ? (
          logs === null ? (
            <div className="flex justify-center py-3">
              <PamLoadingIndicator />
            </div>
          ) : logs.length === 0 ? (
            <p className="text-sm text-tertiary-text">{tt.accessLogsEmpty}</p>
          ) : (
            <ul className="divide-y divide-primary-border rounded-lg border border-primary-border">
              {logs.map((log) => (
                <li
                  data-testid="PAMProjectEnvSecuritySection"
                  key={log.id}
                  className="flex flex-wrap items-center gap-x-3 gap-y-1 px-3 py-2 text-xs"
                >
                  <span className="font-medium text-primary-text">
                    {log.user_label ?? tt.accessUnknownUser}
                  </span>
                  <span
                    className={clsx(
                      'rounded px-1.5 py-0.5',
                      log.action === 'export'
                        ? 'bg-(--fe-color-warning)/10 text-(--fe-color-warning)'
                        : 'bg-brand/10 text-brand'
                    )}
                  >
                    {log.action === 'export'
                      ? tt.accessActionExport
                      : tt.accessActionResolve}
                  </span>
                  <span className="text-secondary-text">
                    {tt.accessKeyCount.replace(
                      '%count%',
                      String(log.key_count)
                    )}
                  </span>
                  {log.client ? (
                    <span
                      className="max-w-48 truncate text-tertiary-text"
                      title={log.client}
                    >
                      {log.client}
                    </span>
                  ) : null}
                  {log.ip ? (
                    <span className="font-mono text-tertiary-text">
                      {log.ip}
                    </span>
                  ) : null}
                  <span className="ml-auto text-tertiary-text">
                    {dayjs(log.created_at).format('YYYY-MM-DD HH:mm:ss')}
                  </span>
                </li>
              ))}
            </ul>
          )
        ) : null}
      </div>
    </div>
  );
}
