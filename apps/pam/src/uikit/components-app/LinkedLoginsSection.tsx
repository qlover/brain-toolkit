'use client';

import { useLocale } from 'next-intl';
import { useEffect, useState } from 'react';

import { AppUserGateway } from '@/impls/AppUserGateway';
import { formatPAMProjectTimestamp } from '@/uikit/components/pam/PAMProjectDisplayUtil';
import { useIOC } from '@/uikit/hook/useIOC';
import type {
  PamLinkedLogin,
  PamLinkedLoginProvider
} from '@schemas/PamUserSchema';

const PROVIDER_LABELS: Record<PamLinkedLoginProvider, string> = {
  brain: 'Brain',
  github: 'GitHub',
  google: 'Google'
};

export function LinkedLoginsSection(props: {
  labels: {
    title: string;
    empty: string;
    linked: string;
    lastLogin: string;
    error: string;
  };
}) {
  const { labels } = props;
  const gateway = useIOC(AppUserGateway);
  const locale = useLocale();
  const [items, setItems] = useState<PamLinkedLogin[] | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    const controller = new AbortController();
    gateway
      .fetchLinkedLogins({ signal: controller.signal })
      .then(setItems)
      .catch(() => {
        if (!controller.signal.aborted) {
          setFailed(true);
        }
      });
    return () => controller.abort();
  }, [gateway]);

  return (
    <div
      data-testid="LinkedLoginsSection"
      className="mt-5 border-t border-primary-border pt-4"
    >
      <h3 className="mb-3 text-sm font-semibold text-primary-text">
        {labels.title}
      </h3>
      {failed ? (
        <p className="text-sm text-(--fe-color-error)">{labels.error}</p>
      ) : items === null ? (
        <div className="h-4 w-2/3 max-w-xs animate-pulse rounded bg-elevated" />
      ) : items.length === 0 ? (
        <p className="text-sm text-secondary-text">{labels.empty}</p>
      ) : (
        <dl className="space-y-3">
          {items.map((item) => {
            const lastLogin = formatPAMProjectTimestamp(
              item.last_login_at,
              locale
            );
            return (
              <div
                data-testid="LinkedLoginsSection"
                key={`${item.provider}:${item.env ?? ''}:${item.account ?? ''}:${item.linked_at ?? ''}`}
                className="flex flex-col gap-1 sm:flex-row sm:items-baseline sm:gap-4"
              >
                <dt className="w-28 shrink-0 text-sm text-secondary-text">
                  {item.env
                    ? `${PROVIDER_LABELS[item.provider]} · ${item.env}`
                    : PROVIDER_LABELS[item.provider]}
                </dt>
                <dd className="min-w-0 flex-1 text-sm font-medium text-primary-text">
                  <span className="break-all">
                    {item.account
                      ? `${item.account} · ${labels.linked}`
                      : labels.linked}
                  </span>
                  {lastLogin ? (
                    <span className="ml-2 text-xs font-normal text-secondary-text">
                      {labels.lastLogin} {lastLogin}
                    </span>
                  ) : null}
                </dd>
              </div>
            );
          })}
        </dl>
      )}
    </div>
  );
}
