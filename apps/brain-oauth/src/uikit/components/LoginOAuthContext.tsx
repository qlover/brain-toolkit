'use client';

import { useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { AppUserGateway } from '@/impls/AppUserGateway';
import { useIOC } from '@/uikit/hook/useIOC';
import { URLParamsKeys } from '@config/common';
import type { LoginI18nInterface } from '@config/i18n-mapping/loginI18n';
import { ROUTE_OAUTH_AUTHORIZE } from '@config/route';
import type { OAuthAuthorizeClientPreview } from '@interfaces/UserServiceInterface';
import { BrainAvatar } from './brain/BrainAvatar';

/** Authorize query string when `returnTo` points at the authorize page. */
function authorizeQueryOf(returnTo: string | null): string | null {
  if (!returnTo) return null;
  try {
    const url = new URL(returnTo, window.location.origin);
    if (url.origin !== window.location.origin) return null;
    if (!url.pathname.endsWith(ROUTE_OAUTH_AUTHORIZE)) return null;
    return url.search.slice(1) || null;
  } catch {
    return null;
  }
}

/** Shows which app is asking when sign-in was triggered by an authorize request. */
export function LoginOAuthContext({ tt }: { tt: LoginI18nInterface }) {
  const searchParams = useSearchParams();
  const userGateway = useIOC(AppUserGateway);
  const [client, setClient] = useState<OAuthAuthorizeClientPreview | null>(
    null
  );

  const returnTo =
    URLParamsKeys.returnTo
      .map((key) => searchParams?.get(key))
      .find((value) => !!value) ?? null;

  useEffect(() => {
    const query = authorizeQueryOf(returnTo);
    if (!query) return;

    let cancelled = false;
    userGateway
      .previewAuthorizeClient(query)
      .then((preview) => {
        if (!cancelled) setClient(preview);
      })
      .catch(() => undefined);
    return () => {
      cancelled = true;
    };
  }, [returnTo, userGateway]);

  if (!client) return null;

  return (
    <div data-testid="LoginOAuthContext" className="brain-inner-card ctx">
      <div className="brain-row">
        <div className="brain-who">
          <BrainAvatar name={client.clientName} src={client.logoUri} />
          <div className="min-w-0">
            <div className="brain-name">{client.clientName}</div>
            <div className="brain-sub">{tt.ctxSub}</div>
          </div>
        </div>
        <span className="brain-pill">{tt.ctxPill}</span>
      </div>
    </div>
  );
}
