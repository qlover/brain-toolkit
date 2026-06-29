import {
  LockOutlined,
  EyeOutlined,
  EditOutlined,
  DeleteOutlined,
  EnvironmentOutlined,
  LinkOutlined,
  SettingOutlined,
  UserOutlined
} from '@ant-design/icons';
import { clsx } from 'clsx';
import type { PAMI18nInterface } from '@config/i18n-mapping/PAMI18n';
import type { PAMProjectDetail } from '@schemas/PAMProjectSchema';
import { PAMIcon } from './PAMIcon';

interface PAMProjectCardProps {
  tt: PAMI18nInterface;
  project: PAMProjectDetail;
  isOwner: boolean;
  onEdit: (id: string) => void;
  onDelete: (project: PAMProjectDetail) => void;
}

export const PAMProjectCard: React.FC<PAMProjectCardProps> = ({
  tt,
  project,
  isOwner,
  onEdit,
  onDelete
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
    <span className="text-xs text-tertiary-text">{tt.noEnvVars}</span>
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
              <span
                title={project.is_public === 1 ? tt.public : tt.private}
                className={clsx(
                  'text-xs mr-2',
                  project.is_public === 1
                    ? 'text-emerald-600'
                    : 'text-amber-600'
                )}
              >
                {project.is_public === 1 ? (
                  <EyeOutlined className="text-sm" />
                ) : (
                  <LockOutlined className="text-sm" />
                )}
              </span>

              <span title={project.name}>{project.name}</span>
            </h3>
            <div className="flex flex-wrap gap-2 mt-1 items-center">
              {project.stack && (
                <span className="bg-primary-bg text-secondary-text text-xs py-0.5 rounded-full">
                  {project.stack}
                </span>
              )}
              {project.category && (
                <span className="bg-primary-bg text-primary-text text-xs py-0.5 rounded-full font-medium">
                  {project.category}
                </span>
              )}

              {!isOwner && (
                <span className="text-xs bg-primary-bg text-tertiary-text py-0.5 rounded-full">
                  <EyeOutlined className="mr-0.5" /> {tt.readonly}
                </span>
              )}
            </div>
          </div>
          {isOwner && (
            <div className="flex gap-1">
              <button
                onClick={() => onEdit(project.id)}
                className="text-primary-text hover:text-primary-text-hover p-1.5 rounded-lg transition"
              >
                <EditOutlined />
              </button>
              <button
                onClick={() => onDelete(project)}
                className="text-red-500 hover:text-red-700 p-1.5 rounded-lg transition"
              >
                <DeleteOutlined />
              </button>
            </div>
          )}
        </div>

        <p className="text-secondary-text text-sm mt-2 line-clamp-2">
          {project.description || tt.noDesc}
        </p>

        <div className="mt-3 flex items-center gap-2">
          {project.repo_url && (
            <a
              data-testid="PAMRepoUrl"
              href={project.repo_url}
              title={project.repo_url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary-text hover:text-primary-text-hover text-sm inline-flex items-center gap-1"
            >
              <PAMIcon repoUrl={project.repo_url} className="w-4" />
              {project.repo_url}
            </a>
          )}
        </div>

        <div className="mt-4">
          <div className="text-xs font-semibold text-secondary-text mb-2">
            <EnvironmentOutlined className="mr-1" /> {tt.envDirectTitle}
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
                  className={clsx(
                    'inline-flex items-center gap-1 text-xs px-3 py-1.5 rounded-full transition',
                    {
                      'bg-blue-100 text-blue-700 hover:bg-blue-200':
                        env.name === 'prod',
                      'bg-green-100 text-green-700 hover:bg-green-200':
                        env.name === 'dev',
                      'bg-gray-100 text-gray-700 hover:bg-gray-200':
                        env.name !== 'prod' && env.name !== 'dev'
                    }
                  )}
                >
                  <LinkOutlined /> {env.name.toUpperCase()}
                </a>
              ))
            ) : (
              <span className="text-xs text-tertiary-text">
                {tt.noEnvConfig}
              </span>
            )}
          </div>
        </div>

        <div className="mt-3 pt-2 border-t border-primary-border">
          <div className="flex justify-between items-center">
            <span className="text-xs font-medium text-secondary-text">
              <SettingOutlined className="mr-1" /> {tt.envDemo}
            </span>
          </div>
          <div className="flex flex-wrap gap-1 mt-1.5">{envVarsPreview}</div>
        </div>
      </div>

      <div className="bg-primary-bg px-5 py-2 text-right text-xs text-tertiary-text flex justify-between">
        <span>
          <UserOutlined className="mr-1" /> todo: 用户信息
        </span>
        <span>{tt.envCount.replace('[count]', envs.length.toString())}</span>
      </div>
    </div>
  );
};
