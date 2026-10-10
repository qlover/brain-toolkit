'use client';

import { ArrowRightIcon } from '@heroicons/react/24/outline';
import { clsx } from 'clsx';
import dynamic from 'next/dynamic';
import { useLocale } from 'next-intl';
import React, { useEffect, useMemo, useState } from 'react';
import { Link } from '@/i18n/routing';
import { extractPAMDescLinks } from '@shared/utils/PAMDescMarkdownUtil';
import type { PAMI18nInterface } from '@config/i18n-mapping/PAMI18n';
import { ROUTE_PROJECT_GENERAL } from '@config/route';
import type { PAMEnvWriteable } from '@schemas/PAMEnvironmentSchema';
import {
  PAMPublicType,
  type SearchPAMProject
} from '@schemas/PAMProjectSchema';
import { PAMEnvLink, PAMPublicIcon } from './PAMIcon';
import { PAMProjectAvatar } from './PAMProjectAvatar';
import {
  formatPAMProjectTimestamp,
  getPAMPrimaryUrl,
  getPAMRepoPath,
  shortenPAMOwnerId
} from './PAMProjectDisplayUtil';
import {
  PAMDescLinkChip,
  PAMProjectPlaceholderCover
} from './PAMProjectQuickLinks';

export type PAMProjectDetailModel = SearchPAMProject & {
  environments?: PAMEnvWriteable[];
};

const PAMProjectDescMarkdown = dynamic(
  () =>
    import('./PAMProjectDescMarkdown').then((m) => m.PAMProjectDescMarkdown),
  {
    ssr: false,
    loading: () => (
      <div
        data-testid="PAMProjectDescMarkdown"
        className="animate-pulse space-y-2"
        aria-hidden
      >
        <div className="h-3 w-full rounded bg-elevated" />
        <div className="h-3 w-4/5 rounded bg-elevated" />
        <div className="h-3 w-2/3 rounded bg-elevated" />
      </div>
    )
  }
);

const SECTION_LABEL =
  'mb-1.5 text-[0.62rem] font-bold tracking-wide text-tertiary-text uppercase';

function DetailCover(props: {
  tt: PAMI18nInterface;
  project: PAMProjectDetailModel;
  iconOnly?: boolean;
  className?: string;
  children?: React.ReactNode;
}) {
  const { tt, project, iconOnly, className, children } = props;
  const url = (project.preview_image_url || '').trim();
  const [failed, setFailed] = useState(false);

  useEffect(() => setFailed(false), [url]);

  return (
    <div
      data-testid="DetailCover"
      className={clsx(
        'relative aspect-video w-full overflow-hidden bg-brand/6',
        className
      )}
    >
      {url && !failed ? (
        // eslint-disable-next-line @next/next/no-img-element -- arbitrary project preview URLs
        <img
          src={url}
          alt=""
          className="absolute inset-0 h-full w-full object-cover object-top"
          onError={() => setFailed(true)}
        />
      ) : (
        <PAMProjectPlaceholderCover
          tt={tt}
          name={project.name}
          slug={project.slug}
          repoUrl={project.repo_url}
          iconOnly={iconOnly}
        />
      )}
      {children}
    </div>
  );
}

/**
 * Project detail content shared by the list drawer, the pinned side column (`panel`)
 * and the mobile expanding card (`card`). The Markdown renderer loads on first render.
 */
export function PAMProjectDetailBody(props: {
  tt: PAMI18nInterface;
  project: PAMProjectDetailModel;
  variant: 'panel' | 'card';
  /** Header actions (panel only). */
  actions?: React.ReactNode;
}) {
  const { tt, project, variant, actions } = props;
  const locale = useLocale();
  const envs = useMemo(
    () => project.environments || [],
    [project.environments]
  );
  const links = useMemo(
    () => extractPAMDescLinks(project.description),
    [project.description]
  );
  const description = (project.description || '').trim();
  const primaryUrl = getPAMPrimaryUrl(envs, project.repo_url);
  const isPublic = project.is_public === PAMPublicType.public;
  const updatedShort = formatPAMProjectTimestamp(
    project.updated_at,
    locale,
    true
  );
  const metaText = [
    project.category,
    project.stack,
    updatedShort ? tt.updatedAt.replace('%time%', updatedShort) : ''
  ]
    .filter(Boolean)
    .join(' · ');

  const entriesSection = (
    <section>
      <div className={SECTION_LABEL}>{tt.quickEntryTitle}</div>
      {envs.length + links.length > 0 ? (
        <div className="flex flex-wrap gap-1.5">
          {envs.map((env) => (
            <PAMEnvLink key={env.id || env.name} {...env} />
          ))}
          {links.map((link) => (
            <PAMDescLinkChip key={link.url} tt={tt} link={link} />
          ))}
        </div>
      ) : (
        <p className="text-xs text-tertiary-text">{tt.quickEntryEmpty}</p>
      )}
    </section>
  );

  const descSection = (
    <section className="min-w-0">
      <div className={SECTION_LABEL}>{tt.detailDescTitle}</div>
      {description ? (
        <PAMProjectDescMarkdown markdown={description} />
      ) : (
        <p className="text-sm text-tertiary-text">{tt.noDesc}</p>
      )}
    </section>
  );

  const infoRows: { key: string; label: string; value: React.ReactNode }[] = [
    { key: 'category', label: tt.labelCategory, value: project.category },
    { key: 'stack', label: tt.labelStack, value: project.stack || '—' },
    {
      key: 'repo',
      label: tt.labelRepo,
      value: project.repo_url ? (
        <a
          href={project.repo_url}
          target="_blank"
          rel="noopener noreferrer"
          className="text-brand hover:text-brand-hover"
        >
          {getPAMRepoPath(project.repo_url)}
        </a>
      ) : (
        '—'
      )
    },
    ...(project.owner_id
      ? [
          {
            key: 'owner',
            label: tt.detailOwner,
            value: (
              <span className="font-mono text-xs" title={project.owner_id}>
                {shortenPAMOwnerId(project.owner_id)}
              </span>
            )
          }
        ]
      : []),
    {
      key: 'updated',
      label: tt.detailUpdated,
      value: formatPAMProjectTimestamp(project.updated_at, locale) || '—'
    }
  ];

  const infoSection = (
    <section>
      <div className={SECTION_LABEL}>{tt.detailInfoTitle}</div>
      <dl className="grid grid-cols-[5.5rem_minmax(0,1fr)] gap-y-1.5 text-sm">
        {infoRows.map((row) => (
          <React.Fragment key={row.key}>
            <dt className="text-tertiary-text">{row.label}</dt>
            <dd className="truncate text-primary-text">{row.value}</dd>
          </React.Fragment>
        ))}
      </dl>
    </section>
  );

  if (variant === 'card') {
    return (
      <div data-testid="PAMProjectDetailBody">
        <DetailCover tt={tt} project={project} iconOnly className="max-h-72">
          <div className="absolute inset-0 bg-linear-to-t from-black/80 via-black/20 to-transparent" />
          <div className="absolute inset-x-0 bottom-0 p-5 text-white">
            {metaText ? (
              <div className="truncate text-[0.7rem] font-semibold tracking-wide text-white/75 uppercase">
                {metaText}
              </div>
            ) : null}
            <div className="mt-1 flex min-w-0 items-center gap-2">
              <span className="truncate text-2xl leading-tight font-bold">
                {project.name}
              </span>
              <PAMPublicIcon
                isPublic={isPublic}
                publicTitle={tt.public}
                privateTitle={tt.private}
                showLabel={false}
                className="shrink-0 text-white/70"
              />
            </div>
          </div>
        </DetailCover>
        <div className="space-y-5 p-5 pb-[calc(1.25rem+env(safe-area-inset-bottom))]">
          {entriesSection}
          {descSection}
          {infoSection}
          <Link
            href={{
              pathname: ROUTE_PROJECT_GENERAL,
              params: { projectId: project.slug }
            }}
            className="flex h-10 items-center justify-center gap-1.5 rounded-[10px] bg-brand text-sm font-medium text-on-brand no-underline transition hover:bg-brand-hover"
          >
            {tt.detailOpenPage}
            <ArrowRightIcon className="h-4 w-4" />
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div data-testid="PAMProjectDetailBody" className="space-y-5">
      <div className="flex items-start gap-3">
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
            <span className="truncate text-lg font-semibold text-primary-text">
              {project.name}
            </span>
            <PAMPublicIcon
              isPublic={isPublic}
              publicTitle={tt.public}
              privateTitle={tt.private}
              showLabel={false}
              className="shrink-0"
            />
          </div>
          {metaText ? (
            <div className="mt-0.5 truncate text-xs text-tertiary-text">
              {metaText}
            </div>
          ) : null}
        </div>
        {actions ? <div className="flex shrink-0 gap-1">{actions}</div> : null}
      </div>
      <DetailCover
        tt={tt}
        project={project}
        className="rounded-xl border border-primary-border"
      />
      {entriesSection}
      {descSection}
      {infoSection}
    </div>
  );
}
