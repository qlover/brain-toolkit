import { TrashIcon } from '@heroicons/react/24/outline';
import { clsx } from 'clsx';
import React, { useMemo } from 'react';
import { toast } from 'sonner';
import { Link } from '@/i18n/routing';
import type { PAMI18nInterface } from '@config/i18n-mapping/PAMI18n';
import type { PAMEnvWriteable } from '@schemas/PAMEnvironmentSchema';
import {
  PAMPublicType,
  type SearchPAMProject
} from '@schemas/PAMProjectSchema';
import { PAMEnvLink, PAMIcon, PAMPublicIcon } from './PAMIcon';
import { getPAMAvatarLetter, shortenPAMOwnerId } from './PAMProjectDisplayUtil';

type PAMProjectCardModel = SearchPAMProject & {
  environments?: PAMEnvWriteable[];
};

interface PAMProjectCardProps {
  tt: PAMI18nInterface;
  project: PAMProjectCardModel;
  isOwner: boolean;
  /** Guest: hide delete and readonly label. */
  isAuthenticated?: boolean;
  onDelete: (project: PAMProjectCardModel) => void;
}

export const PAMProjectCard: React.FC<PAMProjectCardProps> = ({
  tt,
  project,
  isOwner,
  isAuthenticated = false,
  onDelete
}) => {
  const envs = project.environments || [];
  const isPublic = project.is_public === PAMPublicType.public;
  const avatarLetter = getPAMAvatarLetter(project.name);
  const stack = (project.stack || '').trim();
  const hasEnvs = envs.length > 0;

  const avatarClassName = clsx(
    'flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border border-primary-border bg-elevated text-xl font-bold text-brand no-underline sm:h-14 sm:w-14 sm:text-2xl',
    project.repo_url && 'hover:border-brand hover:bg-primary'
  );

  const avatarInner = project.repo_url ? (
    <PAMIcon repoUrl={project.repo_url} className="h-8 w-8 sm:h-9 sm:w-9" />
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
      const ownerId = project.owner_id;
      const shortId = shortenPAMOwnerId(ownerId);
      bits.push({
        key: 'owner',
        node: (
          <button
            type="button"
            title={`${tt.copyOwnerId}: ${ownerId}`}
            aria-label={tt.copyOwnerId}
            onClick={async () => {
              try {
                await navigator.clipboard.writeText(ownerId);
                toast.success(tt.copyOwnerIdSuccess);
              } catch {
                toast.error(tt.errorText);
              }
            }}
            className="font-mono text-tertiary-text transition hover:text-primary-text"
          >
            {shortId}
          </button>
        )
      });
    }
    if (isAuthenticated && !isOwner) {
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
  }, [
    project.category,
    project.owner_id,
    isOwner,
    isAuthenticated,
    tt.readonly,
    tt.copyOwnerId,
    tt.copyOwnerIdSuccess,
    tt.errorText
  ]);

  return (
    <div
      data-testid="PAMProjectCard"
      className="flex h-full flex-col overflow-hidden rounded-2xl border border-primary-border bg-secondary transition hover:border-brand hover:shadow-[0_0_0_1px_var(--fe-color-brand)]"
    >
      <div className="flex flex-1 flex-col gap-2 p-3 sm:gap-2.5 sm:p-3.5">
        <div className="flex items-center justify-between gap-2">
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
              <Link
                href={{
                  pathname: '/projects/[projectId]/general',
                  params: { projectId: project.id }
                }}
                className="block max-w-full truncate text-left text-lg font-semibold leading-snug tracking-tight text-primary-text no-underline transition hover:text-brand sm:text-xl"
              >
                {project.name}
              </Link>
              {subBits.length > 0 ? (
                <div className="mt-0.5 flex flex-wrap items-center gap-x-1.5 gap-y-1 text-xs leading-snug text-tertiary-text">
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

        {stack ? (
          <p
            className="truncate text-sm font-semibold text-primary-text"
            title={stack}
          >
            {stack}
          </p>
        ) : null}

        <p className="line-clamp-2 text-sm leading-snug text-secondary-text">
          {project.description || tt.noDesc}
        </p>

        {hasEnvs ? (
          <div className="flex flex-col gap-1.5">
            <div className="text-[0.58rem] font-bold tracking-wide text-tertiary-text uppercase">
              {tt.envDirectTitle}
            </div>
            <div className="flex flex-wrap gap-1.5">
              {envs.map((env) => (
                <PAMEnvLink key={env.id} {...env} />
              ))}
            </div>
          </div>
        ) : null}

        {isAuthenticated ? (
          <div className="mt-auto flex flex-wrap items-center gap-1.5 border-t border-primary-border pt-2.5">
            {isOwner ? (
              <button
                type="button"
                onClick={() => onDelete(project)}
                className="inline-flex items-center gap-1 rounded-md border border-red-500/30 bg-red-500/5 px-2 py-1.5 text-xs font-medium text-red-600 transition hover:bg-red-500/10"
              >
                <TrashIcon className="h-3 w-3" />
                {tt.delete}
              </button>
            ) : (
              <span className="text-xs text-tertiary-text">{tt.readonly}</span>
            )}
          </div>
        ) : null}
      </div>
    </div>
  );
};
