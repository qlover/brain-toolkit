'use client';

import { LoginValidator } from '@qlover/next-kit/common';
import { type FormEvent, useEffect, useMemo, useRef, useState } from 'react';
import { AppUserGateway } from '@/impls/AppUserGateway';
import { useIOC } from '@/uikit/hook/useIOC';
import { useWarnTranslations } from '@/uikit/hook/useWarnTranslations';
import type { LoginI18nInterface } from '@config/i18n-mapping/loginI18n';

const RESEND_COOLDOWN_SEC = 60;

const inputClass =
  'border-primary-border text-primary-text placeholder:text-tertiary-text focus:border-brand focus:ring-brand w-full rounded-xl border bg-bg-container px-4 py-3 text-sm outline-none transition-colors focus:ring-2 focus:ring-offset-0';

const submitButtonClass =
  'flex min-h-12 w-full items-center justify-center rounded-xl bg-brand px-4 py-3 text-sm font-semibold text-on-brand shadow-sm transition-colors hover:bg-brand-hover focus:outline-none focus:ring-2 focus:ring-brand focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-70 disabled:hover:bg-brand';

const secondaryButtonClass =
  'flex min-h-12 w-full items-center justify-center rounded-xl border border-primary-border bg-bg-container px-4 py-3 text-sm font-medium text-primary-text transition-colors hover:bg-secondary focus:outline-none focus:ring-2 focus:ring-brand focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60';

interface EmailOTPFormProps {
  tt: LoginI18nInterface;
  email: string;
  onEmailChange: (email: string) => void;
  onSentChange?: (sent: boolean) => void;
}

/**
 * Email magic-link login form.
 *
 * Sends a Supabase magic link. Clicking it opens /callback/email-login with a
 * loading UI; the page POSTs { code } to /api/callback/email-login (no browser Supabase).
 */
export function EmailOTPForm({
  tt,
  email,
  onEmailChange,
  onSentChange
}: EmailOTPFormProps) {
  const t = useWarnTranslations();
  const userGateway = useIOC(AppUserGateway);
  const formValidator = useMemo(() => new LoginValidator(), []);

  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [resent, setResent] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [emailError, setEmailError] = useState<string | undefined>();
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const isCountingDown = countdown > 0;
  const resendDisabled = loading || isCountingDown;

  useEffect(() => {
    if (!isCountingDown) return;

    timerRef.current = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          if (timerRef.current) clearInterval(timerRef.current);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isCountingDown]);

  const startResendCooldown = () => {
    setCountdown(RESEND_COOLDOWN_SEC);
  };

  const clearResendCooldown = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    setCountdown(0);
  };

  const validateEmail = (value: string): boolean => {
    const result = formValidator.validateEmail(value.trim());
    if (result != null) {
      setEmailError(t(result.message));
      return false;
    }
    setEmailError(undefined);
    return true;
  };

  const handleSendMagicLink = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSubmitError(null);

    if (!validateEmail(email)) return;

    setLoading(true);
    try {
      await userGateway.sendOtp({ email: email.trim() });
      setSent(true);
      setResent(false);
      startResendCooldown();
      onSentChange?.(true);
    } catch (err) {
      setSubmitError(
        err instanceof Error ? err.message : 'Failed to send magic link'
      );
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (resendDisabled) return;

    setSubmitError(null);
    setLoading(true);
    try {
      await userGateway.sendOtp({ email: email.trim() });
      setResent(true);
      startResendCooldown();
    } catch (err) {
      setSubmitError(
        err instanceof Error ? err.message : 'Failed to resend magic link'
      );
    } finally {
      setLoading(false);
    }
  };

  const isEmpty = !email.trim();

  return (
    <div data-testid="EmailOTPForm" className="w-full">
      {submitError && (
        <div
          role="alert"
          className="text-red-500 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm mb-4 dark:border-red-800 dark:bg-red-950/30"
        >
          {submitError}
        </div>
      )}

      {sent ? (
        <div
          role="status"
          aria-live="polite"
          data-testid="EmailOTPForm-Sent"
          className="space-y-5"
        >
          <div className="flex items-start gap-3">
            <span
              className="bg-brand/10 text-brand mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full"
              aria-hidden
            >
              <svg viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4">
                <path
                  fillRule="evenodd"
                  d="M16.704 4.153a.75.75 0 01.143 1.052l-8 10.5a.75.75 0 01-1.127.075l-4.5-4.5a.75.75 0 011.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 011.05-.143z"
                  clipRule="evenodd"
                />
              </svg>
            </span>
            <div className="min-w-0 flex-1">
              <h3 className="text-primary-text text-base font-semibold">
                {tt.emailOtpSentTitle}
              </h3>
              <p className="text-secondary-text mt-1 text-sm leading-relaxed">
                {tt.emailOtpSentHint}
              </p>
            </div>
          </div>

          <div>
            <p className="text-primary-text mb-1.5 text-sm font-medium">
              {tt.email}
            </p>
            <div
              className={`${inputClass} bg-secondary text-primary-text break-all`}
            >
              {email.trim()}
            </div>
          </div>

          <p className="text-tertiary-text text-xs leading-relaxed">
            {tt.emailOtpSentSpam}
          </p>

          {resent && (
            <p className="text-secondary-text text-sm">{tt.emailOtpSuccess}</p>
          )}

          <div className="space-y-3 pt-1">
            <button
              type="button"
              onClick={handleResend}
              disabled={resendDisabled}
              className={secondaryButtonClass}
            >
              {loading ? (
                <span className="inline-flex items-center gap-2">
                  <span className="inline-block size-4 shrink-0 animate-spin rounded-full border-2 border-current border-t-transparent" />
                  {tt.emailOtpResend}
                </span>
              ) : isCountingDown ? (
                `${countdown}s ${tt.emailOtpCountdownSuffix}`
              ) : (
                tt.emailOtpResend
              )}
            </button>
            <p className="text-center">
              <button
                type="button"
                onClick={() => {
                  setSent(false);
                  setResent(false);
                  setSubmitError(null);
                  clearResendCooldown();
                  onSentChange?.(false);
                }}
                className="text-brand text-sm hover:underline"
              >
                {tt.emailOtpChangeEmail}
              </button>
            </p>
          </div>
        </div>
      ) : (
        <form
          data-testid="EmailOTPForm-Email"
          name="email-magic-link"
          onSubmit={handleSendMagicLink}
          noValidate
          className="space-y-4"
        >
          <div>
            <label
              htmlFor="magic-link-email"
              className="text-primary-text mb-1.5 block text-sm font-medium"
            >
              {tt.email}
            </label>
            <input
              id="magic-link-email"
              type="email"
              name="email"
              autoComplete="email"
              placeholder={tt.email}
              value={email}
              onChange={(e) => {
                onEmailChange(e.target.value);
                if (emailError) setEmailError(undefined);
              }}
              className={inputClass}
              disabled={loading}
              aria-invalid={!!emailError}
              aria-describedby={
                emailError ? 'magic-link-email-error' : undefined
              }
            />
            {emailError && (
              <p
                id="magic-link-email-error"
                className="text-red-500 mt-1 text-sm"
                role="alert"
              >
                {emailError}
              </p>
            )}
          </div>

          <button
            type="submit"
            disabled={loading || isEmpty}
            className={submitButtonClass}
          >
            {loading ? (
              <span className="inline-flex items-center justify-center gap-2">
                <span className="inline-block size-4 shrink-0 animate-spin rounded-full border-2 border-current border-t-transparent" />
              </span>
            ) : (
              tt.emailOtpSend
            )}
          </button>
        </form>
      )}
    </div>
  );
}
