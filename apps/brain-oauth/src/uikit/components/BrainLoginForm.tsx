'use client';

import { useReturnTo } from '@qlover/next-kit/client';
import { LoginValidator } from '@qlover/next-kit/common';
import { type FormEvent, useEffect, useMemo, useState } from 'react';
import { BrainEnvApi } from '@/impls/appApi/BrainEnvApi';
import { AppUserGateway } from '@/impls/AppUserGateway';
import { useIOC } from '@/uikit/hook/useIOC';
import { useWarnTranslations } from '@/uikit/hook/useWarnTranslations';
import { BRAIN_LOGIN_ENV_COOKIE } from '@config/brainApi';
import { URLParamsKeys } from '@config/common';
import type { LoginI18nInterface } from '@config/i18n-mapping/loginI18n';
import { I } from '@config/ioc-identifiter';
import { ROUTE_DEVELOPER_APPS } from '@config/route';
import type { SeedSrcConfigInterface } from '@interfaces/SeedConfigInterface';
import { BrainButton } from './brain/BrainButton';
import { BrainField, BrainSelectField } from './brain/BrainField';
import { BrainTabs } from './brain/BrainTabs';

type LoginMethod = 'phone' | 'email';
type InvalidField = 'phone' | 'code' | 'email' | 'password';

const COUNTRY_CODE = '+86';
const RESEND_SECONDS = 60;

function readLoginEnvCookie(): string | null {
  const match = document.cookie.match(
    new RegExp(`(?:^|; )${BRAIN_LOGIN_ENV_COOKIE}=([^;]*)`)
  );
  return match ? decodeURIComponent(match[1]) : null;
}

function writeLoginEnvCookie(env: string): void {
  document.cookie = `${BRAIN_LOGIN_ENV_COOKIE}=${encodeURIComponent(env)}; path=/; max-age=31536000; samesite=lax`;
}

/** Local numbers get the default country code; `+…` is sent as typed. */
function toE164(raw: string): string | null {
  const compact = raw.replace(/[\s-]/g, '');
  const phone = compact.startsWith('+') ? compact : COUNTRY_CODE + compact;
  return /^\+\d{7,15}$/.test(phone) ? phone : null;
}

export function BrainLoginForm({ tt }: { tt: LoginI18nInterface }) {
  const t = useWarnTranslations();
  const userGateway = useIOC(AppUserGateway);
  const brainEnvApi = useIOC(BrainEnvApi);
  const appConfig = useIOC(I.AppConfig) as SeedSrcConfigInterface;
  const validator = useMemo(() => new LoginValidator(), []);
  const { returnTo } = useReturnTo({ returnToKey: URLParamsKeys.returnTo });

  const [method, setMethod] = useState<LoginMethod>('phone');
  const [phone, setPhone] = useState('');
  const [code, setCode] = useState('');
  const [email, setEmail] = useState(appConfig.testLoginEmail);
  const [password, setPassword] = useState(appConfig.testLoginPassword);
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [codeSent, setCodeSent] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [invalid, setInvalid] = useState<InvalidField | null>(null);
  const [envs, setEnvs] = useState<string[]>([]);
  const [env, setEnv] = useState('');

  useEffect(() => {
    let cancelled = false;
    brainEnvApi
      .getLoginEnvs()
      .then(({ envs: list, defaultEnv }) => {
        if (cancelled) return;
        const saved = readLoginEnvCookie();
        const initial = saved && list.includes(saved) ? saved : defaultEnv;
        setEnvs(list);
        setEnv(initial);
        writeLoginEnvCookie(initial);
      })
      .catch((err) => console.error('Load Brain envs error:', err));
    return () => {
      cancelled = true;
    };
  }, [brainEnvApi]);

  const changeEnv = (next: string) => {
    setEnv(next);
    writeLoginEnvCookie(next);
    setCode('');
    setCodeSent(false);
    setCountdown(0);
    clearError();
  };

  useEffect(() => {
    if (countdown <= 0) return;
    const timer = setTimeout(() => setCountdown((n) => n - 1), 1000);
    return () => clearTimeout(timer);
  }, [countdown]);

  const fail = (message: string, field: InvalidField | null = null) => {
    setError(message);
    setInvalid(field);
  };

  const clearError = () => {
    setError(null);
    setInvalid(null);
  };

  const handleSendCode = async () => {
    const e164 = toE164(phone);
    if (!e164) {
      fail(tt.phoneInvalid, 'phone');
      return;
    }

    clearError();
    setSending(true);
    try {
      await userGateway.sendOtp({ phone: e164 });
      setCodeSent(true);
      setCountdown(RESEND_SECONDS);
      document.getElementById('login-code')?.focus();
    } catch {
      fail(tt.phoneSendError, 'phone');
    } finally {
      setSending(false);
    }
  };

  const submitPhone = async () => {
    const e164 = toE164(phone);
    if (!e164) {
      fail(tt.phoneInvalid, 'phone');
      return;
    }
    if (!/^\d{6}$/.test(code)) {
      fail(tt.phoneOtpInvalid, 'code');
      return;
    }

    setLoading(true);
    try {
      await userGateway.verifyOtp({ phone: e164, token: code });
      returnTo(ROUTE_DEVELOPER_APPS);
    } catch {
      fail(tt.phoneError, 'code');
      setLoading(false);
    }
  };

  const submitEmail = async () => {
    const emailResult = validator.validateEmail(email);
    if (emailResult != null) {
      fail(t(emailResult.message), 'email');
      return;
    }
    const passwordResult = validator.validatePassword(password);
    if (passwordResult != null) {
      fail(t(passwordResult.message), 'password');
      return;
    }

    setLoading(true);
    try {
      await userGateway.verify({ email, password });
      returnTo(ROUTE_DEVELOPER_APPS);
    } catch {
      fail(tt.emailError);
      setLoading(false);
    }
  };

  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    clearError();
    void (method === 'phone' ? submitPhone() : submitEmail());
  };

  const sendLabel =
    countdown > 0
      ? `${countdown}s ${tt.phoneCountdownSuffix}`
      : codeSent
        ? tt.phoneResend
        : tt.phoneSend;

  return (
    <form
      data-testid="BrainLoginForm"
      name="login"
      onSubmit={handleSubmit}
      noValidate
    >
      {envs.length > 1 && (
        <BrainSelectField
          id="login-env"
          label={tt.env}
          value={env}
          disabled={loading || sending}
          onChange={(e) => changeEnv(e.target.value)}
        >
          {envs.map((name) => (
            <option data-testid="BrainLoginForm" key={name} value={name}>
              {name}
            </option>
          ))}
        </BrainSelectField>
      )}

      <BrainTabs
        aria-label={tt.method}
        items={[
          { key: 'phone', label: tt.tabPhone },
          { key: 'email', label: tt.tabEmail }
        ]}
        value={method}
        onChange={(next) => {
          setMethod(next);
          clearError();
        }}
      />

      {method === 'phone' ? (
        <>
          <BrainField
            id="login-phone"
            label={tt.phoneLabel}
            leading={COUNTRY_CODE}
            type="tel"
            name="phone"
            autoComplete="tel-national"
            value={phone}
            disabled={loading}
            invalid={invalid === 'phone'}
            onChange={(e) => {
              setPhone(e.target.value);
              if (invalid === 'phone') clearError();
            }}
          />
          <BrainField
            id="login-code"
            label={tt.phoneOtpLabel}
            type="text"
            name="code"
            inputMode="numeric"
            maxLength={6}
            autoComplete="one-time-code"
            placeholder={tt.phoneOtpPlaceholder}
            value={code}
            disabled={loading}
            invalid={invalid === 'code'}
            onChange={(e) => {
              setCode(e.target.value.replace(/\D/g, ''));
              if (invalid === 'code') clearError();
            }}
            action={
              <button
                type="button"
                data-testid="BrainLoginSendCode"
                className="brain-field-action"
                disabled={countdown > 0 || sending || loading}
                onClick={handleSendCode}
              >
                {sendLabel}
              </button>
            }
          />
        </>
      ) : (
        <>
          <BrainField
            id="login-email"
            label={tt.email}
            type="email"
            name="email"
            autoComplete="email"
            value={email}
            disabled={loading}
            invalid={invalid === 'email'}
            onChange={(e) => {
              setEmail(e.target.value);
              if (invalid === 'email') clearError();
            }}
          />
          <BrainField
            id="login-password"
            label={tt.password}
            type="password"
            name="password"
            autoComplete="current-password"
            value={password}
            disabled={loading}
            invalid={invalid === 'password'}
            onChange={(e) => {
              setPassword(e.target.value);
              if (invalid === 'password') clearError();
            }}
          />
        </>
      )}

      {error && (
        <p className="brain-error" role="alert">
          {error}
        </p>
      )}

      <BrainButton type="submit" arrow loading={loading}>
        {tt.button}
      </BrainButton>
    </form>
  );
}
