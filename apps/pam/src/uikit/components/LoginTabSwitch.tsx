'use client';

import {
  BrainIcon,
  GithubIcon,
  GoogleIcon
} from '@brain-toolkit/next-app-kit/client';
import { ArrowRightIcon } from '@heroicons/react/24/outline';
import { useStrictEffect } from '@qlover/next-kit/client';
import { useSearchParams } from 'next/navigation';
import { useLocale } from 'next-intl';
import { useCallback, useState, type ReactNode } from 'react';
import { AppUserGateway } from '@/impls/AppUserGateway';
import { fetchPublicConfig } from '@/impls/fetchPublicConfig';
import { EmailOTPForm } from '@/uikit/components/EmailOTPForm';
import { LoginForm } from '@/uikit/components/LoginForm';
import { PhoneLoginForm } from '@/uikit/components/PhoneLoginForm';
import type { LoginProviderType } from '@config/common';
import { URLParamsKeys, loginProviders } from '@config/common';
import type { LoginI18nInterface } from '@config/i18n-mapping/loginI18n';
import { I } from '@config/ioc-identifiter';
import type { PamPublicConfig } from '@schemas/PamSiteSettingsSchema';
import type { SeedSrcConfigInterface } from '@interfaces/SeedConfigInterface';
import { useIOC } from '../hook/useIOC';

type LoginTab = 'email' | 'phone';
type EmailMode = 'password' | 'otp';

const providerButtonBaseClass =
  'flex w-full cursor-pointer items-center justify-center gap-2 px-4 py-3 text-sm shadow-sm transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:pointer-events-none disabled:opacity-50';

const providerOutlineClass = `${providerButtonBaseClass} min-h-12 rounded-xl border border-primary-border bg-primary font-semibold text-primary-text hover:bg-elevated focus:ring-brand`;

/** Brain's own primary button: inverse pill + arrow (see brain-oauth prototypes). */
const providerButtonClass = {
  brain: `${providerButtonBaseClass} group min-h-13 rounded-full bg-primary-text font-medium text-primary hover:opacity-90 focus:ring-primary-text`,
  github: providerOutlineClass,
  google: providerOutlineClass
} as const;

function BrainArrow() {
  return (
    <ArrowRightIcon className="h-4 w-4 shrink-0 transition-transform duration-300 group-hover:translate-x-1" />
  );
}

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

/** Full-width shell: keeps buttons aligned; carries title + disabled cursor. */
function ProviderButtonRow({
  title,
  disabled,
  children
}: {
  title: string;
  disabled?: boolean;
  children: ReactNode;
}) {
  return (
    <div
      data-testid="ProviderButtonRow"
      className={`mb-3 w-full ${disabled ? 'cursor-not-allowed' : ''}`}
      title={title}
    >
      {children}
    </div>
  );
}

/**
 * PAM login entry: Brain (Supabase SSO), Brain PKCE, GitHub/Google, email,
 * phone. Methods turned off in site settings are not rendered.
 */
export function LoginTabSwitch({ tt }: { tt: LoginI18nInterface }) {
  const userGateway = useIOC(AppUserGateway);
  const appConfig = useIOC(I.AppConfig) as SeedSrcConfigInterface;
  const locale = useLocale();
  const searchParams = useSearchParams();
  const [tab, setTab] = useState<LoginTab>('email');
  const [emailMode, setEmailMode] = useState<EmailMode>('otp');
  const [email, setEmail] = useState(appConfig.testLoginEmail ?? '');
  const [emailLinkSent, setEmailLinkSent] = useState(false);
  const [providerLogining, setProviderLogining] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [publicConfig, setPublicConfig] = useState<PamPublicConfig | null>(
    null
  );

  useStrictEffect(() => {
    void fetchPublicConfig().then(setPublicConfig);
  }, []);

  const phoneLoginEnabled = publicConfig?.auth.phoneLoginEnabled ?? false;
  const brainSupabaseEnabled = publicConfig?.auth.brainSupabaseEnabled ?? false;
  const brainPkceEnabled = publicConfig?.auth.brainPkceEnabled ?? false;
  const googleEnabled = publicConfig?.auth.googleOauthEnabled ?? false;
  const passwordResetEnabled = publicConfig?.auth.passwordResetEnabled ?? false;

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
          err instanceof Error
            ? err.message
            : 'Failed to start Brain PKCE login'
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

      {brainSupabaseEnabled && (
        <ProviderButtonRow
          title={tt.providerBrainTooltip}
          disabled={providerLogining}
        >
          <button
            type="button"
            data-testid="LoginWithBrain"
            disabled={providerLogining}
            onClick={() => onLoginWithProvider(loginProviders.Brain)}
            aria-label={tt.providerBrain}
            className={providerButtonClass.brain}
          >
            <BrainIcon className="h-5 w-5 shrink-0" />
            <span>{tt.providerBrain}</span>
            <BrainArrow />
          </button>
        </ProviderButtonRow>
      )}

      {brainPkceEnabled && (
        <ProviderButtonRow
          title={tt.providerBrainPkceTooltip}
          disabled={providerLogining}
        >
          <button
            type="button"
            data-testid="LoginWithBrainPkce"
            disabled={providerLogining}
            onClick={onLoginWithBrainPkce}
            aria-label={tt.providerBrainPkce}
            className={providerButtonClass.brain}
          >
            <BrainIcon className="h-5 w-5 shrink-0" />
            <span>{tt.providerBrainPkce}</span>
            <BrainArrow />
          </button>
        </ProviderButtonRow>
      )}

      <ProviderButtonRow title={tt.providerGitHub}>
        <button
          type="button"
          data-testid="LoginWithGitHub"
          disabled={providerLogining}
          onClick={() => onLoginWithProvider(loginProviders.GitHub)}
          aria-label={tt.providerGitHub}
          className={providerButtonClass.github}
        >
          <GithubIcon className="h-5 w-5 shrink-0" />
          <span>{tt.providerGitHub}</span>
        </button>
      </ProviderButtonRow>

      {googleEnabled && (
        <ProviderButtonRow
          title={tt.providerGoogle}
          disabled={providerLogining}
        >
          <button
            type="button"
            data-testid="LoginWithGoogle"
            disabled={providerLogining}
            onClick={() => onLoginWithProvider(loginProviders.Google)}
            aria-label={tt.providerGoogle}
            className={providerButtonClass.google}
          >
            <GoogleIcon className="h-5 w-5 shrink-0" />
            <span>{tt.providerGoogle}</span>
          </button>
        </ProviderButtonRow>
      )}

      <div className="relative mt-6 mb-6">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-primary-border"></div>
        </div>
        <div className="relative flex justify-center text-xs">
          <span className="bg-bg-container px-2 text-tertiary-text">
            {tt.continueWith}
          </span>
        </div>
      </div>

      {phoneLoginEnabled && (
        <div
          className="mb-6 flex border-b border-primary-border"
          role="tablist"
        >
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
            className={`${tabBaseClass} ${tab === 'phone' ? tabActiveClass : tabInactiveClass}`}
            onClick={() => setTab('phone')}
            aria-selected={tab === 'phone'}
            role="tab"
          >
            {tt.tabPhone}
          </button>
        </div>
      )}

      {(tab === 'email' || !phoneLoginEnabled) &&
        (emailMode === 'otp' ? (
          <>
            <EmailOTPForm
              tt={tt}
              email={email}
              onEmailChange={setEmail}
              onSentChange={setEmailLinkSent}
            />
            {!emailLinkSent && (
              <p className="mt-4 text-center">
                <button
                  type="button"
                  onClick={() => setEmailMode('password')}
                  className="text-brand text-sm hover:underline"
                >
                  {tt.switchToPassword}
                </button>
              </p>
            )}
          </>
        ) : (
          <>
            <LoginForm
              tt={tt}
              email={email}
              onEmailChange={setEmail}
              forgotPasswordEnabled={passwordResetEnabled}
            />
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

      {phoneLoginEnabled && tab === 'phone' && (
        <PhoneLoginForm
          tt={tt}
          memoryOtp={publicConfig?.auth.phoneOtpProvider !== 'aliyun'}
        />
      )}
    </div>
  );
}
