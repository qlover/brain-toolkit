'use client';

import { useLocale } from 'next-intl';
import { useSearchParams } from 'next/navigation';
import { useCallback, useState, type ComponentType, type SVGProps } from 'react';
import { AppUserGateway } from '@/impls/AppUserGateway';
import { EmailOTPForm } from '@/uikit/components/EmailOTPForm';
import { GithubIcon, GoogleIcon } from '@/uikit/components/icons';
import { LoginForm } from '@/uikit/components/LoginForm';
import { PhoneLoginForm } from '@/uikit/components/PhoneLoginForm';
import type { LoginProviderType } from '@config/common';
import { URLParamsKeys, loginProviders } from '@config/common';
import type { LoginI18nInterface } from '@config/i18n-mapping/loginI18n';
import { useIOC } from '../hook/useIOC';

type LoginTab = 'email' | 'phone';
type EmailMode = 'password' | 'otp';
type IconComponent = ComponentType<SVGProps<SVGSVGElement>>;

type ProvidersItem = {
  key: LoginProviderType;
  provider: LoginProviderType;
  titleI18nMapKey: keyof LoginI18nInterface;
  disabled: boolean;
  Icon: IconComponent;
};

const providersIcons: Record<
  typeof loginProviders.GitHub | typeof loginProviders.Google,
  IconComponent
> = {
  [loginProviders.GitHub]: GithubIcon,
  [loginProviders.Google]: GoogleIcon
};

/** GitHub / Google only — Brain SSO buttons are dedicated. */
const providersItems: ProvidersItem[] = [
  loginProviders.GitHub,
  loginProviders.Google
].map((provider) => ({
  key: provider,
  disabled: provider === loginProviders.Google,
  provider,
  titleI18nMapKey: ('provider' + provider) as keyof LoginI18nInterface,
  Icon: providersIcons[provider]
}));

function resolveReturnTo(
  searchParams: URLSearchParams | null | undefined
): string {
  if (!searchParams) {
    return '/';
  }
  for (const key of URLParamsKeys.returnTo) {
    const value = searchParams.get(key);
    if (value?.startsWith('/') && !value.startsWith('//')) {
      return value;
    }
  }
  return '/';
}

/**
 * PAM login entry: Brain PKCE (direct brain-oauth), GitHub/Google, email.
 * Supabase `custom:brain` is temporarily disabled (localhost Brain AS).
 */
export function LoginTabSwitch({ tt }: { tt: LoginI18nInterface }) {
  const userGateway = useIOC(AppUserGateway);
  const locale = useLocale();
  const searchParams = useSearchParams();
  const [tab, setTab] = useState<LoginTab>('email');
  const [emailMode, setEmailMode] = useState<EmailMode>('otp');
  const [providerLogining, setProviderLogining] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const phoneLoginEnabled = false;
  /** Supabase custom:brain — disabled while Brain only reachable on localhost. */
  const brainSupabaseEnabled = false;

  const tabBaseClass =
    'flex-1 py-2.5 text-sm font-medium text-center transition-colors cursor-pointer border-b-2 outline-none disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:text-secondary-text disabled:hover:border-transparent';
  const tabActiveClass = 'border-brand text-primary-text';
  const tabInactiveClass =
    'border-transparent text-secondary-text hover:text-primary-text hover:border-primary-border';

  const onLoginWithProvider = useCallback(
    (provider: LoginProviderType) => {
      setProviderLogining(true);
      setError(null);
      userGateway
        .loginWithProvider({ provider })
        .then((result) => {
          if (result.providerUrl) {
            window.location.assign(result.providerUrl);
          }
        })
        .catch((err) => {
          setProviderLogining(false);
          setError(
            err instanceof Error ? err.message : 'Failed to login with provider'
          );
        });
    },
    [userGateway]
  );

  const onLoginWithBrainPkce = useCallback(() => {
    setProviderLogining(true);
    setError(null);
    userGateway
      .loginWithBrainPkce({
        locale,
        returnTo: resolveReturnTo(searchParams)
      })
      .then((result) => {
        if (result.providerUrl) {
          window.location.assign(result.providerUrl);
        }
      })
      .catch((err) => {
        setProviderLogining(false);
        setError(
          err instanceof Error ? err.message : 'Failed to start Brain PKCE login'
        );
      });
  }, [userGateway, locale, searchParams]);

  return (
    <div data-testid="LoginTabSwitch" className="w-full">
      {error && (
        <div
          role="alert"
          className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-500 dark:border-red-800 dark:bg-red-950/30"
        >
          {error}
        </div>
      )}

      <button
        type="button"
        data-testid="LoginWithBrainPkce"
        disabled={providerLogining}
        onClick={onLoginWithBrainPkce}
        title={tt.providerBrainPkce}
        className="mb-6 flex min-h-12 w-full items-center justify-center gap-2 rounded-xl border border-brand/40 bg-brand/10 px-4 py-3 text-sm font-semibold text-brand shadow-sm transition-colors hover:bg-brand/15 focus:outline-none focus:ring-2 focus:ring-brand focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-70"
      >
        <span>{tt.providerBrainPkce}</span>
      </button>

      <button
        type="button"
        data-testid="LoginWithBrain"
        disabled={!brainSupabaseEnabled || providerLogining}
        onClick={() => onLoginWithProvider(loginProviders.Brain)}
        title={tt.providerBrain}
        className="mb-6 flex min-h-12 w-full items-center justify-center gap-2 rounded-xl border border-primary-border bg-elevated px-4 py-3 text-sm font-semibold text-secondary-text shadow-sm transition-colors hover:bg-elevated/80 focus:outline-none focus:ring-2 focus:ring-primary-border focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
      >
        <span>{tt.providerBrain}</span>
      </button>

      {providersItems.map(
        ({ key, disabled, provider, titleI18nMapKey, Icon }) => (
          <button
            data-testid={'LoginWith' + key}
            key={key}
            disabled={disabled || providerLogining}
            onClick={() => onLoginWithProvider(provider)}
            title={tt[titleI18nMapKey]}
            className="mb-6 flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-[#24292e] px-4 py-3 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-[#2c3137] focus:outline-none focus:ring-2 focus:ring-[#24292e] focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-70"
          >
            <Icon className="h-5 w-5" />
            <span>{tt[titleI18nMapKey]}</span>
          </button>
        )
      )}

      <div className="relative mb-6">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-primary-border"></div>
        </div>
        <div className="relative flex justify-center text-xs">
          <span className="bg-bg-container px-2 text-tertiary-text">
            {tt.continueWith}
          </span>
        </div>
      </div>

      <div className="mb-6 flex border-b border-primary-border" role="tablist">
        <button
          type="button"
          className={`${tabBaseClass} ${tab === 'email' ? tabActiveClass : tabInactiveClass}`}
          onClick={() => setTab('email')}
          aria-selected={tab === 'email'}
          role="tab"
        >
          {tt.tabEmail}
        </button>
        <button
          type="button"
          className={`${tabBaseClass} ${tab === 'phone' && phoneLoginEnabled ? tabActiveClass : tabInactiveClass}`}
          onClick={() => {
            if (phoneLoginEnabled) setTab('phone');
          }}
          disabled={!phoneLoginEnabled}
          aria-disabled={!phoneLoginEnabled}
          aria-selected={tab === 'phone' && phoneLoginEnabled}
          title={phoneLoginEnabled ? undefined : tt.tabPhoneDisabled}
          role="tab"
        >
          {tt.tabPhone}
        </button>
      </div>

      {tab === 'email' &&
        (emailMode === 'otp' ? (
          <>
            <EmailOTPForm tt={tt} />
            <p className="mt-4 text-center">
              <button
                type="button"
                onClick={() => setEmailMode('password')}
                className="text-brand text-sm hover:underline"
              >
                {tt.switchToPassword}
              </button>
            </p>
          </>
        ) : (
          <>
            <LoginForm tt={tt} />
            <p className="mt-4 text-center">
              <button
                type="button"
                onClick={() => setEmailMode('otp')}
                className="text-brand text-sm hover:underline"
              >
                {tt.switchToOtp}
              </button>
            </p>
          </>
        ))}

      {phoneLoginEnabled && tab === 'phone' && <PhoneLoginForm tt={tt} />}
    </div>
  );
}
