import { EllipsisHorizontalIcon } from '@heroicons/react/24/outline';
import { clsx } from 'clsx';
import React, { useMemo } from 'react';
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
  getPAMRepoPath
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
  const repoPath = project.repo_url ? getPAMRepoPath(project.repo_url) : '';
  const avatarLetter = getPAMAvatarLetter(project.name);
  const isPublic = project.is_public === PAMPublicType.public;

  const menuItems = useMemo(() => {
    const items: {
      key: string;
      label?: string;
      danger?: boolean;
      divider?: boolean;
    }[] = [];
    if (project.repo_url) {
      items.push({ key: 'open-repo', label: tt.openRepo });
    }
    if (primaryUrl) {
      items.push({ key: 'open-deploy', label: tt.openDeploy });
    }
    if (isOwner) {
      if (items.length > 0) {
        items.push({ key: 'owner-sep', divider: true });
      }
      items.push({ key: 'edit', label: tt.edit });
      items.push({ key: 'delete', label: tt.delete, danger: true });
    }
    return items;
  }, [
    project.repo_url,
    primaryUrl,
    isOwner,
    tt.openRepo,
    tt.openDeploy,
    tt.edit,
    tt.delete
  ]);

  const onMenuSelect = (key: string) => {
    if (key === 'open-repo' && project.repo_url) {
      window.open(project.repo_url, '_blank', 'noopener,noreferrer');
      return;
    }
    if (key === 'open-deploy' && primaryUrl) {
      window.open(primaryUrl, '_blank', 'noopener,noreferrer');
      return;
    }
    if (key === 'edit') {
      onEdit(project.id);
      return;
    }
    if (key === 'delete') {
      onDelete(project);
    }
  };

  const avatarClassName = clsx(
    'flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-primary-border bg-elevated text-sm font-bold text-brand no-underline',
    project.repo_url && 'hover:border-brand hover:bg-primary'
  );

  const avatarInner = project.repo_url ? (
    <PAMIcon repoUrl={project.repo_url} className="h-4 w-4" />
  ) : (
    avatarLetter
  );

  return (
    <div
      data-testid="PAMProjectListItem"
      className="flex flex-col gap-2 border-b border-primary-border bg-transparent px-3 py-3.5 transition last:border-b-0 hover:bg-elevated sm:px-4"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 flex-1 items-start gap-3">
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
          <div className="min-w-0">
            <div className="truncate text-[0.95rem] font-semibold tracking-tight text-primary-text">
              {project.name}
            </div>
            {host ? (
              <a
                href={primaryUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-0.5 block truncate text-sm text-tertiary-text no-underline hover:text-secondary-text"
              >
                {host}
              </a>
            ) : project.stack ? (
              <span className="mt-0.5 block truncate text-sm text-tertiary-text">
                {project.stack}
              </span>
            ) : null}
          </div>
        </div>

        <div className="flex shrink-0 items-center gap-1 pt-0.5 sm:gap-1.5">
          <PAMPublicIcon
            isPublic={isPublic}
            publicTitle={tt.public}
            privateTitle={tt.private}
          />
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
                className="inline-flex h-5 w-5 items-center justify-center rounded-md text-secondary-text transition hover:bg-elevated hover:text-primary-text sm:h-6 sm:w-6 md:h-7 md:w-7"
              >
                <EllipsisHorizontalIcon className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
              </button>
            </Dropdown>
          ) : (
            <span className="text-[10px] text-tertiary-text">
              {tt.readonly}
            </span>
          )}
        </div>
      </div>

      {project.repo_url ? (
        <a
          href={project.repo_url}
          target="_blank"
          rel="noopener noreferrer"
          className="hidden max-w-full w-fit items-center gap-1.5 truncate rounded-md border border-primary-border bg-primary px-2.5 py-1 text-xs text-secondary-text no-underline hover:border-brand hover:text-primary-text md:inline-flex"
        >
          <PAMIcon
            repoUrl={project.repo_url}
            className="h-3.5 w-3.5 shrink-0"
          />
          <span className="truncate">{repoPath}</span>
        </a>
      ) : null}

      <p className="hidden truncate text-sm text-primary-text md:block">
        {project.description || tt.noDesc}
      </p>

      <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1.5 text-xs text-tertiary-text">
        {project.owner_id ? <span>{project.owner_id}</span> : null}
        {project.owner_id && (project.stack || project.category) ? (
          <span>·</span>
        ) : null}
        <span>{project.stack || project.category || '—'}</span>
        <span>·</span>
        <span className="inline-flex flex-wrap items-center gap-1">
          {envs.length > 0 ? (
            envs.map((env) => <PAMEnvLink key={env.id} {...env} compact />)
          ) : (
            <span className="text-tertiary-text">{tt.noEnv}</span>
          )}
        </span>
      </div>
    </div>
  );
};
