import { CloudArrowUpIcon } from '@heroicons/react/24/outline';
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
  /** Open project detail (general tab). */
  onOpen: (id: string) => void;
  onDelete: (project: SearchPAMProject) => void;
  loading?: boolean;
}

function PAMProjectListSkeleton({
  viewMode
}: {
  viewMode: 'card' | 'compact';
}) {
  const items = Array.from({ length: 6 }, (_, i) => i);

  if (viewMode === 'card') {
    return (
      <div
        data-testid="PAMProjectListSkeleton"
        className="grid grid-cols-1 items-start gap-2.5 sm:grid-cols-2 sm:gap-3 lg:grid-cols-3"
      >
        {items.map((key) => (
          <div
            data-testid="PAMProjectListSkeleton"
            key={key}
            className="animate-pulse rounded-2xl border border-primary-border bg-secondary p-4 sm:p-5"
          >
            <div className="mb-4 flex items-start gap-3">
              <div className="h-12 w-12 shrink-0 rounded-xl bg-elevated sm:h-14 sm:w-14" />
              <div className="min-w-0 flex-1 space-y-2">
                <div className="h-4 w-2/3 rounded bg-elevated" />
                <div className="h-3 w-1/2 rounded bg-elevated" />
              </div>
            </div>
            <div className="space-y-2">
              <div className="h-3 w-full rounded bg-elevated" />
              <div className="h-3 w-4/5 rounded bg-elevated" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div
      data-testid="PAMProjectListSkeleton"
      className="bg-secondary overflow-hidden rounded-2xl border border-primary-border shadow-sm"
    >
      <div className="divide-y divide-primary-border">
        {items.map((key) => (
          <div
            data-testid="PAMProjectListSkeleton"
            key={key}
            className="flex animate-pulse items-center gap-3 px-4 py-4 sm:gap-4 sm:px-5"
          >
            <div className="h-12 w-12 shrink-0 rounded-xl bg-elevated" />
            <div className="min-w-0 flex-1 space-y-2">
              <div className="h-4 w-1/3 rounded bg-elevated" />
              <div className="h-3 w-2/3 rounded bg-elevated" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function PAMProjectListEmpty({ tt }: { tt: PAMI18nInterface }) {
  return (
    <div
      data-testid="PAMProjectListEmpty"
      className="bg-secondary mt-4 flex flex-col items-center justify-center rounded-2xl border border-dashed border-primary-border px-4 py-12 sm:py-16"
    >
      <CloudArrowUpIcon className="h-12 w-12 pam-empty-icon text-tertiary-text mb-3 text-4xl sm:text-5xl" />
      <p className="text-secondary-text text-sm sm:text-base">{tt.noProject}</p>
    </div>
  );
}

export const PAMProjectList: React.FC<PAMProjectListProps> = ({
  tt,
  projects,
  viewMode,
  isOwner,
  isAuthenticated = false,
  onOpen,
  onDelete,
  loading = false
}) => {
  if (projects.length === 0) {
    return (
      <div data-testid="PAMProjectList">
        {loading ? (
          <PAMProjectListSkeleton viewMode={viewMode} />
        ) : (
          <PAMProjectListEmpty tt={tt} />
        )}
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
            onOpen={onOpen}
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
            onOpen={onOpen}
            onDelete={onDelete}
          />
        ))}
      </div>
    </div>
  );
};
