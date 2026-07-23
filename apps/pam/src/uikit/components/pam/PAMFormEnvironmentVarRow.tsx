import { MinusCircleIcon } from '@heroicons/react/24/outline';
import { clsx } from 'clsx';
import React from 'react';
import { useWarnTranslations } from '@/uikit/hook/useWarnTranslations';
import type { PAMI18nInterface } from '@config/i18n-mapping/PAMI18n';
import type { PAMVariable } from '@schemas/PAMEnvironmentSchema';
import { pamFormMonoFieldClass } from './PAMFormFieldStyles';
import type { FieldError } from 'react-hook-form';

interface PAMFormEnvironmentVarRowProps {
  envIndex: number;
  item: PAMVariable;
  keyError?: FieldError;
  valueError?: FieldError;
  tt: PAMI18nInterface;
  onUpdateVariable: (
    envIndex: number,
    oldKey: string,
    newKey: string,
    value: string
  ) => void;
  onRemoveVariable: (envIndex: number, key: string) => void;
}

export const PAMFormEnvironmentVarRow: React.FC<
  PAMFormEnvironmentVarRowProps
> = ({
  envIndex,
  item,
  keyError,
  valueError,
  tt,
  onUpdateVariable,
  onRemoveVariable
}) => {
  const t = useWarnTranslations();
  const errorMessage = keyError?.message || valueError?.message;

  return (
    <div data-testid="PAMFormEnvironmentVarRow" className="space-y-0.5">
      <div className="env-var-row flex flex-wrap items-center gap-1.5 sm:flex-nowrap sm:gap-2">
        <input
          type="text"
          placeholder={tt.placeholderEnvVar}
          value={item.key}
          onChange={(e) =>
            onUpdateVariable(envIndex, item.key, e.target.value, item.value)
          }
          className={clsx(
            pamFormMonoFieldClass,
            'env-var-key min-w-15 flex-1 py-1.5 text-xs sm:text-sm',
            keyError && 'border-(--fe-color-error)'
          )}
        />
        <input
          type="text"
          placeholder={tt.placehoderEnvValue}
          value={item.value}
          onChange={(e) =>
            onUpdateVariable(envIndex, item.key, item.key, e.target.value)
          }
          className={clsx(
            pamFormMonoFieldClass,
            'env-var-value min-w-20 flex-[1.5] py-1.5 text-xs sm:text-sm',
            valueError && 'border-(--fe-color-error)'
          )}
        />
        <button
          type="button"
          onClick={() => onRemoveVariable(envIndex, item.key)}
          className="shrink-0 cursor-pointer rounded-lg p-1 text-(--fe-color-error) transition hover:bg-(--fe-color-error)/10 hover:opacity-80 touch-manipulation"
          aria-label={tt.envDelete}
        >
          <MinusCircleIcon className="h-4 w-4" />
        </button>
      </div>
      {errorMessage && (
        <div className="col-span-full mt-0.5 text-xs text-(--fe-color-error)">
          {t(errorMessage)}
        </div>
      )}
    </div>
  );
};
