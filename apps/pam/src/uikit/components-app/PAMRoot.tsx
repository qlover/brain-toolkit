'use client';

import { PAMFacade } from '@/impls/PAMfacade';
import { PAMFacadeInfinite } from '@/impls/PAMFacadeInfinite';
import { I } from '@config/ioc-identifiter';
import type { PAMProjectUpdate } from '@schemas/PAMProjectSchema';
import { PAMForm } from '../components/pam/PAMForm';
import { PAMLoadMoreTrigger } from '../components/pam/PAMLoadMoreTrigger';
import { PAMProjectList } from '../components/pam/PAMProjectList';
import { PAMToolbar } from '../components/pam/PAMToolbar';
import { ResponsiveModal } from '../components/ResponsiveModal';
import { useIOC } from '../hook/useIOC';
import { useStore } from '../hook/useStore';

export function PAMRoot() {
  const dialog = useIOC(I.DialogHandler);
  const pamFacade = useIOC(PAMFacade);
  const pamFacadeInfinite = useIOC(PAMFacadeInfinite);
  const pamFacadeStore = pamFacade.getFacadeStore();
  const createState = useStore(pamFacade.getCreateStore());
  const detailState = useStore(pamFacade.getDetailStore());
  const editProject = detailState.result;
  const isEditMode = Boolean(editProject);

  const projects = useStore(pamFacadeStore, (state) => state.projects || []);
  const viewMode = useStore(pamFacadeStore, (state) => state.viewMode);
  const openDialog = useStore(pamFacadeStore, (state) => state.openDialog);

  return (
    <div
      data-testid="PAMRoot"
      className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 md:py-8 w-full"
    >
      <PAMToolbar
        searchValue={''}
        onCreate={() => pamFacade.openDialog()}
        onSearchChange={() => {
          throw new Error('Function not implemented.');
        }}
        categoryValue={''}
        onCategoryChange={() => {
          throw new Error('Function not implemented.');
        }}
        viewMode={viewMode}
        onViewModeChange={(mode) => pamFacade.changeViewMode(mode)}
        categories={[]}
      />

      <PAMProjectList
        projects={projects}
        viewMode={viewMode}
        isOwner={(data) => !!data.is_owner}
        onEdit={(id) => pamFacade.triggerEdit(id)}
        onDelete={(project) => {
          dialog.confirm({
            type: 'error',
            title: '删除项目',
            content: '确定是否删除: ' + project.name,
            onOk: () => pamFacade.deleteProject(project)
          });
        }}
      />

      <PAMLoadMoreTrigger infiniteFacade={pamFacadeInfinite} />

      <ResponsiveModal
        open={openDialog}
        title={isEditMode ? '编辑项目' : '新建项目'}
        onClose={() => pamFacade.closeDialog()}
      >
        <PAMForm
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
