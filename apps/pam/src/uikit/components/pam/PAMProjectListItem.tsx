import React from 'react';
import type { ProjectCardData } from './PAMProjectCard';

interface PAMProjectListItemProps {
  project: ProjectCardData;
  isOwner: boolean;
  onEdit: (id: string) => void;
  onDelete: (id: string) => void;
  onManageEnv: (id: string) => void;
}

export const PAMProjectListItem: React.FC<PAMProjectListItemProps> = ({
  project,
  isOwner,
  onEdit,
  onDelete,
  onManageEnv
}) => {
  const envs = project.environments || [];

  return (
    <div
      data-testid="PAMProjectListItem"
      className="flex flex-wrap items-center gap-3 px-5 py-3 hover:bg-primary-bg transition border-b border-primary-border last:border-b-0"
    >
      <div className="min-w-[150px]">
        <div className="font-semibold text-primary-text">{project.name}</div>
        <div className="flex flex-wrap gap-1 items-center">
          {project.category && (
            <span className="category-badge text-xs">{project.category}</span>
          )}
          <span className="text-xs text-tertiary-text">
            {project.stack || ''}
          </span>
        </div>
      </div>

      <div className="flex flex-wrap gap-1 flex-1 env-buttons">
        {envs.length > 0 ? (
          envs.map((env) => (
            <a
              data-testid="PAMProjectListItem"
              key={env.id}
              href={env.url || '#'}
              target="_blank"
              rel="noopener noreferrer"
              className={`text-xs px-2 py-1 rounded-md hover:opacity-80 transition inline-flex items-center gap-1 ${
                env.name === 'prod'
                  ? 'bg-blue-100 text-blue-700'
                  : env.name === 'dev'
                    ? 'bg-green-100 text-green-700'
                    : 'bg-gray-100 text-gray-700'
              }`}
            >
              <i className="fas fa-external-link-alt text-[10px]"></i>{' '}
              {env.name.toUpperCase()}
            </a>
          ))
        ) : (
          <span className="text-xs text-tertiary-text">无环境</span>
        )}
      </div>

      <div className="flex items-center gap-2 ml-auto">
        <span
          className={`text-xs ${
            project.is_public === 1 ? 'text-emerald-600' : 'text-amber-600'
          }`}
        >
          <i
            className={`fas ${project.is_public === 1 ? 'fa-eye' : 'fa-lock'}`}
          ></i>
        </span>
        {isOwner ? (
          <>
            <button
              onClick={() => onEdit(project.id)}
              className="text-primary hover:bg-primary-bg p-1.5 rounded transition"
            >
              <i className="fas fa-edit"></i>
            </button>
            <button
              onClick={() => onDelete(project.id)}
              className="text-red-500 hover:bg-red-50 p-1.5 rounded transition"
            >
              <i className="fas fa-trash-alt"></i>
            </button>
            <button
              onClick={() => onManageEnv(project.id)}
              className="text-secondary-text hover:text-primary p-1.5 rounded transition"
              title="管理环境变量"
            >
              <i className="fas fa-cog"></i>
            </button>
          </>
        ) : (
          <span className="text-xs text-tertiary-text">只读</span>
        )}
      </div>
    </div>
  );
};
