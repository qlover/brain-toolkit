'use client';

import {
  ClipboardDocumentIcon,
  LockClosedIcon,
  LockOpenIcon
} from '@heroicons/react/24/outline';
import { clsx } from 'clsx';
import React, { useEffect, useState } from 'react';
import { PAMApi } from '@/impls/appApi/PAMApi';
import { usePAMProjectDetail } from '@/uikit/components-app/pam/PAMProjectDetailShell';
import { useIOC } from '@/uikit/hook/useIOC';
import type { PAMGeneralI18nInterface } from '@config/i18n-mapping/PAMGeneralI18n';
import { I } from '@config/ioc-identifiter';
import {
  PAMPublicType,
  type PAMProjectDetail,
  type PAMProjectUpdate
} from '@schemas/PAMProjectSchema';
import {
  pamFormFieldClass,
  pamFormSelectClass,
  pamFormTextareaClass
} from '../../components/pam/PAMFormFieldStyles';
import { PAMSettingsCard } from '../../components/pam/PAMSettingsCard';
import { usePageI18nMapping } from '../../context/PageI18nContext';

export type PAMProjectGeneralPanelProps = {
  readonly projectId: string;
};

type GeneralFieldKeyType =
  | 'name'
  | 'slug'
  | 'is_public'
  | 'category'
  | 'description'
  | 'stack'
  | 'repo_url';

function SettingsFieldSkeleton(): React.ReactElement {
  return (
    <div
      data-testid="PAMSettingsFieldSkeleton"
      className="h-10 w-full animate-pulse rounded-[10px] bg-elevated"
    />
  );
}

function applyDetailToFields(
  detail: PAMProjectDetail,
  setters: {
    setName: (v: string) => void;
    setSlug: (v: string) => void;
    setIsPublic: (v: 0 | 1) => void;
    setCategory: (v: string) => void;
    setDescription: (v: string) => void;
    setStack: (v: string) => void;
    setRepoUrl: (v: string) => void;
  }
): void {
  setters.setName(detail.name ?? '');
  setters.setSlug(detail.slug ?? '');
  setters.setIsPublic(detail.is_public ?? PAMPublicType.private);
  setters.setCategory(detail.category ?? '');
  setters.setDescription(detail.description ?? '');
  setters.setStack(detail.stack ?? '');
  setters.setRepoUrl(detail.repo_url ?? '');
}

/**
 * Project general tab — Vercel-style one-card-per-field settings.
 *
 * Significance: Atomic updates for safer edits than a whole-form save.
 * Core idea: Reuse Shell-loaded project; each card saves one field.
 * Main function: Patch one field at a time via updateProject.
 * Main purpose: Clear general settings UX on the detail page.
 *
 * @example
 * <PAMProjectGeneralPanel projectId={projectId} />
 */
export function PAMProjectGeneralPanel({
  projectId
}: PAMProjectGeneralPanelProps) {
  const tt = usePageI18nMapping<PAMGeneralI18nInterface>();
  const pamApi = useIOC(PAMApi);
  const dialogHandler = useIOC(I.DialogHandler);
  const {
    project,
    loading,
    error: loadError,
    canEdit,
    setProject
  } = usePAMProjectDetail();

  const [savingField, setSavingField] = useState<GeneralFieldKeyType | null>(
    null
  );

  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [isPublic, setIsPublic] = useState<0 | 1>(PAMPublicType.private);
  const [category, setCategory] = useState('');
  const [description, setDescription] = useState('');
  const [stack, setStack] = useState('');
  const [repoUrl, setRepoUrl] = useState('');

  useEffect(() => {
    if (!project || project.id !== projectId) {
      return;
    }
    applyDetailToFields(project, {
      setName,
      setSlug,
      setIsPublic,
      setCategory,
      setDescription,
      setStack,
      setRepoUrl
    });
  }, [project, projectId]);

  const saveField = async (
    field: GeneralFieldKeyType,
    patch: Partial<PAMProjectUpdate>
  ): Promise<void> => {
    if (!project || !canEdit) {
      return;
    }
    setSavingField(field);
    try {
      const { environments: _environments, ...basics } = project;
      const saved = await pamApi.updateProject(projectId, {
        ...basics,
        ...patch,
        id: projectId
      });
      setProject(saved);
      dialogHandler.success(tt.settingsSave);
    } catch {
      // DialogErrorPlugin already toasts API failures.
    } finally {
      setSavingField(null);
    }
  };

  const copyProjectId = async (): Promise<void> => {
    if (!project) {
      return;
    }
    try {
      await navigator.clipboard.writeText(project.id);
      dialogHandler.success(tt.copied);
    } catch {
      dialogHandler.error(tt.errorText);
    }
  };

  if (loadError && !project) {
    return (
      <div
        data-testid="PAMProjectGeneralPanel"
        className="rounded-2xl border border-primary-border bg-secondary p-6 text-sm text-(--fe-color-error)"
      >
        {tt.projectNotFound}
      </div>
    );
  }

  const ready = !loading && project != null;
  const publicValue = isPublic === PAMPublicType.public;
  const fieldReadOnly = !canEdit;

  return (
    <div
      data-testid="PAMProjectGeneralPanel"
      className="mx-auto flex max-w-3xl flex-col gap-4 sm:gap-5"
    >
      <PAMSettingsCard
        testId="PAMSettingsCard-id"
        title="Project ID"
        description={tt.descProjectId}
        showSave={false}
        footerLeft={tt.descProjectId}
      >
        {ready ? (
          <div className="flex items-stretch gap-2">
            <input
              readOnly
              value={project.id}
              className={clsx(
                pamFormFieldClass,
                'font-mono text-xs sm:text-sm'
              )}
            />
            <button
              type="button"
              onClick={() => void copyProjectId()}
              className="inline-flex shrink-0 cursor-pointer items-center justify-center rounded-[10px] border border-primary-border bg-elevated px-3 text-secondary-text transition hover:text-primary-text touch-manipulation"
              aria-label={tt.copied}
              title={tt.copyOwnerId}
            >
              <ClipboardDocumentIcon className="h-4 w-4" />
            </button>
          </div>
        ) : (
          <SettingsFieldSkeleton />
        )}
      </PAMSettingsCard>

      <PAMSettingsCard
        testId="PAMSettingsCard-name"
        title={tt.labelName}
        description={tt.descProjectName}
        saveLabel={tt.settingsSave}
        savingLabel={tt.formSaveing}
        showSave={canEdit}
        saving={savingField === 'name'}
        saveDisabled={!ready || name.trim() === '' || name === project.name}
        onSave={() => void saveField('name', { name: name.trim() })}
      >
        {ready ? (
          <input
            type="text"
            value={name}
            readOnly={fieldReadOnly}
            onChange={(e) => setName(e.target.value)}
            placeholder={tt.placeholderName}
            className={clsx(
              pamFormFieldClass,
              fieldReadOnly && 'cursor-default opacity-80'
            )}
          />
        ) : (
          <SettingsFieldSkeleton />
        )}
      </PAMSettingsCard>

      <PAMSettingsCard
        testId="PAMSettingsCard-slug"
        title={tt.labelSlug}
        description={tt.descProjectSlug}
        saveLabel={tt.settingsSave}
        savingLabel={tt.formSaveing}
        showSave={canEdit}
        saving={savingField === 'slug'}
        saveDisabled={!ready || slug.trim() === '' || slug === project.slug}
        onSave={() => void saveField('slug', { slug: slug.trim() })}
      >
        {ready ? (
          <input
            type="text"
            value={slug}
            readOnly={fieldReadOnly}
            onChange={(e) => setSlug(e.target.value)}
            placeholder={tt.placeholderSlug}
            className={clsx(
              pamFormFieldClass,
              'font-mono text-sm',
              fieldReadOnly && 'cursor-default opacity-80'
            )}
          />
        ) : (
          <SettingsFieldSkeleton />
        )}
      </PAMSettingsCard>

      <PAMSettingsCard
        testId="PAMSettingsCard-visibility"
        title={ready ? (publicValue ? tt.public : tt.private) : tt.public}
        description={tt.descProjectVisibility}
        saveLabel={tt.settingsSave}
        savingLabel={tt.formSaveing}
        showSave={canEdit}
        saving={savingField === 'is_public'}
        saveDisabled={!ready || isPublic === project.is_public}
        onSave={() => void saveField('is_public', { is_public: isPublic })}
      >
        {ready ? (
          <button
            type="button"
            disabled={fieldReadOnly}
            onClick={() =>
              setIsPublic(
                publicValue ? PAMPublicType.private : PAMPublicType.public
              )
            }
            className={clsx(
              'inline-flex items-center gap-2 rounded-[10px] border px-3 py-2 text-sm font-semibold transition touch-manipulation',
              fieldReadOnly ? 'cursor-default opacity-80' : 'cursor-pointer',
              publicValue
                ? 'border-brand/40 bg-brand/10 text-brand'
                : 'border-primary-border bg-elevated text-secondary-text hover:text-primary-text'
            )}
          >
            {publicValue ? (
              <LockOpenIcon className="h-4 w-4" />
            ) : (
              <LockClosedIcon className="h-4 w-4" />
            )}
            {publicValue ? tt.public : tt.private}
          </button>
        ) : (
          <SettingsFieldSkeleton />
        )}
      </PAMSettingsCard>

      <PAMSettingsCard
        testId="PAMSettingsCard-category"
        title={tt.labelCategory}
        description={tt.descProjectCategory}
        saveLabel={tt.settingsSave}
        savingLabel={tt.formSaveing}
        showSave={canEdit}
        saving={savingField === 'category'}
        saveDisabled={!ready || category === (project.category ?? '')}
        onSave={() => void saveField('category', { category })}
      >
        {ready ? (
          <select
            value={category}
            disabled={fieldReadOnly}
            onChange={(e) => setCategory(e.target.value)}
            className={clsx(
              pamFormSelectClass,
              fieldReadOnly && 'cursor-default opacity-80'
            )}
          >
            <option value="">{tt.labelUnCategory}</option>
            <option value="前端">前端</option>
            <option value="后端">后端</option>
            <option value="工具">工具</option>
            <option value="文档">文档</option>
            <option value="基础设施">基础设施</option>
            <option value="其他">其他</option>
          </select>
        ) : (
          <SettingsFieldSkeleton />
        )}
      </PAMSettingsCard>

      <PAMSettingsCard
        testId="PAMSettingsCard-description"
        title={tt.labelDesc}
        description={tt.descProjectDesc}
        saveLabel={tt.settingsSave}
        savingLabel={tt.formSaveing}
        showSave={canEdit}
        saving={savingField === 'description'}
        saveDisabled={
          !ready || (description || '') === (project.description || '')
        }
        onSave={() =>
          void saveField('description', { description: description || '' })
        }
      >
        {ready ? (
          <textarea
            value={description}
            readOnly={fieldReadOnly}
            onChange={(e) => setDescription(e.target.value)}
            placeholder={tt.placeholderDesc}
            rows={4}
            className={clsx(
              pamFormTextareaClass,
              fieldReadOnly && 'cursor-default opacity-80'
            )}
          />
        ) : (
          <div className="h-24 w-full animate-pulse rounded-[10px] bg-elevated" />
        )}
      </PAMSettingsCard>

      <PAMSettingsCard
        testId="PAMSettingsCard-stack"
        title={tt.labelStack}
        description={tt.descProjectStack}
        saveLabel={tt.settingsSave}
        savingLabel={tt.formSaveing}
        showSave={canEdit}
        saving={savingField === 'stack'}
        saveDisabled={!ready || (stack || '') === (project.stack || '')}
        onSave={() => void saveField('stack', { stack: stack || '' })}
      >
        {ready ? (
          <input
            type="text"
            value={stack}
            readOnly={fieldReadOnly}
            onChange={(e) => setStack(e.target.value)}
            placeholder={tt.placeholderStack}
            className={clsx(
              pamFormFieldClass,
              fieldReadOnly && 'cursor-default opacity-80'
            )}
          />
        ) : (
          <SettingsFieldSkeleton />
        )}
      </PAMSettingsCard>

      <PAMSettingsCard
        testId="PAMSettingsCard-repo"
        title={tt.labelRepo}
        description={tt.descProjectRepo}
        saveLabel={tt.settingsSave}
        savingLabel={tt.formSaveing}
        showSave={canEdit}
        saving={savingField === 'repo_url'}
        saveDisabled={!ready || (repoUrl || '') === (project.repo_url || '')}
        onSave={() => void saveField('repo_url', { repo_url: repoUrl || '' })}
      >
        {ready ? (
          <input
            type="url"
            value={repoUrl}
            readOnly={fieldReadOnly}
            onChange={(e) => setRepoUrl(e.target.value)}
            placeholder={tt.placeholderRepo}
            className={clsx(
              pamFormFieldClass,
              fieldReadOnly && 'cursor-default opacity-80'
            )}
          />
        ) : (
          <SettingsFieldSkeleton />
        )}
      </PAMSettingsCard>
    </div>
  );
}
