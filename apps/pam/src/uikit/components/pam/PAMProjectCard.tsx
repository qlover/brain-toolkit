import React from 'react';
import type { PAMApiProjectSchemaType } from '@schemas/PAMProjectSchema';
import { PAMIcon } from './PAMIcon';

interface PAMProjectCardProps {
  project: PAMApiProjectSchemaType;
  isOwner: boolean;
  onEdit: (id: string) => void;
  onDelete: (id: string) => void;
  onManageEnv: (id: string) => void; // 打开环境管理（当前复用编辑模态框）
}

export const PAMProjectCard: React.FC<PAMProjectCardProps> = ({
  project,
  isOwner,
  onEdit,
  onDelete,
  onManageEnv
}) => {
  const envs = project.environments || [];
  const firstEnv = envs[0];
  const envVarsPreview = firstEnv ? (
    Object.entries(firstEnv.variables || {})
      .slice(0, 2)
      .map(([key]) => (
        <span
          data-testid="envVarsPreview"
          key={key}
          className="inline-block bg-primary-bg rounded px-2 py-0.5 text-xs font-mono text-secondary-text"
        >
          {key}
        </span>
      ))
  ) : (
    <span className="text-xs text-tertiary-text">无环境变量</span>
  );

  return (
    <div
      data-testid="PAMProjectCard"
      className="bg-bg-container rounded-2xl border border-primary-border shadow-sm overflow-hidden card-hover flex flex-col h-full transition-all hover:shadow-md"
    >
      <div className="p-5 flex-1">
        <div className="flex justify-between items-start">
          <div>
            <h3 className="text-lg font-bold text-primary-text truncate">
              {project.name}
            </h3>
            <div className="flex flex-wrap gap-2 mt-1 items-center">
              {project.stack && (
                <span className="bg-primary-bg text-secondary-text text-xs px-2 py-0.5 rounded-full">
                  {project.stack}
                </span>
              )}
              {project.category && (
                <span className="bg-primary-bg text-primary text-xs px-2 py-0.5 rounded-full font-medium">
                  {project.category}
                </span>
              )}
              <span
                className={`text-xs ${
                  project.is_public === 1 ? 'text-green-600' : 'text-amber-600'
                }`}
              >
                <i
                  className={`fas ${
                    project.is_public === 1 ? 'fa-globe' : 'fa-lock'
                  }`}
                ></i>{' '}
                {project.is_public === 1 ? '公开' : '私有'}
              </span>
              {!isOwner && (
                <span className="text-xs bg-primary-bg text-tertiary-text px-2 py-0.5 rounded-full">
                  <i className="fas fa-eye"></i> 只读
                </span>
              )}
            </div>
          </div>
          {isOwner && (
            <div className="flex gap-1">
              <button
                onClick={() => onEdit(project.id)}
                className="text-primary hover:text-primary-hover p-1.5 rounded-lg transition"
              >
                <i className="fas fa-edit"></i>
              </button>
              <button
                onClick={() => onDelete(project.id)}
                className="text-red-500 hover:text-red-700 p-1.5 rounded-lg transition"
              >
                <i className="fas fa-trash-alt"></i>
              </button>
            </div>
          )}
        </div>

        <p className="text-secondary-text text-sm mt-2 line-clamp-2">
          {project.description || '暂无描述'}
        </p>

        <div className="mt-3 flex items-center gap-2">
          {project.repo_url && (
            <a
              href={project.repo_url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary hover:text-primary-hover text-sm inline-flex items-center gap-1"
            >
              <PAMIcon repoUrl={project.repo_url} className="w-4" />
              仓库
            </a>
          )}
        </div>

        <div className="mt-4">
          <div className="text-xs font-semibold text-secondary-text mb-2">
            <i className="fas fa-globe-asia mr-1"></i> 环境直达
          </div>
          <div className="flex flex-wrap gap-2">
            {envs.length > 0 ? (
              envs.map((env) => (
                <a
                  data-testid="PAMProjectCard"
                  key={env.id}
                  href={env.url || '#'}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`inline-flex items-center gap-1 text-xs px-3 py-1.5 rounded-full transition ${
                    env.name === 'prod'
                      ? 'bg-blue-100 text-blue-700 hover:bg-blue-200'
                      : env.name === 'dev'
                        ? 'bg-green-100 text-green-700 hover:bg-green-200'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  <i className="fas fa-link"></i> {env.name.toUpperCase()}
                </a>
              ))
            ) : (
              <span className="text-xs text-tertiary-text">未配置环境</span>
            )}
          </div>
        </div>

        <div className="mt-3 pt-2 border-t border-primary-border">
          <div className="flex justify-between items-center">
            <span className="text-xs font-medium text-secondary-text">
              <i className="fas fa-cog"></i> 环境变量示例
            </span>
            {isOwner && (
              <button
                onClick={() => onManageEnv(project.id)}
                className="text-primary text-xs hover:text-primary-hover"
              >
                <i className="fas fa-edit"></i> 管理
              </button>
            )}
          </div>
          <div className="flex flex-wrap gap-1 mt-1.5">{envVarsPreview}</div>
        </div>
      </div>

      <div className="bg-primary-bg px-5 py-2 text-right text-xs text-tertiary-text flex justify-between">
        <span>
          <i className="far fa-user-circle"></i> todo: 用户信息
        </span>
        <span>{envs.length} 个环境</span>
      </div>
    </div>
  );
};
