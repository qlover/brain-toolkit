'use client';

/**
 * 邮箱魔法链接回调页，只负责交互，不在浏览器里创建 Supabase 客户端。
 *
 * implicit 链接把 session 放在 hash 里，旧 PKCE 链接仍带 `?code=`。
 * 解析后立刻清掉地址栏令牌，再 POST 到 /api/callback/email-login。
 * 本页跳过 /api/user/session 恢复，避免会话建立前去拉用户。
 */

import { useEffect, useState } from 'react';
import { useRouter } from '@/i18n/routing';
import type { UserService } from '@/impls/UserService';
import { useIOC } from '@/uikit/hook/useIOC';
import type { EmailOtpCallbackI18nInterface } from '@config/i18n-mapping/emailOtpCallbackI18n';
import { I } from '@config/ioc-identifiter';
import {
  API_CALLBACK_EMAIL_LOGIN,
  ROUTE_HOME,
  ROUTE_LOGIN
} from '@config/route';
import { EmailMagicLinkCallbackResolver } from './EmailMagicLinkCallbackResolver';

type CallbackStatus = 'authenticating' | 'establishing' | 'error';

interface EmailOtpCallbackClientProps {
  tt: EmailOtpCallbackI18nInterface;
}

export function EmailOtpCallbackClient({ tt }: EmailOtpCallbackClientProps) {
  const router = useRouter();
  const userService = useIOC(I.UserServiceInterface) as UserService;
  const [status, setStatus] = useState<CallbackStatus>('authenticating');

  const statusMessages: Record<CallbackStatus, string> = {
    authenticating: tt.authenticating,
    establishing: tt.establishing,
    error: tt.error
  };

  useEffect(() => {
    let cancelled = false;

    async function failToLogin(message?: string) {
      if (message) {
        console.error(message);
      }
      if (!cancelled) setStatus('error');
      router.replace(ROUTE_LOGIN);
    }

    async function handleCallback() {
      const resolver = new EmailMagicLinkCallbackResolver();
      const callback = resolver.resolve(
        window.location.search,
        window.location.hash
      );
      window.history.replaceState(
        null,
        '',
        resolver.clearCredentials(window.location.href)
      );

      if (callback.kind === 'error') {
        await failToLogin(`Supabase magic link error: ${callback.message}`);
        return;
      }
      if (callback.kind === 'missing') {
        await failToLogin('Missing email login credentials in callback URL');
        return;
      }

      const body =
        callback.kind === 'code'
          ? { code: callback.code }
          : {
              access_token: callback.accessToken,
              refresh_token: callback.refreshToken,
              expires_in: callback.expiresIn,
              token_type: callback.tokenType
            };

      try {
        if (cancelled) return;
        setStatus('establishing');

        const res = await fetch(API_CALLBACK_EMAIL_LOGIN, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body)
        });

        if (!res.ok) {
          let message = 'Failed to establish app session';
          try {
            const data = (await res.json()) as { message?: string };
            if (data.message) message = data.message;
          } catch {
            // 响应体不是 JSON 时沿用默认文案
          }
          await failToLogin(message);
          return;
        }

        // cookie 已写入，再把用户载入客户端 store
        await userService.refreshUser({ disabledDialogError: true });

        if (cancelled) return;
        router.replace(ROUTE_HOME);
      } catch (err) {
        console.error('Email OTP callback error:', err);
        if (!cancelled) setStatus('error');
        if (!cancelled) router.replace(ROUTE_LOGIN);
      }
    }

    handleCallback();

    return () => {
      cancelled = true;
    };
  }, [router, userService]);

  return (
    <div
      data-testid="EmailOtpCallbackClient"
      className="bg-primary flex w-full min-h-screen items-center justify-center font-sans p-4"
    >
      <div className="bg-bg-container border-primary-border w-full max-w-sm rounded-xl border p-8 text-center shadow-sm">
        <span className="border-primary-border text-brand mb-6 inline-flex items-center rounded-full border bg-primary-bg px-3 py-1 text-xs font-semibold tracking-wide uppercase">
          OAuth 2.0
        </span>

        <div className="my-6 flex justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-[3px] border-primary-border border-t-brand" />
        </div>

        <p className="text-primary-text text-sm font-medium">
          {statusMessages[status]}
        </p>
        <p className="text-tertiary-text mt-2 text-xs">{tt.subtitle}</p>
      </div>
    </div>
  );
}
