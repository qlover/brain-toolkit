import {
  ArrowPathIcon,
  CheckIcon,
  CodeBracketIcon,
  LockClosedIcon,
  LockOpenIcon
} from '@heroicons/react/24/outline';
import { zodResolver } from '@hookform/resolvers/zod';
import { clsx } from 'clsx';
import React, { useEffect, useMemo } from 'react';
import { useForm, FormProvider } from 'react-hook-form';
import type { PAMI18nInterface } from '@config/i18n-mapping/PAMI18n';
import type {
  PAMProjectCreate,
  PAMProjectUpdate
} from '@schemas/PAMProjectSchema';
import {
  PAMProjectCreateSchema,
  PAMProjectEnvKey,
  PAMProjectUpdateSchema,
  PAMPublicType
} from '@schemas/PAMProjectSchema';
import { PAMFormEnvironments } from './PAMFormEnvironments';
import {
  pamFormFieldClass,
  pamFormLabelClass,
  pamFormSelectClass,
  pamFormTextareaClass
} from './PAMFormFieldStyles';

type PAMFormProject = PAMProjectCreate | PAMProjectUpdate;

export const PAM_PROJECT_FORM_ID = 'pam-project-form';

export interface PAMFormProps {
  tt: PAMI18nInterface;
  initialData?: PAMFormProject;
  onSubmit: (data: PAMFormProject) => Promise<void> | void;
  onCancel: () => void;
  isSubmitting?: boolean;
  className?: string;
  mode?: 'create' | 'edit';
  /** Native form id for external footer submit (`form=` attribute). */
  formId?: string;
  /** When true, render cancel/save inside the form (default: false — use Modal footer). */
  showActions?: boolean;
}

function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

export const PAMForm: React.FC<PAMFormProps> = ({
  tt,
  initialData,
  onCancel,
  onSubmit,
  isSubmitting = false,
  className = '',
  mode = 'create',
  formId = PAM_PROJECT_FORM_ID,
  showActions = false
}) => {
  const zodResolover = useMemo(
    () => (mode === 'create' ? PAMProjectCreateSchema : PAMProjectUpdateSchema),
    [mode]
  );

  const methods = useForm<PAMFormProject>({
    resolver: zodResolver(zodResolover),
    defaultValues: {
      id: mode === 'edit' ? (initialData as PAMProjectUpdate).id : undefined,
      name: initialData?.name,
      slug: initialData?.slug,
      description: initialData?.description,
      stack: initialData?.stack,
      repo_url: initialData?.repo_url,
      category: initialData?.category,
      is_public: initialData?.is_public ?? PAMPublicType.private,
      [PAMProjectEnvKey]: initialData?.environments || []
    }
  });

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting: formIsSubmitting },
    setValue,
    trigger,
    watch,
    reset
  } = methods;

  const is_public = watch('is_public');

  useEffect(() => {
    reset({
      name: initialData?.name ?? '',
      slug: initialData?.slug ?? '',
      description: initialData?.description ?? '',
      stack: initialData?.stack ?? '',
      repo_url: initialData?.repo_url ?? '',
      category: initialData?.category ?? '',
      is_public: initialData?.is_public ?? PAMPublicType.private,
      environments: initialData?.environments || []
    });
  }, [initialData, reset]);

  const watchName = watch('name');
  useEffect(() => {
    if (watchName && !watch('slug')) {
      setValue('slug', generateSlug(watchName));
    }
  }, [watchName, setValue, watch]);

  const onValidSubmit = (data: PAMFormProject) => {
    if (mode === 'edit' && !('id' in data)) {
      console.log(tt.tipFalteError);
      return;
    }

    const parsed = zodResolover.safeParse(data);
    if (!parsed.success) {
      console.error(parsed.error);
      return;
    }
    onSubmit(parsed.data);
  };

  const togglePublic = () => {
    const current = is_public;
    setValue('is_public', current === 0 ? 1 : 0);
    trigger('is_public');
  };

  const isPublic = is_public === PAMPublicType.public;
  const lockTitle = isPublic ? tt.public : tt.private;
  const busy = isSubmitting || formIsSubmitting;

  return (
    <FormProvider {...methods}>
      <form
        id={formId}
        data-testid="PAMForm"
        onSubmit={handleSubmit(onValidSubmit)}
        className={clsx(
          'space-y-4 sm:space-y-5 px-4 sm:px-6 py-4 sm:py-6',
          className
        )}
      >
        {mode === 'edit' && <input type="hidden" {...register('id')} />}

        <div className="space-y-3 sm:space-y-4">
          <div className="grid grid-cols-1 items-start gap-3 sm:grid-cols-2 sm:gap-4 lg:grid-cols-3">
            <div className="sm:col-span-2 lg:col-span-2">
              <label className={pamFormLabelClass}>
                {tt.labelName}
                <span className="text-(--fe-color-error)">*</span>
              </label>
              <div className="flex items-stretch gap-2">
                <input
                  {...register('name')}
                  type="text"
                  className={clsx(pamFormFieldClass, 'min-w-0 flex-1')}
                  placeholder={tt.placeholderName}
                />
                <button
                  type="button"
                  title={lockTitle}
                  aria-label={lockTitle}
                  onClick={togglePublic}
                  className={clsx(
                    'inline-flex shrink-0 items-center gap-1.5 whitespace-nowrap',
                    'rounded-[10px] border px-3 text-xs font-semibold transition',
                    'cursor-pointer touch-manipulation',
                    isPublic
                      ? 'border-brand/40 bg-brand/10 text-brand'
                      : 'border-primary-border bg-secondary text-tertiary-text hover:bg-elevated'
                  )}
                >
                  {isPublic ? (
                    <LockOpenIcon className="h-3.5 w-3.5" />
                  ) : (
                    <LockClosedIcon className="h-3.5 w-3.5" />
                  )}
                  <span>{lockTitle}</span>
                </button>
                <input
                  type="hidden"
                  {...register('is_public')}
                  value={is_public}
                />
              </div>
              {errors.name && (
                <div className="mt-1 text-xs text-(--fe-color-error)">
                  {errors.name.message}
                </div>
              )}
            </div>
            <div>
              <label className={pamFormLabelClass}>
                {tt.labelSlug}
                <span className="text-(--fe-color-error)">*</span>
              </label>
              <input
                {...register('slug')}
                type="text"
                placeholder={tt.placeholderSlug}
                className={clsx(pamFormFieldClass, 'font-mono text-sm')}
              />
              {errors.slug && (
                <div className="mt-1 text-xs text-(--fe-color-error)">
                  {errors.slug.message}
                </div>
              )}
            </div>
          </div>

          <div>
            <label className={pamFormLabelClass}>{tt.labelStack}</label>
            <input
              {...register('stack')}
              type="text"
              placeholder={tt.placeholderStack}
              className={pamFormFieldClass}
            />
          </div>

          <div>
            <label className={pamFormLabelClass}>{tt.labelDesc}</label>
            <textarea
              {...register('description')}
              rows={2}
              className={pamFormTextareaClass}
              placeholder={tt.placeholderDesc}
            />
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4">
            <div>
              <label className={pamFormLabelClass}>
                <span className="mr-1 inline-flex align-middle">
                  <CodeBracketIcon className="h-4 w-4" />
                </span>
                {tt.labelRepo}
              </label>
              <input
                {...register('repo_url')}
                type="url"
                placeholder={tt.placeholderRepo}
                className={pamFormFieldClass}
              />
              {errors.repo_url && (
                <div className="mt-1 text-xs text-(--fe-color-error)">
                  {errors.repo_url.message}
                </div>
              )}
            </div>
            <div>
              <label className={pamFormLabelClass}>
                {tt.labelCategory}
                <span className="text-(--fe-color-error)">*</span>
              </label>
              <select {...register('category')} className={pamFormSelectClass}>
                <option value="">{tt.labelUnCategory}</option>
                <option value="前端">前端</option>
                <option value="后端">后端</option>
                <option value="工具">工具</option>
                <option value="文档">文档</option>
                <option value="基础设施">基础设施</option>
                <option value="其他">其他</option>
              </select>
              {errors.category && (
                <div className="mt-1 text-xs text-(--fe-color-error)">
                  {errors.category.message}
                </div>
              )}
            </div>
          </div>
        </div>

        <PAMFormEnvironments tt={tt} />

        {showActions && (
          <div className="flex flex-col-reverse gap-2 border-t border-primary-border py-3 sm:flex-row sm:justify-end sm:gap-3 sm:py-2">
            <button
              type="button"
              onClick={onCancel}
              disabled={busy}
              className="w-full cursor-pointer rounded-[10px] border border-primary-border px-4 py-2.5 text-sm text-secondary-text transition hover:bg-elevated disabled:opacity-50 sm:w-auto sm:px-6 sm:py-3 sm:text-base"
            >
              {tt.formCancel}
            </button>
            <button
              type="submit"
              disabled={busy}
              className="flex w-full cursor-pointer items-center justify-center gap-2 rounded-[10px] bg-brand px-4 py-2.5 text-sm font-medium text-on-brand shadow-sm transition hover:bg-brand-hover active:bg-brand-active disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto sm:min-w-35 sm:px-6 sm:py-3 sm:text-base"
            >
              {busy ? (
                <>
                  <ArrowPathIcon className="h-4 w-4 animate-spin" />
                  {tt.formSaveing}
                </>
              ) : (
                <>
                  <CheckIcon className="h-4 w-4" />
                  {mode === 'edit' ? tt.formEdit : tt.formSave}
                </>
              )}
            </button>
          </div>
        )}
      </form>
    </FormProvider>
  );
};
