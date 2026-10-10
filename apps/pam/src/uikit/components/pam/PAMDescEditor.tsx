'use client';

import { ArrowsPointingOutIcon } from '@heroicons/react/24/outline';
import { clsx } from 'clsx';
import React, { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import type { PAMDescEditorI18nInterface } from '@config/i18n-mapping/PAMI18n';
import { pamFormFieldClass } from './PAMFormFieldStyles';
import { PAMProjectDescMarkdownLazy } from './PAMProjectDescMarkdownLazy';

export const PAM_DESC_MAX_LENGTH = 10000;

export type PAMDescEditorProps = {
  tt: PAMDescEditorI18nInterface;
  value: string;
  onChange: (value: string) => void;
  onBlur?: () => void;
  placeholder?: string;
  /** Fixed height in rows; when omitted the textarea grows with content up to ~10 rows. */
  rows?: number;
  readOnly?: boolean;
  disabled?: boolean;
  name?: string;
  id?: string;
  testId?: string;
};

type ModeType = 'write' | 'preview';

const AUTO_GROW_MIN_ROWS = 3;
const AUTO_GROW_MAX_ROWS = 10;

function DescPreview(props: {
  tt: PAMDescEditorI18nInterface;
  value: string;
  className?: string;
}) {
  const text = props.value.trim();
  return (
    <div
      data-testid="DescPreview"
      className={clsx('min-w-0 overflow-auto', props.className)}
    >
      {text ? (
        <PAMProjectDescMarkdownLazy markdown={text} />
      ) : (
        <p className="text-sm text-tertiary-text">{props.tt.descEditorEmpty}</p>
      )}
    </div>
  );
}

function autoGrow(el: HTMLTextAreaElement): void {
  const style = window.getComputedStyle(el);
  const line = parseFloat(style.lineHeight) || 20;
  const chrome =
    parseFloat(style.paddingTop) +
    parseFloat(style.paddingBottom) +
    parseFloat(style.borderTopWidth) +
    parseFloat(style.borderBottomWidth);
  el.style.height = 'auto';
  const min = line * AUTO_GROW_MIN_ROWS + chrome;
  const max = line * AUTO_GROW_MAX_ROWS + chrome;
  el.style.height = `${Math.min(Math.max(el.scrollHeight, min), max)}px`;
}

/**
 * Markdown description editor shared by the create modal and the General tab:
 * write / preview toggle, character count, and a full-screen split editor.
 */
export function PAMDescEditor(props: PAMDescEditorProps) {
  const {
    tt,
    value,
    onChange,
    onBlur,
    placeholder,
    rows,
    readOnly,
    disabled,
    name,
    id,
    testId = 'PAMDescEditor'
  } = props;
  const [mode, setMode] = useState<ModeType>('write');
  const [expanded, setExpanded] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const expandedRef = useRef<HTMLTextAreaElement>(null);
  const locked = Boolean(readOnly || disabled);

  useLayoutEffect(() => {
    if (rows == null && mode === 'write' && textareaRef.current) {
      autoGrow(textareaRef.current);
    }
  }, [value, rows, mode]);

  useEffect(() => {
    if (!expanded) {
      return;
    }
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    expandedRef.current?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.stopPropagation();
        setExpanded(false);
      }
    };
    window.addEventListener('keydown', onKey, true);
    return () => {
      document.body.style.overflow = prevOverflow;
      window.removeEventListener('keydown', onKey, true);
    };
  }, [expanded]);

  const segmentButton = (target: ModeType, label: string) => (
    <button
      data-testid="segmentButton"
      type="button"
      role="tab"
      aria-selected={mode === target}
      onClick={() => setMode(target)}
      className={clsx(
        'rounded-md px-2.5 py-1 text-xs font-medium transition',
        mode === target
          ? 'bg-secondary text-primary-text shadow-sm'
          : 'text-tertiary-text hover:text-primary-text'
      )}
    >
      {label}
    </button>
  );

  const textareaProps = {
    name,
    value,
    placeholder,
    readOnly,
    disabled,
    maxLength: PAM_DESC_MAX_LENGTH,
    onBlur,
    onChange: (e: React.ChangeEvent<HTMLTextAreaElement>) =>
      onChange(e.target.value)
  };

  return (
    <div data-testid={testId} className="min-w-0">
      <div className="mb-1.5 flex items-center gap-2">
        <div
          role="tablist"
          className="inline-flex rounded-lg border border-primary-border bg-elevated p-0.5"
        >
          {segmentButton('write', tt.descEditorWrite)}
          {segmentButton('preview', tt.descEditorPreview)}
        </div>
        <span className="text-xs text-tertiary-text">
          {tt.descEditorMarkdown}
        </span>
        {!locked ? (
          <button
            type="button"
            data-testid={`${testId}-expand`}
            title={tt.descEditorExpand}
            aria-label={tt.descEditorExpand}
            onClick={() => setExpanded(true)}
            className="ml-auto inline-flex h-7 w-7 items-center justify-center rounded-md text-tertiary-text transition hover:bg-elevated hover:text-primary-text"
          >
            <ArrowsPointingOutIcon className="h-4 w-4" />
          </button>
        ) : null}
      </div>

      {mode === 'write' ? (
        <textarea
          {...textareaProps}
          ref={textareaRef}
          id={id}
          rows={rows ?? AUTO_GROW_MIN_ROWS}
          className={clsx(
            pamFormFieldClass,
            'block leading-relaxed',
            rows == null ? 'resize-none overflow-y-auto' : 'resize-y'
          )}
        />
      ) : (
        <DescPreview
          tt={tt}
          value={value}
          className={clsx(
            'rounded-[10px] border border-primary-border bg-secondary px-3.5 py-2.5',
            rows == null ? 'max-h-80 min-h-24' : 'max-h-[32rem] min-h-40'
          )}
        />
      )}

      <div className="mt-1 flex items-start justify-between gap-3 text-xs text-tertiary-text">
        <span>{tt.descEditorHint}</span>
        <span className="shrink-0 tabular-nums">
          {value.length} / {PAM_DESC_MAX_LENGTH}
        </span>
      </div>

      {expanded
        ? createPortal(
            <div
              data-testid={`${testId}-fullscreen`}
              role="dialog"
              aria-modal="true"
              className="fixed inset-0 z-1100 flex flex-col bg-secondary"
            >
              <div className="flex h-12 shrink-0 items-center gap-3 border-b border-primary-border px-4">
                <span className="text-sm font-semibold text-primary-text">
                  {tt.descEditorMarkdown}
                </span>
                <span className="text-xs text-tertiary-text tabular-nums">
                  {value.length} / {PAM_DESC_MAX_LENGTH}
                </span>
                <button
                  type="button"
                  onClick={() => setExpanded(false)}
                  className="ml-auto h-8 rounded-lg bg-brand px-4 text-sm font-medium text-on-brand transition hover:bg-brand-hover"
                >
                  {tt.descEditorDone}
                </button>
              </div>
              <div className="grid min-h-0 flex-1 grid-rows-2 md:grid-cols-2 md:grid-rows-1">
                <textarea
                  {...textareaProps}
                  ref={expandedRef}
                  className="min-h-0 resize-none border-primary-border bg-secondary p-4 font-mono text-sm leading-relaxed text-primary-text focus:outline-none max-md:border-b md:border-r"
                />
                <DescPreview
                  tt={tt}
                  value={value}
                  className="min-h-0 bg-primary p-4"
                />
              </div>
            </div>,
            document.body
          )
        : null}
    </div>
  );
}
