import { clsx } from 'clsx';
import { useLocale } from 'next-intl';
import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState
} from 'react';
import { Link } from '@/i18n/routing';
import {
  extractPAMDescLinks,
  extractPAMDescSummary
} from '@shared/utils/PAMDescMarkdownUtil';
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
  getPAMPrimaryUrl
} from './PAMProjectDisplayUtil';
import {
  PAMDescLinkChip,
  PAMProjectPlaceholderCover,
  PAMProjectQuickAccess
} from './PAMProjectQuickLinks';

/** Entries shown inline on a card; the rest go to the quick-access menu. */
const CARD_QUICK_ENTRY_MAX = 5;

type PAMProjectCardModel = SearchPAMProject & {
  environments?: PAMEnvWriteable[];
};

interface PAMProjectCardProps {
  tt: PAMI18nInterface;
  project: PAMProjectCardModel;
  isOwner: boolean;
  /** Guest: hide readonly label. */
  isAuthenticated?: boolean;
  highlightKeyword?: string;
  highlightCategory?: string;
}

export const PAMProjectCard: React.FC<PAMProjectCardProps> = ({
  tt,
  project,
  isOwner,
  isAuthenticated = false,
  highlightKeyword = '',
  highlightCategory = ''
}) => {
  const locale = useLocale();
  const envs = useMemo(
    () => project.environments || [],
    [project.environments]
  );
  const isPublic = project.is_public === PAMPublicType.public;
  const stack = (project.stack || '').trim();
  const primaryUrl = getPAMPrimaryUrl(envs, project.repo_url);
  const summary = useMemo(
    () => extractPAMDescSummary(project.description),
    [project.description]
  );
  const links = useMemo(
    () => extractPAMDescLinks(project.description),
    [project.description]
  );
  const entryCount = envs.length + links.length;
  const inlineEnvs = envs.slice(0, CARD_QUICK_ENTRY_MAX);
  const inlineLinks = links.slice(
    0,
    Math.max(0, CARD_QUICK_ENTRY_MAX - inlineEnvs.length)
  );
  const restCount = entryCount - inlineEnvs.length - inlineLinks.length;
  const previewImageUrl = (project.preview_image_url || '').trim();
  const [previewFailed, setPreviewFailed] = useState(false);
  const [previewLoaded, setPreviewLoaded] = useState(false);
  const previewImgRef = useRef<HTMLImageElement>(null);
  const showCover = previewImageUrl.length > 0 && !previewFailed;

  const syncPreviewLoaded = useCallback((img: HTMLImageElement | null) => {
    previewImgRef.current = img;
    if (img?.complete && img.naturalWidth > 0) {
      setPreviewLoaded(true);
    }
  }, []);

  useEffect(() => {
    setPreviewFailed(false);
    setPreviewLoaded(false);
    syncPreviewLoaded(previewImgRef.current);
  }, [previewImageUrl, syncPreviewLoaded]);

  const categoryActive = isCategoryHighlightActive(
    project.category,
    highlightCategory
  );
  const titleNode = useMemo(
    () => highlightText(project.name, highlightKeyword),
    [project.name, highlightKeyword]
  );

  const subBits = useMemo(() => {
    const bits: { key: string; node: React.ReactNode }[] = [];
    if (project.category) {
      bits.push({
        key: 'cat',
        node: (
          <span
            className={clsx(
              'inline-flex shrink-0 items-center rounded-full border px-1.5 py-0.5 text-[0.62rem] font-semibold',
              categoryActive
                ? PAM_CATEGORY_HIGHLIGHT_CLASS
                : 'border-brand/35 bg-brand/10 text-brand'
            )}
          >
            {project.category}
          </span>
        )
      });
    }
    if (stack) {
      bits.push({
        key: 'stack',
        node: (
          <span className="shrink-0 font-medium text-primary-text">
            {stack}
          </span>
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
    const updatedAtText = formatPAMProjectTimestamp(
      project.updated_at,
      locale,
      true
    );
    if (updatedAtText) {
      bits.push({
        key: 'updated',
        node: (
          <time
            dateTime={String(project.updated_at ?? '')}
            className="truncate"
          >
            {tt.updatedAt.replace('%time%', updatedAtText)}
          </time>
        )
      });
    }
    return bits;
  }, [
    project.category,
    categoryActive,
    stack,
    project.updated_at,
    locale,
    isOwner,
    isAuthenticated,
    tt.readonly,
    tt.updatedAt
  ]);

  const coverMedia = (
    <>
      <div
        className={clsx(
          'absolute inset-0 flex items-center justify-center transition-opacity',
          previewLoaded ? 'pointer-events-none opacity-0' : 'opacity-100'
        )}
        aria-hidden={previewLoaded}
      >
        <PAMProjectAvatar
          name={project.name}
          primaryUrl={primaryUrl}
          repoUrl={project.repo_url}
          allowPreview={false}
          variant="cover"
        />
      </div>
      {
        // eslint-disable-next-line @next/next/no-img-element -- arbitrary project preview URLs
        <img
          ref={syncPreviewLoaded}
          src={previewImageUrl}
          alt=""
          className={clsx(
            'absolute inset-0 h-full w-full object-cover transition-opacity',
            previewLoaded ? 'opacity-100' : 'opacity-0'
          )}
          onLoad={() => setPreviewLoaded(true)}
          onError={() => setPreviewFailed(true)}
        />
      }
    </>
  );

  return (
    <div
      data-testid="PAMProjectCard"
      className="flex h-full flex-col overflow-hidden rounded-2xl border border-primary-border bg-secondary transition hover:border-brand hover:shadow-[0_0_0_1px_var(--fe-color-brand)]"
    >
      <div className="relative aspect-video w-full shrink-0 overflow-hidden border-b border-primary-border bg-brand/6">
        {showCover ? (
          primaryUrl ? (
            <a
              href={primaryUrl}
              target="_blank"
              rel="noopener noreferrer"
              title={primaryUrl}
              className="absolute inset-0 block"
            >
              {coverMedia}
            </a>
          ) : (
            <Link
              href={{
                pathname: ROUTE_PROJECT_GENERAL,
                params: { projectId: project.slug }
              }}
              title={project.name}
              className="absolute inset-0 block"
            >
              {coverMedia}
            </Link>
          )
        ) : (
          <Link
            href={{
              pathname: ROUTE_PROJECT_GENERAL,
              params: { projectId: project.slug }
            }}
            title={project.name}
            className="absolute inset-0 block"
          >
            <PAMProjectPlaceholderCover
              tt={tt}
              name={project.name}
              slug={project.slug}
              repoUrl={project.repo_url}
            />
          </Link>
        )}
      </div>
      <div className="flex flex-1 flex-col gap-2 p-3 sm:gap-2.5 sm:p-3.5">
        <div className="flex items-center justify-between gap-2">
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
              <Link
                href={{
                  pathname: ROUTE_PROJECT_GENERAL,
                  params: { projectId: project.slug }
                }}
                className="block max-w-full truncate text-left text-lg font-semibold leading-snug tracking-tight text-primary-text no-underline transition hover:text-brand sm:text-xl"
              >
                {titleNode}
              </Link>
              {subBits.length > 0 ? (
                <div className="mt-0.5 flex items-center gap-1.5 overflow-hidden text-xs leading-snug whitespace-nowrap text-tertiary-text">
                  {subBits.map((bit, index) => (
                    <React.Fragment key={bit.key}>
                      {index > 0 ? (
                        <span className="shrink-0 opacity-50">·</span>
                      ) : null}
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

        <p className="line-clamp-2 text-sm leading-snug text-secondary-text">
          {summary || tt.noDesc}
        </p>

        <div className="mt-auto flex flex-col gap-1.5">
          <div className="text-[0.58rem] font-bold tracking-wide text-tertiary-text uppercase">
            {tt.quickEntryTitle}
          </div>
          {entryCount > 0 ? (
            <div className="flex flex-wrap items-center gap-1.5">
              {inlineEnvs.map((env) => (
                <PAMEnvLink key={env.id} {...env} />
              ))}
              {inlineLinks.map((link) => (
                <PAMDescLinkChip key={link.url} tt={tt} link={link} />
              ))}
              {restCount > 0 ? (
                <PAMProjectQuickAccess
                  tt={tt}
                  slug={project.slug}
                  name={project.name}
                  repoUrl={project.repo_url}
                  envs={envs}
                  links={links}
                  className="h-7 px-2.5 sm:h-8"
                >
                  +{restCount}
                </PAMProjectQuickAccess>
              ) : null}
            </div>
          ) : (
            <div className="flex h-7 items-center text-xs text-tertiary-text sm:h-8">
              {tt.quickEntryEmpty}
            </div>
          )}
        </div>

        {isAuthenticated && !isOwner ? (
          <div className="border-t border-primary-border pt-2.5">
            <span className="text-xs text-tertiary-text">{tt.readonly}</span>
          </div>
        ) : null}
      </div>
    </div>
  );
};
