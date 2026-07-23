import {
  ChevronDownIcon,
  PlusIcon,
  ServerStackIcon,
  TrashIcon
} from '@heroicons/react/24/outline';
import { clsx } from 'clsx';
import React from 'react';
import { Controller, useFormContext } from 'react-hook-form';
import type { PAMI18nInterface } from '@config/i18n-mapping/PAMI18n';
import type { PAMProjectCreate } from '@schemas/PAMProjectSchema';
import { PAMProjectEnvKey } from '@schemas/PAMProjectSchema';
import { PAMFormEnvironmentVarRow } from './PAMFormEnvironmentVarRow';
import { pamFormFieldClass, pamFormMonoFieldClass } from './PAMFormFieldStyles';

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
      className="env-block relative overflow-hidden rounded-[10px] border border-primary-border bg-elevated transition"
    >
      <div className="p-3 sm:p-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex min-w-30 flex-1 items-center gap-2">
            <ServerStackIcon className="h-4 w-4 shrink-0 text-brand" />
            <Controller
              name={`${PAMProjectEnvKey}.${index}.name`}
              control={control}
              render={({ field: nameField }) => (
                <input
                  data-testid="PAMFormEnvironmentBlockName"
                  {...nameField}
                  placeholder={tt.placeholderEnvName}
                  className={clsx(
                    pamFormMonoFieldClass,
                    'w-24 py-1.5 font-semibold sm:w-36 sm:text-sm'
                  )}
                />
              )}
            />
            <button
              type="button"
              onClick={() => onToggleCollapse(index)}
              className="cursor-pointer p-1 text-tertiary-text transition hover:text-primary-text touch-manipulation"
              title={isCollapsed ? tt.collapsed : tt.uncollapsed}
            >
              <ChevronDownIcon
                className={clsx(
                  'h-4 w-4 transition-transform duration-200',
                  isCollapsed && '-rotate-90'
                )}
              />
            </button>
          </div>
          <button
            type="button"
            onClick={() => onRemove(index)}
            className="flex cursor-pointer items-center gap-1 rounded-lg px-2 py-1 text-xs text-(--fe-color-error) transition hover:bg-(--fe-color-error)/10 hover:opacity-80 touch-manipulation sm:text-sm"
          >
            <TrashIcon className="h-3 w-3" />
            <span className="hidden sm:inline">{tt.envDelete}</span>
          </button>
        </div>

        <div
          className={clsx(
            'env-collapse-content mt-3 transition-all duration-300 ease-in-out',
            isCollapsed
              ? 'mt-0 max-h-0 overflow-hidden opacity-0'
              : 'max-h-500 opacity-100'
          )}
        >
          <div className="mb-3">
            <label className="text-[10px] font-semibold text-secondary-text sm:text-xs">
              {tt.envUrlTitle}
            </label>
            <Controller
              name={`${PAMProjectEnvKey}.${index}.url`}
              control={control}
              render={({ field: urlField }) => (
                <input
                  data-testid="PAMFormEnvironmentBlockUrl"
                  {...urlField}
                  type="url"
                  placeholder={tt.placeholderEnvUrl}
                  className={clsx(
                    pamFormFieldClass,
                    'mt-1 py-1.5 text-xs sm:text-sm'
                  )}
                />
              )}
            />
            {errors.environments?.[index]?.url?.message && (
              <div className="mt-1 text-xs text-(--fe-color-error)">
                {errors.environments?.[index]?.url?.message}
              </div>
            )}
          </div>

          <div>
            <label className="flex flex-wrap items-center gap-2 text-[10px] font-semibold text-secondary-text sm:text-xs">
              <span>{tt.envVarTitle}</span>
              <button
                type="button"
                onClick={() => onAddVariable(index)}
                className="flex cursor-pointer items-center gap-1 rounded-lg px-2 py-0.5 text-xs text-brand transition hover:bg-brand/10 hover:text-brand-hover touch-manipulation"
              >
                <PlusIcon className="h-4 w-4" />
                {tt.envVarAdd}
              </button>
            </label>
            <div className="env-vars-list mt-2 max-h-40 space-y-1.5 overflow-y-auto">
              {variables.length === 0 ? (
                <div className="py-1 text-xs text-tertiary-text">
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
