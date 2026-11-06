'use client';

import { usePageI18nMapping } from '@qlover/next-kit/client';
import clsx from 'clsx';
import React, { useCallback, useEffect, useState } from 'react';
import { PAMApi } from '@/impls/appApi/PAMApi';
import { useIOC } from '@/uikit/hook/useIOC';
import { PermissionKey } from '@shared/auth/permissionKeys';
import type { PAMGeneralI18nInterface } from '@config/i18n-mapping/PAMGeneralI18n';
import type { PamCiOidcProviderType } from '@schemas/PamCiOidcSchema';
import { pamFormFieldClass } from '../../components/pam/PAMFormFieldStyles';
import { PAMSettingsCard } from '../../components/pam/PAMSettingsCard';

export type PAMProjectCiOidcSectionProps = {
  readonly projectId: string;
  readonly canEdit: boolean;
};

/**
 * 项目设置：CI OIDC 绑定（GitHub Actions / Vercel）。
 */
export function PAMProjectCiOidcSection({
  projectId,
  canEdit
}: PAMProjectCiOidcSectionProps): React.ReactElement {
  const tt = usePageI18nMapping<PAMGeneralI18nInterface>();
  const pamApi = useIOC(PAMApi);
  const [provider, setProvider] = useState<PamCiOidcProviderType>('github');
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
    setMessage(null);
    try {
      const [binding, aud] = await Promise.all([
        pamApi.getCiOidcBinding(projectId, provider),
        pamApi.getCiOidcAudience(provider)
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
  }, [pamApi, projectId, provider]);

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
        provider,
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
      await pamApi.deleteCiOidcBinding(projectId, provider);
      setBoundRepository(null);
      setRepository('');
      setMessage(tt.ciOidcCleared);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setSaving(false);
    }
  };

  const isVercel = provider === 'vercel';
  const resourceLabel = isVercel ? tt.ciOidcVercelLabel : tt.ciOidcRepoLabel;
  const resourcePlaceholder = isVercel
    ? tt.ciOidcVercelPlaceholder
    : tt.ciOidcRepoPlaceholder;
  const audienceHintTemplate = isVercel
    ? tt.ciOidcVercelAudienceHint
    : tt.ciOidcAudienceHint;
  const audienceHint = audienceHintTemplate.replace(
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
        <div className="flex gap-2" role="tablist" aria-label="OIDC provider">
          {(
            [
              ['github', tt.ciOidcProviderGithub],
              ['vercel', tt.ciOidcProviderVercel]
            ] as const
          ).map(([value, label]) => (
            <button
              data-testid="PAMProjectCiOidcSection"
              key={value}
              type="button"
              role="tab"
              aria-selected={provider === value}
              disabled={loading || saving}
              onClick={() => setProvider(value)}
              className={clsx(
                'rounded-[10px] border px-3 py-1.5 text-sm',
                provider === value
                  ? 'border-brand text-brand'
                  : 'border-primary-border text-secondary-text hover:text-primary-text'
              )}
            >
              {label}
            </button>
          ))}
        </div>
        <label className="flex flex-col gap-1 text-sm text-secondary-text">
          <span>{resourceLabel}</span>
          <input
            type="text"
            value={repository}
            readOnly={!canEdit || loading}
            onChange={(e) => setRepository(e.target.value)}
            placeholder={resourcePlaceholder}
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
