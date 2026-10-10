import { Squares2X2Icon } from '@heroicons/react/24/outline';
import { clsx } from 'clsx';
import { useLocale } from 'next-intl';
import React, { useMemo } from 'react';
import { Link } from '@/i18n/routing';
import {
  extractPAMDescLinks,
  extractPAMDescSummary
} from '@shared/utils/PAMDescMarkdownUtil';
import type { PAMI18nInterface } from '@config/i18n-mapping/PAMI18n';
import { ROUTE_PROJECT_DETAIL } from '@config/route';
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
  getPAMPrimaryUrl
} from './PAMProjectDisplayUtil';
import { PAMDescLinkChip, PAMProjectQuickAccess } from './PAMProjectQuickLinks';

type PAMProjectListModel = SearchPAMProject & {
  environments?: PAMEnvWriteable[];
};

interface PAMProjectListItemProps {
  tt: PAMI18nInterface;
  project: PAMProjectListModel;
  highlightKeyword?: string;
  highlightCategory?: string;
  /** Plain left click opens the in-list detail instead of navigating (modifier clicks still navigate). */
  onOpenDetail?: (slug: string) => void;
  /** Row whose detail is showing in the drawer / side column. */
  selected?: boolean;
}

/** Entries in the mobile strip under the row. */
const MOBILE_STRIP_MAX = 4;

/**
 * List row (tap → in-list detail, or the project page without `onOpenDetail`). Content grows with the viewport:
 * - mobile: name + summary, quick links in a strip below
 * - md: 2 envs + 2 link icons inline
 * - lg: category · stack · updated after the name
 * - xl: 3 envs + titled link chips
 * The quick-access button always lists every entry.
 */
export const PAMProjectListItem: React.FC<PAMProjectListItemProps> = ({
  tt,
  project,
  highlightKeyword = '',
  highlightCategory = '',
  onOpenDetail,
  selected = false
}) => {
  const locale = useLocale();
  const envs = useMemo(
    () => project.environments || [],
    [project.environments]
  );
  const primaryUrl = getPAMPrimaryUrl(envs, project.repo_url);
  const isPublic = project.is_public === PAMPublicType.public;
  const summary = useMemo(
    () => extractPAMDescSummary(project.description),
    [project.description]
  );
  const links = useMemo(
    () => extractPAMDescLinks(project.description),
    [project.description]
  );
  const entryCount = envs.length + links.length;

  const categoryActive = isCategoryHighlightActive(
    project.category,
    highlightCategory
  );
  const titleNode = useMemo(
    () => highlightText(project.name, highlightKeyword),
    [project.name, highlightKeyword]
  );

  const updatedAtText = formatPAMProjectTimestamp(
    project.updated_at,
    locale,
    true
  );
  const metaText = [
    project.stack,
    updatedAtText ? tt.updatedAt.replace('%time%', updatedAtText) : ''
  ]
    .filter(Boolean)
    .join(' · ');

  const stripEnvs = envs.slice(0, MOBILE_STRIP_MAX);
  const stripLinks = links.slice(
    0,
    Math.max(0, MOBILE_STRIP_MAX - stripEnvs.length)
  );

  return (
    <div
      data-testid="PAMProjectListItem"
      data-pam-row={project.slug}
      className={clsx(
        'relative px-3 py-2.5 transition sm:px-4',
        selected
          ? 'bg-brand/8 shadow-[inset_2px_0_0_var(--fe-color-brand)]'
          : 'bg-secondary hover:bg-elevated'
      )}
    >
      <Link
        href={{
          pathname: ROUTE_PROJECT_DETAIL,
          params: { projectId: project.slug }
        }}
        aria-label={project.name}
        className="absolute inset-0"
        onClick={(event) => {
          if (
            !onOpenDetail ||
            event.button !== 0 ||
            event.metaKey ||
            event.ctrlKey ||
            event.shiftKey ||
            event.altKey
          ) {
            return;
          }
          event.preventDefault();
          onOpenDetail(project.slug);
        }}
      />
      <div className="flex items-center gap-3">
        <PAMProjectAvatar
          name={project.name}
          primaryUrl={primaryUrl}
          repoUrl={project.repo_url}
          allowPreview={false}
          linkToRepo
          linkTitle={tt.openRepo}
          className="relative h-10! w-10! text-lg! sm:h-11! sm:w-11!"
        />
        <div className="min-w-0 flex-1">
          <div className="flex min-w-0 items-center gap-1.5 whitespace-nowrap">
            <span className="truncate font-semibold text-primary-text">
              {titleNode}
            </span>
            <PAMPublicIcon
              isPublic={isPublic}
              publicTitle={tt.public}
              privateTitle={tt.private}
              showLabel={false}
              className="shrink-0"
            />
            {project.category ? (
              <span
                className={clsx(
                  'max-lg:hidden ml-1 inline-flex shrink-0 items-center rounded-full border px-1.5 py-0.5 text-[0.62rem] font-semibold',
                  categoryActive
                    ? PAM_CATEGORY_HIGHLIGHT_CLASS
                    : 'border-brand/35 bg-brand/10 text-brand'
                )}
              >
                {project.category}
              </span>
            ) : null}
            {metaText ? (
              <span className="max-lg:hidden truncate text-xs text-tertiary-text">
                {metaText}
              </span>
            ) : null}
          </div>
          <p className="truncate text-sm text-secondary-text">
            {summary || tt.noDesc}
          </p>
        </div>

        {entryCount > 0 ? (
          <div className="relative max-md:hidden flex shrink-0 items-center justify-end gap-1">
            {envs.slice(0, 3).map((env, index) => (
              <PAMEnvLink
                key={env.id}
                {...env}
                compact
                className={clsx('shrink-0', index >= 2 && 'max-xl:hidden')}
              />
            ))}
            {links.slice(0, 2).map((link) => (
              <React.Fragment key={link.url}>
                <PAMDescLinkChip
                  tt={tt}
                  link={link}
                  iconOnly
                  className="xl:hidden"
                />
                <PAMDescLinkChip
                  tt={tt}
                  link={link}
                  compact
                  className="max-xl:hidden"
                />
              </React.Fragment>
            ))}
          </div>
        ) : null}

        <PAMProjectQuickAccess
          tt={tt}
          slug={project.slug}
          name={project.name}
          repoUrl={project.repo_url}
          envs={envs}
          links={links}
          className="h-[30px] min-w-[42px] px-2"
        >
          <Squares2X2Icon className="h-3.5 w-3.5" />
          <span>{entryCount}</span>
        </PAMProjectQuickAccess>
        {entryCount === 0 ? (
          <span className="h-[30px] w-[42px] shrink-0" aria-hidden />
        ) : null}
      </div>

      {entryCount > 0 ? (
        <div className="relative mt-2 ml-[52px] flex gap-1.5 overflow-x-auto [scrollbar-width:none] md:hidden [&::-webkit-scrollbar]:hidden">
          {stripEnvs.map((env) => (
            <PAMEnvLink key={env.id} {...env} compact className="shrink-0" />
          ))}
          {stripLinks.map((link) => (
            <PAMDescLinkChip key={link.url} tt={tt} link={link} compact />
          ))}
        </div>
      ) : null}
    </div>
  );
};
