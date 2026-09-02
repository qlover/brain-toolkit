'use client';

import { ExecutorError } from '@qlover/fe-corekit/executor';
import { useReturnTo } from '@qlover/next-kit/client';
import { isI18nKey, type TranslateFn } from '@qlover/next-kit/common';
import {
  type FormEvent,
  useCallback,
  useEffect,
  useRef,
  useState
} from 'react';
import { AppUserGateway } from '@/impls/AppUserGateway';
import { useIOC } from '@/uikit/hook/useIOC';
import { useWarnTranslations } from '@/uikit/hook/useWarnTranslations';
import { URLParamsKeys } from '@config/common';
import type { LoginI18nInterface } from '@config/i18n-mapping/loginI18n';
import { ROUTE_HOME } from '@config/route';

const RESEND_COOLDOWN_SEC = 60;

function resolveSubmitError(
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

/**
 * Normalize to E.164 for Supabase Phone Auth / Test phone numbers.
 * Accepts +86138…, 86138…, or mainland 11-digit 1xxxxxxxxxx.
 */
function normalizePhoneE164(raw: string): string {
  const trimmed = raw.trim().replace(/[\s-]/g, '');
  if (!trimmed) {
    return '';
  }
  if (trimmed.startsWith('+')) {
    return `+${trimmed.slice(1).replace(/\D/g, '')}`;
  }
  const digits = trimmed.replace(/\D/g, '');
  if (/^1\d{10}$/.test(digits)) {
    return `+86${digits}`;
  }
  if (digits.startsWith('86') && digits.length >= 12) {
    return `+${digits}`;
  }
  return digits ? `+${digits}` : '';
}

const inputClass =
  'border-primary-border text-primary-text placeholder:text-tertiary-text focus:border-brand focus:ring-brand w-full rounded-xl border bg-bg-container px-4 py-3 text-sm outline-none transition-colors focus:ring-2 focus:ring-offset-0';

type Step = 'phone' | 'otp';

interface PhoneLoginFormProps {
  tt: LoginI18nInterface;
}

export function PhoneLoginForm({ tt }: PhoneLoginFormProps) {
  const t = useWarnTranslations();
  const userGateway = useIOC(AppUserGateway);
  const { returnTo } = useReturnTo({ returnToKey: URLParamsKeys.returnTo });

  const [step, setStep] = useState<Step>('phone');
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [phoneError, setPhoneError] = useState<string | undefined>();
  const [otpError, setOtpError] = useState<string | undefined>();
  const [countdown, setCountdown] = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const isCountingDown = countdown > 0;

  // Countdown timer for resend
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

  const validatePhone = useCallback(
    (value: string): boolean => {
      const normalized = normalizePhoneE164(value);
      // E.164: + and 8–15 digits total after country code (ITU max 15 digits).
      if (!normalized || !/^\+[1-9]\d{7,14}$/.test(normalized)) {
        setPhoneError(t(tt.phoneInvalid));
        return false;
      }
      setPhoneError(undefined);
      return true;
    },
    [t, tt.phoneInvalid]
  );

  const validateOtp = useCallback(
    (value: string): boolean => {
      const trimmed = value.trim();
      if (!trimmed || !/^\d{6}$/.test(trimmed)) {
        setOtpError(t(tt.phoneOtpInvalid));
        return false;
      }
      setOtpError(undefined);
      return true;
    },
    [t, tt.phoneOtpInvalid]
  );

  const handleSendOtp = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSubmitError(null);

    if (!validatePhone(phone)) return;

    const normalized = normalizePhoneE164(phone);
    setPhone(normalized);
    setLoading(true);
    try {
      await userGateway.sendOtp({ phone: normalized });
      setStep('otp');
      setCountdown(RESEND_COOLDOWN_SEC);
    } catch (err) {
      setSubmitError(resolveSubmitError(err, 'Send OTP failed', t));
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSubmitError(null);

    if (!validateOtp(otp)) return;

    const normalized = normalizePhoneE164(phone);
    setLoading(true);
    try {
      await userGateway.verifyOtp({ phone: normalized, token: otp.trim() });
      returnTo(ROUTE_HOME);
    } catch (err) {
      setSubmitError(resolveSubmitError(err, 'Phone login failed', t));
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (countdown > 0 || loading) return;
    setSubmitError(null);
    const normalized = normalizePhoneE164(phone);
    setLoading(true);
    try {
      await userGateway.sendOtp({ phone: normalized });
      setOtp('');
      setCountdown(RESEND_COOLDOWN_SEC);
    } catch (err) {
      setSubmitError(resolveSubmitError(err, 'Resend OTP failed', t));
    } finally {
      setLoading(false);
    }
  };

  const isEmpty = !phone.trim();
  const submitDisabled = loading;

  return (
    <div data-testid="PhoneLoginForm" className="w-full">
      {submitError && (
        <div
          role="alert"
          className="text-red-500 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm mb-4 dark:border-red-800 dark:bg-red-950/30"
        >
          {submitError}
        </div>
      )}

      {step === 'phone' && (
        <form
          data-testid="PhoneLoginForm-Phone"
          name="phone-login-phone"
          onSubmit={handleSendOtp}
          noValidate
          className="space-y-4"
        >
          <p className="text-sm text-secondary-text">{tt.phoneSubtitle}</p>
          <div>
            <label
              htmlFor="phone-number"
              className="text-primary-text mb-1.5 block text-sm font-medium"
            >
              {tt.phoneLabel}
            </label>
            <input
              id="phone-number"
              type="tel"
              name="phone"
              autoComplete="tel"
              placeholder={tt.phonePlaceholder}
              value={phone}
              onChange={(e) => {
                setPhone(e.target.value);
                if (phoneError) setPhoneError(undefined);
              }}
              className={inputClass}
              disabled={submitDisabled}
              aria-invalid={!!phoneError}
              aria-describedby={phoneError ? 'phone-error' : undefined}
            />
            {phoneError && (
              <p
                id="phone-error"
                className="text-red-500 mt-1 text-sm"
                role="alert"
              >
                {phoneError}
              </p>
            )}
          </div>

          <button
            type="submit"
            disabled={submitDisabled || isEmpty}
            className="flex min-h-12 w-full items-center justify-center rounded-xl bg-brand px-4 py-3 text-sm font-semibold text-on-brand shadow-sm transition-colors hover:bg-brand-hover focus:outline-none focus:ring-2 focus:ring-brand focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-70 disabled:hover:bg-brand"
          >
            {loading ? (
              <span className="inline-flex items-center justify-center gap-2">
                <span className="inline-block size-4 shrink-0 animate-spin rounded-full border-2 border-current border-t-transparent" />
              </span>
            ) : (
              tt.phoneSend
            )}
          </button>
        </form>
      )}

      {step === 'otp' && (
        <form
          data-testid="PhoneLoginForm-Otp"
          name="phone-login-otp"
          onSubmit={handleVerifyOtp}
          noValidate
          className="space-y-4"
        >
          <div className="text-sm text-secondary-text">
            {phone}
            <button
              type="button"
              onClick={() => {
                setStep('phone');
                setOtp('');
                setSubmitError(null);
              }}
              className="ml-2 text-brand hover:underline text-xs"
            >
              ✎
            </button>
          </div>

          <div>
            <label
              htmlFor="phone-otp"
              className="text-primary-text mb-1.5 block text-sm font-medium"
            >
              {tt.phoneOtpLabel}
            </label>
            <input
              id="phone-otp"
              type="text"
              inputMode="numeric"
              maxLength={6}
              name="otp"
              autoComplete="one-time-code"
              placeholder={tt.phoneOtpPlaceholder}
              value={otp}
              onChange={(e) => {
                // Only allow digits
                const val = e.target.value.replace(/\D/g, '');
                setOtp(val);
                if (otpError) setOtpError(undefined);
              }}
              className={inputClass}
              disabled={submitDisabled}
              aria-invalid={!!otpError}
              aria-describedby={otpError ? 'phone-otp-error' : undefined}
              autoFocus
            />
            {otpError && (
              <p
                id="phone-otp-error"
                className="text-red-500 mt-1 text-sm"
                role="alert"
              >
                {otpError}
              </p>
            )}
          </div>

          <button
            type="submit"
            disabled={submitDisabled || !otp.trim()}
            className="flex min-h-12 w-full items-center justify-center rounded-xl bg-brand px-4 py-3 text-sm font-semibold text-on-brand shadow-sm transition-colors hover:bg-brand-hover focus:outline-none focus:ring-2 focus:ring-brand focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-70 disabled:hover:bg-brand"
          >
            {loading ? (
              <span className="inline-flex items-center justify-center gap-2">
                <span className="inline-block size-4 shrink-0 animate-spin rounded-full border-2 border-current border-t-transparent" />
              </span>
            ) : (
              tt.phoneVerify
            )}
          </button>

          <div className="text-center text-sm">
            {countdown > 0 ? (
              <span className="text-tertiary-text">
                {countdown}s {tt.phoneCountdownSuffix}
              </span>
            ) : (
              <button
                type="button"
                onClick={handleResend}
                disabled={loading}
                className="text-brand hover:underline disabled:opacity-50"
              >
                {tt.phoneResend}
              </button>
            )}
          </div>
        </form>
      )}
    </div>
  );
}
