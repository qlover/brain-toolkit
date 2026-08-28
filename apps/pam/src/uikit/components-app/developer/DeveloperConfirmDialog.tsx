'use client';

import {
  ArrowPathIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline';
import { clsx } from 'clsx';
import { useState } from 'react';
import {
  oauthDangerButtonClass,
  oauthPrimaryButtonClass,
  oauthSecondaryButtonClass
} from '@config/component';
import { DeveloperOverlayModal } from './DeveloperOverlayModal';

export type DeveloperConfirmOptions = {
  title: string;
  content: string;
  okText: string;
  cancelText: string;
  variant?: 'default' | 'danger';
  onConfirm: () => void | Promise<void>;
};

type DeveloperConfirmDialogProps = {
  open: boolean;
  options: DeveloperConfirmOptions | null;
  onClose: () => void;
};

export function DeveloperConfirmDialog({
  open,
  options,
  onClose
}: DeveloperConfirmDialogProps) {
  const [pending, setPending] = useState(false);

  const handleConfirm = async () => {
    if (!options || pending) return;
    setPending(true);
    try {
      await options.onConfirm();
      onClose();
    } catch {
      // Keep dialog open; caller shows toast via dialogHandler
    } finally {
      setPending(false);
    }
  };

  if (!options) return null;

  const okClass =
    options.variant === 'danger'
      ? oauthDangerButtonClass
      : oauthPrimaryButtonClass;

  return (
    <DeveloperOverlayModal
      open={open}
      title={options.title}
      onClose={pending ? () => undefined : onClose}
      maxWidthClass="max-w-md"
      closeOnBackdrop={!pending}
      footer={
        <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <button
            type="button"
            className={clsx(
              oauthSecondaryButtonClass,
              'min-h-11 w-full justify-center sm:w-auto'
            )}
            disabled={pending}
            onClick={onClose}
          >
            {options.cancelText}
          </button>
          <button
            type="button"
            className={clsx(
              okClass,
              'min-h-11 w-full justify-center gap-2 sm:w-auto'
            )}
            disabled={pending}
            onClick={() => void handleConfirm()}
          >
            {pending && <ArrowPathIcon className="h-4 w-4 animate-spin" />}
            {options.okText}
          </button>
        </div>
      }
    >
      <div className="flex gap-3 rounded-xl border border-primary-border/80 bg-elevated/40 px-3.5 py-3.5">
        <ExclamationTriangleIcon
          className={clsx(
            'mt-0.5 h-5 w-5 shrink-0',
            options.variant === 'danger'
              ? 'text-red-500'
              : 'text-amber-500 dark:text-amber-400'
          )}
        />
        <p className="text-sm leading-relaxed text-secondary-text">
          {options.content}
        </p>
      </div>
    </DeveloperOverlayModal>
  );
}
