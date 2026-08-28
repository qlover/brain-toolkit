'use client';

import { clsx } from 'clsx';
import React, { useEffect, useMemo, useState } from 'react';
import { PAMIcon } from './PAMIcon';
import {
  getPAMAvatarLetter,
  getPAMSiteIconCandidates
} from './PAMProjectDisplayUtil';

export type PAMProjectAvatarVariant = 'avatar' | 'cover';

export interface PAMProjectAvatarProps {
  name: string;
  previewImageUrl?: string | null;
  /** Site / env primary URL — used for favicon / logo.svg. */
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
 * Visual priority: preview (optional) → favicon.ico / favicon.svg / logo.svg
 * → repo forge icon → letter.
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
  const siteIcons = useMemo(() => getPAMSiteIconCandidates(primary), [primary]);
  const letter = getPAMAvatarLetter(name);

  const [previewFailed, setPreviewFailed] = useState(false);
  const [siteIconIndex, setSiteIconIndex] = useState(0);

  useEffect(() => {
    setPreviewFailed(false);
  }, [preview]);

  useEffect(() => {
    setSiteIconIndex(0);
  }, [siteIcons]);

  const usePreview = allowPreview && preview.length > 0 && !previewFailed;
  const siteIconUrl =
    !usePreview && siteIconIndex < siteIcons.length
      ? siteIcons[siteIconIndex]
      : null;
  const useSiteIcon = !!siteIconUrl;
  const useRepoIcon = !usePreview && !useSiteIcon && !!repo;
  const isImageMark = usePreview || useSiteIcon;

  const shellClassName = clsx(
    variant === 'cover'
      ? 'relative flex aspect-video w-full shrink-0 items-center justify-center overflow-hidden bg-elevated'
      : clsx(
          'flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-primary-border text-xl font-bold text-brand no-underline sm:h-14 sm:w-14 sm:text-2xl',
          isImageMark ? 'bg-elevated' : 'bg-brand/10',
          linkToRepo &&
            repo &&
            !usePreview &&
            'hover:border-brand hover:bg-primary'
        ),
    className
  );

  let inner: React.ReactNode;
  if (usePreview) {
    inner = (
      // eslint-disable-next-line @next/next/no-img-element -- arbitrary preview / storage URLs
      <img
        src={preview}
        alt=""
        className="h-full w-full object-cover"
        onError={() => setPreviewFailed(true)}
      />
    );
  } else if (useSiteIcon && siteIconUrl) {
    inner = (
      // eslint-disable-next-line @next/next/no-img-element -- arbitrary site favicon / logo URLs
      <img
        src={siteIconUrl}
        alt=""
        className={
          variant === 'cover'
            ? 'h-14 w-14 object-contain sm:h-16 sm:w-16'
            : 'h-7 w-7 object-contain sm:h-8 sm:w-8'
        }
        onError={() => setSiteIconIndex((i) => i + 1)}
      />
    );
  } else if (useRepoIcon) {
    inner = (
      <PAMIcon
        repoUrl={repo}
        className={
          variant === 'cover'
            ? 'h-12 w-12 text-brand sm:h-14 sm:w-14'
            : 'h-8 w-8 sm:h-9 sm:w-9'
        }
      />
    );
  } else {
    inner = (
      <span
        className={clsx(
          variant === 'cover' && 'text-4xl font-bold text-brand sm:text-5xl'
        )}
      >
        {letter}
      </span>
    );
  }

  if (linkToRepo && repo && !usePreview) {
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
