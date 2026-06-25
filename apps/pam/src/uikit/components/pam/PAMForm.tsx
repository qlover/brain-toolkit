import {
  SaveOutlined,
  LoadingOutlined,
  CodeOutlined,
  LockOutlined,
  UnlockOutlined
} from '@ant-design/icons';
import { zodResolver } from '@hookform/resolvers/zod';
import { clsx } from 'clsx';
import React, { useEffect } from 'react';
import { useForm, FormProvider } from 'react-hook-form';
import type { PAMProjectCreateWithEnv } from '@schemas/PAMProjectSchema';
import {
  PAMProjectCreateWithEnvSchema,
  PAMPublicType
} from '@schemas/PAMProjectSchema';
import { PAMFormEnvironments } from './PAMFormEnvironments';

export interface PAMFormProps {
  initialData?: PAMProjectCreateWithEnv;
  onSubmit: (data: PAMProjectCreateWithEnv) => Promise<void> | void;
  onCancel: () => void;
  isSubmitting?: boolean;
  className?: string;
}

function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

type FormValues = PAMProjectCreateWithEnv;

export const PAMForm: React.FC<PAMFormProps> = ({
  initialData,
  onCancel,
  onSubmit,
  isSubmitting = false,
  className = ''
}) => {
  const methods = useForm<FormValues>({
    resolver: zodResolver(PAMProjectCreateWithEnvSchema),
    defaultValues: {
      name: initialData?.name,
      slug: initialData?.slug,
      description: initialData?.description,
      stack: initialData?.stack,
      repo_url: initialData?.repo_url,
      category: initialData?.category,
      is_public: initialData?.is_public ?? PAMPublicType.private,
      environments: initialData?.environments || []
    }
  });

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting: formIsSubmitting },
    setValue,
    trigger,
    watch
  } = methods;

  const watchName = watch('name');
  useEffect(() => {
    if (watchName && !watch('slug')) {
      setValue('slug', generateSlug(watchName));
    }
  }, [watchName, setValue, watch]);

  const onValidSubmit = (data: FormValues) => {
    const parsed = PAMProjectCreateWithEnvSchema.safeParse(data);
    if (!parsed.success) {
      console.error(parsed.error);
      return;
    }
    onSubmit(parsed.data);
  };

  const togglePublic = () => {
    const current = watch('is_public');
    setValue('is_public', current === 0 ? 1 : 0);
    trigger('is_public');
  };

  return (
    <FormProvider {...methods}>
      <form
        data-testid="PAMForm"
        onSubmit={handleSubmit(onValidSubmit)}
        className={`space-y-4 sm:space-y-6 ${className}`}
      >
        <div className="space-y-3 sm:space-y-4 p-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
            <div className="sm:col-span-2 lg:col-span-2">
              <label className="block text-xs sm:text-sm font-semibold text-secondary-text mb-1">
                项目名称 <span className="text-(--fe-color-error)">*</span>
              </label>
              <div className="flex items-center justify-between gap-2">
                <input
                  {...register('name')}
                  type="text"
                  className="flex-1 border border-primary-border rounded-xl px-3 sm:px-4 py-2.5 sm:py-3 bg-bg-container text-primary-text focus:outline-none focus:ring-2 focus:ring-primary text-sm sm:text-base touch-manipulation"
                  placeholder="例如: Brain Backend"
                />
                <div className="min-w-12">
                  <button
                    type="button"
                    onClick={togglePublic}
                    className="flex items-center gap-2 px-3 py-2 rounded-xl border border-primary-border hover:bg-primary-bg transition cursor-pointer touch-manipulation"
                  >
                    <span
                      title={
                        watch('is_public') === PAMPublicType.public
                          ? '公开'
                          : '私有'
                      }
                      className={clsx(
                        'text-base',
                        watch('is_public') === PAMPublicType.public
                          ? 'text-brand'
                          : 'text-tertiary-text'
                      )}
                    >
                      {watch('is_public') === PAMPublicType.public ? (
                        <UnlockOutlined />
                      ) : (
                        <LockOutlined className="text-tertiary-text" />
                      )}
                    </span>
                    <span className="text-sm font-medium text-primary-text">
                      {watch('is_public') === PAMPublicType.public
                        ? '公开'
                        : '私有'}
                    </span>
                  </button>
                  <input
                    type="hidden"
                    {...register('is_public')}
                    value={watch('is_public')}
                  />
                </div>
              </div>
              {errors.name && (
                <div className="text-(--fe-color-error) text-xs mt-1">
                  {errors.name.message}
                </div>
              )}
            </div>
            <div>
              <label className="block text-xs sm:text-sm font-semibold text-secondary-text mb-1">
                Slug <span className="text-(--fe-color-error)">*</span>
              </label>
              <input
                {...register('slug')}
                type="text"
                placeholder="auto"
                className="w-full border border-primary-border rounded-xl px-3 sm:px-4 py-2.5 sm:py-3 bg-bg-container text-primary-text focus:outline-none focus:ring-2 focus:ring-primary text-sm sm:text-base touch-manipulation"
              />
              {errors.slug && (
                <div className="text-(--fe-color-error) text-xs mt-1">
                  {errors.slug.message}
                </div>
              )}
            </div>
          </div>

          <div>
            <label className="block text-xs sm:text-sm font-semibold text-secondary-text mb-1">
              技术栈
            </label>
            <input
              {...register('stack')}
              type="text"
              placeholder="React, Go, Python …"
              className="w-full border border-primary-border rounded-xl px-3 sm:px-4 py-2.5 sm:py-3 bg-bg-container text-primary-text focus:outline-none focus:ring-2 focus:ring-primary text-sm sm:text-base touch-manipulation"
            />
          </div>

          <div>
            <label className="block text-xs sm:text-sm font-semibold text-secondary-text mb-1">
              项目描述
            </label>
            <textarea
              {...register('description')}
              rows={2}
              className="w-full border border-primary-border rounded-xl px-3 sm:px-4 py-2.5 sm:py-3 bg-bg-container text-primary-text focus:outline-none focus:ring-2 focus:ring-primary text-sm sm:text-base resize-y min-h-15"
              placeholder="简要描述项目…"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
            <div>
              <label className="block text-xs sm:text-sm font-semibold text-secondary-text mb-1">
                <span className="mr-1">
                  <CodeOutlined />
                </span>
                仓库地址
              </label>
              <input
                {...register('repo_url')}
                type="url"
                placeholder="https://github.com/..."
                className="w-full border border-primary-border rounded-xl px-3 sm:px-4 py-2.5 sm:py-3 bg-bg-container text-primary-text focus:outline-none focus:ring-2 focus:ring-primary text-sm sm:text-base touch-manipulation"
              />
              {errors.repo_url && (
                <div className="text-(--fe-color-error) text-xs mt-1">
                  {errors.repo_url.message}
                </div>
              )}
            </div>
            <div>
              <label className="block text-xs sm:text-sm font-semibold text-secondary-text mb-1">
                分类 <span className="text-(--fe-color-error)">*</span>
              </label>
              <select
                {...register('category')}
                className="w-full border border-primary-border rounded-xl px-3 sm:px-4 py-2.5 sm:py-3 bg-bg-container text-primary-text focus:outline-none focus:ring-2 focus:ring-primary text-sm sm:text-base touch-manipulation"
              >
                <option value="">未分类</option>
                <option value="前端">前端</option>
                <option value="后端">后端</option>
                <option value="工具">工具</option>
                <option value="文档">文档</option>
                <option value="基础设施">基础设施</option>
                <option value="其他">其他</option>
              </select>
              {errors.category && (
                <div className="text-(--fe-color-error) text-xs mt-1">
                  {errors.category.message}
                </div>
              )}
            </div>
          </div>
        </div>

        <PAMFormEnvironments />

        <div
          className="
            flex flex-col-reverse sm:flex-row sm:justify-end gap-2 sm:gap-3
            py-3 border-t border-primary-border
            sticky bottom-0 sm:py-2
            -mx-4 sm:mx-0 px-4 sm:px-0
            md:relative
            shadow-[0_-4px_12px_rgba(0,0,0,0.04)]
            z-10
          "
          style={{ backgroundColor: 'var(--fe-color-bg-container, #ffffff)' }}
        >
          <button
            type="button"
            onClick={onCancel}
            disabled={isSubmitting || formIsSubmitting}
            className="
              px-4 sm:px-6 py-2.5 sm:py-3
              border border-primary-border rounded-xl
              text-secondary-text hover:bg-primary-bg
              transition text-sm sm:text-base
              touch-manipulation w-full sm:w-auto
              order-2 sm:order-1
              disabled:opacity-50 cursor-pointer
            "
          >
            取消
          </button>
          <button
            type="submit"
            disabled={isSubmitting || formIsSubmitting}
            className="
              px-4 sm:px-6 py-2.5 sm:py-3
              bg-brand hover:bg-brand-hover active:bg-brand-active
              text-on-brand rounded-xl
              shadow-sm font-medium
              transition text-sm sm:text-base
              touch-manipulation w-full sm:w-auto
              order-1 sm:order-2
              flex items-center justify-center gap-2
              disabled:opacity-50 disabled:cursor-not-allowed
              sm:min-w-35 cursor-pointer
            "
          >
            {isSubmitting || formIsSubmitting ? (
              <>
                <span>
                  <LoadingOutlined className="animate-spin" />
                </span>
                保存中…
              </>
            ) : (
              <>
                <span>
                  <SaveOutlined />
                </span>
                保存项目
              </>
            )}
          </button>
        </div>
      </form>
    </FormProvider>
  );
};
