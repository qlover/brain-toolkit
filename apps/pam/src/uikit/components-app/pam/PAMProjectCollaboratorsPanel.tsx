'use client';

import { clsx } from 'clsx';
import { useCallback, useEffect, useState } from 'react';
import { PAMApi } from '@/impls/appApi/PAMApi';
import { PAMSettingsCard } from '@/uikit/components/pam/PAMSettingsCard';
import { usePAMProjectDetail } from '@/uikit/components-app/pam/PAMProjectDetailShell';
import {
  PAMProjectTransferPicker,
  prefetchTransferUsers
} from '@/uikit/components-app/pam/PAMProjectTransferPicker';
import { useIOC } from '@/uikit/hook/useIOC';
import type { PAMGeneralI18nInterface } from '@config/i18n-mapping/PAMGeneralI18n';
import { I } from '@config/ioc-identifiter';
import type {
  PAMProjectCollaboratorItem,
  PAMProjectCollaboratorRole
} from '@schemas/PAMProjectCollaboratorSchema';
import type { PAMAuthUserSummary } from '@schemas/PAMProjectSchema';

export type PAMProjectCollaboratorsPanelProps = {
  readonly tt: PAMGeneralI18nInterface;
};

function RoleToggle({
  value,
  disabled,
  busy,
  memberLabel,
  adminLabel,
  updatingLabel,
  onChange
}: {
  value: PAMProjectCollaboratorRole;
  disabled?: boolean;
  busy?: boolean;
  memberLabel: string;
  adminLabel: string;
  updatingLabel: string;
  onChange: (role: PAMProjectCollaboratorRole) => void;
}) {
  const btnClass = (active: boolean) =>
    clsx(
      'relative min-w-[4.5rem] rounded-md px-2.5 py-1 text-xs font-medium transition',
      active
        ? 'bg-brand text-on-brand shadow-sm'
        : 'text-secondary-text hover:bg-elevated hover:text-primary-text',
      (disabled || busy) && 'cursor-not-allowed opacity-60'
    );

  return (
    <div data-testid="RoleToggle" className="inline-flex items-center gap-2">
      <div
        role="group"
        aria-label="role"
        className="inline-flex rounded-lg border border-primary-border bg-bg-container p-0.5"
      >
        <button
          type="button"
          disabled={disabled || busy}
          aria-pressed={value === 'member'}
          className={btnClass(value === 'member')}
          onClick={() => {
            if (value !== 'member') onChange('member');
          }}
        >
          {memberLabel}
        </button>
        <button
          type="button"
          disabled={disabled || busy}
          aria-pressed={value === 'admin'}
          className={btnClass(value === 'admin')}
          onClick={() => {
            if (value !== 'admin') onChange('admin');
          }}
        >
          {adminLabel}
        </button>
      </div>
      {busy ? (
        <span className="inline-flex items-center gap-1 text-xs text-secondary-text">
          <span
            className="inline-block size-3.5 shrink-0 animate-spin rounded-full border-2 border-current border-t-transparent"
            aria-hidden
          />
          {updatingLabel}
        </span>
      ) : null}
    </div>
  );
}

/**
 * Project collaborators list + add/remove (admin/owner manage).
 * Role changes stay in-place with spinner + success toast.
 */
export function PAMProjectCollaboratorsPanel({
  tt
}: PAMProjectCollaboratorsPanelProps) {
  const pamApi = useIOC(PAMApi);
  const dialog = useIOC(I.DialogHandler);
  const { projectId, project, canManageCollaborators } = usePAMProjectDetail();

  const [items, setItems] = useState<PAMProjectCollaboratorItem[]>([]);
  const [initialLoading, setInitialLoading] = useState(false);
  const [busyUserId, setBusyUserId] = useState<string | null>(null);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [adding, setAdding] = useState(false);
  const [addRole, setAddRole] = useState<PAMProjectCollaboratorRole>('member');
  const [warmUsers, setWarmUsers] = useState<
    PAMAuthUserSummary[] | undefined
  >();

  const loadList = useCallback(async () => {
    if (!projectId) return;
    setInitialLoading(true);
    try {
      const list = await pamApi.listCollaborators(projectId);
      setItems(list);
    } finally {
      setInitialLoading(false);
    }
  }, [pamApi, projectId]);

  useEffect(() => {
    if (!projectId || !project?.can_edit) {
      return;
    }
    void loadList();
  }, [projectId, project?.can_edit, loadList]);

  const warmUsersList = useCallback(() => {
    void prefetchTransferUsers(pamApi).then(setWarmUsers);
  }, [pamApi]);

  const refreshQuietly = useCallback(async () => {
    if (!projectId) return;
    const list = await pamApi.listCollaborators(projectId);
    setItems(list);
  }, [pamApi, projectId]);

  const onRoleChange = useCallback(
    async (userId: string, role: PAMProjectCollaboratorRole) => {
      if (!projectId || busyUserId) return;

      const label = role === 'admin' ? tt.collabRoleAdmin : tt.collabRoleMember;

      setItems((prev) =>
        prev.map((item) => (item.user_id === userId ? { ...item, role } : item))
      );
      setBusyUserId(userId);
      try {
        const updated = await pamApi.updateCollaboratorRole(projectId, userId, {
          role
        });
        setItems((prev) =>
          prev.map((item) =>
            item.user_id === userId ? { ...item, ...updated } : item
          )
        );
        dialog.success(`${tt.collabRoleUpdateSuccess} · ${label}`);
      } catch (error) {
        await refreshQuietly();
        throw error;
      } finally {
        setBusyUserId(null);
      }
    },
    [
      busyUserId,
      dialog,
      pamApi,
      projectId,
      refreshQuietly,
      tt.collabRoleAdmin,
      tt.collabRoleMember,
      tt.collabRoleUpdateSuccess
    ]
  );

  if (!project?.can_edit) {
    return null;
  }

  const showInitialLoading = initialLoading && items.length === 0;
  const anyBusy = busyUserId !== null || adding;

  return (
    <PAMSettingsCard
      testId="PAMSettingsCard-collaborators"
      title={tt.collabTitle}
      description={tt.collabDesc}
      showSave={false}
    >
      <div className="space-y-3" data-testid="PAMProjectCollaboratorsPanel">
        <div className="rounded-lg border border-primary-border px-3 py-2 text-sm">
          <div className="flex items-center justify-between gap-2">
            <span className="text-primary-text truncate font-medium">
              {tt.collabRoleOwner}
            </span>
            <span className="shrink-0 rounded bg-elevated px-1.5 py-0.5 text-xs text-secondary-text">
              {tt.collabRoleOwner}
            </span>
          </div>
        </div>

        {showInitialLoading ? (
          <p className="text-sm text-secondary-text">{tt.collabLoading}</p>
        ) : items.length === 0 ? (
          <p className="text-sm text-secondary-text">{tt.collabEmpty}</p>
        ) : (
          <ul className="space-y-2">
            {items.map((item) => {
              const rowBusy = busyUserId === item.user_id;
              return (
                <li
                  data-testid="PAMProjectCollaboratorsPanel"
                  key={item.id}
                  className={clsx(
                    'flex flex-col gap-2 rounded-lg border border-primary-border px-3 py-2.5 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between',
                    rowBusy && 'border-brand/40 bg-brand/5'
                  )}
                >
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-primary-text">
                      {item.email || item.user_id}
                    </p>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    {canManageCollaborators ? (
                      <RoleToggle
                        value={item.role}
                        busy={rowBusy}
                        disabled={anyBusy && !rowBusy}
                        memberLabel={tt.collabRoleMember}
                        adminLabel={tt.collabRoleAdmin}
                        updatingLabel={tt.collabRoleUpdating}
                        onChange={(role) => {
                          void onRoleChange(item.user_id, role);
                        }}
                      />
                    ) : (
                      <span className="rounded-md bg-elevated px-2 py-1 text-xs text-secondary-text">
                        {item.role === 'admin'
                          ? tt.collabRoleAdmin
                          : tt.collabRoleMember}
                      </span>
                    )}
                    {canManageCollaborators ? (
                      <button
                        type="button"
                        disabled={anyBusy}
                        className="text-xs font-medium text-red-600 hover:underline disabled:opacity-50"
                        onClick={() => {
                          dialog.confirm({
                            okType: 'danger',
                            title: tt.collabRemoveTitle,
                            content: tt.collabRemoveContent.replace(
                              '[email]',
                              item.email || item.user_id
                            ),
                            onOk: async () => {
                              setBusyUserId(item.user_id);
                              try {
                                await pamApi.removeCollaborator(
                                  projectId,
                                  item.user_id
                                );
                                setItems((prev) =>
                                  prev.filter(
                                    (row) => row.user_id !== item.user_id
                                  )
                                );
                                dialog.success(tt.collabRemoveSuccess);
                              } finally {
                                setBusyUserId(null);
                              }
                            }
                          });
                        }}
                      >
                        {tt.collabRemove}
                      </button>
                    ) : null}
                  </div>
                </li>
              );
            })}
          </ul>
        )}

        {canManageCollaborators ? (
          <div className="flex flex-wrap items-center gap-2 border-t border-primary-border pt-3">
            <RoleToggle
              value={addRole}
              disabled={anyBusy}
              memberLabel={tt.collabRoleMember}
              adminLabel={tt.collabRoleAdmin}
              updatingLabel={tt.collabRoleUpdating}
              onChange={setAddRole}
            />
            <button
              type="button"
              data-testid="PAMProjectCollaboratorsAddButton"
              disabled={anyBusy}
              onMouseEnter={warmUsersList}
              onFocus={warmUsersList}
              onClick={() => {
                warmUsersList();
                setPickerOpen(true);
              }}
              className={clsx(
                'inline-flex cursor-pointer items-center justify-center rounded-lg border border-brand/30 bg-brand/5 px-4 py-2 text-sm font-semibold text-brand transition',
                'hover:bg-brand/10 disabled:cursor-not-allowed disabled:opacity-60'
              )}
            >
              {tt.collabAdd}
            </button>
          </div>
        ) : null}
      </div>

      <PAMProjectTransferPicker
        open={pickerOpen}
        onClose={() => setPickerOpen(false)}
        title={tt.collabPickerTitle}
        searchPlaceholder={tt.transferSearchPlaceholder}
        loadingText={tt.transferLoading}
        emptyText={tt.transferEmpty}
        confirmText={tt.collabAdd}
        projectName={project.name}
        transferring={adding}
        initialUsers={warmUsers}
        onConfirm={async (user: PAMAuthUserSummary) => {
          setAdding(true);
          try {
            const created = await pamApi.addCollaborator(projectId, {
              user_id: user.id,
              role: addRole
            });
            setItems((prev) =>
              prev.some((row) => row.user_id === created.user_id)
                ? prev
                : [...prev, created]
            );
            setPickerOpen(false);
            dialog.success(tt.collabAddSuccess);
          } finally {
            setAdding(false);
          }
        }}
      />
    </PAMSettingsCard>
  );
}
