'use client';

import { clsx } from 'clsx';
import { useId, useState, type FormEvent, type ReactNode } from 'react';
import { PamUserFeedbackApi } from '@/impls/appApi/PamUserFeedbackApi';
import { useIOC } from '@/uikit/hook/useIOC';
import {
  PAM_USER_FEEDBACK_CATEGORIES,
  PamUserFeedbackCategory,
  type PamUserFeedbackCategoryType,
  type PamUserFeedbackItemPublicType
} from '@schemas/PamUserFeedbackSchema';

const BODY_MAX_LENGTH = 4000;

export type PamFeedbackFormLabelsType = {
  readonly category: string;
  readonly body: string;
  readonly bodyPlaceholder: string;
  readonly screenshots: string;
  readonly screenshotsAdd: string;
  readonly deviceNotice: string;
  readonly submit: string;
  readonly submitting: string;
  readonly success: string;
  readonly screenshotsError: string;
  readonly error: string;
  readonly categories: Readonly<Record<PamUserFeedbackCategoryType, string>>;
};

type ScreenshotItemType = {
  readonly id: string;
  readonly file: File;
  readonly url: string;
};

/**
 * 用户反馈表单：分类 + 正文 + 可选截图。
 */
export function PamFeedbackForm({
  labels,
  onSubmitted
}: {
  readonly labels: PamFeedbackFormLabelsType;
  readonly onSubmitted?: (item: PamUserFeedbackItemPublicType) => void;
}): ReactNode {
  const api = useIOC(PamUserFeedbackApi);
  const formId = useId();
  const [category, setCategory] = useState<PamUserFeedbackCategoryType>(
    PamUserFeedbackCategory.bug
  );
  const [body, setBody] = useState('');
  const [screenshots, setScreenshots] = useState<readonly ScreenshotItemType[]>(
    []
  );
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [isError, setIsError] = useState(false);

  const resetFields = (): void => {
    for (const item of screenshots) {
      URL.revokeObjectURL(item.url);
    }
    setScreenshots([]);
    setBody('');
  };

  const onSubmit = async (event: FormEvent<HTMLFormElement>): Promise<void> => {
    event.preventDefault();
    if (busy || body.trim().length === 0) {
      return;
    }
    setBusy(true);
    setMessage(null);
    setIsError(false);
    try {
      const result = await api.submit({
        category,
        body,
        screenshots: screenshots.map((item) => item.file)
      });
      resetFields();
      setIsError(result.screenshotsFailed);
      setMessage(
        result.screenshotsFailed ? labels.screenshotsError : labels.success
      );
      onSubmitted?.(result.item);
    } catch {
      setIsError(true);
      setMessage(labels.error);
    } finally {
      setBusy(false);
    }
  };

  return (
    <form
      data-testid="PamFeedbackForm"
      className="space-y-3"
      onSubmit={(e) => void onSubmit(e)}
    >
      <fieldset disabled={busy}>
        <legend className="mb-1.5 block text-xs font-medium text-secondary-text">
          {labels.category}
        </legend>
        <div className="flex flex-wrap gap-1.5" role="radiogroup">
          {PAM_USER_FEEDBACK_CATEGORIES.map((value) => (
            <button
              key={value}
              type="button"
              role="radio"
              aria-checked={category === value}
              data-testid={`PamFeedbackFormCategory-${value}`}
              className={clsx(
                'rounded-full border px-3 py-1 text-xs font-medium transition-colors',
                category === value
                  ? 'border-brand bg-brand/10 text-brand'
                  : 'border-primary-border text-secondary-text hover:bg-elevated'
              )}
              onClick={() => setCategory(value)}
            >
              {labels.categories[value]}
            </button>
          ))}
        </div>
      </fieldset>

      <div>
        <label
          className="mb-1.5 block text-xs font-medium text-secondary-text"
          htmlFor={`${formId}-body`}
        >
          {labels.body}
        </label>
        <textarea
          id={`${formId}-body`}
          data-testid="PamFeedbackFormBody"
          className="min-h-28 w-full resize-y rounded-xl border border-primary-border bg-bg-container px-3 py-2 text-sm text-primary-text outline-none focus:border-brand focus:ring-2 focus:ring-brand"
          value={body}
          disabled={busy}
          placeholder={labels.bodyPlaceholder}
          maxLength={BODY_MAX_LENGTH}
          onChange={(e) => setBody(e.target.value)}
        />
        <div className="mt-1 text-right text-[11px] tabular-nums text-tertiary-text">
          {body.length} / {BODY_MAX_LENGTH}
        </div>
      </div>

      <div>
        <p className="mb-1.5 text-xs font-medium text-secondary-text">
          {labels.screenshots}
        </p>
        <div className="flex flex-wrap gap-2">
          {screenshots.map((item) => (
            <button
              data-testid="PamFeedbackScreenshotThumb"
              key={item.id}
              type="button"
              className="relative h-16 w-16 overflow-hidden rounded-lg border border-primary-border bg-cover bg-center"
              style={{
                backgroundImage: `url(${JSON.stringify(item.url).slice(1, -1)})`
              }}
              onClick={() => {
                URL.revokeObjectURL(item.url);
                setScreenshots(screenshots.filter((s) => s.id !== item.id));
              }}
              title="移除"
              aria-label="移除截图"
            />
          ))}
          {screenshots.length < 3 ? (
            <label className="flex h-16 w-16 cursor-pointer items-center justify-center rounded-lg border border-dashed border-primary-border text-[11px] text-secondary-text hover:bg-elevated">
              {labels.screenshotsAdd}
              <input
                type="file"
                accept="image/jpeg,image/png,image/webp"
                className="hidden"
                disabled={busy}
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  e.target.value = '';
                  if (!file) {
                    return;
                  }
                  setScreenshots([
                    ...screenshots,
                    {
                      id: `${file.name}-${String(file.size)}-${String(Date.now())}`,
                      file,
                      url: URL.createObjectURL(file)
                    }
                  ]);
                }}
              />
            </label>
          ) : null}
        </div>
      </div>

      <p className="text-[11px] leading-relaxed text-tertiary-text">
        {labels.deviceNotice}
      </p>

      {message != null ? (
        <p
          role="status"
          className={clsx(
            'text-xs',
            isError ? 'text-red-500' : 'text-secondary-text'
          )}
        >
          {message}
        </p>
      ) : null}

      <button
        type="submit"
        disabled={busy || body.trim().length === 0}
        className="inline-flex cursor-pointer items-center justify-center rounded-xl bg-brand px-4 py-2 text-sm font-semibold text-on-brand hover:bg-brand-hover disabled:cursor-not-allowed disabled:opacity-50"
      >
        {busy ? labels.submitting : labels.submit}
      </button>
    </form>
  );
}
