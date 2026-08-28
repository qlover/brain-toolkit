import { clsx } from 'clsx';
import { useLocale } from 'next-intl';
import React, { useCallback, useMemo } from 'react';
import { toast } from 'sonner';
import { Link } from '@/i18n/routing';
import type { PAMI18nInterface } from '@config/i18n-mapping/PAMI18n';
import { ROUTE_PROJECT_GENERAL } from '@config/route';
import type { PAMEnvWriteable } from '@schemas/PAMEnvironmentSchema';
import {
  PAMPublicType,
  type SearchPAMProject
} from '@schemas/PAMProjectSchema';
import {
  highlightText,
  isCategoryHighlightActive,
  PAM_CATEGORY_HIGHLIGHT_CLASS
} from './PAMHighlightUtil';
import { PAMEnvLink, PAMPublicIcon } from './PAMIcon';
import { PAMProjectAvatar } from './PAMProjectAvatar';
import {
  formatPAMProjectTimestamp,
  getPAMPrimaryUrl,
  shortenPAMOwnerId
} from './PAMProjectDisplayUtil';

type PAMProjectListModel = SearchPAMProject & {
  environments?: PAMEnvWriteable[];
};

interface PAMProjectListItemProps {
  tt: PAMI18nInterface;
  project: PAMProjectListModel;
  highlightKeyword?: string;
  highlightCategory?: string;
}

/**
 * List row:
 * 1) larger avatar (→ repo) + title (+ lock) / host | envs
 * 2–3) description + meta, left-aligned with the avatar
 */
export const PAMProjectListItem: React.FC<PAMProjectListItemProps> = ({
  tt,
  project,
  highlightKeyword = '',
  highlightCategory = ''
}) => {
  const locale = useLocale();
  const envs = useMemo(
    () => project.environments || [],
    [project.environments]
  );
  const primaryUrl = getPAMPrimaryUrl(envs, project.repo_url);
  const isPublic = project.is_public === PAMPublicType.public;

  const categoryActive = isCategoryHighlightActive(
    project.category,
    highlightCategory
  );
  const titleNode = useMemo(
    () => highlightText(project.name, highlightKeyword),
    [project.name, highlightKeyword]
  );

  const envChips =
    envs.length > 0
      ? envs.map((env) => <PAMEnvLink key={env.id} {...env} compact />)
      : null;

  const ownerId = project.owner_id || '';
  const ownerIdShort = shortenPAMOwnerId(ownerId);
  const updatedAtText = formatPAMProjectTimestamp(project.updated_at, locale);
  const updatedAtLabel = updatedAtText
    ? tt.updatedAt.replace('%time%', updatedAtText)
    : '';

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
          <PAMProjectAvatar
            name={project.name}
            primaryUrl={primaryUrl}
            repoUrl={project.repo_url}
            allowPreview={false}
            linkToRepo
            linkTitle={tt.openRepo}
          />
          <div className="min-w-0 flex-1">
            <div className="flex min-w-0 items-center gap-1.5">
              <Link
                href={{
                  pathname: ROUTE_PROJECT_GENERAL,
                  params: { projectId: project.slug }
                }}
                className="block max-w-full truncate text-left text-lg font-semibold leading-snug tracking-tight text-primary-text no-underline transition hover:text-brand sm:text-xl"
              >
                {titleNode}
              </Link>
              <PAMPublicIcon
                isPublic={isPublic}
                publicTitle={tt.public}
                privateTitle={tt.private}
                className="shrink-0"
              />
            </div>
            {primaryUrl ? (
              <div className="mt-0.5 block truncate text-sm leading-snug text-tertiary-text ">
                <a
                  href={primaryUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  title={primaryUrl}
                  className="no-underline hover:text-secondary-text hover:underline"
                >
                  {primaryUrl}
                </a>
              </div>
            ) : project.stack ? (
              <span className="mt-0.5 block truncate text-sm leading-snug text-tertiary-text">
                {project.stack}
              </span>
            ) : null}
          </div>
        </div>

        {envChips ? (
          <div className="flex max-w-[min(100%,20rem)] shrink-0 flex-wrap items-center justify-end gap-1.5">
            <div className="max-md:hidden flex flex-wrap items-center justify-end gap-1">
              {envChips}
            </div>
          </div>
        ) : null}
      </div>

      <p className="max-md:hidden truncate text-sm text-primary-text block">
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
            <span className="max-lg:hidden inline">{ownerId}</span>
          </button>
        ) : null}
        {ownerId && project.category ? <span>·</span> : null}
        {project.category ? (
          <span
            className={clsx(
              categoryActive &&
                clsx(
                  'rounded-full px-1.5 py-0.5 font-semibold',
                  PAM_CATEGORY_HIGHLIGHT_CLASS
                )
            )}
          >
            {project.category}
          </span>
        ) : null}
        {(ownerId || project.category) && project.stack ? <span>·</span> : null}
        {project.stack ? <span>{project.stack}</span> : null}
        {envChips ? (
          <>
            {ownerId || project.category || project.stack ? (
              <span className="md:hidden">·</span>
            ) : null}
            <span className="inline-flex flex-wrap items-center gap-1 md:hidden">
              {envChips}
            </span>
          </>
        ) : null}
        {updatedAtLabel ? (
          <>
            {ownerId || project.category || project.stack || envChips ? (
              <span>·</span>
            ) : null}
            <time dateTime={String(project.updated_at ?? '')}>
              {updatedAtLabel}
            </time>
          </>
        ) : null}
      </div>
    </div>
  );
};
