'use client';

import { usePageI18nMapping } from '@qlover/next-kit/client';
import React, { useCallback, useEffect, useState } from 'react';
import { PAMApi } from '@/impls/appApi/PAMApi';
import { useIOC } from '@/uikit/hook/useIOC';
import { PermissionKey } from '@shared/auth/permissionKeys';
import type { PAMGeneralI18nInterface } from '@config/i18n-mapping/PAMGeneralI18n';
import { pamFormFieldClass } from '../../components/pam/PAMFormFieldStyles';
import { PAMSettingsCard } from '../../components/pam/PAMSettingsCard';

export type PAMProjectCiOidcSectionProps = {
  readonly projectId: string;
  readonly canEdit: boolean;
};

/**
 * 项目设置：GitHub Actions OIDC 仓库绑定。
 */
export function PAMProjectCiOidcSection({
  projectId,
  canEdit
}: PAMProjectCiOidcSectionProps): React.ReactElement {
  const tt = usePageI18nMapping<PAMGeneralI18nInterface>();
  const pamApi = useIOC(PAMApi);
  const [repository, setRepository] = useState('');
  const [boundRepository, setBoundRepository] = useState<string | null>(null);
  const [audience, setAudience] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [binding, aud] = await Promise.all([
        pamApi.getCiOidcBinding(projectId),
        pamApi.getCiOidcAudience()
      ]);
      setAudience(aud);
      const repo = binding?.repository ?? '';
      setBoundRepository(binding ? binding.repository : null);
      setRepository(repo);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setLoading(false);
    }
  }, [pamApi, projectId]);

  useEffect(() => {
    void load();
  }, [load]);

  const handleSave = async (): Promise<void> => {
    const next = repository.trim();
    if (!next) {
      return;
    }
    setSaving(true);
    setMessage(null);
    setError(null);
    try {
      const saved = await pamApi.upsertCiOidcBinding(projectId, {
        repository: next
      });
      setBoundRepository(saved.repository);
      setRepository(saved.repository);
      setMessage(tt.ciOidcSaved);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setSaving(false);
    }
  };

  const handleClear = async (): Promise<void> => {
    setSaving(true);
    setMessage(null);
    setError(null);
    try {
      await pamApi.deleteCiOidcBinding(projectId);
      setBoundRepository(null);
      setRepository('');
      setMessage(tt.ciOidcCleared);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setSaving(false);
    }
  };

  const audienceHint = tt.ciOidcAudienceHint.replace(
    '{{audience}}',
    audience || '—'
  );

  return (
    <PAMSettingsCard
      testId="PAMSettingsCard-ci-oidc"
      title={tt.ciOidcTitle}
      description={tt.ciOidcDesc}
      saveLabel={tt.ciOidcSave}
      savingLabel={tt.formSaveing}
      showSave={canEdit}
      savePermission={PermissionKey.pam_project_edit}
      saving={saving}
      saveDisabled={
        loading ||
        !canEdit ||
        repository.trim() === '' ||
        repository.trim() === (boundRepository ?? '')
      }
      onSave={() => void handleSave()}
    >
      <div
        data-testid="PAMProjectCiOidcSection"
        className="flex flex-col gap-3"
      >
        <label className="flex flex-col gap-1 text-sm text-secondary-text">
          <span>{tt.ciOidcRepoLabel}</span>
          <input
            type="text"
            value={repository}
            readOnly={!canEdit || loading}
            onChange={(e) => setRepository(e.target.value)}
            placeholder={tt.ciOidcRepoPlaceholder}
            className={pamFormFieldClass}
            autoComplete="off"
          />
        </label>
        <p className="text-xs text-secondary-text">{audienceHint}</p>
        {canEdit && boundRepository ? (
          <button
            type="button"
            disabled={saving || loading}
            onClick={() => void handleClear()}
            className="self-start rounded-[10px] border border-primary-border px-3 py-1.5 text-sm text-secondary-text hover:text-primary-text"
          >
            {tt.ciOidcClear}
          </button>
        ) : null}
        {message ? (
          <p className="text-sm text-brand" role="status">
            {message}
          </p>
        ) : null}
        {error ? (
          <p className="text-sm text-danger" role="alert">
            {error}
          </p>
        ) : null}
      </div>
    </PAMSettingsCard>
  );
}
