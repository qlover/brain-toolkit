'use client';

import { XMarkIcon } from '@heroicons/react/24/outline';
import { clsx } from 'clsx';
import { useEffect, useId, useState } from 'react';
import { createPortal } from 'react-dom';
import type { ReactNode } from 'react';

export interface BrainModalProps {
  open: boolean;
  title: ReactNode;
  children: ReactNode;
  /** Omit to make the dialog non-dismissable (e.g. one-time credentials). */
  onClose?: () => void;
  wide?: boolean;
  'data-testid'?: string;
}

/**
 * Centered card dialog. Portaled to `body` so it stacks above the Brain
 * header, which sits in its own stacking context.
 */
export function BrainModal({
  open,
  title,
  children,
  onClose,
  wide,
  'data-testid': testId
}: BrainModalProps) {
  const titleId = useId();
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  useEffect(() => {
    if (!open || !onClose) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [open, onClose]);

  if (!open || !mounted) return null;

  return createPortal(
    <div
      className="brain-modal"
      data-testid={testId}
      onClick={(event) => {
        if (event.target === event.currentTarget) onClose?.();
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className={clsx('brain-card', wide && 'wide')}
      >
        <div className="brain-modal-head">
          <h2 id={titleId} className="brain-title">
            {title}
          </h2>
          {onClose && (
            <button
              type="button"
              className="brain-modal-close"
              aria-label="Close"
              onClick={onClose}
            >
              <XMarkIcon />
            </button>
          )}
        </div>
        {children}
      </div>
    </div>,
    document.body
  );
}
