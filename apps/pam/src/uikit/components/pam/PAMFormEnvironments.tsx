import {
  PlusOutlined,
  DeleteOutlined,
  CloudServerOutlined,
  CloudUploadOutlined,
  DownOutlined,
  LinkOutlined,
  ExclamationCircleOutlined
} from '@ant-design/icons';
import React, { useState, useCallback, useEffect } from 'react';
import {
  Controller,
  useFormContext,
  useFieldArray,
  useWatch
} from 'react-hook-form';
import type {
  PAMEnvironmentCreateSchemaType,
  PAMProjectCreateWithEnvSchemaType
} from '@schemas/PAMProjectSchema';
import { PAMProjectEnvKey } from '@schemas/PAMProjectSchema';

type FormValues = PAMProjectCreateWithEnvSchemaType;

export const PAMFormEnvironments: React.FC = () => {
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
  const environments = useWatch({ control, name: PAMProjectEnvKey }) || [];

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
      const variables = { ...(env.variables || {}) };

      // 检查是否已有不完整的变量（键或值为空）
      const hasIncomplete = Object.entries(variables).some(
        ([key, value]) => key.trim() === '' || value.trim() === ''
      );
      if (hasIncomplete) {
        alert('请先填写完整当前所有环境变量（键和值都不能为空）');
        return;
      }

      // 生成唯一的默认键名（如 new_var, new_var2 ...）
      const baseKey = 'new_var';
      let counter = 1;
      let newKey = baseKey;
      while (variables[newKey] !== undefined) {
        counter++;
        newKey = `${baseKey}${counter}`;
      }

      variables[newKey] = '';
      setValue(`${PAMProjectEnvKey}.${envIndex}.variables`, variables);
      setCollapsedEnvs((prev) => ({ ...prev, [envIndex]: false }));
      trigger(`${PAMProjectEnvKey}.${envIndex}.variables`);
    },
    [environments, setValue, trigger]
  );

  const removeVariable = useCallback(
    (envIndex: number, key: string) => {
      const envs = environments || [];
      const env = envs[envIndex];
      if (!env) return;
      const variables = { ...(env.variables || {}) };
      delete variables[key];
      setValue(`${PAMProjectEnvKey}.${envIndex}.variables`, variables);
      trigger(`${PAMProjectEnvKey}.${envIndex}.variables`);
    },
    [environments, setValue, trigger]
  );

  const updateVariable = useCallback(
    (envIndex: number, oldKey: string, newKey: string, value: string) => {
      const envs = environments || [];
      const env = envs[envIndex];
      if (!env) return;

      // 如果新键名为空，则删除该变量（用户意图是删除）
      if (newKey.trim() === '') {
        removeVariable(envIndex, oldKey);
        return;
      }

      const variables = { ...(env.variables || {}) };
      if (oldKey !== newKey) {
        delete variables[oldKey];
      }
      variables[newKey.trim()] = value;
      setValue(`${PAMProjectEnvKey}.${envIndex}.variables`, variables);
      trigger(`${PAMProjectEnvKey}.${envIndex}.variables`);
    },
    [environments, setValue, trigger, removeVariable]
  );

  const renderEnvironmentBlock = useCallback(
    (field: PAMEnvironmentCreateSchemaType, index: number) => {
      const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;
      const isCollapsed = collapsedEnvs[index] ?? (isMobile && index >= 1);
      const env = environments[index];
      const varKeys = Object.keys(env?.variables || {}).filter((k) => k.trim());

      return (
        <div
          data-testid="renderEnvironmentBlock"
          key={String(field.name + index)}
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
                  render={({ field }) => (
                    <input
                      data-testid="renderEnvironmentBlock"
                      {...field}
                      placeholder="环境名称 (如 dev, prod)"
                      className="font-bold border border-primary-border rounded-lg px-2 sm:px-3 py-1.5 sm:py-2 w-24 sm:w-36 text-xs sm:text-sm bg-bg-container text-primary-text focus:outline-none focus:ring-2 focus:ring-primary touch-manipulation"
                    />
                  )}
                />
                <button
                  type="button"
                  onClick={() => toggleCollapse(index)}
                  className="touch-manipulation text-tertiary-text hover:text-primary-text transition p-1 cursor-pointer"
                  title={isCollapsed ? '展开' : '折叠'}
                >
                  <span>
                    <DownOutlined
                      className={`text-xs transition-transform duration-200 ${
                        isCollapsed ? '-rotate-90' : ''
                      }`}
                    />
                  </span>
                </button>
              </div>
              <button
                type="button"
                onClick={() => remove(index)}
                className="text-(--fe-color-error) hover:text-(--fe-color-error)/80 text-xs sm:text-sm touch-manipulation flex items-center gap-1 px-2 py-1 rounded-lg hover:bg-(--fe-color-error)/10 transition cursor-pointer"
              >
                <span>
                  <DeleteOutlined className="text-xs" />
                </span>
                <span className="hidden xs:inline">删除</span>
              </button>
            </div>

            <div
              className={`env-collapse-content mt-3 transition-all duration-300 ease-in-out ${
                isCollapsed
                  ? 'max-h-0 opacity-0 overflow-hidden mt-0'
                  : 'max-h-500 opacity-100'
              }`}
            >
              <div className="mb-3">
                <label className="text-[10px] sm:text-xs font-semibold text-secondary-text">
                  访问地址
                </label>
                <Controller
                  name={`${PAMProjectEnvKey}.${index}.url`}
                  control={control}
                  render={({ field }) => (
                    <input
                      data-testid="renderEnvironmentBlock"
                      {...field}
                      type="url"
                      placeholder="https://..."
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
                  <span>环境变量</span>
                  <button
                    type="button"
                    onClick={() => addVariable(index)}
                    className="text-primary-text hover:text-primary-text-hover text-xs touch-manipulation flex items-center gap-1 px-2 py-0.5 rounded-lg hover:bg-primary-bg transition cursor-pointer"
                  >
                    <span>
                      <PlusOutlined />
                    </span>
                    添加
                  </button>
                </label>
                <div className="env-vars-list mt-2 space-y-1.5 max-h-40 overflow-y-auto">
                  {varKeys.length === 0 ? (
                    <div className="text-xs text-tertiary-text py-1">
                      暂无环境变量
                    </div>
                  ) : (
                    varKeys.map((key) => (
                      <div
                        data-testid="renderEnvironmentBlock"
                        key={key}
                        className="env-var-row flex flex-wrap sm:flex-nowrap gap-1.5 sm:gap-2 items-center"
                      >
                        <input
                          type="text"
                          placeholder="KEY"
                          value={key}
                          onChange={(e) => {
                            const newKey = e.target.value;
                            if (newKey !== key) {
                              updateVariable(
                                index,
                                key,
                                newKey,
                                env?.variables?.[key] || ''
                              );
                            }
                          }}
                          className="env-var-key flex-1 min-w-15 border border-primary-border rounded-lg px-2 sm:px-3 py-1.5 sm:py-2 text-xs sm:text-sm bg-bg-container text-primary-text focus:outline-none focus:ring-2 focus:ring-primary touch-manipulation"
                        />
                        <input
                          type="text"
                          placeholder="value"
                          value={env?.variables?.[key] || ''}
                          onChange={(e) =>
                            updateVariable(index, key, key, e.target.value)
                          }
                          className="env-var-value flex-[1.5] min-w-20 border border-primary-border rounded-lg px-2 sm:px-3 py-1.5 sm:py-2 text-xs sm:text-sm bg-bg-container text-primary-text focus:outline-none focus:ring-2 focus:ring-primary touch-manipulation"
                        />
                        <button
                          type="button"
                          onClick={() => removeVariable(index, key)}
                          className="text-(--fe-color-error) hover:text-(--fe-color-error)/80 touch-manipulation shrink-0 p-1 rounded-lg hover:bg-(--fe-color-error)/10 transition cursor-pointer"
                        >
                          <span>
                            <DeleteOutlined className="text-xs" />
                          </span>
                        </button>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      );
    },
    [
      collapsedEnvs,
      toggleCollapse,
      control,
      errors,
      environments,
      addVariable,
      updateVariable,
      removeVariable,
      remove
    ]
  );

  const handleAddEnvironment = () => {
    append({ name: '', url: '', variables: {} });
    const newIndex = fields.length;
    setCollapsedEnvs((prev) => ({ ...prev, [newIndex]: false }));
    setTimeout(() => {
      const blocks = document.querySelectorAll('.env-block');
      const last = blocks[blocks.length - 1];
      if (last) last.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }, 100);
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
          多环境配置
          <span className="text-[10px] sm:text-xs font-normal text-tertiary-text ml-1">
            ({fields.length})
          </span>
        </label>
        <button
          type="button"
          data-testid="add-environment-button"
          onClick={handleAddEnvironment}
          className="text-primary-text text-xs sm:text-sm hover:text-primary-text-hover bg-primary-bg hover:bg-primary-bg/80 px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg transition touch-manipulation flex items-center gap-1.5 cursor-pointer"
        >
          <span>
            <PlusOutlined />
          </span>
          添加环境
        </button>
      </div>

      <div className="space-y-3 sm:space-y-4">
        {fields.map((field, index) => renderEnvironmentBlock(field, index))}
      </div>

      <p className="text-[10px] sm:text-xs text-tertiary-text mt-2">
        <span className="mr-1">
          <LinkOutlined />
        </span>
        每个环境独立访问地址 + 环境变量
      </p>
    </div>
  );
};
