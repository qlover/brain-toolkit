'use client';

import { useState } from 'react';
import { BrainButton } from '@/uikit/components/brain/BrainButton';
import { BrainModal } from '@/uikit/components/brain/BrainModal';

export type DeveloperConfirmOptions = {
  title: string;
  content: string;
  okText: string;
  cancelText: string;
  onConfirm: () => void | Promise<void>;
};

type DeveloperConfirmDialogProps = {
  open: boolean;
  options: DeveloperConfirmOptions | null;
  onClose: () => void;
};

/** Second confirmation for destructive actions; the confirm button is red. */
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

  return (
    <BrainModal
      open={open}
      title={options.title}
      onClose={pending ? undefined : onClose}
      data-testid="DeveloperConfirmDialog"
    >
      <p className="brain-desc" style={{ marginTop: 0 }}>
        {options.content}
      </p>
      <div className="brain-modal-actions">
        <BrainButton
          type="button"
          variant="ghost"
          size="sm"
          auto
          disabled={pending}
          onClick={onClose}
        >
          {options.cancelText}
        </BrainButton>
        <BrainButton
          type="button"
          variant="danger"
          size="sm"
          auto
          loading={pending}
          onClick={() => void handleConfirm()}
        >
          {options.okText}
        </BrainButton>
      </div>
    </BrainModal>
  );
}
