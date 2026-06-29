'use client';

import { PAMFacade } from '@/impls/PAMfacade';
import { PAMFacadeInfinite } from '@/impls/PAMFacadeInfinite';
import type { PAMI18nInterface } from '@config/i18n-mapping/PAMI18n';
import { I } from '@config/ioc-identifiter';
import type { PAMProjectUpdate } from '@schemas/PAMProjectSchema';
import { PAMForm } from '../components/pam/PAMForm';
import { PAMLoadMoreTrigger } from '../components/pam/PAMLoadMoreTrigger';
import { PAMPageHeader } from '../components/pam/PAMPageHeader';
import { PAMProjectList } from '../components/pam/PAMProjectList';
import { PAMToolbar } from '../components/pam/PAMToolbar';
import { ResponsiveModal } from '../components/ResponsiveModal';
import { usePageI18nMapping } from '../context/PageI18nContext';
import { useIOC } from '../hook/useIOC';
import { useStore } from '../hook/useStore';

export function PAMRoot() {
  const tt = usePageI18nMapping<PAMI18nInterface>();

  const dialog = useIOC(I.DialogHandler);
  const pamFacade = useIOC(PAMFacade);
  const pamFacadeInfinite = useIOC(PAMFacadeInfinite);
  const pamFacadeStore = pamFacade.getFacadeStore();
  const createState = useStore(pamFacade.getCreateStore());
  const detailState = useStore(pamFacade.getDetailStore());
  const editProject = detailState.result;
  const isEditMode = Boolean(editProject);

  const projects = useStore(pamFacadeStore, (state) => state.projects || []);
  const listLoading = useStore(pamFacadeStore, (state) => state.loading);
  const viewMode = useStore(pamFacadeStore, (state) => state.viewMode);
  const openDialog = useStore(pamFacadeStore, (state) => state.openDialog);

  return (
    <div
      data-testid="PAMRoot"
      className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-4 md:py-8 w-full"
    >
      <PAMPageHeader tt={tt} onCreate={() => pamFacade.openDialog()} />

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
      />

      <PAMProjectList
        tt={tt}
        projects={projects}
        viewMode={viewMode}
        loading={listLoading}
        isOwner={(data) => !!data.is_owner}
        onEdit={(id) => pamFacade.triggerEdit(id)}
        onDelete={(project) => {
          dialog.confirm({
            type: 'error',
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
        open={openDialog}
        title={isEditMode ? tt.editProjectTitle : tt.createProjectTitle}
        onClose={() => pamFacade.closeDialog()}
      >
        <PAMForm
          tt={tt}
          initialData={editProject ?? undefined}
          mode={isEditMode ? 'edit' : 'create'}
          isSubmitting={createState.loading}
          onCancel={() => pamFacade.closeDialog()}
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
