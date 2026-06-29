import {
  CloudServerOutlined,
  DeleteOutlined,
  DownOutlined,
  PlusOutlined
} from '@ant-design/icons';
import { clsx } from 'clsx';
import React from 'react';
import { Controller, useFormContext } from 'react-hook-form';
import type { PAMI18nInterface } from '@config/i18n-mapping/PAMI18n';
import type { PAMProjectCreate } from '@schemas/PAMProjectSchema';
import { PAMProjectEnvKey } from '@schemas/PAMProjectSchema';
import { PAMFormEnvironmentVarRow } from './PAMFormEnvironmentVarRow';

type FormValues = PAMProjectCreate;
type PAMFormEnvironmentType = NonNullable<
  FormValues[typeof PAMProjectEnvKey]
>[number];

interface PAMFormEnvironmentBlockProps {
  index: number;
  env: PAMFormEnvironmentType;
  isCollapsed: boolean;
  tt: PAMI18nInterface;
  onToggleCollapse: (index: number) => void;
  onRemove: (index: number) => void;
  onAddVariable: (envIndex: number) => void;
  onUpdateVariable: (
    envIndex: number,
    oldKey: string,
    newKey: string,
    value: string
  ) => void;
  onRemoveVariable: (envIndex: number, key: string) => void;
}

export const PAMFormEnvironmentBlock: React.FC<
  PAMFormEnvironmentBlockProps
> = ({
  index,
  env,
  isCollapsed,
  tt,
  onToggleCollapse,
  onRemove,
  onAddVariable,
  onUpdateVariable,
  onRemoveVariable
}) => {
  const {
    control,
    formState: { errors }
  } = useFormContext<FormValues>();

  const variables = env.variables || [];

  return (
    <div
      data-testid="PAMFormEnvironmentBlock"
      className="env-block border border-primary-border rounded-xl bg-primary-bg relative transition overflow-hidden"
    >
      <div className="p-3 sm:p-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2 flex-1 min-w-30">
            <span className="text-brand text-sm cursor-pointer">
              <CloudServerOutlined />
            </span>
            <Controller
              name={`${PAMProjectEnvKey}.${index}.name`}
              control={control}
              render={({ field: nameField }) => (
                <input
                  data-testid="PAMFormEnvironmentBlock"
                  {...nameField}
                  placeholder={tt.placeholderEnvName}
                  className="font-bold border border-primary-border rounded-lg px-2 sm:px-3 py-1.5 sm:py-2 w-24 sm:w-36 text-xs sm:text-sm bg-bg-container text-primary-text focus:outline-none focus:ring-2 focus:ring-primary touch-manipulation"
                />
              )}
            />
            <button
              type="button"
              onClick={() => onToggleCollapse(index)}
              className="touch-manipulation text-tertiary-text hover:text-primary-text transition p-1 cursor-pointer"
              title={isCollapsed ? tt.collapsed : tt.uncollapsed}
            >
              <span>
                <DownOutlined
                  className={clsx(
                    'text-xs transition-transform duration-200',
                    isCollapsed && '-rotate-90'
                  )}
                />
              </span>
            </button>
          </div>
          <button
            type="button"
            onClick={() => onRemove(index)}
            className="text-(--fe-color-error) hover:text-(--fe-color-error)/80 text-xs sm:text-sm touch-manipulation flex items-center gap-1 px-2 py-1 rounded-lg hover:bg-(--fe-color-error)/10 transition cursor-pointer"
          >
            <span>
              <DeleteOutlined className="text-xs" />
            </span>
            <span className="hidden xs:inline">{tt.envDelete}</span>
          </button>
        </div>

        <div
          className={clsx(
            'env-collapse-content mt-3 transition-all duration-300 ease-in-out',
            isCollapsed
              ? 'max-h-0 opacity-0 overflow-hidden mt-0'
              : 'max-h-500 opacity-100'
          )}
        >
          <div className="mb-3">
            <label className="text-[10px] sm:text-xs font-semibold text-secondary-text">
              {tt.envUrlTitle}
            </label>
            <Controller
              name={`${PAMProjectEnvKey}.${index}.url`}
              control={control}
              render={({ field: urlField }) => (
                <input
                  data-testid="PAMFormEnvironmentBlock"
                  {...urlField}
                  type="url"
                  placeholder={tt.placeholderEnvUrl}
                  className="w-full border border-primary-border rounded-lg px-2 sm:px-3 py-1.5 sm:py-2 text-xs sm:text-sm mt-1 bg-bg-container text-primary-text focus:outline-none focus:ring-2 focus:ring-primary touch-manipulation"
                />
              )}
            />
            {errors.environments?.[index]?.url && (
              <div className="text-(--fe-color-error) text-xs mt-1">
                {errors.environments[index].url.message}
              </div>
            )}
          </div>

          <div>
            <label className="text-[10px] sm:text-xs font-semibold text-secondary-text flex items-center gap-2 flex-wrap">
              <span>{tt.envVarTitle}</span>
              <button
                type="button"
                onClick={() => onAddVariable(index)}
                className="text-primary-text hover:text-primary-text-hover text-xs touch-manipulation flex items-center gap-1 px-2 py-0.5 rounded-lg hover:bg-primary-bg transition cursor-pointer"
              >
                <span>
                  <PlusOutlined />
                </span>
                {tt.envVarAdd}
              </button>
            </label>
            <div className="env-vars-list mt-2 space-y-1.5 max-h-40 overflow-y-auto">
              {variables.length === 0 ? (
                <div className="text-xs text-tertiary-text py-1">
                  {tt.noEnvVar}
                </div>
              ) : (
                variables.map((item, idx) => (
                  <PAMFormEnvironmentVarRow
                    key={item.id || idx}
                    envIndex={index}
                    item={item}
                    keyError={
                      errors.environments?.[index]?.variables?.[idx]?.key
                    }
                    valueError={
                      errors.environments?.[index]?.variables?.[idx]?.value
                    }
                    tt={tt}
                    onUpdateVariable={onUpdateVariable}
                    onRemoveVariable={onRemoveVariable}
                  />
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
