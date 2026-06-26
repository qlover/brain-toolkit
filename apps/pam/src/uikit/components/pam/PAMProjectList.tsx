import { UploadOutlined } from '@ant-design/icons';
import React from 'react';
import type { SearchPAMProject } from '@schemas/PAMProjectSchema';
import { PAMProjectCard } from './PAMProjectCard';
import { PAMProjectListItem } from './PAMProjectListItem';

interface PAMProjectListProps {
  projects: readonly SearchPAMProject[];
  viewMode: 'card' | 'compact';
  isOwner: (project: SearchPAMProject) => boolean;
  onEdit: (id: string) => void;
  onDelete: (id: string) => void;
}

export const PAMProjectList: React.FC<PAMProjectListProps> = ({
  projects,
  viewMode,
  isOwner,
  onEdit,
  onDelete
}) => {
  if (projects.length === 0) {
    return (
      <div
        data-testid="PAMProjectList"
        className="text-center py-16 bg-bg-container rounded-2xl border border-dashed border-primary-border mt-4"
      >
        <UploadOutlined className="text-5xl text-tertiary-text mb-3" />
        <p className="text-secondary-text">暂无项目，点击「新增资产」创建</p>
      </div>
    );
  }

  if (viewMode === 'card') {
    return (
      <div
        data-testid="PAMProjectList"
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
      >
        {projects.map((project) => (
          <PAMProjectCard
            key={project.id}
            project={project}
            isOwner={isOwner(project)}
            onEdit={onEdit}
            onDelete={onDelete}
          />
        ))}
      </div>
    );
  }

  return (
    <div
      data-testid="PAMProjectList"
      className="bg-bg-container rounded-2xl border border-primary-border overflow-hidden shadow-sm"
    >
      <div className="divide-y divide-primary-border">
        {projects.map((project) => (
          <PAMProjectListItem
            key={project.id}
            project={project}
            isOwner={isOwner(project)}
            onEdit={onEdit}
            onDelete={onDelete}
          />
        ))}
      </div>
    </div>
  );
};
