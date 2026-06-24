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
        <Button
          onClick={() => {
            pamFacadeStore.update({
              openDialog: true
            });
          }}
        >
          新建
        </Button>
      </div>
      <PAMProjectList
        projects={projects}
        viewMode={viewMode}
        isOwner={() => {
          return false;
        }}
        onEdit={function (id: string): void {
          throw new Error('Function not implemented.');
        }}
        onDelete={function (id: string): void {
          throw new Error('Function not implemented.');
        }}
        onManageEnv={function (id: string): void {
          throw new Error('Function not implemented.');
        }}
      />

      <ResponsiveModal
        open={openDialog}
        onClose={() => {
          pamFacadeStore.update({
            openDialog: false
          });
        }}
      >
        <PAMForm
          isSubmitting={createState.loading}
          onSubmit={(data) => {
            pamFacade.createProject(data);
          }}
          onCancel={() => {
            pamFacadeStore.update({
              openDialog: false
            });
          }}
        />
      </ResponsiveModal>
    </div>
  );
}
