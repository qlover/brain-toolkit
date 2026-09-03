'use client';

import {
  ClipboardDocumentIcon,
  LockClosedIcon,
  LockOpenIcon
} from '@heroicons/react/24/outline';
import { useStore, usePageI18nMapping } from '@qlover/next-kit/client';
import { clsx } from 'clsx';
import React, { useEffect, useState } from 'react';
import { useRouter } from '@/i18n/routing';
import { PAMApi } from '@/impls/appApi/PAMApi';
import { PAMFacade } from '@/impls/PAMfacade';
import { usePAMProjectDetail } from '@/uikit/components-app/pam/PAMProjectDetailShell';
import { useIOC } from '@/uikit/hook/useIOC';
import type { PAMGeneralI18nInterface } from '@config/i18n-mapping/PAMGeneralI18n';
import { I } from '@config/ioc-identifiter';
import { ROUTE_PROJECT_GENERAL, ROUTE_PROJECTS } from '@config/route';
import {
  PAMPublicType,
  type PAMProjectDetail,
  type PAMProjectUpdate
} from '@schemas/PAMProjectSchema';
import type { PAMAuthUserSummary } from '@schemas/PAMProjectSchema';
import { PAMProjectCollaboratorsPanel } from './PAMProjectCollaboratorsPanel';
import {
  PAMProjectTransferPicker,
  prefetchTransferUsers
} from './PAMProjectTransferPicker';
import { PAMCategoryField } from '../../components/pam/PAMCategoryField';
import {
  pamFormFieldClass,
  pamFormTextareaClass
} from '../../components/pam/PAMFormFieldStyles';
import { getPAMPrimaryUrl } from '../../components/pam/PAMProjectDisplayUtil';
import { PAMSettingsCard } from '../../components/pam/PAMSettingsCard';

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
  projectId: _routeProjectId
}: PAMProjectGeneralPanelProps) {
  const tt = usePageI18nMapping<PAMGeneralI18nInterface>();
  const router = useRouter();
  const pamApi = useIOC(PAMApi);
  const pamFacade = useIOC(PAMFacade);
  const dialogHandler = useIOC(I.DialogHandler);
  const {
    project,
    projectId,
    loading,
    error: loadError,
    canEdit,
    canManageCollaborators,
    deleting,
    requestDeleteProject,
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
  const [transferOpen, setTransferOpen] = useState(false);
  const [transferring, setTransferring] = useState(false);
  const [transferUsersWarm, setTransferUsersWarm] = useState<
    PAMAuthUserSummary[] | undefined
  >(undefined);
  const [capturingPreview, setCapturingPreview] = useState(false);
  const categories = useStore(
    pamFacade.getFacadeStore(),
    (state) => state.categories
  );

  const warmTransferUsers = () => {
    void prefetchTransferUsers(pamApi)
      .then(setTransferUsersWarm)
      .catch(() => undefined);
  };

  useEffect(() => {
    if (!project) {
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
  }, [project]);

  const saveField = async (
    field: GeneralFieldKeyType,
    patch: Partial<PAMProjectUpdate>
  ): Promise<void> => {
    if (!project || !canEdit || !projectId) {
      return;
    }
    const previousSlug = project.slug;
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
      if (field === 'category') {
        void pamFacade.pullCategories({ force: true });
      }
      if (field === 'slug' && saved.slug && saved.slug !== previousSlug) {
        router.replace({
          pathname: ROUTE_PROJECT_GENERAL,
          params: { projectId: saved.slug }
        });
      }
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
        testId="PAMSettingsCard-preview-image"
        title={tt.labelPreviewImage}
        description={tt.descPreviewImage}
        showSave={false}
      >
        {ready ? (
          <div className="flex flex-col gap-3">
            {project.preview_image_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={project.preview_image_url}
                alt=""
                className="aspect-video w-full rounded-lg border border-primary-border object-cover bg-elevated"
                data-testid="PAMProjectPreviewImage"
              />
            ) : (
              <div
                className="flex aspect-video w-full items-center justify-center rounded-lg border border-dashed border-primary-border bg-elevated/40 text-sm text-secondary-text"
                data-testid="PAMProjectPreviewEmpty"
              >
                —
              </div>
            )}
            <p className="text-xs text-secondary-text">
              {tt.previewSource}:{' '}
              <span className="break-all text-primary-text">
                {getPAMPrimaryUrl(project.environments, project.repo_url) ||
                  tt.previewNoUrl}
              </span>
            </p>
            {canEdit ? (
              <button
                type="button"
                data-testid="PAMProjectPreviewCapture"
                disabled={
                  capturingPreview ||
                  !getPAMPrimaryUrl(project.environments, project.repo_url)
                }
                onClick={() => {
                  if (!projectId) return;
                  setCapturingPreview(true);
                  void pamApi
                    .refreshPreviewImage(projectId)
                    .then((saved) => {
                      setProject(saved);
                      dialogHandler.success(tt.settingsSave);
                    })
                    .finally(() => setCapturingPreview(false));
                }}
                className={clsx(
                  'inline-flex cursor-pointer items-center justify-center rounded-lg border border-primary-border bg-elevated px-4 py-2 text-sm font-semibold text-primary-text transition',
                  'hover:bg-primary disabled:cursor-not-allowed disabled:opacity-60 touch-manipulation'
                )}
              >
                {capturingPreview
                  ? tt.previewCapturing
                  : project.preview_image_url
                    ? tt.previewRefresh
                    : tt.previewCapture}
              </button>
            ) : null}
          </div>
        ) : (
          <SettingsFieldSkeleton />
        )}
      </PAMSettingsCard>

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
          <PAMCategoryField
            value={category}
            disabled={fieldReadOnly}
            onChange={setCategory}
            extras={categories}
            labels={{
              labelUnCategory: tt.labelUnCategory,
              categoryCustom: tt.categoryCustom,
              categoryCustomPlaceholder: tt.categoryCustomPlaceholder
            }}
          />
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

      {project?.can_edit && ready ? (
        <PAMProjectCollaboratorsPanel tt={tt} />
      ) : null}

      {canManageCollaborators && ready ? (
        <PAMSettingsCard
          testId="PAMSettingsCard-transfer"
          title={tt.transferZoneTitle}
          description={tt.transferZoneDesc}
          showSave={false}
        >
          <button
            type="button"
            data-testid="PAMProjectGeneralTransferButton"
            disabled={transferring}
            onMouseEnter={warmTransferUsers}
            onFocus={warmTransferUsers}
            onClick={() => {
              warmTransferUsers();
              setTransferOpen(true);
            }}
            className={clsx(
              'inline-flex cursor-pointer items-center justify-center rounded-lg border border-amber-500/30 bg-amber-500/5 px-4 py-2 text-sm font-semibold text-amber-700 transition',
              'hover:bg-amber-500/10 disabled:cursor-not-allowed disabled:opacity-60 touch-manipulation dark:text-amber-300'
            )}
          >
            {tt.transferStart}
          </button>
          <PAMProjectTransferPicker
            open={transferOpen}
            onClose={() => setTransferOpen(false)}
            title={tt.transferPickerTitle}
            searchPlaceholder={tt.transferSearchPlaceholder}
            loadingText={tt.transferLoading}
            emptyText={tt.transferEmpty}
            confirmText={tt.transferSubmit}
            confirmHintTemplate={tt.transferContent}
            projectName={project?.name ?? ''}
            transferring={transferring}
            initialUsers={transferUsersWarm}
            onConfirm={async (user: PAMAuthUserSummary) => {
              if (!project || !projectId) return;
              setTransferring(true);
              try {
                await pamApi.transferProject(projectId, {
                  user_id: user.id
                });
                setTransferOpen(false);
                dialogHandler.success(tt.transferSuccess);
                void pamFacade.invalidateHomeProjectList();
                router.replace(ROUTE_PROJECTS);
              } finally {
                setTransferring(false);
              }
            }}
          />
        </PAMSettingsCard>
      ) : null}

      {canManageCollaborators && ready ? (
        <PAMSettingsCard
          testId="PAMSettingsCard-delete"
          title={tt.deleteZoneTitle}
          description={tt.deleteZoneDesc}
          showSave={false}
        >
          <button
            type="button"
            data-testid="PAMProjectGeneralDeleteButton"
            disabled={deleting}
            onClick={requestDeleteProject}
            className={clsx(
              'inline-flex cursor-pointer items-center justify-center rounded-lg border border-red-500/30 bg-red-500/5 px-4 py-2 text-sm font-semibold text-red-600 transition',
              'hover:bg-red-500/10 disabled:cursor-not-allowed disabled:opacity-60 touch-manipulation'
            )}
          >
            {tt.deleteProject}
          </button>
        </PAMSettingsCard>
      ) : null}
    </div>
  );
}
