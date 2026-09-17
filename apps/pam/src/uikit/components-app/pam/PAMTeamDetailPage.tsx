'use client';

import {
  asyncErrorMessage,
  runAsyncStore,
  usePendingAsyncStore,
  type AsyncState
} from '@brain-toolkit/react-kit';
import { ArrowLeftIcon, PlusIcon } from '@heroicons/react/24/outline';
import { usePageI18nMapping, useStrictEffect } from '@qlover/next-kit/client';
import { useCallback, useMemo, useState } from 'react';
import { Link, useRouter } from '@/i18n/routing';
import { PAMApi } from '@/impls/appApi/PAMApi';
import { PamTeamsApi } from '@/impls/appApi/PamTeamsApi';
import {
  pamFormFieldClass,
  pamFormLabelClass
} from '@/uikit/components/pam/PAMFormFieldStyles';
import { PAMSettingsCard } from '@/uikit/components/pam/PAMSettingsCard';
import { PamLoadingIndicator } from '@/uikit/components/PamLoadingIndicator';
import { ResponsiveModal } from '@/uikit/components/ResponsiveModal';
import { useIOC } from '@/uikit/hook/useIOC';
import { PermissionKey } from '@shared/auth/permissionKeys';
import { resolveUserDisplayLabel } from '@shared/utils/pamUserIdentity';
import type { PAMTeamsI18nInterface } from '@config/i18n-mapping/PAMTeamsI18n';
import { ROUTE_PROJECT_GENERAL, ROUTE_TEAMS, projectPath } from '@config/route';
import type { SearchPAMProject } from '@schemas/PAMProjectSchema';
import {
  isPersonalTeamSlug,
  type PamTeamDetail,
  type PamTeamMemberItem,
  type PamTeamProjectItem
} from '@schemas/PamTeamSchema';
import {
  PAMProjectTransferPicker,
  prefetchTransferUsers
} from './PAMProjectTransferPicker';

function roleLabel(tt: PAMTeamsI18nInterface, role: string): string {
  if (role === 'owner') return tt.roleOwner;
  if (role === 'admin') return tt.roleAdmin;
  return tt.roleMember;
}

export function PAMTeamDetailPage({ teamId }: { teamId: string }) {
  const tt = usePageI18nMapping<PAMTeamsI18nInterface>();
  const router = useRouter();
  const teamsApi = useIOC(PamTeamsApi);
  const pamApi = useIOC(PAMApi);
  const [detailState, detailStore] =
    usePendingAsyncStore<AsyncState<PamTeamDetail>>();
  const [success, setSuccess] = useState<string | null>(null);
  const [addOpen, setAddOpen] = useState(false);
  const [memberBusy, setMemberBusy] = useState(false);
  const [ownedProjects, setOwnedProjects] = useState<SearchPAMProject[]>([]);
  const [attachedProjects, setAttachedProjects] = useState<
    PamTeamProjectItem[]
  >([]);
  const [attachProjectId, setAttachProjectId] = useState('');
  const [attaching, setAttaching] = useState(false);
  const [dissolveOpen, setDissolveOpen] = useState(false);
  const [dissolving, setDissolving] = useState(false);

  const detail = detailState.result;
  const loading = detailState.loading;
  const error = asyncErrorMessage(detailState.error);

  const permissions = detail?.permissions ?? [];
  const canAddMember = permissions.includes(
    PermissionKey.pam_teams_members_create
  );
  const canUpdateMember = permissions.includes(
    PermissionKey.pam_teams_members_update
  );
  const canRemoveMember = permissions.includes(
    PermissionKey.pam_teams_members_delete
  );
  const canAttach = permissions.includes(
    PermissionKey.pam_teams_projects_attach
  );
  const canDissolve =
    !!detail &&
    !isPersonalTeamSlug(detail.slug) &&
    permissions.includes(PermissionKey.pam_teams_delete);

  const loadAttachedProjects = useCallback(async () => {
    try {
      setAttachedProjects(await teamsApi.listProjects(teamId));
    } catch {
      setAttachedProjects([]);
    }
  }, [teamId, teamsApi]);

  const patchMembers = useCallback(
    (updater: (members: PamTeamMemberItem[]) => PamTeamMemberItem[]) => {
      const current = detailStore.getResult();
      if (!current) return;
      detailStore.success({
        ...current,
        members: updater(current.members ?? [])
      });
    },
    [detailStore]
  );

  const load = useCallback(async () => {
    setSuccess(null);
    const next = await runAsyncStore(detailStore, teamsApi.detail(teamId), {
      keep: true,
      mapError: () => tt.error
    });
    if (next === undefined) {
      setAttachedProjects([]);
      return;
    }
    await loadAttachedProjects();
  }, [detailStore, loadAttachedProjects, teamId, teamsApi, tt.error]);

  useStrictEffect(() => {
    void load();
  }, [load]);

  useStrictEffect(() => {
    if (!canAttach) return;
    void pamApi
      .searchProjects({ page: 1, pageSize: 50 })
      .then((result) => {
        setOwnedProjects(
          (result.items ?? []).filter(
            (item) => !!(item.is_owner || item.can_edit)
          )
        );
      })
      .catch(() => setOwnedProjects([]));
  }, [canAttach, pamApi]);

  const attachCandidates = useMemo(() => {
    return ownedProjects.filter((p) => p.team_id !== teamId);
  }, [ownedProjects, teamId]);

  const handleAddMember = async (user: { id: string }) => {
    if (memberBusy) return;
    setMemberBusy(true);
    detailStore.emit({ error: null });
    try {
      const member = await teamsApi.addMember(teamId, {
        user_id: user.id,
        role: 'member'
      });
      setAddOpen(false);
      patchMembers((members) =>
        members.some((m) => m.user_id === member.user_id)
          ? members.map((m) => (m.user_id === member.user_id ? member : m))
          : [...members, member]
      );
    } catch {
      detailStore.failed(tt.error);
    } finally {
      setMemberBusy(false);
    }
  };

  const handleRoleChange = async (
    member: PamTeamMemberItem,
    role: 'admin' | 'member'
  ) => {
    if (!canUpdateMember || member.role === 'owner' || member.role === role) {
      return;
    }
    setMemberBusy(true);
    detailStore.emit({ error: null });
    try {
      const updated = await teamsApi.updateMember(teamId, member.user_id, {
        role
      });
      patchMembers((members) =>
        members.map((m) => (m.user_id === updated.user_id ? updated : m))
      );
    } catch {
      detailStore.failed(tt.error);
    } finally {
      setMemberBusy(false);
    }
  };

  const handleRemove = async (member: PamTeamMemberItem) => {
    if (!canRemoveMember || member.role === 'owner') return;
    setMemberBusy(true);
    detailStore.emit({ error: null });
    try {
      await teamsApi.removeMember(teamId, member.user_id);
      patchMembers((members) =>
        members.filter((m) => m.user_id !== member.user_id)
      );
    } catch {
      detailStore.failed(tt.error);
    } finally {
      setMemberBusy(false);
    }
  };

  const handleAttach = async () => {
    if (!attachProjectId || !canAttach || attaching) return;
    const projectId = attachProjectId;
    const candidate = ownedProjects.find((p) => p.id === projectId);
    setAttaching(true);
    detailStore.emit({ error: null });
    setSuccess(null);
    try {
      await teamsApi.attachProject(teamId, { project_id: projectId });
      setAttachProjectId('');
      setSuccess(tt.attachSuccess);
      setOwnedProjects((prev) =>
        prev.map((p) => (p.id === projectId ? { ...p, team_id: teamId } : p))
      );
      if (candidate?.owner_id) {
        const attached: PamTeamProjectItem = {
          id: candidate.id,
          name: candidate.name,
          slug: candidate.slug,
          owner_id: candidate.owner_id,
          team_id: teamId
        };
        setAttachedProjects((prev) =>
          prev.some((p) => p.id === attached.id)
            ? prev.map((p) => (p.id === attached.id ? attached : p))
            : [attached, ...prev]
        );
      } else {
        await loadAttachedProjects();
      }
    } catch {
      detailStore.failed(tt.error);
    } finally {
      setAttaching(false);
    }
  };

  const handleDissolve = async () => {
    if (!canDissolve || dissolving) return;
    setDissolving(true);
    detailStore.emit({ error: null });
    try {
      await teamsApi.dissolve(teamId);
      setDissolveOpen(false);
      router.push(ROUTE_TEAMS);
    } catch {
      detailStore.failed(tt.error);
      setDissolving(false);
    }
  };

  if (loading) {
    return (
      <div
        data-testid="PAMTeamDetailPage"
        className="flex min-h-48 items-center justify-center py-16"
      >
        <PamLoadingIndicator />
      </div>
    );
  }

  if (!detail) {
    return (
      <div
        data-testid="PAMTeamDetailPage"
        className="mx-auto max-w-3xl px-4 py-10"
      >
        <p className="text-sm text-(--fe-color-error)">{error ?? tt.error}</p>
        <Link
          href={ROUTE_TEAMS}
          className="mt-4 inline-flex items-center gap-2 text-sm text-brand"
        >
          <ArrowLeftIcon className="h-4 w-4" />
          {tt.back}
        </Link>
      </div>
    );
  }

  const members = detail.members ?? [];

  return (
    <div
      data-testid="PAMTeamDetailPage"
      className="mx-auto w-full max-w-4xl min-w-0 px-3 py-6 sm:px-6 lg:px-8"
    >
      <Link
        href={ROUTE_TEAMS}
        className="mb-4 inline-flex items-center gap-2 text-sm text-secondary-text transition hover:text-brand"
      >
        <ArrowLeftIcon className="h-4 w-4" />
        {tt.back}
      </Link>

      <header className="mb-8 border-b border-primary-border/70 pb-6">
        <h1 className="text-2xl font-semibold tracking-tight text-primary-text sm:text-3xl">
          {detail.name}
        </h1>
        <p className="mt-2 text-sm text-secondary-text">
          {detail.slug} · {tt.myRole}: {roleLabel(tt, detail.my_role)}
        </p>
      </header>

      {error ? (
        <p className="mb-4 text-sm text-(--fe-color-error)" role="alert">
          {error}
        </p>
      ) : null}
      {success ? (
        <p className="mb-4 text-sm text-secondary-text">{success}</p>
      ) : null}

      <div className="flex flex-col gap-4 sm:gap-5">
        <PAMSettingsCard
          testId="PAMTeamCard-members"
          title={tt.membersTitle}
          description={tt.membersDesc}
          showSave={false}
          footerLeft={
            canAddMember ? (
              <button
                type="button"
                data-permission={PermissionKey.pam_teams_members_create}
                onClick={() => setAddOpen(true)}
                onMouseEnter={() => void prefetchTransferUsers(pamApi)}
                className="inline-flex items-center gap-1.5 rounded-lg border border-primary-border bg-elevated px-3 py-1.5 text-sm text-primary-text hover:bg-surface"
              >
                <PlusIcon className="h-4 w-4" />
                {tt.addMember}
              </button>
            ) : null
          }
        >
          <ul className="divide-y divide-primary-border overflow-hidden rounded-[10px] border border-primary-border bg-surface/40">
            {members.map((member) => {
              const label = resolveUserDisplayLabel({
                displayName: member.display_name,
                phone: member.phone,
                email: member.email,
                userId: member.user_id
              });
              const isOwner = member.role === 'owner';
              return (
                <li
                  data-testid="PAMTeamDetailPage"
                  key={member.id}
                  className="flex flex-col gap-2 px-3 py-3 sm:flex-row sm:items-center sm:justify-between sm:px-4"
                >
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-primary-text">
                      {label}
                    </p>
                    <p className="truncate text-xs text-secondary-text">
                      {member.email || member.user_id}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    {canUpdateMember && !isOwner ? (
                      <select
                        value={member.role}
                        disabled={memberBusy}
                        onChange={(e) =>
                          void handleRoleChange(
                            member,
                            e.target.value as 'admin' | 'member'
                          )
                        }
                        className="rounded-lg border border-primary-border bg-surface px-2 py-1.5 text-sm"
                        data-permission={PermissionKey.pam_teams_members_update}
                      >
                        <option value="admin">{tt.roleAdmin}</option>
                        <option value="member">{tt.roleMember}</option>
                      </select>
                    ) : (
                      <span className="text-sm text-secondary-text">
                        {roleLabel(tt, member.role)}
                      </span>
                    )}
                    {canRemoveMember && !isOwner ? (
                      <button
                        type="button"
                        disabled={memberBusy}
                        data-permission={PermissionKey.pam_teams_members_delete}
                        onClick={() => void handleRemove(member)}
                        className="text-sm text-(--fe-color-error) hover:underline disabled:opacity-50"
                      >
                        {tt.removeMember}
                      </button>
                    ) : null}
                  </div>
                </li>
              );
            })}
          </ul>
        </PAMSettingsCard>

        <PAMSettingsCard
          testId="PAMTeamCard-projects"
          title={tt.projectsTitle}
          description={tt.projectsDesc}
          showSave={false}
        >
          {attachedProjects.length === 0 ? (
            <p className="rounded-[10px] border border-dashed border-primary-border px-4 py-8 text-center text-sm text-secondary-text">
              {tt.projectsEmpty}
            </p>
          ) : (
            <ul className="divide-y divide-primary-border overflow-hidden rounded-[10px] border border-primary-border bg-surface/40">
              {attachedProjects.map((project) => (
                <li
                  data-testid="PAMTeamDetailPage"
                  key={project.id}
                  className="min-w-0 px-3 py-3 sm:px-4"
                >
                  <Link
                    href={{
                      pathname: ROUTE_PROJECT_GENERAL,
                      params: { projectId: project.slug }
                    }}
                    className="block min-w-0 transition hover:text-brand"
                  >
                    <p className="truncate text-sm font-medium text-primary-text">
                      {project.name}
                    </p>
                    <p className="mt-0.5 truncate text-xs text-secondary-text">
                      {projectPath(project.slug)}
                    </p>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </PAMSettingsCard>

        {canAttach ? (
          <PAMSettingsCard
            testId="PAMTeamCard-attach"
            title={tt.attachTitle}
            description={tt.attachDesc}
            showSave
            saveLabel={tt.attach}
            savingLabel={tt.loading}
            saving={attaching}
            saveDisabled={!attachProjectId || attaching}
            savePermission={PermissionKey.pam_teams_projects_attach}
            onSave={() => void handleAttach()}
          >
            <div className="flex flex-col gap-3">
              <label className="flex min-w-0 flex-col gap-1.5">
                <span className={pamFormLabelClass}>
                  {tt.attachPlaceholder}
                </span>
                <select
                  value={attachProjectId}
                  onChange={(e) => setAttachProjectId(e.target.value)}
                  disabled={attaching}
                  className={pamFormFieldClass}
                >
                  <option value="">{tt.attachPlaceholder}</option>
                  {attachCandidates.map((p) => (
                    <option
                      data-testid="PAMTeamDetailPage"
                      key={p.id}
                      value={p.id}
                    >
                      {p.name} ({p.slug})
                    </option>
                  ))}
                </select>
              </label>
              {attachProjectId ? (
                <Link
                  href={{
                    pathname: ROUTE_PROJECT_GENERAL,
                    params: {
                      projectId:
                        attachCandidates.find((p) => p.id === attachProjectId)
                          ?.slug ?? attachProjectId
                    }
                  }}
                  className="inline-block text-xs text-brand"
                >
                  {projectPath(
                    attachCandidates.find((p) => p.id === attachProjectId)
                      ?.slug ?? attachProjectId
                  )}
                </Link>
              ) : null}
            </div>
          </PAMSettingsCard>
        ) : null}

        {canDissolve ? (
          <PAMSettingsCard
            testId="PAMTeamCard-dissolve"
            title={tt.dissolveZoneTitle}
            description={tt.dissolveDesc}
            showSave={false}
          >
            <button
              type="button"
              data-permission={PermissionKey.pam_teams_delete}
              onClick={() => setDissolveOpen(true)}
              className="inline-flex cursor-pointer items-center justify-center rounded-lg border border-red-500/30 bg-red-500/5 px-4 py-2 text-sm font-semibold text-red-600 transition hover:bg-red-500/10 touch-manipulation"
            >
              {tt.dissolve}
            </button>
          </PAMSettingsCard>
        ) : null}
      </div>

      <PAMProjectTransferPicker
        open={addOpen}
        onClose={() => setAddOpen(false)}
        title={tt.addMemberTitle}
        searchPlaceholder={tt.namePlaceholder}
        loadingText={tt.loading}
        emptyText={tt.empty}
        confirmText={tt.confirm}
        transferring={memberBusy}
        onConfirm={handleAddMember}
      />

      <ResponsiveModal
        open={dissolveOpen}
        title={tt.dissolveTitle}
        onClose={() => !dissolving && setDissolveOpen(false)}
        showFullscreenToggle={false}
        bodyClassName="px-4 py-4 sm:px-8 sm:py-6"
        footer={
          <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <button
              type="button"
              disabled={dissolving}
              onClick={() => setDissolveOpen(false)}
              className="rounded-[10px] border border-primary-border px-4 py-2.5 text-sm text-secondary-text disabled:opacity-50"
            >
              {tt.cancel}
            </button>
            <button
              type="button"
              disabled={dissolving}
              onClick={() => void handleDissolve()}
              className="rounded-[10px] bg-(--fe-color-error) px-4 py-2.5 text-sm font-medium text-white disabled:opacity-50"
            >
              {dissolving ? tt.dissolving : tt.dissolve}
            </button>
          </div>
        }
      >
        <p className="text-sm leading-relaxed text-secondary-text">
          {tt.dissolveDesc}
        </p>
      </ResponsiveModal>
    </div>
  );
}
