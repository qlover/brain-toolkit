import { clsx } from 'clsx';
import type { ReactNode } from 'react';

export interface AdminPageShellProps {
  readonly title: string;
  readonly description?: string;
  readonly children: ReactNode;
  readonly className?: string;
  readonly contentClassName?: string;
}

/**
 * Shared admin page header + content area. Width is controlled by {@link AdminLayout}.
 */
export function AdminPageShell({
  title,
  description,
  children,
  className,
  contentClassName
}: AdminPageShellProps) {
  return (
    <div data-testid="AdminPageShell" className={clsx('w-full', className)}>
      <header className="mb-5 border-b border-primary-border/70 pb-4 sm:mb-8 sm:pb-6">
        <h1 className="text-xl font-semibold tracking-tight text-primary-text sm:text-2xl lg:text-3xl">
          {title}
        </h1>
        {description ? (
          <p className="mt-2 text-sm leading-relaxed text-secondary-text sm:text-[15px]">
            {description}
          </p>
        ) : null}
      </header>
      <div className={clsx('w-full', contentClassName)}>{children}</div>
    </div>
  );
}
