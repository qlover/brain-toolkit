'use client';

import { clsx } from 'clsx';
import { useMemo, type ChangeEvent } from 'react';
import { mergePamCategories } from '@config/pamCategories';
import { pamFormFieldClass } from './PAMFormFieldStyles';

export interface PAMCategoryFieldLabels {
  readonly labelUnCategory: string;
  readonly categoryCustom: string;
  readonly categoryCustomPlaceholder: string;
}

export interface PAMCategoryFieldProps {
  readonly value: string;
  readonly onChange: (value: string) => void;
  readonly labels: PAMCategoryFieldLabels;
  readonly disabled?: boolean;
  readonly extras?: readonly string[];
  readonly inputClassName?: string;
  readonly inputTestId?: string;
  /** @deprecated Select UI removed; kept for call-site compatibility. */
  readonly selectClassName?: string;
  /** @deprecated Select UI removed; kept for call-site compatibility. */
  readonly selectTestId?: string;
}

/**
 * Free-text category field with optional suggestion chips.
 *
 * Plain text input (no native datalist — browsers draw a select-like caret).
 * Empty value means uncategorized.
 */
export function PAMCategoryField({
  value,
  onChange,
  labels,
  disabled = false,
  extras,
  inputClassName,
  inputTestId = 'PAMCategoryFieldCustom'
}: PAMCategoryFieldProps) {
  const options = useMemo(() => mergePamCategories(extras), [extras]);

  const onInputChange = (event: ChangeEvent<HTMLInputElement>) => {
    onChange(event.target.value);
  };

  return (
    <div data-testid="PAMCategoryField" className="flex flex-col gap-2">
      <input
        data-testid={inputTestId}
        type="text"
        value={value}
        disabled={disabled}
        placeholder={labels.categoryCustomPlaceholder}
        aria-label={labels.labelUnCategory}
        autoComplete="off"
        onChange={onInputChange}
        className={clsx(
          pamFormFieldClass,
          disabled && 'cursor-default opacity-80',
          inputClassName
        )}
      />
      {options.length > 0 ? (
        <div
          data-testid="PAMCategoryFieldSuggestions"
          className="flex flex-wrap gap-1.5"
        >
          {options.map((cat) => {
            const active = value.trim() === cat;
            return (
              <button
                data-testid="PAMCategoryField"
                key={cat}
                type="button"
                disabled={disabled}
                onClick={() => onChange(active ? '' : cat)}
                className={clsx(
                  'rounded-md border px-2 py-0.5 text-xs transition',
                  active
                    ? 'border-brand bg-brand/10 text-brand'
                    : 'border-primary-border text-secondary-text hover:border-brand/40 hover:text-primary-text',
                  disabled && 'cursor-default opacity-80'
                )}
              >
                {cat}
              </button>
            );
          })}
        </div>
      ) : null}
    </div>
  );
}
