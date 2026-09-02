import { ArrowPathIcon } from '@heroicons/react/24/outline';
import { clsx } from 'clsx';
import React from 'react';

export type PAMSettingsCardProps = {
  readonly title: string;
  readonly description: string;
  readonly children: React.ReactNode;
  readonly saveLabel?: string;
  readonly savingLabel?: string;
  readonly showSave?: boolean;
  readonly saveDisabled?: boolean;
  readonly saving?: boolean;
  readonly onSave?: () => void;
  readonly footerLeft?: React.ReactNode;
  readonly testId?: string;
  readonly className?: string;
};

/**
 * Vercel-style settings section card with optional per-section Save.
 *
 * Significance: Isolates one project attribute into an interactive block.
 * Core idea: Title + description + editor + footer save for atomic updates.
 * Main function: Layout shell for general settings fields.
 * Main purpose: Safer, clearer edits than one giant form submit.
 *
 * @example
 * <PAMSettingsCard title="Name" description="..." onSave={save} saveLabel="Save">
 *   <input />
 * </PAMSettingsCard>
 */
export const PAMSettingsCard: React.FC<PAMSettingsCardProps> = ({
  title,
  description,
  children,
  saveLabel = 'Save',
  savingLabel = 'Saving...',
  showSave = true,
  saveDisabled = false,
  saving = false,
  onSave,
  footerLeft,
  testId = 'PAMSettingsCard',
  className
}) => {
  return (
    <section
      data-testid={testId}
      className={clsx(
        'overflow-hidden rounded-2xl border border-primary-border bg-secondary shadow-sm',
        className
      )}
    >
      <div className="space-y-4 px-3 py-4 sm:px-6 sm:py-6">
        <div className="space-y-1">
          <h2 className="text-base font-semibold text-primary-text sm:text-lg">
            {title}
          </h2>
          <p className="text-sm leading-relaxed text-secondary-text">
            {description}
          </p>
        </div>
        <div>{children}</div>
      </div>
      {(showSave || footerLeft) && (
        <div className="flex flex-col gap-3 border-t border-primary-border bg-elevated/40 px-3 py-3 sm:flex-row sm:items-center sm:justify-between sm:px-6">
          <div className="min-w-0 text-xs text-tertiary-text sm:text-sm">
            {footerLeft}
          </div>
          {showSave && onSave ? (
            <button
              type="button"
              onClick={onSave}
              disabled={saveDisabled || saving}
              className={clsx(
                'inline-flex w-full cursor-pointer items-center justify-center gap-2 rounded-lg bg-brand px-3.5 py-2.5 text-sm font-medium text-on-brand transition sm:w-auto',
                'hover:bg-brand-hover active:bg-brand-active',
                'disabled:cursor-not-allowed disabled:opacity-50 touch-manipulation'
              )}
            >
              {saving ? (
                <>
                  <ArrowPathIcon className="h-4 w-4 animate-spin" />
                  {savingLabel}
                </>
              ) : (
                saveLabel
              )}
            </button>
          ) : null}
        </div>
      )}
    </section>
  );
};
