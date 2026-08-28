'use client';

import { clsx } from 'clsx';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { PAMIcon } from './PAMIcon';
import {
  buildPamSiteLogoApiUrl,
  getPAMAvatarLetter
} from './PAMProjectDisplayUtil';

export type PAMProjectAvatarVariant = 'avatar' | 'cover';

export interface PAMProjectAvatarProps {
  name: string;
  previewImageUrl?: string | null;
  /** Site / env primary URL — proxied via `/api/pam/site-logo`. */
  primaryUrl?: string | null;
  repoUrl?: string | null;
  /** When false, skip preview (list rows; card body next to title). */
  allowPreview?: boolean;
  /**
   * `avatar`: list / card title mark.
   * `cover`: card top strip — only meaningful when preview is shown.
   */
  variant?: PAMProjectAvatarVariant;
  className?: string;
  /** Wrap in repo link when falling back to non-preview mark. */
  linkToRepo?: boolean;
  linkTitle?: string;
}

/**
 * Visual priority: preview (optional) → site logo API → repo icon → letter.
 */
export const PAMProjectAvatar: React.FC<PAMProjectAvatarProps> = ({
  name,
  previewImageUrl,
  primaryUrl,
  repoUrl,
  allowPreview = true,
  variant = 'avatar',
  className,
  linkToRepo = false,
  linkTitle
}) => {
  const preview = (previewImageUrl || '').trim();
  const primary = (primaryUrl || '').trim();
  const repo = (repoUrl || '').trim();
  const siteLogoApiUrl = useMemo(
    () => buildPamSiteLogoApiUrl(primary),
    [primary]
  );
  const letter = getPAMAvatarLetter(name);

  const [previewFailed, setPreviewFailed] = useState(false);
  const [siteLogoFailed, setSiteLogoFailed] = useState(false);
  const [markLoaded, setMarkLoaded] = useState(false);
  const markImgRef = useRef<HTMLImageElement>(null);

  useEffect(() => {
    setPreviewFailed(false);
  }, [preview]);

  useEffect(() => {
    setSiteLogoFailed(false);
  }, [siteLogoApiUrl]);

  const usePreview = allowPreview && preview.length > 0 && !previewFailed;
  const useSiteLogo = !usePreview && !!siteLogoApiUrl && !siteLogoFailed;
  const activeImageSrc = usePreview
    ? preview
    : useSiteLogo
      ? siteLogoApiUrl
      : null;

  const syncMarkLoadedFromImage = (img: HTMLImageElement | null): void => {
    markImgRef.current = img;
    if (img?.complete && img.naturalWidth > 0) {
      setMarkLoaded(true);
    }
  };

  useEffect(() => {
    setMarkLoaded(false);
    syncMarkLoadedFromImage(markImgRef.current);
  }, [activeImageSrc]);

  const useRepoIcon = !activeImageSrc && !!repo;
  const showLoadedImage = !!activeImageSrc && markLoaded;

  const shellClassName = clsx(
    variant === 'cover'
      ? 'relative flex aspect-video w-full shrink-0 items-center justify-center overflow-hidden bg-elevated'
      : clsx(
          'flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-primary-border text-xl font-bold text-brand no-underline sm:h-14 sm:w-14 sm:text-2xl',
          showLoadedImage ? 'bg-elevated' : 'bg-brand/10',
          linkToRepo &&
            repo &&
            !showLoadedImage &&
            'hover:border-brand hover:bg-primary'
        ),
    className
  );

  const renderFallback = (): React.ReactNode => {
    if (useRepoIcon) {
      return (
        <PAMIcon
          repoUrl={repo}
          className={
            variant === 'cover'
              ? 'h-12 w-12 text-brand sm:h-14 sm:w-14'
              : 'h-8 w-8 sm:h-9 sm:w-9'
          }
        />
      );
    }

    return (
      <span
        data-testid="renderFallback"
        className={clsx(
          variant === 'cover' && 'text-4xl font-bold text-brand sm:text-5xl'
        )}
      >
        {letter}
      </span>
    );
  };

  let inner: React.ReactNode;
  if (activeImageSrc) {
    inner = (
      <div className="relative flex h-full w-full items-center justify-center">
        <div
          className={clsx(
            'flex items-center justify-center transition-opacity',
            markLoaded ? 'pointer-events-none opacity-0' : 'opacity-100'
          )}
          aria-hidden={markLoaded}
        >
          {renderFallback()}
        </div>
        {
          // eslint-disable-next-line @next/next/no-img-element -- preview URL or same-origin logo proxy
          <img
            ref={syncMarkLoadedFromImage}
            src={activeImageSrc}
            alt=""
            className={clsx(
              'absolute inset-0 transition-opacity',
              usePreview
                ? 'h-full w-full object-cover'
                : 'm-auto h-7 w-7 object-contain sm:h-8 sm:w-8',
              markLoaded ? 'opacity-100' : 'opacity-0'
            )}
            onLoad={() => setMarkLoaded(true)}
            onError={() => {
              setMarkLoaded(false);
              if (usePreview) {
                setPreviewFailed(true);
              } else {
                setSiteLogoFailed(true);
              }
            }}
          />
        }
      </div>
    );
  } else {
    inner = renderFallback();
  }

  if (linkToRepo && repo && !activeImageSrc) {
    return (
      <a
        data-testid="PAMProjectAvatar"
        href={repo}
        target="_blank"
        rel="noopener noreferrer"
        title={linkTitle || name}
        className={shellClassName}
      >
        {inner}
      </a>
    );
  }

  return (
    <div data-testid="PAMProjectAvatar" className={shellClassName} title={name}>
      {inner}
    </div>
  );
};
