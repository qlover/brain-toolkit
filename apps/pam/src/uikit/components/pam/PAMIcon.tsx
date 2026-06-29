import {
  EyeOutlined,
  GlobalOutlined,
  LinkOutlined,
  LockOutlined
} from '@ant-design/icons';
import {
  faGithub,
  faGitlab,
  faGitAlt
} from '@fortawesome/free-brands-svg-icons';
import { faCodeBranch } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
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

export function PAMPublicIcon(props: {
  isPublic: boolean;
  publicTitle: string;
  privateTitle: string;
  className?: string;
}) {
  const { isPublic, publicTitle, privateTitle, className = '' } = props;
  return (
    <span
      data-testid="PAMPublicIcon"
      title={isPublic ? publicTitle : privateTitle}
      className={clsx(
        'text-xs',
        isPublic ? 'text-emerald-600' : 'text-amber-600',
        className
      )}
    >
      {isPublic ? <GlobalOutlined /> : <LockOutlined />}
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
      <EyeOutlined className="mr-0.5" />
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

const preEnvColors = {
  PROD: 'bg-blue-100 text-blue-700 hover:bg-blue-200 hover:text-blue-700',
  DEV: 'bg-green-100 text-green-700 hover:bg-green-200 hover:text-green-700',
  OTHER: 'bg-gray-100 text-gray-700 hover:bg-gray-200 hover:text-gray-700'
} as const;

/**
 * 渲染环境链接
 *
 * 预定义 prod,dev,other 三种环境，其他环境归为 OTHER
 *
 */
export function PAMEnvLink(
  props: PAMEnvWriteable & React.HTMLAttributes<HTMLAnchorElement>
) {
  const { name, url, className, ...rest } = props;
  const showName = name.toUpperCase() as keyof typeof preEnvColors;
  return (
    <a
      data-testid="PAMEnvLink"
      title={name}
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      {...rest}
      className={clsx(
        'inline-flex items-center gap-1 text-xs px-1 py-0.5 md:px-1.5 md:py-1 md:text-sm rounded-full transition',
        preEnvColors[showName] || preEnvColors.OTHER,
        className
      )}
    >
      <LinkOutlined /> <span>{showName}</span>
    </a>
  );
}
