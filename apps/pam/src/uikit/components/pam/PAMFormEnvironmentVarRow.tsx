import { DeleteOutlined } from '@ant-design/icons';
import { clsx } from 'clsx';
import React from 'react';
import { useWarnTranslations } from '@/uikit/hook/useWarnTranslations';
import type { PAMI18nInterface } from '@config/i18n-mapping/PAMI18n';
import type { PAMVariable } from '@schemas/PAMEnvironmentSchema';
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
      <div className="env-var-row flex flex-wrap sm:flex-nowrap gap-1.5 sm:gap-2 items-center">
        <input
          type="text"
          placeholder={tt.placeholderEnvVar}
          value={item.key}
          onChange={(e) =>
            onUpdateVariable(envIndex, item.key, e.target.value, item.value)
          }
          className={clsx(
            'env-var-key flex-1 min-w-15 border rounded-lg px-2 sm:px-3 py-1.5 sm:py-2 text-xs sm:text-sm bg-secondary text-primary-text focus:outline-none focus:ring-2 focus:ring-brand touch-manipulation',
            keyError ? 'border-(--fe-color-error)' : 'border-primary-border'
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
            'env-var-value flex-[1.5] min-w-20 border rounded-lg px-2 sm:px-3 py-1.5 sm:py-2 text-xs sm:text-sm bg-secondary text-primary-text focus:outline-none focus:ring-2 focus:ring-brand touch-manipulation',
            valueError ? 'border-(--fe-color-error)' : 'border-primary-border'
          )}
        />
        <button
          type="button"
          onClick={() => onRemoveVariable(envIndex, item.key)}
          className="text-(--fe-color-error) hover:text-(--fe-color-error)/80 touch-manipulation shrink-0 p-1 rounded-lg hover:bg-(--fe-color-error)/10 transition cursor-pointer"
        >
          <DeleteOutlined className="text-xs" />
        </button>
      </div>
      {errorMessage && (
        <div className="text-(--fe-color-error) text-xs mt-0.5 col-span-full">
          {t(errorMessage)}
        </div>
      )}
    </div>
  );
};
