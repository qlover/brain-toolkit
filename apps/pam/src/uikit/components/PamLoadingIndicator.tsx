'use client';

import { clsx } from 'clsx';

/**
 * Visible loading dots for PAM.
 *
 * Do not use `@qlover/next-kit` {@code Loading} here: it paints with
 * {@code bg-(--fe-color-primary)}, while PAM defines {@code --fe-color-primary}
 * as an RGB channel triplet meant for {@code rgb(var(--fe-color-primary))},
 * so kit dots are effectively transparent.
 */
export function PamLoadingIndicator({
  className
}: {
  readonly className?: string;
}) {
  return (
    <div
      data-testid="LoadingRoot"
      className={clsx('flex items-center justify-center gap-3', className)}
      aria-hidden
    >
      {[0, 1, 2].map((i) => (
        <span
          key={i}
          data-testid="Loading"
          className="h-3 w-3 animate-bounce rounded-full bg-brand"
          style={{ animationDelay: `${i * 0.2}s`, opacity: 0.75 }}
        />
      ))}
    </div>
  );
}
