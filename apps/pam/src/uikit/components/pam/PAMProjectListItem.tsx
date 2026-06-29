import { EditOutlined, DeleteOutlined } from '@ant-design/icons';
import { Grid } from 'antd';
import React, { useMemo } from 'react';
import type { PAMI18nInterface } from '@config/i18n-mapping/PAMI18n';
import {
  PAMPublicType,
  type PAMProjectDetail
} from '@schemas/PAMProjectSchema';
import { PAMEnvLink, PAMProjectName, PAMPublicIcon } from './PAMIcon';

const { useBreakpoint } = Grid;

interface PAMProjectListItemProps {
  tt: PAMI18nInterface;
  project: PAMProjectDetail;
  isOwner: boolean;
  onEdit: (id: string) => void;
  onDelete: (project: PAMProjectDetail) => void;
}

export const PAMProjectListItem: React.FC<PAMProjectListItemProps> = ({
  tt,
  project,
  isOwner,
  onEdit,
  onDelete
}) => {
  const envs = useMemo(
    () => project.environments || [],
    [project.environments]
  );

  const bk = useBreakpoint();
  const isMobile = bk.xs;

  const renderEnvs = useMemo(() => {
    if (Array.isArray(envs) && envs.length > 0) {
      return envs.map((env) => <PAMEnvLink key={env.id} {...env} />);
    }

    return (
      <span
        data-testid="PAMProjectListItemNoEnv"
        className="text-xs text-tertiary-text"
      >
        {tt.noEnv}
      </span>
    );
  }, [envs, tt.noEnv]);

  return (
    <div
      data-testid="PAMProjectListItem"
      className="px-5 py-3 bg-secondary hover:bg-primary/80 transition border-b border-primary-border last:border-b-0"
    >
      <div className="flex flex-wrap items-center gap-3">
        <div className="min-w-37">
          <div className="font-semibold text-md md:text-lg text-primary-text truncate flex items-center gap-2">
            <PAMProjectName
              name={project.name}
              repoUrl={project.repo_url ?? ''}
            />
          </div>
          <div className="flex flex-wrap gap-1.5 mt-1 items-center">
            {project.stack && (
              <span className="text-secondary-text bg-primary text-xs py-0.5 px-1 rounded-full">
                {project.stack}
              </span>
            )}
            {project.category && (
              <span className="text-brand font-bold bg-primary text-xs py-0.5 px-2 rounded-full">
                {project.category}
              </span>
            )}
          </div>
        </div>

        {!isMobile && (
          <div className="flex flex-wrap gap-1 flex-1">{renderEnvs}</div>
        )}

        <div className="flex items-center gap-2 ml-auto">
          <div className="flex items-center gap-1.5">
            <PAMPublicIcon
              isPublic={project.is_public === PAMPublicType.public}
              publicTitle={tt.public}
              privateTitle={tt.private}
            />

            {isOwner && (
              <button
                onClick={() => onEdit(project.id)}
                className="text-sm p-1 text-brand hover:text-brand-hover hover:bg-primary-bg rounded transition"
              >
                <EditOutlined />
              </button>
            )}
            {isOwner && (
              <button
                onClick={() => onDelete(project)}
                className="text-sm p-1 text-red-500 hover:bg-red-500 hover:text-primary-text rounded transition"
              >
                <DeleteOutlined />
              </button>
            )}
          </div>
        </div>
      </div>

      {isMobile && (
        <div className="flex items-center gap-1.5 mt-1">{renderEnvs}</div>
      )}
    </div>
  );
};
