'use client';

import {
  CheckIcon,
  ChevronDownIcon,
  ExclamationCircleIcon,
  InformationCircleIcon,
  LockClosedIcon
} from '@heroicons/react/24/outline';
import { useState } from 'react';
import { AppUserGateway } from '@/impls/AppUserGateway';
import { BrainAvatar } from '@/uikit/components/brain/BrainAvatar';
import { BrainButton } from '@/uikit/components/brain/BrainButton';
import { BrainModal } from '@/uikit/components/brain/BrainModal';
import { BrainSwitch } from '@/uikit/components/brain/BrainSwitch';
import { useIOC } from '@/uikit/hook/useIOC';
import type { OAuthAuthorizeI18nInterface } from '@config/i18n-mapping/OAuthAuthorizeI18n';
import { resolveScopeLabel } from '@config/i18n-mapping/OAuthAuthorizeI18n';
import type { OAuthAuthorizePageData } from '@qlover/oauth-wrapper';

export interface OAuthAuthorizeAccount {
  name?: string | null;
  email?: string | null;
  phone?: string | null;
}

export interface OAuthAuthorizeCardProps {
  tt: OAuthAuthorizeI18nInterface;
  authorizeData: OAuthAuthorizePageData;
  account?: OAuthAuthorizeAccount | null;
  /** Login URL that returns to this authorize request after sign-in. */
  switchAccountHref?: string;
}

export function OAuthAuthorizeCard({
  tt,
  authorizeData,
  account,
  switchAccountHref
}: OAuthAuthorizeCardProps) {
  const userGateway = useIOC(AppUserGateway);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [trust, setTrust] = useState(false);
  const [loading, setLoading] = useState(false);
  const [denyOpen, setDenyOpen] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const accountPrimary =
    account?.name?.trim() || account?.email || account?.phone || '';
  const accountSecondary = [account?.email, account?.phone]
    .filter((value): value is string => !!value && value !== accountPrimary)
    .join(' · ');

  const submit = async (action: 'allow' | 'deny') => {
    setLoading(true);
    setErrorMessage(null);

    try {
      const redirectUrl = await userGateway.submitOAuthConsent({
        action,
        client_id: authorizeData.clientId,
        redirect_uri: authorizeData.redirectUri,
        scope: authorizeData.scopes.join(' ') || undefined,
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
  };

  const handleSwitchAccount = async () => {
    if (!switchAccountHref) return;
    setLoading(true);
    try {
      await userGateway.logout();
    } finally {
      window.location.assign(switchAccountHref);
    }
  };

  return (
    <div data-testid="OAuthAuthorizeCard" className="brain-card wide">
      <h1 className="brain-title">{tt.heading}</h1>
      <p className="brain-desc">
        {authorizeData.clientName} {tt.subtitle}
      </p>

      <div className="brain-inner-card">
        <div className="brain-row">
          <div className="brain-who">
            <BrainAvatar
              name={authorizeData.clientName}
              src={authorizeData.logoUri}
            />
            <div className="min-w-0">
              <div className="brain-name">{authorizeData.clientName}</div>
              {authorizeData.clientUri && (
                <div className="brain-sub">{authorizeData.clientUri}</div>
              )}
            </div>
          </div>
          <span className="brain-pill">{tt.oauthBadge}</span>
        </div>
      </div>

      {accountPrimary && (
        <div className="brain-section">
          <div className="brain-section-head">
            <span className="brain-label">{tt.accountLabel}</span>
          </div>
          <div className="brain-row">
            <div className="brain-who">
              <BrainAvatar name={accountPrimary} size="sm" />
              <div className="min-w-0">
                <div className="brain-name" style={{ fontSize: 14 }}>
                  {accountPrimary}
                </div>
                {accountSecondary && (
                  <div className="brain-sub">{accountSecondary}</div>
                )}
              </div>
            </div>
            {switchAccountHref && (
              <button
                type="button"
                data-testid="OAuthAuthorizeSwitchAccount"
                className="brain-link accent"
                disabled={loading}
                onClick={() => void handleSwitchAccount()}
              >
                {tt.switchAccount}
              </button>
            )}
          </div>
        </div>
      )}

      <div className="brain-section">
        <div className="brain-section-head">
          <span className="brain-label">{tt.permissionsLabel}</span>
          <button
            type="button"
            className="brain-link"
            aria-expanded={detailsOpen}
            onClick={() => setDetailsOpen((open) => !open)}
          >
            {tt.details}
            <ChevronDownIcon
              className="brain-toggle-chevron"
              data-open={detailsOpen}
            />
          </button>
        </div>
        <ul className="brain-perm-list">
          {authorizeData.scopes.map((scope) => (
            <li data-testid="OAuthAuthorizeCard" key={scope}>
              <span className="brain-check" aria-hidden>
                <CheckIcon strokeWidth={2.5} />
              </span>
              <span>{resolveScopeLabel(tt, scope)}</span>
            </li>
          ))}
        </ul>
        {detailsOpen && (
          <div className="brain-note" style={{ marginTop: 14 }}>
            <LockClosedIcon />
            <span>{tt.extraPermNote}</span>
          </div>
        )}
      </div>

      <div className="brain-section">
        <label className="brain-trust">
          <BrainSwitch
            data-testid="OAuthAuthorizeTrust"
            checked={trust}
            disabled={loading}
            onChange={(event) => setTrust(event.target.checked)}
          />
          <span>{tt.trustOption}</span>
          <span className="brain-hint" title={tt.trustTooltip}>
            <InformationCircleIcon />
          </span>
        </label>
      </div>

      {errorMessage && (
        <div
          role="alert"
          className="brain-note danger"
          style={{ marginTop: 20 }}
        >
          <ExclamationCircleIcon />
          <span>{errorMessage}</span>
        </div>
      )}

      <div className="brain-actions">
        <BrainButton
          type="button"
          variant="ghost"
          data-testid="OAuthAuthorizeDeny"
          disabled={loading}
          onClick={() => setDenyOpen(true)}
        >
          {tt.deny}
        </BrainButton>
        <BrainButton
          type="button"
          arrow
          data-testid="OAuthAuthorizeAllow"
          loading={loading}
          onClick={() => void submit('allow')}
        >
          {tt.allow}
        </BrainButton>
      </div>

      <p className="brain-safety">{tt.safetyNote}</p>

      <BrainModal
        open={denyOpen}
        title={tt.denyTitle}
        onClose={() => setDenyOpen(false)}
        data-testid="OAuthAuthorizeDenyModal"
      >
        <p className="brain-desc" style={{ marginTop: 0 }}>
          {tt.denyConfirm}
        </p>
        <div className="brain-modal-actions">
          <BrainButton
            type="button"
            variant="ghost"
            size="sm"
            auto
            onClick={() => setDenyOpen(false)}
          >
            {tt.cancel}
          </BrainButton>
          <BrainButton
            type="button"
            variant="danger"
            size="sm"
            auto
            onClick={() => {
              setDenyOpen(false);
              void submit('deny');
            }}
          >
            {tt.deny}
          </BrainButton>
        </div>
      </BrainModal>
    </div>
  );
}
