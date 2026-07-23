import { EllipsisHorizontalIcon } from '@heroicons/react/24/outline';
import { clsx } from 'clsx';
import React, { useCallback, useMemo } from 'react';
import { toast } from 'sonner';
import type { PAMI18nInterface } from '@config/i18n-mapping/PAMI18n';
import type { PAMEnvWriteable } from '@schemas/PAMEnvironmentSchema';
import {
  PAMPublicType,
  type SearchPAMProject
} from '@schemas/PAMProjectSchema';
import { Dropdown } from '../Dropdown';
import { PAMEnvLink, PAMIcon, PAMPublicIcon } from './PAMIcon';
import {
  getPAMAvatarLetter,
  getPAMDisplayHost,
  getPAMPrimaryUrl,
  shortenPAMOwnerId
} from './PAMProjectDisplayUtil';

type PAMProjectListModel = SearchPAMProject & {
  environments?: PAMEnvWriteable[];
};

interface PAMProjectListItemProps {
  tt: PAMI18nInterface;
  project: PAMProjectListModel;
  isOwner: boolean;
  onEdit: (id: string) => void;
  onDelete: (project: PAMProjectListModel) => void;
}

/**
 * List row:
 * 1) larger avatar (→ repo) + title (+ lock) / host | envs + menu
 * 2–3) description + meta, left-aligned with the avatar
 */
export const PAMProjectListItem: React.FC<PAMProjectListItemProps> = ({
  tt,
  project,
  isOwner,
  onEdit,
  onDelete
}) => {
  const envs = useMemo(
    () => project.environments || [],
    [project.environments]
  );
  const primaryUrl = getPAMPrimaryUrl(envs, project.repo_url);
  const host = getPAMDisplayHost(primaryUrl);
  const avatarLetter = getPAMAvatarLetter(project.name);
  const isPublic = project.is_public === PAMPublicType.public;

  const menuItems = useMemo(() => {
    if (!isOwner) {
      return [] as {
        key: string;
        label?: string;
        danger?: boolean;
        divider?: boolean;
      }[];
    }
    return [
      { key: 'edit', label: tt.edit },
      { key: 'delete', label: tt.delete, danger: true }
    ];
  }, [isOwner, tt.edit, tt.delete]);

  const onMenuSelect = (key: string) => {
    if (key === 'edit') {
      onEdit(project.id);
      return;
    }
    if (key === 'delete') {
      onDelete(project);
    }
  };

  const avatarClassName = clsx(
    'flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border border-primary-border bg-elevated text-xl font-bold text-brand no-underline sm:h-14 sm:w-14 sm:text-2xl',
    project.repo_url && 'hover:border-brand hover:bg-primary'
  );

  const avatarInner = project.repo_url ? (
    <PAMIcon repoUrl={project.repo_url} className="h-8 w-8 sm:h-9 sm:w-9" />
  ) : (
    avatarLetter
  );

  const envChips =
    envs.length > 0
      ? envs.map((env) => <PAMEnvLink key={env.id} {...env} compact />)
      : null;

  const ownerId = project.owner_id || '';
  const ownerIdShort = shortenPAMOwnerId(ownerId);

  const onCopyOwnerId = useCallback(async () => {
    if (!ownerId) {
      return;
    }
    try {
      await navigator.clipboard.writeText(ownerId);
      toast.success(tt.copyOwnerIdSuccess);
    } catch {
      toast.error(tt.errorText);
    }
  }, [ownerId, tt.copyOwnerIdSuccess, tt.errorText]);

  return (
    <div
      data-testid="PAMProjectListItem"
      className="flex flex-col gap-1.5 border-b border-primary-border bg-transparent px-3 py-3.5 transition last:border-b-0 hover:bg-elevated sm:gap-2 sm:px-4"
    >
      <div className="flex items-center justify-between gap-3">
        <div className="flex min-w-0 flex-1 items-center gap-3 sm:gap-3.5">
          {project.repo_url ? (
            <a
              href={project.repo_url}
              target="_blank"
              rel="noopener noreferrer"
              title={tt.openRepo}
              className={avatarClassName}
            >
              {avatarInner}
            </a>
          ) : (
            <div className={avatarClassName} title={project.name}>
              {avatarInner}
            </div>
          )}
          <div className="min-w-0 flex-1">
            <div className="flex min-w-0 items-center gap-1.5">
              <div className="truncate text-lg font-semibold leading-snug tracking-tight text-primary-text sm:text-xl">
                {project.name}
              </div>
              <PAMPublicIcon
                isPublic={isPublic}
                publicTitle={tt.public}
                privateTitle={tt.private}
                className="shrink-0"
              />
            </div>
            {host ? (
              <a
                href={primaryUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-0.5 block truncate text-sm leading-snug text-tertiary-text no-underline hover:text-secondary-text hover:underline"
              >
                {host}
              </a>
            ) : project.stack ? (
              <span className="mt-0.5 block truncate text-sm leading-snug text-tertiary-text">
                {project.stack}
              </span>
            ) : null}
          </div>
        </div>

        <div className="flex max-w-[min(100%,20rem)] shrink-0 flex-wrap items-center justify-end gap-1.5">
          {envChips ? (
            <div className="hidden flex-wrap items-center justify-end gap-1 md:flex">
              {envChips}
            </div>
          ) : null}
          {menuItems.length > 0 ? (
            <Dropdown
              items={menuItems}
              placement="bottom-end"
              mobileMode="menu"
              onSelect={onMenuSelect}
              data-testid="PAMProjectListItemMenu"
            >
              <button
                type="button"
                title={tt.moreActions}
                aria-label={tt.moreActions}
                className="inline-flex h-8 w-8 items-center justify-center rounded-md text-secondary-text transition hover:bg-elevated hover:text-primary-text"
              >
                <EllipsisHorizontalIcon className="h-5 w-5" />
              </button>
            </Dropdown>
          ) : (
            <span className="text-[10px] text-tertiary-text">
              {tt.readonly}
            </span>
          )}
        </div>
      </div>

      <p className="hidden truncate text-sm text-primary-text md:block">
        {project.description || tt.noDesc}
      </p>

      <div className="flex min-w-0 flex-wrap items-center gap-x-2.5 gap-y-1.5 text-xs text-tertiary-text">
        {ownerId ? (
          <button
            type="button"
            title={`${tt.copyOwnerId}: ${ownerId}`}
            aria-label={tt.copyOwnerId}
            onClick={onCopyOwnerId}
            className="font-mono text-tertiary-text transition hover:text-primary-text"
          >
            <span className="lg:hidden">{ownerIdShort}</span>
            <span className="hidden lg:inline">{ownerId}</span>
          </button>
        ) : null}
        {ownerId && (project.stack || project.category) ? <span>·</span> : null}
        {project.stack || project.category ? (
          <span>{project.stack || project.category}</span>
        ) : null}
        {envChips ? (
          <>
            {ownerId || project.stack || project.category ? (
              <span className="md:hidden">·</span>
            ) : null}
            <span className="inline-flex flex-wrap items-center gap-1 md:hidden">
              {envChips}
            </span>
          </>
        ) : null}
      </div>
    </div>
  );
};
