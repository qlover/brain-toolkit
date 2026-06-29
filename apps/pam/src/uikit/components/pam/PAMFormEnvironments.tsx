import {
  PlusOutlined,
  CloudUploadOutlined,
  LinkOutlined,
  ExclamationCircleOutlined
} from '@ant-design/icons';
import React, { useState, useCallback, useEffect } from 'react';
import { useFormContext, useFieldArray, useWatch } from 'react-hook-form';
import { v4 as uuid } from 'uuid';
import type { PAMI18nInterface } from '@config/i18n-mapping/PAMI18n';
import type { PAMProjectCreate } from '@schemas/PAMProjectSchema';
import { PAMProjectEnvKey } from '@schemas/PAMProjectSchema';
import { PAMFormEnvironmentBlock } from './PAMFormEnvironmentBlock';

type FormValues = PAMProjectCreate;

interface PAMFormEnvironmentsProps {
  tt: PAMI18nInterface;
}

export const PAMFormEnvironments: React.FC<PAMFormEnvironmentsProps> = ({
  tt
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
      const hasIncomplete = variables.some(
        (item) => item.key.trim() === '' || item.value.trim() === ''
      );
      if (hasIncomplete) {
        alert(tt.envTip);
        return;
      }

      const updated = [...variables, { id: uuid(), key: '', value: '' }];
      setValue(`${PAMProjectEnvKey}.${envIndex}.variables`, updated);
      setCollapsedEnvs((prev) => ({ ...prev, [envIndex]: false }));
      trigger(`${PAMProjectEnvKey}.${envIndex}.variables`);
    },
    [environments, setValue, trigger, tt.envTip]
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
    (envIndex: number, oldKey: string, newKey: string, value: string) => {
      const envs = environments || [];
      const env = envs[envIndex];
      if (!env) return;

      if (newKey.trim() === '') {
        removeVariable(envIndex, oldKey);
        return;
      }

      const variables = env.variables || [];
      const index = variables.findIndex((item) => item.key === oldKey);
      if (index === -1) return;

      const oldItem = variables[index];
      const updated = [...variables];
      updated[index] = {
        ...oldItem,
        key: newKey.trim(),
        value
      };
      setValue(`${PAMProjectEnvKey}.${envIndex}.variables`, updated);
      trigger(`${PAMProjectEnvKey}.${envIndex}.variables`);
    },
    [environments, setValue, trigger, removeVariable]
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
      className="border-t border-primary-border p-4 sm:pt-5"
    >
      {errors.environments?.message && (
        <div className="bg-(--fe-color-error)/10 border border-(--fe-color-error)/30 text-(--fe-color-error) text-sm rounded-xl px-4 py-3 flex items-center gap-2 mb-3">
          <span>
            <ExclamationCircleOutlined />
          </span>
          <span>{errors.environments.message}</span>
        </div>
      )}

      <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
        <label className="text-sm sm:text-base font-bold text-primary-text flex items-center gap-1.5">
          <span className="text-brand">
            <CloudUploadOutlined />
          </span>
          {tt.mulitEnv}
          <span className="text-[10px] sm:text-xs font-normal text-tertiary-text ml-1">
            ({fields.length})
          </span>
        </label>
        <button
          type="button"
          data-testid="add-environment-button"
          onClick={handleAddEnvironment}
          className="text-brand text-xs sm:text-sm hover:text-brand-hover bg-primary-bg hover:bg-primary-bg/80 px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg transition touch-manipulation flex items-center gap-1.5 cursor-pointer"
        >
          <span>
            <PlusOutlined />
          </span>
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
              onToggleCollapse={toggleCollapse}
              onRemove={remove}
              onAddVariable={addVariable}
              onUpdateVariable={updateVariable}
              onRemoveVariable={removeVariable}
            />
          );
        })}
      </div>

      <p className="text-[10px] sm:text-xs text-tertiary-text mt-2">
        <span className="mr-1">
          <LinkOutlined />
        </span>
        {tt.envDirectTitle}
      </p>
    </div>
  );
};
