import { clsx } from 'clsx';

export interface BrainAvatarProps {
  /** Used for the initial when there is no image. */
  name?: string | null;
  src?: string | null;
  size?: 'md' | 'sm';
  className?: string;
}

/** Round avatar: image when available, otherwise the first letter on the brand gradient. */
export function BrainAvatar({
  name,
  src,
  size = 'md',
  className
}: BrainAvatarProps) {
  const initial = name?.trim().charAt(0).toUpperCase() || '?';

  return (
    <span
      data-testid="BrainAvatar"
      className={clsx('brain-avatar', size === 'sm' && 'sm', className)}
      aria-hidden
    >
      {src ? (
        // eslint-disable-next-line @next/next/no-img-element -- external logo URL from developer input
        <img src={src} alt="" />
      ) : (
        initial
      )}
    </span>
  );
}
