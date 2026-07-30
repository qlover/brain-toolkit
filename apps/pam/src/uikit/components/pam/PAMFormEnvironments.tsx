import {
  CloudArrowUpIcon,
  ExclamationCircleIcon,
  PlusIcon
} from '@heroicons/react/24/outline';
import React, { useState, useCallback, useEffect } from 'react';
import { useFormContext, useFieldArray, useWatch } from 'react-hook-form';
import { v4 as uuid } from 'uuid';
import { useIOC } from '@/uikit/hook/useIOC';
import { PAMEnvDotenvParseUtil } from '@shared/utils/PAMEnvDotenvParseUtil';
import type { PAMEnvFormI18n } from '@config/i18n-mapping/PAMEnvFormI18n';
import { I } from '@config/ioc-identifiter';
import type { PAMProjectCreate } from '@schemas/PAMProjectSchema';
import { PAMProjectEnvKey } from '@schemas/PAMProjectSchema';
import { PAMFormEnvironmentBlock } from './PAMFormEnvironmentBlock';

type FormValues = PAMProjectCreate;

interface PAMFormEnvironmentsProps {
  tt: PAMEnvFormI18n;
  lockedSensitiveIds?: ReadonlySet<string>;
}

function formatImportResult(
  template: string,
  imported: number,
  skipped: number
): string {
  return template
    .replaceAll('%imported%', String(imported))
    .replaceAll('%skipped%', String(skipped));
}

export const PAMFormEnvironments: React.FC<PAMFormEnvironmentsProps> = ({
  tt,
  lockedSensitiveIds = new Set<string>()
}) => {
  const {
    control,
    setValue,
    trigger,
    formState: { errors }
  } = useFormContext<FormValues>();
  const { fields, append, remove } = useFieldArray({
    control,
    name: PAMProjectEnvKey
  });
  const environments = useWatch({ control, name: PAMProjectEnvKey });
  const dialogHandler = useIOC(I.DialogHandler);

  const [collapsedEnvs, setCollapsedEnvs] = useState<Record<number, boolean>>(
    {}
  );

  useEffect(() => {
    const isMobile = window.innerWidth < 768;
    if (isMobile && fields.length > 1) {
      const collapsed: Record<number, boolean> = {};
      fields.forEach((_, index) => {
        if (index >= 1) collapsed[index] = true;
      });
      setCollapsedEnvs(collapsed);
    }
  }, [fields]);

  const toggleCollapse = useCallback((index: number) => {
    setCollapsedEnvs((prev) => ({
      ...prev,
      [index]: !prev[index]
    }));
  }, []);

  const addVariable = useCallback(
    (envIndex: number) => {
      const envs = environments || [];
      const env = envs[envIndex];
      if (!env) return;

      const variables = env.variables || [];
      const hasIncomplete = variables.some((item) => {
        if (item.key.trim() === '') {
          return true;
        }
        if (item.sensitive) {
          return false;
        }
        return item.value.trim() === '';
      });
      if (hasIncomplete) {
        dialogHandler.warn(tt.envTip);
        return;
      }

      const updated = [
        ...variables,
        { id: uuid(), key: '', value: '', sensitive: false }
      ];
      setValue(`${PAMProjectEnvKey}.${envIndex}.variables`, updated);
      setCollapsedEnvs((prev) => ({ ...prev, [envIndex]: false }));
      trigger(`${PAMProjectEnvKey}.${envIndex}.variables`);
    },
    [environments, setValue, trigger, tt.envTip, dialogHandler]
  );

  const removeVariable = useCallback(
    (envIndex: number, key: string) => {
      const envs = environments || [];
      const env = envs[envIndex];
      if (!env) return;
      const variables = env.variables || [];
      const updated = variables.filter((item) => item.key !== key);
      setValue(`${PAMProjectEnvKey}.${envIndex}.variables`, updated);
      trigger(`${PAMProjectEnvKey}.${envIndex}.variables`);
    },
    [environments, setValue, trigger]
  );

  const updateVariable = useCallback(
    (
      envIndex: number,
      oldKey: string,
      newKey: string,
      value: string,
      sensitive?: boolean
    ) => {
      const envs = environments || [];
      const env = envs[envIndex];
      if (!env) return;

      const variables = env.variables || [];
      const index = variables.findIndex((item) => item.key === oldKey);
      if (index === -1) return;

      // Clearing a filled key deletes the row; empty new rows may still toggle sensitive/value.
      if (newKey.trim() === '' && oldKey.trim() !== '') {
        removeVariable(envIndex, oldKey);
        return;
      }

      const oldItem = variables[index];
      const nextSensitive =
        oldItem.id && lockedSensitiveIds.has(oldItem.id)
          ? oldItem.sensitive === true
          : (sensitive ?? oldItem.sensitive ?? false);
      const updated = [...variables];
      updated[index] = {
        ...oldItem,
        key: newKey.trim(),
        value,
        sensitive: nextSensitive
      };
      setValue(`${PAMProjectEnvKey}.${envIndex}.variables`, updated);
      trigger(`${PAMProjectEnvKey}.${envIndex}.variables`);
    },
    [environments, setValue, trigger, removeVariable, lockedSensitiveIds]
  );

  const importVariables = useCallback(
    (envIndex: number, text: string) => {
      const envs = environments || [];
      const env = envs[envIndex];
      if (!env) return;

      const parsed = PAMEnvDotenvParseUtil.parse(text);
      if (parsed.length === 0) {
        dialogHandler.warn(tt.envVarImportEmpty);
        return;
      }

      const variables = env.variables || [];
      const existingKeys = new Set(
        variables.map((item) => item.key).filter((key) => key.trim() !== '')
      );
      const toAdd = parsed.filter((item) => !existingKeys.has(item.key));
      const skipped = parsed.length - toAdd.length;

      if (toAdd.length === 0) {
        dialogHandler.warn(
          formatImportResult(tt.envVarImportResult, 0, skipped)
        );
        return;
      }

      const updated = [
        ...variables,
        ...toAdd.map((item) => ({
          id: uuid(),
          key: item.key,
          value: item.value,
          sensitive: true
        }))
      ];
      setValue(`${PAMProjectEnvKey}.${envIndex}.variables`, updated);
      setCollapsedEnvs((prev) => ({ ...prev, [envIndex]: false }));
      trigger(`${PAMProjectEnvKey}.${envIndex}.variables`);
      dialogHandler.success(
        formatImportResult(tt.envVarImportResult, toAdd.length, skipped)
      );
    },
    [environments, setValue, trigger, tt, dialogHandler]
  );

  const handleAddEnvironment = (): void => {
    append({ name: '', url: '', variables: [] });
    const newIndex = fields.length;
    setCollapsedEnvs((prev) => ({ ...prev, [newIndex]: false }));
    setTimeout(() => {
      const blocks = document.querySelectorAll('.env-block');
      const last = blocks[blocks.length - 1];
      if (last) last.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }, 100);
  };

  const resolveIsCollapsed = (index: number): boolean => {
    const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;
    return collapsedEnvs[index] ?? (isMobile && index >= 1);
  };

  return (
    <div
      data-testid="PAMFormEnvironments"
      className="border-t border-primary-border pt-4 sm:pt-5"
    >
      {errors.environments?.message && (
        <div className="mb-3 flex items-center gap-2 rounded-[10px] border border-(--fe-color-error)/30 bg-(--fe-color-error)/10 px-4 py-3 text-sm text-(--fe-color-error)">
          <ExclamationCircleIcon className="h-4 w-4 shrink-0" />
          <span>{errors.environments.message}</span>
        </div>
      )}

      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <label className="flex items-center gap-1.5 text-sm font-bold text-primary-text sm:text-base">
          <CloudArrowUpIcon className="h-4 w-4 text-brand" />
          {tt.mulitEnv}
          <span className="ml-1 text-[10px] font-normal text-tertiary-text sm:text-xs">
            ({fields.length})
          </span>
        </label>
        <button
          type="button"
          data-testid="add-environment-button"
          onClick={handleAddEnvironment}
          className="flex cursor-pointer items-center gap-1.5 rounded-lg bg-brand/10 px-3 py-1.5 text-xs text-brand transition hover:bg-brand/15 hover:text-brand-hover touch-manipulation sm:px-4 sm:py-2 sm:text-sm"
        >
          <PlusIcon className="h-4 w-4" />
          {tt.envAdd}
        </button>
      </div>

      <div className="space-y-3 sm:space-y-4">
        {fields.map((field, index) => {
          const env = environments?.[index];
          if (!env) return null;

          return (
            <PAMFormEnvironmentBlock
              key={String(field.name + index)}
              index={index}
              env={env}
              isCollapsed={resolveIsCollapsed(index)}
              tt={tt}
              lockedSensitiveIds={lockedSensitiveIds}
              onToggleCollapse={toggleCollapse}
              onRemove={remove}
              onAddVariable={addVariable}
              onImportVariables={importVariables}
              onUpdateVariable={updateVariable}
              onRemoveVariable={removeVariable}
            />
          );
        })}
      </div>

      <p className="mt-2 text-[10px] text-tertiary-text sm:text-xs">
        {tt.envDirectTitle}
      </p>
    </div>
  );
};
