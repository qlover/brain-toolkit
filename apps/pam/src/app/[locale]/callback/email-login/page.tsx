/**
 * 邮箱魔法链接回调页（服务端组件）。
 *
 * implicit 链接把 session 放在 hash 里，旧 PKCE 链接带 `?code=`。
 * 客户端展示加载态，再把 session 或 code POST 到 /api/callback/email-login。
 */

import { notFound } from 'next/navigation';
import { AppRoutePage } from '@/uikit/components-app/AppRoutePage';
import { i18nConfig } from '@config/i18n';
import { COMMON_ADMIN_TITLE } from '@config/i18n-identifier/common/common';
import {
  emailOtpCallbackI18n,
  NS_PAGE_EMAIL_OTP_CALLBACK
} from '@config/i18n-mapping/emailOtpCallbackI18n';
import { ROUTE_LOGIN } from '@config/route';
import type { PageParamsProps } from '@interfaces/AppPageRouter';
import {
  AppPageRouteParams,
  type PageParamsType
} from '@server/render/AppPageRouteParams';
import { EmailOtpCallbackClient } from './EmailOtpCallbackClient';
import type { Metadata } from 'next';

export async function generateStaticParams() {
  return i18nConfig.supportedLngs.map((locale) => ({ locale }));
}

export async function generateMetadata({
  params
}: {
  params: Promise<PageParamsType>;
}): Promise<Metadata> {
  const pageParams = new AppPageRouteParams(await params);
  return await pageParams.getI18nInterface(emailOtpCallbackI18n);
}

export default async function EmailOtpCallbackPage(props: PageParamsProps) {
  if (!props.params) {
    return notFound();
  }

  const params = await props.params;
  const pageParams = new AppPageRouteParams(params);

  const tt = await pageParams.getI18nInterface(
    { ...emailOtpCallbackI18n, adminTitle: COMMON_ADMIN_TITLE },
    NS_PAGE_EMAIL_OTP_CALLBACK
  );

  return (
    <AppRoutePage
      data-testid="AppRoute-EmailOtpCallbackPage"
      tt={{
        title: tt.authenticating,
        adminTitle: tt.adminTitle
      }}
      showHeaderNav={false}
      showAuthButton={false}
      headerHref={ROUTE_LOGIN}
      mainProps={{
        className: 'text-xs1 bg-primary flex min-h-screen'
      }}
    >
      <EmailOtpCallbackClient tt={tt} />
    </AppRoutePage>
  );
}
