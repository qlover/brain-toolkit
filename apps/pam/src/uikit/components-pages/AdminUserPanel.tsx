'use client';

import { ArrowRightOnRectangleIcon } from '@heroicons/react/24/outline';
import { clsx } from 'clsx';
import { useLocale } from 'next-intl';
import { useCallback, useEffect, useState } from 'react';
import { LocaleLink } from '@/uikit/components/LocaleLink';
import { useI18nMapping } from '@/uikit/hook/useI18nMapping';
import { useIOC } from '@/uikit/hook/useIOC';
import { useUserAuth } from '@/uikit/hook/useUserAuth';
import { useWarnTranslations } from '@/uikit/hook/useWarnTranslations';
import {
  COMMON_LOGOUT_DIALOG_CONTENT,
  COMMON_LOGOUT_DIALOG_TITLE,
  COMMON_SIGNED_IN_AS,
  COMMON_USER_AUTH_FAILED_GO_TO_LOGIN
} from '@config/i18n-identifier/common/common';
import { I } from '@config/ioc-identifiter';
import { ROUTE_LOGIN } from '@config/route';

function emailInitial(email: string): string {
  const local = email.split('@')[0]?.trim();
  return (local?.[0] ?? '?').toUpperCase();
}

function shortUserId(id: string): string {
  if (id.length <= 12) {
    return id;
  }
  return `${id.slice(0, 8)}…`;
}

export function AdminUserPanel({
  collapsed = false
}: {
  /** Desktop sidebar collapsed to icon rail. */
  collapsed?: boolean;
}) {
  const locale = useLocale();
  const t = useWarnTranslations();
  const dialogHandler = useIOC(I.DialogHandler);
  const userService = useIOC(I.UserServiceInterface);
  const routerService = useIOC(I.RouterServiceInterface);
  const { success, loading, user } = useUserAuth();

  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
  }, []);

  const logoutTt = useI18nMapping({
    title: COMMON_LOGOUT_DIALOG_TITLE,
    content: COMMON_LOGOUT_DIALOG_CONTENT
  });

  const onLogout = useCallback(() => {
    dialogHandler.confirm({
      title: logoutTt.title,
      content: logoutTt.content,
      onOk: async () => {
        await userService.logout();
        routerService.gotoLogin();
      }
    });
  }, [dialogHandler, logoutTt, userService, routerService]);

  if (!mounted || loading) {
    return (
      <div
        data-testid="AdminUserPanel"
        className={clsx('p-3', collapsed && 'flex justify-center')}
      >
        <div
          className="h-10 w-10 animate-pulse rounded-full bg-elevated"
          aria-hidden
        />
      </div>
    );
  }

  if (!success || !user) {
    return (
      <div data-testid="AdminUserPanel" className="p-3">
        <LocaleLink
          href={ROUTE_LOGIN}
          locale={locale}
          className="flex w-full items-center justify-center rounded-lg border border-primary-border bg-elevated px-3 py-2 text-sm font-medium text-primary-text transition hover:bg-primary touch-manipulation"
        >
          {t(COMMON_USER_AUTH_FAILED_GO_TO_LOGIN)}
        </LocaleLink>
      </div>
    );
  }

  const email = user.email?.trim() ?? '';
  const displayName = email || shortUserId(user.id);
  const signedInLabel = t(COMMON_SIGNED_IN_AS);

  if (collapsed) {
    return (
      <div data-testid="AdminUserPanel" className="flex justify-center p-2">
        <button
          type="button"
          title={`${signedInLabel} ${displayName}`}
          aria-label={`${signedInLabel} ${displayName}`}
          onClick={onLogout}
          className="inline-flex h-10 w-10 cursor-pointer items-center justify-center rounded-full bg-brand/10 text-sm font-semibold text-brand transition hover:bg-brand/15 touch-manipulation"
        >
          {emailInitial(displayName)}
        </button>
      </div>
    );
  }

  return (
    <div data-testid="AdminUserPanel" className="p-3">
      <div className="flex items-start gap-3 rounded-xl bg-elevated/60 p-3">
        <span
          className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-brand/10 text-sm font-semibold text-brand"
          aria-hidden
        >
          {emailInitial(displayName)}
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-[11px] font-medium uppercase tracking-wide text-tertiary-text">
            {signedInLabel}
          </p>
          <p
            className="truncate text-sm font-medium text-primary-text"
            title={displayName}
          >
            {displayName}
          </p>
          {email ? (
            <p
              className="mt-0.5 truncate font-mono text-[11px] text-tertiary-text"
              title={user.id}
            >
              {shortUserId(user.id)}
            </p>
          ) : null}
        </div>
      </div>
      <button
        type="button"
        onClick={onLogout}
        className="mt-2 inline-flex w-full cursor-pointer items-center justify-center gap-2 rounded-lg border border-primary-border px-3 py-2 text-sm font-medium text-secondary-text transition hover:bg-elevated hover:text-primary-text touch-manipulation"
      >
        <ArrowRightOnRectangleIcon className="h-4 w-4 shrink-0" aria-hidden />
        {logoutTt.title}
      </button>
    </div>
  );
}
