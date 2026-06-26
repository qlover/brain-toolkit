import {
  EditOutlined,
  DeleteOutlined,
  EyeOutlined,
  LockOutlined,
  LinkOutlined
} from '@ant-design/icons';
import { clsx } from 'clsx';
import React from 'react';
import type { PAMProjectDetail } from '@schemas/PAMProjectSchema';

interface PAMProjectListItemProps {
  project: PAMProjectDetail;
  isOwner: boolean;
  onEdit: (id: string) => void;
  onDelete: (id: string) => void;
}

export const PAMProjectListItem: React.FC<PAMProjectListItemProps> = ({
  project,
  isOwner,
  onEdit,
  onDelete
}) => {
  const envs = project.environments || [];

  return (
    <div
      data-testid="PAMProjectListItem"
      className="flex flex-wrap items-center gap-3 px-5 py-3 hover:bg-primary-bg transition border-b border-primary-border last:border-b-0"
    >
      <div className="min-w-37">
        <div className="font-semibold text-primary-text">{project.name}</div>
        <div className="flex flex-wrap gap-1 items-center">
          {project.category && (
            <span className="category-badge text-brand-active text-xs">
              {project.category}
            </span>
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
              data-testid={'PAMProjectListItemAction-' + env.id}
              key={env.id}
              href={env.url || '#'}
              target="_blank"
              rel="noopener noreferrer"
              className={clsx(
                'text-xs px-2 py-1 rounded-md hover:opacity-80 transition inline-flex items-center gap-1',
                {
                  'bg-blue-100 text-blue-700': env.name === 'prod',
                  'bg-green-100 text-green-700': env.name === 'dev',
                  'bg-gray-100 text-gray-700':
                    env.name !== 'prod' && env.name !== 'dev'
                }
              )}
            >
              <LinkOutlined className="text-sm" /> {env.name.toUpperCase()}
            </a>
          ))
        ) : (
          <span className="text-xs text-tertiary-text">无环境</span>
        )}
      </div>

      <div className="flex items-center gap-2 ml-auto">
        <span
          className={clsx(
            'text-xs',
            project.is_public === 1 ? 'text-emerald-600' : 'text-amber-600'
          )}
        >
          {project.is_public === 1 ? (
            <EyeOutlined className="text-sm" />
          ) : (
            <LockOutlined className="text-sm" />
          )}
        </span>
        {isOwner ? (
          <>
            <button
              onClick={() => onEdit(project.id)}
              className="text-sm text-brand hover:text-brand-hover hover:bg-primary-bg p-1.5 rounded transition"
            >
              <EditOutlined />
            </button>
            <button
              onClick={() => onDelete(project.id)}
              className="text-sm text-red-500 hover:bg-red-500 hover:text-primary-text p-1.5 rounded transition"
            >
              <DeleteOutlined />
            </button>
          </>
        ) : null}
      </div>
    </div>
  );
};
