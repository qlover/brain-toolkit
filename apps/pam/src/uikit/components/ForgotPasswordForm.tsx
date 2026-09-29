'use client';

import { ArrowPathIcon } from '@heroicons/react/24/outline';
import { ExecutorError } from '@qlover/fe-corekit/executor';
import { useStrictEffect } from '@qlover/next-kit/client';
import { isI18nKey, type TranslateFn } from '@qlover/next-kit/common';
import { type FormEvent, useState } from 'react';
import { AppUserGateway } from '@/impls/AppUserGateway';
import { fetchPublicConfig } from '@/impls/fetchPublicConfig';
import { LocaleLink } from '@/uikit/components/LocaleLink';
import { useIOC } from '@/uikit/hook/useIOC';
import { useWarnTranslations } from '@/uikit/hook/useWarnTranslations';
import type { PasswordResetI18nInterface } from '@config/i18n-mapping/passwordResetI18n';
import { ROUTE_LOGIN } from '@config/route';

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export const passwordResetInputClass =
  'border-primary-border text-primary-text placeholder:text-tertiary-text focus:border-brand focus:ring-brand w-full rounded-xl border bg-bg-container px-4 py-3 text-sm outline-none transition-colors focus:ring-2 focus:ring-offset-0';

export const passwordResetInputErrorClass =
  'border-(--fe-color-error) focus:border-(--fe-color-error) focus:ring-(--fe-color-error)';

export const passwordResetButtonClass =
  'inline-flex w-full cursor-pointer items-center justify-center gap-2 rounded-xl bg-brand px-4 py-3 text-sm font-semibold text-on-brand hover:bg-brand-hover disabled:cursor-not-allowed disabled:opacity-50';

export function resolvePasswordResetError(
  err: unknown,
  fallback: string,
  t: TranslateFn
): string {
  if (err instanceof ExecutorError && isI18nKey(err.id)) {
    return t(err.id);
  }
  if (err instanceof Error) {
    if (isI18nKey(err.message)) {
      return t(err.message);
    }
    return err.message || fallback;
  }
  return fallback;
}

export function ForgotPasswordForm({ tt }: { tt: PasswordResetI18nInterface }) {
  const t = useWarnTranslations();
  const gateway = useIOC(AppUserGateway);
  const [enabled, setEnabled] = useState<boolean | null>(null);
  const [email, setEmail] = useState('');
  const [touched, setTouched] = useState(false);
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useStrictEffect(() => {
    void fetchPublicConfig().then((config) =>
      setEnabled(config.auth.passwordResetEnabled === true)
    );
  }, []);

  const emailValid = EMAIL_PATTERN.test(email.trim());
  const emailError = touched && email && !emailValid ? tt.emailInvalid : null;

  const onSubmit = async (event: FormEvent) => {
    event.preventDefault();
    if (!emailValid || loading) {
      setTouched(true);
      return;
    }
    setError(null);
    setLoading(true);
    try {
      await gateway.forgotPassword({ email: email.trim() });
      setSent(true);
    } catch (err) {
      setError(resolvePasswordResetError(err, tt.errorFallback, t));
    } finally {
      setLoading(false);
    }
  };

  const backLink = (
    <p className="mt-6 text-center text-sm">
      <LocaleLink
        title={tt.backToLogin}
        href={ROUTE_LOGIN}
        className="text-brand hover:underline"
      >
        {tt.backToLogin}
      </LocaleLink>
    </p>
  );

  if (enabled === null) {
    return (
      <div
        data-testid="ForgotPasswordForm"
        className="flex justify-center py-6"
      >
        <ArrowPathIcon className="h-5 w-5 animate-spin text-tertiary-text" />
      </div>
    );
  }

  if (!enabled) {
    return (
      <div data-testid="ForgotPasswordForm-Disabled">
        <p className="text-sm text-secondary-text">{tt.disabled}</p>
        {backLink}
      </div>
    );
  }

  if (sent) {
    return (
      <div
        data-testid="ForgotPasswordForm-Sent"
        className="flex flex-col gap-3"
      >
        <h3 className="text-lg font-semibold text-primary-text">
          {tt.sentTitle}
        </h3>
        <p className="text-sm text-secondary-text">{tt.sentHint}</p>
        <p className="text-sm text-tertiary-text">{tt.sentSpam}</p>
        <button
          type="button"
          onClick={() => setSent(false)}
          className="mt-2 cursor-pointer self-start text-sm font-medium text-brand hover:underline"
        >
          {tt.resend}
        </button>
        {backLink}
      </div>
    );
  }

  return (
    <form
      data-testid="ForgotPasswordForm"
      className="flex flex-col gap-4"
      onSubmit={onSubmit}
      noValidate
    >
      <div className="flex flex-col gap-1">
        <input
          type="email"
          autoComplete="email"
          value={email}
          disabled={loading}
          aria-invalid={Boolean(emailError)}
          onChange={(e) => {
            setEmail(e.target.value);
            setError(null);
          }}
          onBlur={() => setTouched(true)}
          placeholder={tt.emailPlaceholder}
          className={`${passwordResetInputClass}${emailError ? ` ${passwordResetInputErrorClass}` : ''}`}
        />
        {emailError ? (
          <p className="text-sm text-(--fe-color-error)">{emailError}</p>
        ) : null}
      </div>

      {error ? (
        <p className="text-sm text-(--fe-color-error)">{error}</p>
      ) : null}

      <button
        type="submit"
        disabled={loading || !emailValid}
        className={passwordResetButtonClass}
      >
        {loading ? <ArrowPathIcon className="h-4 w-4 animate-spin" /> : null}
        {tt.submit}
      </button>
      {backLink}
    </form>
  );
}
