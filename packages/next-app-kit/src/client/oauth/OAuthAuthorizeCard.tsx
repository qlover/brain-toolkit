'use client';

import {
  ArrowPathIcon,
  CheckCircleIcon,
  ChevronDownIcon,
  ExclamationCircleIcon,
  InformationCircleIcon,
  LockClosedIcon,
  QuestionMarkCircleIcon,
  Squares2X2Icon,
  UserCircleIcon
} from '@heroicons/react/24/outline';
import { clsx } from 'clsx';
import { useCallback, useMemo, useState } from 'react';

// Mobile stacks allow above deny. No flex-1 in the column layout: iOS Safari
// collapses flex-basis 0% items there and the buttons overlap.
const FOOTER_BUTTON_LAYOUT = 'w-full sm:w-auto sm:flex-1';

export interface OAuthAuthorizeCardText {
  readonly heading: string;
  readonly subtitle: string;
  readonly appLabel: string;
  readonly oauthBadge: string;
  readonly permissionsLabel: string;
  readonly extraPermNote: string;
  readonly trustOption: string;
  readonly trustTooltip: string;
  readonly safetyNote: string;
  readonly deny: string;
  readonly allow: string;
  readonly denyConfirm: string;
  readonly errorConsent: string;
  readonly accountLabel: string;
  readonly switchAccount: string;
}

/** Subset of oauth-wrapper `OAuthAuthorizePageData` rendered by the card. */
export interface OAuthAuthorizeCardData {
  readonly clientId: string;
  readonly clientName: string;
  readonly clientUri?: string | null;
  readonly logoUri?: string | null;
  readonly redirectUri: string;
  readonly scopes: readonly string[];
  readonly state?: string;
  readonly codeChallenge?: string;
  readonly codeChallengeMethod?: string;
}

export interface OAuthAuthorizeConsentPayload {
  action: 'allow' | 'deny';
  client_id: string;
  redirect_uri: string;
  scope?: string;
  state?: string;
  trust?: boolean;
  code_challenge?: string;
  code_challenge_method?: string;
}

export interface OAuthAuthorizeAccount {
  name?: string | null;
  email?: string | null;
  phone?: string | null;
}

export interface OAuthAuthorizeCardProps {
  readonly tt: OAuthAuthorizeCardText;
  readonly authorizeData: OAuthAuthorizeCardData;
  readonly account?: OAuthAuthorizeAccount | null;
  /** Login URL that returns to this authorize request after sign-in. */
  readonly switchAccountHref?: string;
  readonly scopeLabel: (scope: string) => string;
  /** Posts the consent and resolves to the client redirect URL. */
  readonly submitConsent: (
    payload: OAuthAuthorizeConsentPayload
  ) => Promise<string>;
  /** Ends the app session before switching account. */
  readonly logout: () => Promise<unknown>;
}

export function OAuthAuthorizeCard({
  tt,
  authorizeData,
  account,
  switchAccountHref,
  scopeLabel,
  submitConsent,
  logout
}: OAuthAuthorizeCardProps) {
  const [extraOpen, setExtraOpen] = useState(false);
  const [trust, setTrust] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const accountPrimary =
    account?.name?.trim() || account?.email || account?.phone || '';
  const accountSecondary = [account?.email, account?.phone]
    .filter((value): value is string => !!value && value !== accountPrimary)
    .join(' · ');

  const handleSwitchAccount = async () => {
    if (!switchAccountHref) {
      return;
    }
    setLoading(true);
    try {
      await logout();
    } finally {
      window.location.assign(switchAccountHref);
    }
  };

  const scopeLabels = useMemo(
    () =>
      authorizeData.scopes.map((scope) => ({
        scope,
        label: scopeLabel(scope)
      })),
    [authorizeData.scopes, scopeLabel]
  );

  const scopeParam = authorizeData.scopes.join(' ');

  const submit = useCallback(
    async (action: 'allow' | 'deny') => {
      setLoading(true);
      setErrorMessage(null);

      try {
        const redirectUrl = await submitConsent({
          action,
          client_id: authorizeData.clientId,
          redirect_uri: authorizeData.redirectUri,
          scope: scopeParam || undefined,
          state: authorizeData.state,
          trust: action === 'allow' ? trust : undefined,
          code_challenge: authorizeData.codeChallenge,
          code_challenge_method: authorizeData.codeChallengeMethod
        });

        window.location.assign(redirectUrl);
      } catch (err) {
        setErrorMessage(err instanceof Error ? err.message : tt.errorConsent);
        setLoading(false);
      }
    },
    [authorizeData, submitConsent, scopeParam, trust, tt.errorConsent]
  );

  const handleAllow = () => {
    void submit('allow');
  };

  const handleDeny = () => {
    if (!window.confirm(tt.denyConfirm)) {
      return;
    }
    void submit('deny');
  };

  return (
    <div
      data-testid="OAuthAuthorizeCard"
      className="max-w-lg w-full bg-primary rounded-2xl shadow-xl border border-primary-border overflow-hidden"
    >
      {errorMessage && (
        <div
          role="alert"
          className="mx-6 mt-4 bg-red-50 dark:bg-red-900/30 border-l-4 border-red-500 p-3 rounded text-sm text-red-700 dark:text-red-300"
        >
          <ExclamationCircleIcon className="mr-2 inline h-4 w-4" />
          {errorMessage}
        </div>
      )}

      <div className="p-6 border-b border-primary-border">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-full bg-brand/10 flex items-center justify-center text-brand text-xl overflow-hidden shrink-0">
            {authorizeData.logoUri ? (
              <img
                src={authorizeData.logoUri}
                alt=""
                className="w-full h-full object-cover"
              />
            ) : (
              <Squares2X2Icon className="h-6 w-6" />
            )}
          </div>
          <div>
            <h2 className="text-xl font-semibold text-primary-text">
              {tt.heading}
            </h2>
            <p className="text-sm text-secondary-text">{tt.subtitle}</p>
          </div>
        </div>
      </div>

      <div className="p-6 space-y-5">
        {accountPrimary && (
          <div
            data-testid="OAuthAuthorizeAccount"
            className="flex items-center gap-3 rounded-lg border border-brand/30 bg-brand/5 p-3"
          >
            <UserCircleIcon className="h-9 w-9 text-brand shrink-0" />
            <div className="min-w-0 flex-1">
              <p className="text-xs text-secondary-text">{tt.accountLabel}</p>
              <p className="font-semibold text-primary-text truncate">
                {accountPrimary}
              </p>
              {accountSecondary && (
                <p className="text-xs text-secondary-text truncate">
                  {accountSecondary}
                </p>
              )}
            </div>
            {switchAccountHref && (
              <button
                type="button"
                disabled={loading}
                onClick={handleSwitchAccount}
                className="text-xs text-brand hover:underline shrink-0 disabled:opacity-60"
              >
                {tt.switchAccount}
              </button>
            )}
          </div>
        )}

        <div className="bg-elevated rounded-lg p-4">
          <div className="flex justify-between items-start gap-3">
            <div className="min-w-0">
              <p className="text-xs text-secondary-text uppercase tracking-wide">
                {tt.appLabel}
              </p>
              <p className="font-semibold text-lg text-primary-text truncate">
                {authorizeData.clientName}
              </p>
              {authorizeData.clientUri && (
                <p className="text-sm text-secondary-text truncate">
                  {authorizeData.clientUri}
                </p>
              )}
            </div>
            <span className="bg-brand/10 text-brand text-xs px-2 py-1 rounded-full shrink-0">
              {tt.oauthBadge}
            </span>
          </div>
        </div>

        <div>
          <button
            type="button"
            className="flex w-full justify-between items-center cursor-pointer text-left"
            onClick={() => setExtraOpen((open) => !open)}
            aria-expanded={extraOpen}
          >
            <p className="text-sm font-medium flex items-center gap-1 text-primary-text">
              <LockClosedIcon className="h-4 w-4" />
              {tt.permissionsLabel}
            </p>
            <ChevronDownIcon
              className={clsx(
                'h-4 w-4 text-secondary-text transition-transform',
                extraOpen && 'rotate-180'
              )}
            />
          </button>
          <div className="mt-2 space-y-2 pl-1">
            {scopeLabels.map(({ scope, label }) => (
              <div
                data-testid="OAuthAuthorizeScope"
                key={scope}
                className="flex items-start gap-2"
              >
                <CheckCircleIcon className="h-4 w-4 text-green-500 mt-0.5 shrink-0" />
                <span className="text-sm text-primary-text">{label}</span>
              </div>
            ))}
          </div>
          <div
            hidden={!extraOpen}
            className="mt-2 pl-5 text-xs text-secondary-text border-l-2 border-brand/40"
          >
            <p>{tt.extraPermNote}</p>
          </div>
        </div>

        <div className="flex items-center justify-between pt-2 gap-2">
          <div className="flex items-center min-w-0">
            <input
              type="checkbox"
              id="trustCheckbox"
              checked={trust}
              onChange={(e) => setTrust(e.target.checked)}
              className="w-4 h-4 text-brand rounded focus:ring-brand shrink-0"
            />
            <label
              htmlFor="trustCheckbox"
              className="ml-2 text-sm text-primary-text"
            >
              {tt.trustOption}
            </label>
          </div>
          <QuestionMarkCircleIcon
            className="h-3 w-3 text-secondary-text shrink-0"
            title={tt.trustTooltip}
          />
        </div>

        <div className="bg-amber-50 dark:bg-amber-950/30 border-l-4 border-amber-500 p-3 rounded text-sm text-primary-text">
          <InformationCircleIcon className="mr-2 inline h-4 w-4 text-amber-600" />
          {tt.safetyNote}
        </div>
      </div>

      <div className="p-6 border-t border-primary-border bg-elevated flex flex-col-reverse gap-3 sm:flex-row">
        <button
          type="button"
          id="denyBtn"
          disabled={loading}
          onClick={handleDeny}
          className={`${FOOTER_BUTTON_LAYOUT} px-4 py-2.5 rounded-lg border border-primary-border hover:bg-secondary transition font-medium text-primary-text disabled:opacity-60`}
        >
          {tt.deny}
        </button>
        <button
          type="button"
          id="allowBtn"
          disabled={loading}
          onClick={handleAllow}
          className={`${FOOTER_BUTTON_LAYOUT} px-4 py-2.5 rounded-lg bg-brand text-on-brand hover:bg-brand-hover transition font-medium shadow-sm flex items-center justify-center gap-2 disabled:opacity-60`}
        >
          {tt.allow}
          {loading && <ArrowPathIcon className="h-4 w-4 animate-spin" />}
        </button>
      </div>
    </div>
  );
}
