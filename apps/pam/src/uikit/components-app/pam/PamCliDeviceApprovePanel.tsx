'use client';

import clsx from 'clsx';
import { useSearchParams } from 'next/navigation';
import { useCallback, useMemo, useState } from 'react';

type ApproveStateType = 'idle' | 'loading' | 'success' | 'error';

/**
 * Browser UI for approving a PAM CLI device login.
 *
 * Significance: Completes the CLI browser auth handshake.
 * Core idea: Logged-in user confirms a user_code from the terminal.
 * Main function: Call approve API and show result.
 * Main purpose: Let `pam login` finish without typing password in CLI.
 */
export function PamCliDeviceApprovePanel() {
  const searchParams = useSearchParams();
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
      setMessage(
        '请输入终端显示的 user code / Enter the code from your terminal'
      );
      return;
    }

    setState('loading');
    setMessage('');

    try {
      const response = await fetch('/api/pam/cli/device/approve', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_code: code }),
        credentials: 'include'
      });
      const body = (await response.json()) as {
        success?: boolean;
        message?: string;
        id?: string;
        data?: { email?: string };
      };

      if (!response.ok || !body.success) {
        throw new Error(body.message || body.id || 'Approve failed / 授权失败');
      }

      setEmail(body.data?.email || '');
      setState('success');
      setMessage(
        '已授权，可返回终端继续。Authorized — return to your terminal.'
      );
    } catch (error) {
      setState('error');
      setMessage(error instanceof Error ? error.message : String(error));
    }
  }, [userCode]);

  return (
    <div
      data-testid="PamCliDeviceApprovePanel"
      className="mx-auto flex w-full max-w-md flex-col gap-6 px-6 py-16 text-primary-text"
    >
      <div className="flex flex-col gap-2">
        <h1 className="text-2xl font-semibold tracking-tight text-primary-text">
          Authorize PAM CLI
        </h1>
        <p className="text-sm leading-relaxed text-secondary-text">
          确认终端中的验证码，以完成 CLI 登录。Confirm the code shown in your
          terminal to finish CLI login.
        </p>
      </div>

      <label className="flex flex-col gap-2 text-sm text-secondary-text">
        <span>User code</span>
        <input
          data-testid="PamCliDeviceUserCodeInput"
          className="rounded-md border border-primary-border bg-secondary px-3 py-2 font-mono tracking-widest text-primary-text uppercase placeholder-tertiary-text focus:outline-none focus:ring-2 focus:ring-brand"
          value={userCode}
          onChange={(event) => setUserCode(event.target.value.toUpperCase())}
          placeholder="ABCD-EFGH"
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
          ? 'Authorizing…'
          : state === 'success'
            ? 'Authorized'
            : 'Authorize CLI'}
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
