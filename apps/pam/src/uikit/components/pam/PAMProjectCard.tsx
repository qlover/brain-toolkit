import { clsx } from 'clsx';
import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState
} from 'react';
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
  getPAMDisplayHost,
  getPAMPrimaryUrl,
  shortenPAMOwnerId
} from './PAMProjectDisplayUtil';

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
  const envs = project.environments || [];
  const isPublic = project.is_public === PAMPublicType.public;
  const stack = (project.stack || '').trim();
  const hasEnvs = envs.length > 0;
  const primaryUrl = getPAMPrimaryUrl(envs, project.repo_url);
  const displayHost = getPAMDisplayHost(primaryUrl);
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
              'inline-flex items-center rounded-full border px-1.5 py-0.5 text-[0.62rem] font-semibold',
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
    categoryActive,
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
      {showCover ? (
        <div className="relative aspect-video w-full shrink-0 overflow-hidden bg-brand/6">
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
        </div>
      ) : (
        <div className="flex h-18 shrink-0 items-center gap-3 border-b border-primary-border bg-brand/6 px-3 sm:h-20 sm:gap-3.5 sm:px-3.5">
          <PAMProjectAvatar
            name={project.name}
            primaryUrl={primaryUrl}
            repoUrl={project.repo_url}
            allowPreview={false}
            linkToRepo
            linkTitle={tt.openRepo}
            className="h-11! w-11! text-lg! sm:h-12! sm:w-12! sm:text-xl!"
          />
          <div className="min-w-0 flex-1">
            {displayHost && primaryUrl ? (
              <a
                href={primaryUrl}
                target="_blank"
                rel="noopener noreferrer"
                title={primaryUrl}
                className="block truncate text-xs font-medium text-tertiary-text no-underline transition hover:text-secondary-text hover:underline"
              >
                {displayHost}
              </a>
            ) : null}
            {stack ? (
              <div
                className={clsx(
                  'truncate text-sm font-semibold text-primary-text',
                  displayHost && 'mt-0.5'
                )}
              >
                {stack}
              </div>
            ) : !displayHost ? (
              <div className="truncate text-sm font-semibold text-secondary-text">
                {project.name}
              </div>
            ) : null}
          </div>
        </div>
      )}
      <div className="flex flex-1 flex-col gap-2 p-3 sm:gap-2.5 sm:p-3.5">
        <div className="flex items-center justify-between gap-2">
          <div className="flex min-w-0 flex-1 items-center gap-3 sm:gap-3.5">
            {showCover ? (
              <PAMProjectAvatar
                name={project.name}
                primaryUrl={primaryUrl}
                repoUrl={project.repo_url}
                allowPreview={false}
                linkToRepo
                linkTitle={tt.openRepo}
              />
            ) : null}
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

        {showCover && stack ? (
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

        {isAuthenticated && !isOwner ? (
          <div className="mt-auto border-t border-primary-border pt-2.5">
            <span className="text-xs text-tertiary-text">{tt.readonly}</span>
          </div>
        ) : null}
      </div>
    </div>
  );
};
