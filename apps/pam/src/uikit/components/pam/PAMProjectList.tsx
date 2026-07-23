import { ArrowPathIcon, CloudArrowUpIcon } from '@heroicons/react/24/outline';
import React from 'react';
import type { PAMI18nInterface } from '@config/i18n-mapping/PAMI18n';
import type { SearchPAMProject } from '@schemas/PAMProjectSchema';
import { PAMProjectCard } from './PAMProjectCard';
import { PAMProjectListItem } from './PAMProjectListItem';

interface PAMProjectListProps {
  tt: PAMI18nInterface;
  projects: readonly SearchPAMProject[];
  viewMode: 'card' | 'compact';
  isOwner: (project: SearchPAMProject) => boolean;
  /** When false, hide mutate actions and readonly badges (guest). */
  isAuthenticated?: boolean;
  onEdit: (id: string) => void;
  onDelete: (project: SearchPAMProject) => void;
  loading?: boolean;
}

function PAMProjectListEmpty({
  tt,
  loading
}: {
  tt: PAMI18nInterface;
  loading: boolean;
}) {
  return (
    <div
      data-testid="PAMProjectListEmpty"
      className="bg-secondary mt-4 flex flex-col items-center justify-center rounded-2xl border border-dashed border-primary-border px-4 py-12 sm:py-16"
    >
      {loading ? (
        <>
          <ArrowPathIcon className="h-12 w-12 text-brand mb-3 text-4xl sm:text-5xl animate-spin" />
          <p className="text-secondary-text text-sm sm:text-base">
            {tt.loadingText}
          </p>
        </>
      ) : (
        <>
          <CloudArrowUpIcon className="h-12 w-12 pam-empty-icon text-tertiary-text mb-3 text-4xl sm:text-5xl" />
          <p className="text-secondary-text text-sm sm:text-base">
            {tt.noProject}
          </p>
        </>
      )}
    </div>
  );
}

export const PAMProjectList: React.FC<PAMProjectListProps> = ({
  tt,
  projects,
  viewMode,
  isOwner,
  isAuthenticated = false,
  onEdit,
  onDelete,
  loading = false
}) => {
  if (projects.length === 0) {
    return (
      <div data-testid="PAMProjectList">
        <PAMProjectListEmpty tt={tt} loading={loading} />
      </div>
    );
  }

  if (viewMode === 'card') {
    return (
      <div
        data-testid="PAMProjectList"
        className="grid grid-cols-1 items-start gap-2.5 sm:grid-cols-2 sm:gap-3 lg:grid-cols-3"
      >
        {projects.map((project) => (
          <PAMProjectCard
            tt={tt}
            key={project.id}
            project={project}
            isOwner={isOwner(project)}
            isAuthenticated={isAuthenticated}
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
      className="bg-secondary overflow-hidden rounded-2xl border border-primary-border shadow-sm"
    >
      <div className="divide-y divide-primary-border">
        {projects.map((project) => (
          <PAMProjectListItem
            tt={tt}
            key={project.id}
            project={project}
            isOwner={isAuthenticated && isOwner(project)}
            onEdit={onEdit}
            onDelete={onDelete}
          />
        ))}
      </div>
    </div>
  );
};
