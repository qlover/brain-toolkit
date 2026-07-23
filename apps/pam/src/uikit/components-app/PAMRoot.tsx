'use client';

import { useMountedClient } from '@brain-toolkit/react-kit';
import { ArrowPathIcon, CheckIcon } from '@heroicons/react/24/outline';
import { PAMFacade } from '@/impls/PAMfacade';
import { PAMFacadeInfinite } from '@/impls/PAMFacadeInfinite';
import { PAMViewMode } from '@/interface/PAMFacadeInterface';
import type { PAMI18nInterface } from '@config/i18n-mapping/PAMI18n';
import { I } from '@config/ioc-identifiter';
import type { PAMProjectUpdate } from '@schemas/PAMProjectSchema';
import { PAMForm, PAM_PROJECT_FORM_ID } from '../components/pam/PAMForm';
import { PAMLoadMoreTrigger } from '../components/pam/PAMLoadMoreTrigger';
import { PAMProjectList } from '../components/pam/PAMProjectList';
import { PAMToolbar } from '../components/pam/PAMToolbar';
import { ResponsiveModal } from '../components/ResponsiveModal';
import { usePageI18nMapping } from '../context/PageI18nContext';
import { useIOC } from '../hook/useIOC';
import { useStore } from '../hook/useStore';
import { useUserAuth } from '../hook/useUserAuth';

export function PAMRoot() {
  const tt = usePageI18nMapping<PAMI18nInterface>();
  const mounted = useMountedClient();
  const { success: isAuthenticated } = useUserAuth();

  const dialog = useIOC(I.DialogHandler);
  const pamFacade = useIOC(PAMFacade);
  const pamFacadeInfinite = useIOC(PAMFacadeInfinite);
  const pamFacadeStore = pamFacade.getFacadeStore();
  const createState = useStore(pamFacade.getCreateStore());
  const detailState = useStore(pamFacade.getDetailStore());
  const editProject = detailState.result;
  const isEditMode = Boolean(editProject);
  const isSubmitting = createState.loading;

  const projects = useStore(pamFacadeStore, (state) => state.projects || []);
  const listLoading = useStore(pamFacadeStore, (state) => state.loading);
  const persistedViewMode = useStore(pamFacadeStore, (state) => state.viewMode);
  const openDialog = useStore(pamFacadeStore, (state) => state.openDialog);

  // Keep SSR + first client paint on Compact; apply persisted mode after mount.
  const viewMode = mounted ? persistedViewMode : PAMViewMode.Compact;

  const closeDialog = () => pamFacade.closeDialog();

  return (
    <div
      data-testid="PAMRoot"
      className="mx-auto w-full max-w-7xl px-3 py-4 sm:px-6 md:py-8 lg:px-8"
    >
      <PAMToolbar
        tt={tt}
        facadeInterface={pamFacade}
        categoryValue={''}
        onCategoryChange={() => {
          throw new Error('Function not implemented.');
        }}
        viewMode={viewMode}
        onViewModeChange={(mode) => pamFacade.changeViewMode(mode)}
        categories={[]}
        canCreate={isAuthenticated}
        onCreate={() => {
          if (!isAuthenticated) return;
          pamFacade.openDialog();
        }}
      />

      <PAMProjectList
        tt={tt}
        projects={projects}
        viewMode={viewMode}
        loading={listLoading}
        isAuthenticated={isAuthenticated}
        isOwner={(data) => !!data.is_owner}
        onEdit={(id) => {
          if (!isAuthenticated) return;
          pamFacade.triggerEdit(id);
        }}
        onDelete={(project) => {
          if (!isAuthenticated) return;
          dialog.confirm({
            okType: 'danger',
            title: tt.deleteProjectTitle,
            content: tt.deleteProjectContent.replace('[name]', project.name),
            onOk: () => pamFacade.deleteProject(project)
          });
        }}
      />

      <PAMLoadMoreTrigger
        loadingText={tt.loadingText}
        noMoreText={tt.noMoreText}
        errorText={tt.errorText}
        loadMoreText={tt.loadMoreText}
        infiniteFacade={pamFacadeInfinite}
      />

      <ResponsiveModal
        open={isAuthenticated && openDialog}
        title={isEditMode ? tt.editProjectTitle : tt.createProjectTitle}
        onClose={closeDialog}
        footer={
          <div className="flex flex-col-reverse items-stretch gap-2 sm:flex-row sm:items-center sm:justify-end sm:gap-3">
            <button
              type="button"
              onClick={closeDialog}
              disabled={isSubmitting}
              className="w-full cursor-pointer rounded-[10px] border border-primary-border px-4 py-2.5 text-sm text-secondary-text transition hover:bg-elevated disabled:opacity-50 sm:w-auto sm:px-6 sm:py-3 sm:text-base"
            >
              {tt.formCancel}
            </button>
            <button
              type="submit"
              form={PAM_PROJECT_FORM_ID}
              disabled={isSubmitting}
              className="flex w-full cursor-pointer items-center justify-center gap-2 rounded-[10px] bg-brand px-4 py-2.5 text-sm font-medium text-on-brand shadow-sm transition hover:bg-brand-hover active:bg-brand-active disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto sm:min-w-35 sm:px-6 sm:py-3 sm:text-base"
            >
              {isSubmitting ? (
                <>
                  <ArrowPathIcon className="h-4 w-4 animate-spin" />
                  {tt.formSaveing}
                </>
              ) : (
                <>
                  <CheckIcon className="h-4 w-4" />
                  {isEditMode ? tt.formEdit : tt.formSave}
                </>
              )}
            </button>
          </div>
        }
      >
        <PAMForm
          tt={tt}
          formId={PAM_PROJECT_FORM_ID}
          showActions={false}
          initialData={editProject ?? undefined}
          mode={isEditMode ? 'edit' : 'create'}
          isSubmitting={isSubmitting}
          onCancel={closeDialog}
          onSubmit={(data) => {
            if (isEditMode && editProject?.id) {
              pamFacade.updateProject(editProject.id, data as PAMProjectUpdate);
            } else {
              pamFacade.createProject(data);
            }
          }}
        />
      </ResponsiveModal>
    </div>
  );
}
