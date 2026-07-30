import { clsx } from 'clsx';
import React, { useState } from 'react';
import type { PAMEnvFormI18n } from '@config/i18n-mapping/PAMEnvFormI18n';
import { pamFormMonoFieldClass } from './PAMFormFieldStyles';

interface PAMFormEnvImportPanelProps {
  tt: PAMEnvFormI18n;
  onImport: (text: string) => void;
  onCancel: () => void;
}

/**
 * Dotenv paste panel for importing environment variables.
 */
export const PAMFormEnvImportPanel: React.FC<PAMFormEnvImportPanelProps> = ({
  tt,
  onImport,
  onCancel
}) => {
  const [text, setText] = useState('');

  return (
    <div
      data-testid="PAMFormEnvImportPanel"
      className="mt-2 space-y-2 rounded-lg border border-primary-border bg-elevated/60 p-2"
    >
      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder={tt.envVarImportPlaceholder}
        rows={5}
        className={clsx(
          pamFormMonoFieldClass,
          'w-full resize-y py-1.5 text-xs sm:text-sm'
        )}
      />
      <div className="flex flex-wrap items-center justify-end gap-2">
        <button
          type="button"
          onClick={onCancel}
          className="cursor-pointer rounded-lg px-2 py-1 text-xs text-secondary-text transition hover:bg-elevated touch-manipulation sm:text-sm"
        >
          {tt.envVarImportCancel}
        </button>
        <button
          type="button"
          onClick={() => onImport(text)}
          className="cursor-pointer rounded-lg bg-brand/10 px-2 py-1 text-xs text-brand transition hover:bg-brand/15 touch-manipulation sm:text-sm"
        >
          {tt.envVarImportConfirm}
        </button>
      </div>
    </div>
  );
};
