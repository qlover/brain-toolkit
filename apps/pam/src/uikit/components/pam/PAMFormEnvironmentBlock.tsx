import {
  ChevronDownIcon,
  PlusIcon,
  ServerStackIcon,
  TrashIcon
} from '@heroicons/react/24/outline';
import { clsx } from 'clsx';
import React, { useRef, useState } from 'react';
import { Controller, useFormContext } from 'react-hook-form';
import { useIOC } from '@/uikit/hook/useIOC';
import { PAMEnvDotenvParseUtil } from '@shared/utils/PAMEnvDotenvParseUtil';
import type { PAMEnvFormI18n } from '@config/i18n-mapping/PAMEnvFormI18n';
import { I } from '@config/ioc-identifiter';
import type { PAMProjectCreate } from '@schemas/PAMProjectSchema';
import { PAMProjectEnvKey } from '@schemas/PAMProjectSchema';
import { PAMFormEnvImportPanel } from './PAMFormEnvImportPanel';
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
  tt: PAMEnvFormI18n;
  lockedSensitiveIds: ReadonlySet<string>;
  onToggleCollapse: (index: number) => void;
  onRemove: (index: number) => void;
  onAddVariable: (envIndex: number) => void;
  onImportVariables: (envIndex: number, text: string) => void;
  onUpdateVariable: (
    envIndex: number,
    oldKey: string,
    newKey: string,
    value: string,
    sensitive?: boolean
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
  lockedSensitiveIds,
  onToggleCollapse,
  onRemove,
  onAddVariable,
  onImportVariables,
  onUpdateVariable,
  onRemoveVariable
}) => {
  const {
    control,
    formState: { errors }
  } = useFormContext<FormValues>();
  const [showImport, setShowImport] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const dialogHandler = useIOC(I.DialogHandler);

  const variables = env.variables || [];

  const handleImportFileChange = (
    event: React.ChangeEvent<HTMLInputElement>
  ): void => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) {
      return;
    }

    if (!PAMEnvDotenvParseUtil.isAllowedImportFileName(file.name)) {
      dialogHandler.warn(tt.envVarImportInvalid);
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const text = typeof reader.result === 'string' ? reader.result : '';
      if (PAMEnvDotenvParseUtil.parse(text).length === 0) {
        dialogHandler.warn(tt.envVarImportInvalid);
        return;
      }
      onImportVariables(index, text);
    };
    reader.readAsText(file);
  };

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
            <span className="max-sm:hidden inline">{tt.envDelete}</span>
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
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-[10px] font-semibold text-secondary-text sm:text-xs">
                {tt.envVarTitle}
              </span>
              <button
                type="button"
                onClick={() => setShowImport((prev) => !prev)}
                className={clsx(
                  'flex cursor-pointer items-center gap-1 rounded-lg px-2 py-0.5 text-xs font-semibold text-secondary-text transition touch-manipulation',
                  'hover:bg-brand/10 hover:text-brand',
                  showImport && 'bg-brand/10 text-brand'
                )}
              >
                {tt.envVarImport}
              </button>
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="flex cursor-pointer items-center gap-1 rounded-lg px-2 py-0.5 text-xs font-semibold text-secondary-text transition hover:bg-brand/10 hover:text-brand touch-manipulation"
              >
                {tt.envVarImportFile}
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept=".env,.env.*,.txt,text/plain"
                className="hidden"
                onChange={handleImportFileChange}
              />
              <button
                type="button"
                onClick={() => onAddVariable(index)}
                className="flex cursor-pointer items-center gap-1 rounded-lg px-2 py-0.5 text-xs font-semibold text-brand transition hover:bg-brand/10 hover:text-brand-hover touch-manipulation"
              >
                <PlusIcon className="h-4 w-4" />
                {tt.envVarAdd}
              </button>
            </div>
            {showImport && (
              <PAMFormEnvImportPanel
                tt={tt}
                onCancel={() => setShowImport(false)}
                onImport={(text) => {
                  onImportVariables(index, text);
                  setShowImport(false);
                }}
              />
            )}
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
                    sensitiveLocked={
                      item.id ? lockedSensitiveIds.has(item.id) : false
                    }
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
