import {
  ArrowTopRightOnSquareIcon,
  MinusCircleIcon
} from '@heroicons/react/24/outline';
import { clsx } from 'clsx';
import React from 'react';
import { useWarnTranslations } from '@/uikit/hook/useWarnTranslations';
import type { PAMEnvFormI18n } from '@config/i18n-mapping/PAMEnvFormI18n';
import type { PAMVariable } from '@schemas/PAMEnvironmentSchema';
import { pamFormMonoFieldClass } from './PAMFormFieldStyles';
import type { FieldError } from 'react-hook-form';

interface PAMFormEnvironmentVarRowProps {
  envIndex: number;
  item: PAMVariable;
  keyError?: FieldError;
  valueError?: FieldError;
  tt: PAMEnvFormI18n;
  sensitiveLocked: boolean;
  /** Non-owner detail view: inputs disabled, remove hidden. */
  readOnly?: boolean;
  onUpdateVariable: (
    envIndex: number,
    oldKey: string,
    newKey: string,
    value: string,
    sensitive?: boolean
  ) => void;
  onRemoveVariable: (envIndex: number, key: string) => void;
}

/**
 * Strips a leading `#` for display; storage still keeps raw dotenv lines.
 */
function toDisplayCommentLine(line: string): string {
  const trimmed = line.trimStart();
  if (trimmed.startsWith('#')) {
    return trimmed.replace(/^#\s?/, '');
  }
  return line;
}

/**
 * Drops leading/trailing blank comment lines for cleaner UI.
 */
function visibleCommentLines(
  comments: readonly string[] | undefined
): readonly string[] {
  if (!comments || comments.length === 0) {
    return [];
  }
  let start = 0;
  let end = comments.length;
  while (start < end && comments[start]!.trim() === '') {
    start += 1;
  }
  while (end > start && comments[end - 1]!.trim() === '') {
    end -= 1;
  }
  return comments.slice(start, end);
}

function isHttpUrlValue(value: string): boolean {
  const trimmed = (value || '').trim();
  if (!trimmed) {
    return false;
  }
  try {
    const parsed = new URL(trimmed);
    return parsed.protocol === 'http:' || parsed.protocol === 'https:';
  } catch {
    return false;
  }
}

export const PAMFormEnvironmentVarRow: React.FC<
  PAMFormEnvironmentVarRowProps
> = ({
  envIndex,
  item,
  keyError,
  valueError,
  tt,
  sensitiveLocked,
  readOnly = false,
  onUpdateVariable,
  onRemoveVariable
}) => {
  const t = useWarnTranslations();
  const errorMessage = keyError?.message || valueError?.message;
  const isSensitive = item.sensitive === true;
  const fieldsDisabled = readOnly || sensitiveLocked;
  const commentLines = visibleCommentLines(item.comments);
  const valueHref =
    !isSensitive && isHttpUrlValue(item.value) ? item.value.trim() : '';

  return (
    <div
      data-testid="PAMFormEnvironmentVarRow"
      className="min-w-0 max-w-full space-y-1"
    >
      {commentLines.length > 0 ? (
        <div
          data-testid="PAMFormEnvironmentVarComments"
          title={commentLines.join('\n')}
          className="max-h-24 min-w-0 max-w-full overflow-x-hidden overflow-y-auto rounded-md border-l-2 border-brand/35 bg-secondary/70 px-2.5 py-1.5"
        >
          <div className="min-w-0 space-y-0.5 text-[11px] leading-relaxed text-secondary-text sm:text-xs">
            {commentLines.map((line, index) => {
              const display = toDisplayCommentLine(line);
              const isBlank = display.trim() === '';
              return (
                <p
                  data-testid="PAMFormEnvironmentVarCommentLine"
                  key={`${item.key}-comment-${index}`}
                  className={clsx(
                    'max-w-full wrap-break-word break-all whitespace-pre-wrap',
                    isBlank && 'h-2'
                  )}
                >
                  {isBlank ? null : display}
                </p>
              );
            })}
          </div>
        </div>
      ) : null}

      <div className="env-var-row flex flex-wrap items-center gap-1.5 sm:flex-nowrap sm:gap-2">
        <input
          type="text"
          placeholder={tt.placeholderEnvVar}
          value={item.key}
          readOnly={readOnly}
          disabled={readOnly}
          onChange={(e) =>
            onUpdateVariable(
              envIndex,
              item.key,
              e.target.value,
              item.value,
              isSensitive
            )
          }
          className={clsx(
            pamFormMonoFieldClass,
            'env-var-key min-w-15 flex-1 py-1.5 text-xs sm:text-sm',
            keyError && 'border-(--fe-color-error)',
            readOnly && 'cursor-default opacity-80'
          )}
        />
        {readOnly && valueHref ? (
          <a
            href={valueHref}
            target="_blank"
            rel="noopener noreferrer"
            title={valueHref}
            className={clsx(
              pamFormMonoFieldClass,
              'env-var-value inline-flex min-w-20 flex-[1.5] items-center gap-1.5 py-1.5 text-xs text-brand no-underline transition hover:underline sm:text-sm'
            )}
          >
            <span className="min-w-0 truncate">{item.value}</span>
            <ArrowTopRightOnSquareIcon
              className="h-3.5 w-3.5 shrink-0"
              aria-hidden
            />
          </a>
        ) : (
          <input
            type={isSensitive ? 'password' : 'text'}
            placeholder={
              isSensitive
                ? tt.envVarSensitivePlaceholder
                : tt.placehoderEnvValue
            }
            value={item.value}
            readOnly={readOnly}
            disabled={readOnly}
            onChange={(e) =>
              onUpdateVariable(
                envIndex,
                item.key,
                item.key,
                e.target.value,
                isSensitive
              )
            }
            className={clsx(
              pamFormMonoFieldClass,
              'env-var-value min-w-20 flex-[1.5] py-1.5 text-xs sm:text-sm',
              valueError && 'border-(--fe-color-error)',
              readOnly && 'cursor-default opacity-80'
            )}
          />
        )}
        {!readOnly && valueHref ? (
          <a
            href={valueHref}
            target="_blank"
            rel="noopener noreferrer"
            title={valueHref}
            aria-label={valueHref}
            className="shrink-0 rounded-lg p-1 text-brand transition hover:bg-brand/10"
          >
            <ArrowTopRightOnSquareIcon className="h-4 w-4" aria-hidden />
          </a>
        ) : null}
        <label
          className={clsx(
            'flex shrink-0 items-center gap-1 text-[10px] text-secondary-text sm:text-xs',
            fieldsDisabled ? 'cursor-not-allowed opacity-70' : 'cursor-pointer'
          )}
          title={sensitiveLocked ? tt.envVarSensitiveLocked : undefined}
        >
          <input
            type="checkbox"
            checked={isSensitive}
            disabled={fieldsDisabled}
            onChange={(e) =>
              onUpdateVariable(
                envIndex,
                item.key,
                item.key,
                item.value,
                e.target.checked
              )
            }
            className="h-3.5 w-3.5 accent-brand disabled:cursor-not-allowed"
          />
          <span>{tt.envVarSensitive}</span>
        </label>
        {!readOnly ? (
          <button
            type="button"
            onClick={() => onRemoveVariable(envIndex, item.key)}
            className="shrink-0 cursor-pointer rounded-lg p-1 text-(--fe-color-error) transition hover:bg-(--fe-color-error)/10 hover:opacity-80 touch-manipulation"
            aria-label={tt.envDelete}
          >
            <MinusCircleIcon className="h-4 w-4" />
          </button>
        ) : null}
      </div>
      {errorMessage && (
        <div className="col-span-full mt-0.5 text-xs text-(--fe-color-error)">
          {t(errorMessage)}
        </div>
      )}
    </div>
  );
};
