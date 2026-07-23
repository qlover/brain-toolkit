import {
  ArrowTopRightOnSquareIcon,
  PencilSquareIcon,
  TrashIcon
} from '@heroicons/react/24/outline';
import { clsx } from 'clsx';
import React, { useMemo } from 'react';
import type { PAMI18nInterface } from '@config/i18n-mapping/PAMI18n';
import type { PAMEnvWriteable } from '@schemas/PAMEnvironmentSchema';
import {
  PAMPublicType,
  type SearchPAMProject
} from '@schemas/PAMProjectSchema';
import { PAMEnvLink, PAMIcon, PAMPublicIcon } from './PAMIcon';
import {
  getPAMAvatarLetter,
  getPAMDisplayHost,
  getPAMPrimaryUrl,
  getPAMRepoPath
} from './PAMProjectDisplayUtil';

type PAMProjectCardModel = SearchPAMProject & {
  environments?: PAMEnvWriteable[];
};

interface PAMProjectCardProps {
  tt: PAMI18nInterface;
  project: PAMProjectCardModel;
  isOwner: boolean;
  onEdit: (id: string) => void;
  onDelete: (project: PAMProjectCardModel) => void;
}

export const PAMProjectCard: React.FC<PAMProjectCardProps> = ({
  tt,
  project,
  isOwner,
  onEdit,
  onDelete
}) => {
  const envs = project.environments || [];
  const primaryUrl = getPAMPrimaryUrl(envs, project.repo_url);
  const host = getPAMDisplayHost(primaryUrl);
  const isPublic = project.is_public === PAMPublicType.public;
  const avatarLetter = getPAMAvatarLetter(project.name);

  const urlHref = host && primaryUrl ? primaryUrl : project.repo_url || '';
  const urlLabel = host
    ? host
    : project.repo_url
      ? getPAMRepoPath(project.repo_url)
      : '';

  const avatarClassName = clsx(
    'flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-primary-border bg-elevated text-sm font-bold text-brand no-underline',
    project.repo_url && 'hover:border-brand hover:bg-primary'
  );

  const avatarInner = project.repo_url ? (
    <PAMIcon repoUrl={project.repo_url} className="h-4 w-4" />
  ) : (
    avatarLetter
  );

  const subBits = useMemo(() => {
    const bits: { key: string; node: React.ReactNode }[] = [];
    if (project.category) {
      bits.push({
        key: 'cat',
        node: (
          <span className="inline-flex items-center rounded-full border border-brand/35 bg-brand/10 px-1.5 py-0.5 text-[0.62rem] font-semibold text-brand">
            {project.category}
          </span>
        )
      });
    }
    if (project.owner_id) {
      bits.push({
        key: 'owner',
        node: <span>{project.owner_id}</span>
      });
    }
    if (!isOwner) {
      bits.push({
        key: 'ro',
        node: (
          <span className="inline-flex items-center rounded-full border border-primary-border bg-elevated px-1.5 py-0.5 text-[0.62rem] font-semibold text-secondary-text">
            {tt.readonly}
          </span>
        )
      });
    }
    return bits;
  }, [project.category, project.owner_id, isOwner, tt.readonly]);

  return (
    <div
      data-testid="PAMProjectCard"
      className="flex flex-col overflow-hidden rounded-[10px] border border-primary-border bg-secondary transition hover:border-brand hover:shadow-[0_0_0_1px_var(--fe-color-brand)]"
    >
      <div className="flex flex-col gap-2.5 p-3 sm:p-3.5">
        <div className="flex items-start justify-between gap-2">
          <div className="flex min-w-0 flex-1 items-start gap-2.5">
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
              <div className="truncate text-[0.95rem] font-semibold leading-tight text-primary-text">
                {project.name}
              </div>
              {subBits.length > 0 ? (
                <div className="mt-0.5 flex flex-wrap items-center gap-x-1.5 gap-y-1 text-xs text-tertiary-text">
                  {subBits.map((bit, index) => (
                    <React.Fragment key={bit.key}>
                      {index > 0 ? <span className="opacity-50">·</span> : null}
                      {bit.node}
                    </React.Fragment>
                  ))}
                </div>
              ) : null}
            </div>
          </div>
          <PAMPublicIcon
            isPublic={isPublic}
            publicTitle={tt.public}
            privateTitle={tt.private}
          />
        </div>

        <p
          className="truncate text-sm font-semibold text-primary-text"
          title={project.stack || undefined}
        >
          {project.stack || '—'}
        </p>

        <p className="line-clamp-2 text-sm leading-snug text-secondary-text">
          {project.description || tt.noDesc}
        </p>

        {urlLabel && urlHref ? (
          <a
            href={urlHref}
            target="_blank"
            rel="noopener noreferrer"
            title={urlHref}
            className="inline-flex w-fit max-w-full items-center gap-1.5 truncate rounded-md border border-primary-border bg-elevated px-2 py-1 font-mono text-xs text-secondary-text no-underline hover:border-brand hover:text-brand"
          >
            {host ? (
              <ArrowTopRightOnSquareIcon className="h-3 w-3 shrink-0" />
            ) : (
              <PAMIcon
                repoUrl={project.repo_url || undefined}
                className="h-3 w-3 shrink-0"
              />
            )}
            <span className="truncate">{urlLabel}</span>
          </a>
        ) : null}

        <div className="flex flex-col gap-1.5">
          <div className="text-[0.58rem] font-bold tracking-wide text-tertiary-text uppercase">
            {tt.envDirectTitle}
          </div>
          <div className="flex flex-wrap gap-1.5">
            {envs.length > 0 ? (
              envs.map((env) => <PAMEnvLink key={env.id} {...env} />)
            ) : (
              <span className="text-xs text-tertiary-text">
                {tt.noEnvConfig}
              </span>
            )}
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-1.5 border-t border-primary-border pt-2.5">
          {project.repo_url ? (
            <a
              href={project.repo_url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 rounded-md border border-primary-border bg-elevated px-2 py-1.5 text-xs font-medium text-primary-text no-underline hover:border-brand hover:text-brand"
            >
              <PAMIcon repoUrl={project.repo_url} className="h-3 w-3" />
              {tt.openRepo}
            </a>
          ) : null}
          {primaryUrl ? (
            <a
              href={primaryUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 rounded-md border border-primary-border bg-elevated px-2 py-1.5 text-xs font-medium text-primary-text no-underline hover:border-brand hover:text-brand"
            >
              <ArrowTopRightOnSquareIcon className="h-3 w-3" />
              {tt.openDeploy}
            </a>
          ) : null}
          {isOwner ? (
            <>
              <button
                type="button"
                onClick={() => onEdit(project.id)}
                className="inline-flex items-center gap-1 rounded-md border border-brand/40 bg-brand/10 px-2 py-1.5 text-xs font-medium text-brand transition hover:bg-brand/20"
              >
                <PencilSquareIcon className="h-3 w-3" />
                {tt.edit}
              </button>
              <button
                type="button"
                onClick={() => onDelete(project)}
                className="inline-flex items-center gap-1 rounded-md border border-red-500/30 bg-red-500/5 px-2 py-1.5 text-xs font-medium text-red-600 transition hover:bg-red-500/10"
              >
                <TrashIcon className="h-3 w-3" />
                {tt.delete}
              </button>
            </>
          ) : null}
        </div>
      </div>
    </div>
  );
};
