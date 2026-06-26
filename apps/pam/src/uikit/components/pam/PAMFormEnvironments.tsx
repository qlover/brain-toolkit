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
import { v4 as uuid } from 'uuid';
import type { PAMEnvWriteable } from '@schemas/PAMEnvironmentSchema';
import type { PAMProjectCreate } from '@schemas/PAMProjectSchema';
import { PAMProjectEnvKey } from '@schemas/PAMProjectSchema';

type FormValues = PAMProjectCreate;

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
      // 检查是否有不完整项（key或value为空）
      const hasIncomplete = variables.some(
        (item) => item.key.trim() === '' || item.value.trim() === ''
      );
      if (hasIncomplete) {
        // FIXME:
        alert('请先填写完整当前所有环境变量（键和值都不能为空）');
        return;
      }

      const updated = [...variables, { id: uuid(), key: '', value: '' }];
      setValue(`${PAMProjectEnvKey}.${envIndex}.variables`, updated);
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

      // 保留原有 id 和 _tempId，更新 key/value
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

  const renderEnvironmentBlock = useCallback(
    (field: PAMEnvWriteable, index: number) => {
      const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;
      const isCollapsed = collapsedEnvs[index] ?? (isMobile && index >= 1);
      const env = environments?.[index];

      if (!env) return null;

      const variables = env.variables || [];

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
                  {variables.length === 0 ? (
                    <div className="text-xs text-tertiary-text py-1">
                      暂无环境变量
                    </div>
                  ) : (
                    variables.map((item, idx) => {
                      // 获取当前变量的错误
                      const keyError =
                        errors.environments?.[index]?.variables?.[idx]?.key;
                      const valueError =
                        errors.environments?.[index]?.variables?.[idx]?.value;

                      return (
                        <div
                          data-testid="renderEnvironmentBlock"
                          key={item.id || idx}
                          className="space-y-0.5"
                        >
                          <div className="env-var-row flex flex-wrap sm:flex-nowrap gap-1.5 sm:gap-2 items-center">
                            <input
                              type="text"
                              placeholder="KEY"
                              value={item.key}
                              onChange={(e) =>
                                updateVariable(
                                  index,
                                  item.key,
                                  e.target.value,
                                  item.value
                                )
                              }
                              className={`env-var-key flex-1 min-w-15 border rounded-lg px-2 sm:px-3 py-1.5 sm:py-2 text-xs sm:text-sm bg-bg-container text-primary-text focus:outline-none focus:ring-2 focus:ring-primary touch-manipulation ${
                                keyError
                                  ? 'border-(--fe-color-error)'
                                  : 'border-primary-border'
                              }`}
                            />
                            <input
                              type="text"
                              placeholder="value"
                              value={item.value}
                              onChange={(e) =>
                                updateVariable(
                                  index,
                                  item.key,
                                  item.key,
                                  e.target.value
                                )
                              }
                              className={`env-var-value flex-[1.5] min-w-20 border rounded-lg px-2 sm:px-3 py-1.5 sm:py-2 text-xs sm:text-sm bg-bg-container text-primary-text focus:outline-none focus:ring-2 focus:ring-primary touch-manipulation ${
                                valueError
                                  ? 'border-(--fe-color-error)'
                                  : 'border-primary-border'
                              }`}
                            />
                            <button
                              type="button"
                              onClick={() => removeVariable(index, item.key)}
                              className="text-(--fe-color-error) hover:text-(--fe-color-error)/80 touch-manipulation shrink-0 p-1 rounded-lg hover:bg-(--fe-color-error)/10 transition cursor-pointer"
                            >
                              <DeleteOutlined className="text-xs" />
                            </button>
                          </div>
                          {(keyError || valueError) && (
                            <div className="text-(--fe-color-error) text-xs mt-0.5 col-span-full">
                              {keyError?.message || valueError?.message}
                            </div>
                          )}
                        </div>
                      );
                    })
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
    append({ name: '', url: '', variables: [] });
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
