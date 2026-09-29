'use client';

import {
  OAuthAuthorizeCard as KitOAuthAuthorizeCard,
  type OAuthAuthorizeAccount,
  type OAuthAuthorizeConsentPayload
} from '@brain-toolkit/next-app-kit/client';
import { useCallback } from 'react';
import { AppUserGateway } from '@/impls/AppUserGateway';
import { useIOC } from '@/uikit/hook/useIOC';
import type { OAuthAuthorizeI18nInterface } from '@config/i18n-mapping/OAuthAuthorizeI18n';
import { resolveScopeLabel } from '@config/i18n-mapping/OAuthAuthorizeI18n';
import type { OAuthAuthorizePageData } from '@qlover/oauth-wrapper';

export type { OAuthAuthorizeAccount };

type ConsentRequest = Parameters<AppUserGateway['submitOAuthConsent']>[0];

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

  const scopeLabel = useCallback(
    (scope: string) => resolveScopeLabel(tt, scope),
    [tt]
  );
  const submitConsent = useCallback(
    (payload: OAuthAuthorizeConsentPayload) =>
      userGateway.submitOAuthConsent(payload as ConsentRequest),
    [userGateway]
  );
  const logout = useCallback(() => userGateway.logout(), [userGateway]);

  return (
    <KitOAuthAuthorizeCard
      tt={tt}
      authorizeData={authorizeData}
      account={account}
      switchAccountHref={switchAccountHref}
      scopeLabel={scopeLabel}
      submitConsent={submitConsent}
      logout={logout}
    />
  );
}
