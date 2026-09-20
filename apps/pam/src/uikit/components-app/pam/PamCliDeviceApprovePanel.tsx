'use client';

import { usePageI18nMapping } from '@qlover/next-kit/client';
import clsx from 'clsx';
import { useSearchParams } from 'next/navigation';
import { useLocale } from 'next-intl';
import { useCallback, useMemo, useState } from 'react';
import type { PamenvDeviceI18nInterface } from '@config/i18n-mapping/PamenvDeviceI18n';

type ApproveStateType = 'idle' | 'loading' | 'success' | 'error';

/**
 * 浏览器端批准 PAM CLI 设备登录。
 */
export function PamCliDeviceApprovePanel() {
  const tt = usePageI18nMapping<PamenvDeviceI18nInterface>();
  const searchParams = useSearchParams();
  const locale = useLocale();
  const initialCode = useMemo(
    () => (searchParams?.get('user_code') || '').toUpperCase(),
    [searchParams]
  );
  const [userCode, setUserCode] = useState(initialCode);
  const [state, setState] = useState<ApproveStateType>('idle');
  const [message, setMessage] = useState('');
  const [email, setEmail] = useState('');

  const onApprove = useCallback(async () => {
    const code = userCode.trim();
    if (!code) {
      setState('error');
      setMessage(tt.codeRequired);
      return;
    }

    setState('loading');
    setMessage('');

    try {
      const approveLocale = locale === 'zh' ? 'zh' : 'en';
      const response = await fetch('/api/pam/cli/device/approve', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_code: code, locale: approveLocale }),
        credentials: 'include'
      });
      const body = (await response.json()) as {
        success?: boolean;
        message?: string;
        id?: string;
        data?: { email?: string };
      };

      if (!response.ok || !body.success) {
        throw new Error(body.message || body.id || tt.approveFailed);
      }

      setEmail(body.data?.email || '');
      setState('success');
      setMessage(tt.success);
    } catch (error) {
      setState('error');
      setMessage(error instanceof Error ? error.message : String(error));
    }
  }, [locale, tt.approveFailed, tt.codeRequired, tt.success, userCode]);

  return (
    <div
      data-testid="PamCliDeviceApprovePanel"
      className="mx-auto flex w-full max-w-md flex-col gap-6 px-6 py-16 text-primary-text"
    >
      <div className="flex flex-col gap-2">
        <h1 className="text-2xl font-semibold tracking-tight text-primary-text">
          {tt.heading}
        </h1>
        <p className="text-sm leading-relaxed text-secondary-text">
          {tt.subtitle}
        </p>
      </div>

      <label className="flex flex-col gap-2 text-sm text-secondary-text">
        <span>{tt.codeLabel}</span>
        <input
          data-testid="PamCliDeviceUserCodeInput"
          className="rounded-md border border-primary-border bg-secondary px-3 py-2 font-mono tracking-widest text-primary-text uppercase placeholder-tertiary-text focus:outline-none focus:ring-2 focus:ring-brand"
          value={userCode}
          onChange={(event) => setUserCode(event.target.value.toUpperCase())}
          placeholder={tt.codePlaceholder}
          autoComplete="one-time-code"
        />
      </label>

      <button
        data-testid="PamCliDeviceApproveButton"
        type="button"
        disabled={state === 'loading' || state === 'success'}
        onClick={() => {
          void onApprove();
        }}
        className={clsx(
          'rounded-md px-4 py-2 text-sm font-medium transition',
          state === 'success'
            ? 'border border-primary-border bg-elevated text-secondary-text'
            : 'bg-brand text-white hover:opacity-90 disabled:opacity-60'
        )}
      >
        {state === 'loading'
          ? tt.approving
          : state === 'success'
            ? tt.authorized
            : tt.approve}
      </button>

      {message ? (
        <p
          className={clsx(
            'text-sm leading-relaxed',
            state === 'error' ? 'text-red-500' : 'text-secondary-text'
          )}
        >
          {message}
          {email ? ` (${email})` : ''}
        </p>
      ) : null}
    </div>
  );
}
