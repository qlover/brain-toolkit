'use client';

import {
  runAsyncStore,
  useAsyncStore,
  usePendingAsyncStore,
  type AsyncState
} from '@brain-toolkit/react-kit';
import { PlusIcon } from '@heroicons/react/24/outline';
import { usePageI18nMapping, useStrictEffect } from '@qlover/next-kit/client';
import { useCallback, useMemo, useState } from 'react';
import { Link } from '@/i18n/routing';
import { PamTeamsApi, type PamTeamListItem } from '@/impls/appApi/PamTeamsApi';
import {
  pamFormFieldClass,
  pamFormLabelClass
} from '@/uikit/components/pam/PAMFormFieldStyles';
import { PamLoadingIndicator } from '@/uikit/components/PamLoadingIndicator';
import { ResponsiveModal } from '@/uikit/components/ResponsiveModal';
import { PermissionKey, useCan } from '@/uikit/hook/useHasPermission';
import { useIOC } from '@/uikit/hook/useIOC';
import type { PAMTeamsI18nInterface } from '@config/i18n-mapping/PAMTeamsI18n';
import { ROUTE_TEAM_DETAIL } from '@config/route';
import { isPersonalTeamSlug } from '@schemas/PamTeamSchema';

function roleLabel(tt: PAMTeamsI18nInterface, role: string): string {
  if (role === 'owner') return tt.roleOwner;
  if (role === 'admin') return tt.roleAdmin;
  return tt.roleMember;
}

export function PAMTeamsPage() {
  const tt = usePageI18nMapping<PAMTeamsI18nInterface>();
  const teamsApi = useIOC(PamTeamsApi);
  const { allowed: canCreate } = useCan(PermissionKey.pam_teams_create);
  const [list, listStore] =
    usePendingAsyncStore<AsyncState<PamTeamListItem[]>>();
  const [create, createStore] = useAsyncStore<AsyncState<PamTeamListItem>>();
  const [createOpen, setCreateOpen] = useState(false);
  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');

  const teams = useMemo(() => list.result ?? [], [list.result]);
  const loading = list.loading;
  const saving = create.loading;
  const error =
    list.status === 'failed' || create.status === 'failed' ? tt.error : null;

  const load = useCallback(async () => {
    await runAsyncStore(listStore, teamsApi.listMine(), { keep: true });
  }, [listStore, teamsApi]);

  useStrictEffect(() => {
    void load();
  }, [load]);

  const namedTeams = useMemo(
    () => teams.filter((t) => !isPersonalTeamSlug(t.slug)),
    [teams]
  );
  const personalTeams = useMemo(
    () => teams.filter((t) => isPersonalTeamSlug(t.slug)),
    [teams]
  );

  const handleCreate = async () => {
    const trimmed = name.trim();
    if (!trimmed || saving) return;
    listStore.emit({ error: null });
    const created = await runAsyncStore(
      createStore,
      teamsApi.create({
        name: trimmed,
        slug: slug.trim() || undefined
      })
    );
    if (!createStore.isSuccess() || created === undefined) {
      return;
    }
    setCreateOpen(false);
    setName('');
    setSlug('');
    const current = listStore.getResult() ?? [];
    if (current.some((t) => t.id === created.id)) {
      return;
    }
    listStore.success([
      {
        ...created,
        my_role: created.my_role === 'none' ? 'owner' : created.my_role,
        permissions: created.permissions
      },
      ...current
    ]);
  };

  const renderTeamCard = (team: PamTeamListItem) => {
    const personal = isPersonalTeamSlug(team.slug);
    return (
      <Link
        key={team.id}
        href={{
          pathname: ROUTE_TEAM_DETAIL,
          params: { teamId: team.id }
        }}
        className="block min-w-0 overflow-hidden rounded-2xl border border-primary-border bg-secondary p-4 transition hover:border-brand/40 hover:bg-elevated/40"
        title={team.name}
      >
        <div className="flex min-w-0 items-start justify-between gap-3">
          <div className="min-w-0 flex-1 overflow-hidden">
            <h2 className="truncate text-base font-semibold text-primary-text">
              {personal ? tt.personal : team.name}
            </h2>
            <p className="mt-1 truncate text-xs text-secondary-text">
              {team.slug}
            </p>
          </div>
          <span className="shrink-0 rounded-lg bg-elevated px-2 py-1 text-xs text-secondary-text">
            {roleLabel(tt, team.my_role)}
          </span>
        </div>
      </Link>
    );
  };

  return (
    <div
      data-testid="PAMTeamsPage"
      className="mx-auto w-full max-w-7xl min-w-0 overflow-x-hidden px-3 py-6 sm:px-6 lg:px-8"
    >
      <header className="mb-6 flex flex-col gap-3 sm:mb-8 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-primary-text sm:text-3xl">
            {tt.title}
          </h1>
          <p className="mt-2 max-w-2xl text-sm text-secondary-text">
            {tt.description}
          </p>
        </div>
        {canCreate ? (
          <button
            type="button"
            data-permission={PermissionKey.pam_teams_create}
            onClick={() => setCreateOpen(true)}
            className="inline-flex items-center justify-center gap-2 rounded-[10px] bg-brand px-4 py-2.5 text-sm font-medium text-on-brand shadow-sm transition hover:bg-brand-hover"
          >
            <PlusIcon className="h-4 w-4" />
            {tt.create}
          </button>
        ) : null}
      </header>

      {error ? (
        <p className="mb-4 text-sm text-(--fe-color-error)" role="alert">
          {error}
        </p>
      ) : null}

      {loading ? (
        <div className="flex min-h-48 items-center justify-center">
          <PamLoadingIndicator />
        </div>
      ) : namedTeams.length === 0 && personalTeams.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-primary-border px-4 py-10 text-center text-sm text-secondary-text">
          {tt.empty}
        </p>
      ) : (
        <div className="space-y-8">
          {namedTeams.length > 0 ? (
            <section className="grid min-w-0 gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {namedTeams.map(renderTeamCard)}
            </section>
          ) : (
            <p className="rounded-2xl border border-dashed border-primary-border px-4 py-8 text-center text-sm text-secondary-text">
              {tt.empty}
            </p>
          )}
          {personalTeams.length > 0 ? (
            <section className="min-w-0">
              <h2 className="mb-3 text-xs font-semibold tracking-wide text-secondary-text uppercase">
                {tt.personal}
              </h2>
              <div className="grid min-w-0 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {personalTeams.map(renderTeamCard)}
              </div>
            </section>
          ) : null}
        </div>
      )}

      <ResponsiveModal
        open={createOpen}
        title={tt.createTitle}
        onClose={() => !saving && setCreateOpen(false)}
        bodyClassName="px-4 py-4 sm:px-8 sm:py-6"
        footer={
          <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <button
              type="button"
              disabled={saving}
              onClick={() => setCreateOpen(false)}
              className="rounded-[10px] border border-primary-border px-4 py-2.5 text-sm text-secondary-text"
            >
              {tt.cancel}
            </button>
            <button
              type="button"
              disabled={saving || !name.trim()}
              onClick={() => void handleCreate()}
              className="rounded-[10px] bg-brand px-4 py-2.5 text-sm font-medium text-on-brand disabled:opacity-50"
            >
              {tt.confirm}
            </button>
          </div>
        }
      >
        <div className="flex flex-col gap-4">
          <label className="flex flex-col gap-1.5">
            <span className={pamFormLabelClass}>{tt.nameLabel}</span>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={tt.namePlaceholder}
              className={pamFormFieldClass}
              autoFocus
            />
          </label>
          <label className="flex flex-col gap-1.5">
            <span className={pamFormLabelClass}>{tt.slugLabel}</span>
            <input
              value={slug}
              onChange={(e) => setSlug(e.target.value)}
              placeholder={tt.slugPlaceholder}
              className={pamFormFieldClass}
            />
          </label>
        </div>
      </ResponsiveModal>
    </div>
  );
}
