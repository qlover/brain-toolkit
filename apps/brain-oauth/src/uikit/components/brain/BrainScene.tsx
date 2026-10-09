import { clsx } from 'clsx';

const SPHERES = ['sm', 'lg', 'xs1', 'xs2', 'xs3', 'xs4'] as const;

export interface BrainSceneProps {
  /** Disc in the top-right corner; for dense pages like the console. */
  quiet?: boolean;
  /**
   * Scrolls with the page and only covers the top area (header + hero)
   * instead of staying fixed behind the whole viewport.
   */
  contained?: boolean;
}

/**
 * Decorative background (disc + floating spheres). Place inside a
 * `brain-page` container; content stays above it.
 */
export function BrainScene({ quiet, contained }: BrainSceneProps) {
  return (
    <div
      data-testid="BrainScene"
      className={clsx(
        'brain-scene',
        quiet && 'quiet',
        contained && 'contained'
      )}
      aria-hidden
    >
      <div className="brain-disc" />
      {SPHERES.map((size) => (
        <div
          data-testid="BrainScene"
          key={size}
          className={`brain-sphere brain-sphere-${size}`}
        />
      ))}
    </div>
  );
}
