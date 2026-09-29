import { ArrowRightIcon } from '@heroicons/react/24/outline';
import { clsx } from 'clsx';
import type { ButtonHTMLAttributes } from 'react';

export interface BrainButtonProps
  extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'ghost' | 'danger';
  size?: 'md' | 'sm';
  /** Shrink to content instead of full width. */
  auto?: boolean;
  /** Trailing arrow that nudges on hover. */
  arrow?: boolean;
  loading?: boolean;
}

/** Pill button; primary is inverted (dark on light theme, light on dark). */
export function BrainButton({
  variant = 'primary',
  size = 'md',
  auto,
  arrow,
  loading,
  disabled,
  className,
  children,
  ...props
}: BrainButtonProps) {
  return (
    <button
      data-testid="BrainButton"
      className={clsx(
        'brain-btn',
        variant !== 'primary' && variant,
        size === 'sm' && 'sm',
        auto && 'auto',
        className
      )}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      {...props}
    >
      {loading && <span className="brain-spinner" aria-hidden />}
      {children}
      {arrow && !loading && (
        <span className="brain-btn-arrow" aria-hidden>
          <ArrowRightIcon />
        </span>
      )}
    </button>
  );
}
