'use client';

import { ArrowPathIcon } from '@heroicons/react/24/outline';
import { useStrictEffect } from '@qlover/next-kit/client';
import { useSearchParams } from 'next/navigation';
import { type FormEvent, useState } from 'react';
import { AppUserGateway } from '@/impls/AppUserGateway';
import {
  passwordResetButtonClass,
  passwordResetInputClass,
  passwordResetInputErrorClass,
  resolvePasswordResetError
} from '@/uikit/components/ForgotPasswordForm';
import { LocaleLink } from '@/uikit/components/LocaleLink';
import { useIOC } from '@/uikit/hook/useIOC';
import { useWarnTranslations } from '@/uikit/hook/useWarnTranslations';
import type { PasswordResetI18nInterface } from '@config/i18n-mapping/passwordResetI18n';
import { ROUTE_AUTH_FORGOT_PASSWORD, ROUTE_LOGIN } from '@config/route';
import { isValidPassword } from '@schemas/PamUserSchema';

type Phase = 'checking' | 'invalid' | 'form' | 'done';

export function ResetPasswordForm({ tt }: { tt: PasswordResetI18nInterface }) {
  const t = useWarnTranslations();
  const gateway = useIOC(AppUserGateway);
  const token = useSearchParams()?.get('token')?.trim() ?? '';

  const [phase, setPhase] = useState<Phase>(token ? 'checking' : 'invalid');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [touched, setTouched] = useState({ next: false, confirm: false });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useStrictEffect(() => {
    if (!token) {
      return;
    }
    gateway
      .verifyResetToken(token)
      .then((result) => setPhase(result.valid ? 'form' : 'invalid'))
      .catch(() => setPhase('invalid'));
  }, [gateway, token]);

  const newPasswordError =
    newPassword && !isValidPassword(newPassword) ? tt.invalid : null;
  const confirmPasswordError =
    confirmPassword && confirmPassword !== newPassword ? tt.mismatch : null;
  const showNewPasswordError = touched.next ? newPasswordError : null;
  const showConfirmPasswordError =
    touched.confirm || confirmPassword.length >= newPassword.length
      ? confirmPasswordError
      : null;

  const canSubmit =
    !loading &&
    newPassword.length > 0 &&
    confirmPassword.length > 0 &&
    !newPasswordError &&
    !confirmPasswordError;

  const onSubmit = async (event: FormEvent) => {
    event.preventDefault();
    if (!canSubmit) {
      setTouched({ next: true, confirm: true });
      return;
    }
    setError(null);
    setLoading(true);
    try {
      await gateway.resetPassword({ token, new_password: newPassword });
      setPhase('done');
    } catch (err) {
      setError(resolvePasswordResetError(err, tt.errorFallback, t));
    } finally {
      setLoading(false);
    }
  };

  if (phase === 'checking') {
    return (
      <div
        data-testid="ResetPasswordForm"
        className="flex items-center gap-2 py-6 text-sm text-secondary-text"
      >
        <ArrowPathIcon className="h-4 w-4 animate-spin" />
        {tt.checking}
      </div>
    );
  }

  if (phase === 'invalid') {
    return (
      <div
        data-testid="ResetPasswordForm-Invalid"
        className="flex flex-col gap-4"
      >
        <p className="text-sm text-(--fe-color-error)">{tt.tokenInvalid}</p>
        <LocaleLink
          title={tt.requestNew}
          href={ROUTE_AUTH_FORGOT_PASSWORD}
          className={passwordResetButtonClass}
        >
          {tt.requestNew}
        </LocaleLink>
      </div>
    );
  }

  if (phase === 'done') {
    return (
      <div data-testid="ResetPasswordForm-Done" className="flex flex-col gap-4">
        <h3 className="text-lg font-semibold text-primary-text">
          {tt.successTitle}
        </h3>
        <p className="text-sm text-secondary-text">{tt.successHint}</p>
        <LocaleLink
          title={tt.goLogin}
          href={ROUTE_LOGIN}
          className={passwordResetButtonClass}
        >
          {tt.goLogin}
        </LocaleLink>
      </div>
    );
  }

  return (
    <form
      data-testid="ResetPasswordForm"
      className="flex flex-col gap-4"
      onSubmit={onSubmit}
      noValidate
    >
      <div className="flex flex-col gap-1">
        <input
          type="password"
          autoComplete="new-password"
          maxLength={50}
          value={newPassword}
          disabled={loading}
          aria-invalid={Boolean(showNewPasswordError)}
          onChange={(e) => {
            setNewPassword(e.target.value);
            setError(null);
          }}
          onBlur={() => setTouched((prev) => ({ ...prev, next: true }))}
          placeholder={tt.newPlaceholder}
          className={`${passwordResetInputClass}${showNewPasswordError ? ` ${passwordResetInputErrorClass}` : ''}`}
        />
        {showNewPasswordError ? (
          <p className="text-sm text-(--fe-color-error)">
            {showNewPasswordError}
          </p>
        ) : null}
      </div>
      <div className="flex flex-col gap-1">
        <input
          type="password"
          autoComplete="new-password"
          maxLength={50}
          value={confirmPassword}
          disabled={loading}
          aria-invalid={Boolean(showConfirmPasswordError)}
          onChange={(e) => {
            setConfirmPassword(e.target.value);
            setError(null);
          }}
          onBlur={() => setTouched((prev) => ({ ...prev, confirm: true }))}
          placeholder={tt.confirmPlaceholder}
          className={`${passwordResetInputClass}${showConfirmPasswordError ? ` ${passwordResetInputErrorClass}` : ''}`}
        />
        {showConfirmPasswordError ? (
          <p className="text-sm text-(--fe-color-error)">
            {showConfirmPasswordError}
          </p>
        ) : null}
      </div>

      {error ? (
        <p className="text-sm text-(--fe-color-error)">{error}</p>
      ) : null}

      <button
        type="submit"
        disabled={!canSubmit}
        className={passwordResetButtonClass}
      >
        {loading ? <ArrowPathIcon className="h-4 w-4 animate-spin" /> : null}
        {tt.resetSubmit}
      </button>
    </form>
  );
}
