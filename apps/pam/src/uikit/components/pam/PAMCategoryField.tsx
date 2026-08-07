'use client';

import { clsx } from 'clsx';
import { useMemo, type ChangeEvent } from 'react';
import { mergePamCategories, PAM_CATEGORY_CUSTOM } from '@config/pamCategories';
import { pamFormFieldClass, pamFormSelectClass } from './PAMFormFieldStyles';

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
  readonly selectClassName?: string;
  readonly inputClassName?: string;
  readonly selectTestId?: string;
  readonly inputTestId?: string;
}

/**
 * Preset + custom single category control for create/edit forms.
 */
export function PAMCategoryField({
  value,
  onChange,
  labels,
  disabled = false,
  extras,
  selectClassName,
  inputClassName,
  selectTestId = 'PAMCategoryFieldSelect',
  inputTestId = 'PAMCategoryFieldCustom'
}: PAMCategoryFieldProps) {
  const options = useMemo(() => mergePamCategories(extras), [extras]);
  const trimmed = value.trim();
  const isKnownOption = trimmed === '' || options.includes(trimmed);
  const selectValue = isKnownOption ? value : PAM_CATEGORY_CUSTOM;
  const showCustomInput = selectValue === PAM_CATEGORY_CUSTOM;

  const onSelectChange = (event: ChangeEvent<HTMLSelectElement>) => {
    const next = event.target.value;
    if (next === PAM_CATEGORY_CUSTOM) {
      onChange(isKnownOption ? '' : value);
      return;
    }
    onChange(next);
  };

  return (
    <div data-testid="PAMCategoryField" className="flex flex-col gap-2">
      <select
        data-testid={selectTestId}
        value={selectValue}
        disabled={disabled}
        onChange={onSelectChange}
        className={clsx(
          pamFormSelectClass,
          disabled && 'cursor-default opacity-80',
          selectClassName
        )}
      >
        <option value="">{labels.labelUnCategory}</option>
        {options.map((cat) => (
          <option data-testid="PAMCategoryField" key={cat} value={cat}>
            {cat}
          </option>
        ))}
        <option value={PAM_CATEGORY_CUSTOM}>{labels.categoryCustom}</option>
      </select>
      {showCustomInput ? (
        <input
          data-testid={inputTestId}
          type="text"
          value={isKnownOption ? '' : value}
          disabled={disabled}
          placeholder={labels.categoryCustomPlaceholder}
          onChange={(event) => onChange(event.target.value)}
          className={clsx(
            pamFormFieldClass,
            disabled && 'cursor-default opacity-80',
            inputClassName
          )}
        />
      ) : null}
    </div>
  );
}
