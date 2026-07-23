import {
  faGithub,
  faGitlab,
  faGitAlt
} from '@fortawesome/free-brands-svg-icons';
import { faCodeBranch } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  ArrowTopRightOnSquareIcon,
  EyeIcon,
  LockClosedIcon
} from '@heroicons/react/24/outline';
import { clsx } from 'clsx';
import React from 'react';
import type { PAMEnvWriteable } from '@schemas/PAMEnvironmentSchema';

interface PAMIconProps {
  repoUrl?: string;
  className?: string;
}

export const PAMIcon: React.FC<PAMIconProps> = ({
  repoUrl,
  className = ''
}) => {
  if (!repoUrl) {
    return <FontAwesomeIcon icon={faCodeBranch} className={className} />;
  }
  const host = new URL(repoUrl).hostname.toLowerCase();
  if (host.includes('github.com'))
    return <FontAwesomeIcon icon={faGithub} className={className} />;
  if (host.includes('gitlab.com'))
    return <FontAwesomeIcon icon={faGitlab} className={className} />;
  if (host.includes('gitee.com'))
    return <FontAwesomeIcon icon={faGitAlt} className={className} />;

  return <FontAwesomeIcon icon={faCodeBranch} className={className} />;
};

/**
 * Visibility indicator aligned with PAMForm lock semantics.
 * Public projects render nothing; private shows a compact lock chip.
 * Scales down on small screens (icon-only), grows slightly on larger viewports.
 */
export function PAMPublicIcon(props: {
  isPublic: boolean;
  publicTitle: string;
  privateTitle: string;
  className?: string;
  showLabel?: boolean;
}) {
  const { isPublic, privateTitle, className = '', showLabel = true } = props;

  if (isPublic) {
    return null;
  }

  return (
    <span
      data-testid="PAMPublicIcon"
      title={privateTitle}
      className={clsx(
        'inline-flex items-center justify-center rounded-md border border-primary-border bg-elevated font-medium text-tertiary-text',
        'h-5 w-5 gap-0 p-0',
        'sm:h-[22px] sm:w-[22px]',
        'md:h-6 md:w-auto md:gap-1 md:px-1.5',
        className
      )}
    >
      <LockClosedIcon className="h-3 w-3 sm:h-[13px] sm:w-[13px] md:h-3.5 md:w-3.5" />
      {showLabel ? (
        <span className="hidden text-[0.65rem] leading-none md:inline">
          {privateTitle}
        </span>
      ) : null}
    </span>
  );
}

export function PAMAuthIcon(props: {
  isOwner: boolean;
  readonlyTitle: string;
  className?: string;
}) {
  const { isOwner, readonlyTitle, className } = props;
  return (
    <span
      data-testid="PAMAuthIcon"
      title={isOwner ? readonlyTitle : 'Not Owner'}
      className={clsx(
        'text-sm',
        isOwner ? 'text-emerald-600' : 'text-amber-600',
        className
      )}
    >
      <EyeIcon className="h-4 w-4 mr-0.5" />
    </span>
  );
}

export function PAMProjectName(props: {
  name: string;
  repoUrl?: string;
  className?: string;
  wrapperClassName?: string;
}) {
  const { name, repoUrl, wrapperClassName, className } = props;

  if (repoUrl) {
    return (
      <a
        data-testid="PAMProjectRepoUrl"
        href={repoUrl}
        title={repoUrl}
        target="_blank"
        rel="noopener noreferrer"
        className={clsx(
          'text-brand hover:text-brand-hover inline-flex items-center gap-1 text-xs sm:text-sm',
          wrapperClassName
        )}
      >
        <PAMIcon repoUrl={repoUrl} className="w-4" />
        <span
          data-testid="PAMProjectName"
          title={name}
          className={clsx(
            'text-primary-text hover:text-brand-hover transition-colors',
            className
          )}
        >
          {name}
        </span>
      </a>
    );
  }

  return (
    <span
      data-testid="PAMProjectName"
      title={name}
      className={clsx(
        'text-primary-text hover:text-brand-hover transition-colors',
        className
      )}
    >
      {name}
    </span>
  );
}

const EnvChipKind = {
  Dev: 'dev',
  Prod: 'prod',
  Other: 'other'
} as const;

type EnvChipKindType = (typeof EnvChipKind)[keyof typeof EnvChipKind];

function getEnvChipKind(name: string): EnvChipKindType {
  const normalized = (name || '').trim().toLowerCase();
  if (normalized === 'dev' || normalized === 'development') {
    return EnvChipKind.Dev;
  }
  if (normalized === 'prod' || normalized === 'production') {
    return EnvChipKind.Prod;
  }
  return EnvChipKind.Other;
}

/**
 * Prototype env-chip colors via Tailwind arbitrary values.
 * Avoid named palette (`green-50` etc.) — custom @qlover/tailwind-theme
 * may not emit those utilities, so chips silently lose color.
 */
const envChipKindClassName: Record<EnvChipKindType, string> = {
  [EnvChipKind.Dev]:
    'text-[#1a7f37] bg-[color-mix(in_srgb,#1a7f37_14%,#fff)] border-[color-mix(in_srgb,#1a7f37_30%,#fff)] dark:text-[#3fb950] dark:bg-[color-mix(in_srgb,#3fb950_18%,transparent)] dark:border-[color-mix(in_srgb,#3fb950_36%,transparent)] [[data-theme=pink]_&]:text-[#34d399] [[data-theme=pink]_&]:bg-[color-mix(in_srgb,#34d399_18%,transparent)] [[data-theme=pink]_&]:border-[color-mix(in_srgb,#34d399_36%,transparent)]',
  [EnvChipKind.Prod]:
    'text-[#9a6700] bg-[color-mix(in_srgb,#9a6700_14%,#fff)] border-[color-mix(in_srgb,#9a6700_30%,#fff)] dark:text-[#d29922] dark:bg-[color-mix(in_srgb,#d29922_18%,transparent)] dark:border-[color-mix(in_srgb,#d29922_36%,transparent)] [[data-theme=pink]_&]:text-[#fbbf24] [[data-theme=pink]_&]:bg-[color-mix(in_srgb,#fbbf24_18%,transparent)] [[data-theme=pink]_&]:border-[color-mix(in_srgb,#fbbf24_36%,transparent)]',
  [EnvChipKind.Other]:
    'text-[#656d76] bg-[#f0f2f4] border-[#d0d7de] dark:text-[#8b949e] dark:bg-elevated dark:border-primary-border [[data-theme=pink]_&]:text-[#c490a8] [[data-theme=pink]_&]:bg-elevated [[data-theme=pink]_&]:border-primary-border'
};

/**
 * Environment jump chip — matches pam-prototypev3 `.env-chip`.
 */
export function PAMEnvLink(
  props: PAMEnvWriteable &
    React.HTMLAttributes<HTMLAnchorElement> & {
      compact?: boolean;
    }
) {
  const { name, url, className, compact = false, ...rest } = props;
  const kind = getEnvChipKind(name);
  const showName = (name || '').toUpperCase();

  return (
    <a
      data-testid="PAMEnvLink"
      title={name}
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      {...rest}
      className={clsx(
        'inline-flex items-center border border-solid font-mono font-semibold tracking-wide no-underline transition-opacity hover:opacity-90',
        compact
          ? 'gap-1 rounded px-1.5 py-0.5 text-[0.7rem] sm:gap-1.5 sm:px-2 sm:py-1 sm:text-xs md:text-[0.8rem]'
          : 'gap-1.5 rounded-md px-2.5 py-1 text-xs sm:text-sm',
        envChipKindClassName[kind],
        className
      )}
    >
      <ArrowTopRightOnSquareIcon
        className={clsx(
          compact ? 'h-3 w-3 sm:h-3.5 sm:w-3.5' : 'h-3.5 w-3.5 sm:h-4 sm:w-4',
          'shrink-0 text-current'
        )}
        aria-hidden
      />
      <span>{showName}</span>
    </a>
  );
}
