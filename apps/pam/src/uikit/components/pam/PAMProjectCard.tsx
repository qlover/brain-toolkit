import {
  EditOutlined,
  DeleteOutlined,
  EnvironmentOutlined,
  SettingOutlined,
  UserOutlined
} from '@ant-design/icons';
import type { PAMI18nInterface } from '@config/i18n-mapping/PAMI18n';
import type { PAMProjectDetail } from '@schemas/PAMProjectSchema';
import {
  PAMAuthIcon,
  PAMEnvLink,
  PAMProjectName,
  PAMPublicIcon
} from './PAMIcon';

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
      className="card-hover bg-secondary flex h-full flex-col overflow-hidden rounded-2xl border border-primary-border shadow-sm"
    >
      <div className="p-5 flex-1">
        <div className="flex justify-between items-start">
          <div>
            <h3 className="text-lg font-bold text-primary-text truncate flex items-center gap-2">
              <PAMProjectName
                name={project.name}
                repoUrl={project.repo_url ?? ''}
              />

              <PAMPublicIcon
                isPublic={project.is_public === 1}
                publicTitle={tt.public}
                privateTitle={tt.private}
              />

              <PAMAuthIcon isOwner={isOwner} readonlyTitle={tt.readonly} />
            </h3>
            <div className="flex flex-wrap gap-2 mt-1 items-center">
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

              {isOwner && (
                <div className="flex gap-1">
                  <button
                    onClick={() => onEdit(project.id)}
                    className="text-brand hover:text-brand-hover p-1.5 rounded-lg transition"
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
          </div>
        </div>

        <p className="text-secondary-text text-sm mt-2 line-clamp-2">
          {project.description || tt.noDesc}
        </p>

        <div className="mt-4">
          <div className="text-xs font-semibold text-secondary-text mb-2">
            <EnvironmentOutlined className="mr-1" /> {tt.envDirectTitle}
          </div>
          <div className="flex flex-wrap gap-2">
            {envs.length > 0 ? (
              envs.map((env) => <PAMEnvLink key={env.id} {...env} />)
            ) : (
              <span className="text-xs text-tertiary-text">
                {tt.noEnvConfig}
              </span>
            )}
          </div>
        </div>

        <div className="hidden mt-3 pt-2 border-t border-primary-border">
          <div className="flex justify-between items-center">
            <span className="text-xs font-medium text-secondary-text">
              <SettingOutlined className="mr-1" /> {tt.envDemo}
            </span>
          </div>
          <div className="flex flex-wrap gap-1 mt-1.5">{envVarsPreview}</div>
        </div>
      </div>

      <div className="bg-primary px-5 py-2 text-right text-xs text-secondary-text border-t border-primary-border flex flex-wrap justify-between">
        <span
          title={project.owner_id}
          className="text-ellipsis overflow-hidden"
        >
          <UserOutlined className="mr-1" /> {project.owner_id}
        </span>
        <span>{tt.envCount.replace('[count]', envs.length.toString())}</span>
      </div>
    </div>
  );
};
