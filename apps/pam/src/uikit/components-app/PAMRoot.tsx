'use client';

import { Button } from 'antd';
import { useEffect } from 'react';
import { PAMFacade } from '@/impls/PAMfacade';
import { PAMForm } from '../components/pam/PAMForm';
import { PAMProjectList } from '../components/pam/PAMProjectList';
import { ResponsiveModal } from '../components/ResponsiveModal';
import { useIOC } from '../hook/useIOC';
import { useStore } from '../hook/useStore';

export function PAMRoot() {
  const pamFacade = useIOC(PAMFacade);
  const pamFacadeStore = pamFacade.getFacadeStore();
  const createState = useStore(pamFacade.getCreateStore());
  const detailState = useStore(pamFacade.getDetailStore());
  const editProject = detailState.result;
  const isEditMode = Boolean(editProject);

  const projects = useStore(
    pamFacadeStore,
    (state) => state.result?.items || []
  );
  const viewMode = useStore(pamFacadeStore, (state) => state.viewMode);
  const openDialog = useStore(pamFacadeStore, (state) => state.openDialog);

  useEffect(() => {
    pamFacade.pullProjectList();
  }, [pamFacade]);

  return (
    <div
      data-testid="PAMRoot"
      className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 md:py-8 w-full"
    >
      <div>
        <Button onClick={() => pamFacade.openDialog()}>新建</Button>
      </div>
      <PAMProjectList
        projects={projects}
        viewMode={viewMode}
        isOwner={(data) => !!data.is_owner}
        onEdit={(id) => pamFacade.triggerEdit(id)}
        onDelete={() => {
          throw new Error('Function not implemented.');
        }}
        onManageEnv={() => {
          throw new Error('Function not implemented.');
        }}
      />

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
              pamFacade.updateProject(editProject.id, data);
            } else {
              pamFacade.createProject(data);
            }
          }}
        />
      </ResponsiveModal>
    </div>
  );
}
