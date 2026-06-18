import {
  faGithub,
  faGitlab,
  faGitAlt
} from '@fortawesome/free-brands-svg-icons';
import { faCodeBranch } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import React from 'react';

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
  try {
    const host = new URL(repoUrl).hostname.toLowerCase();
    if (host.includes('github.com'))
      return <FontAwesomeIcon icon={faGithub} className={className} />;
    if (host.includes('gitlab.com'))
      return <FontAwesomeIcon icon={faGitlab} className={className} />;
    if (host.includes('gitee.com'))
      return <FontAwesomeIcon icon={faGitAlt} className={className} />;
    return <FontAwesomeIcon icon={faCodeBranch} className={className} />;
  } catch {
    return <FontAwesomeIcon icon={faCodeBranch} className={className} />;
  }
};
