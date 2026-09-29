import { PageI18nProvider } from '@qlover/next-kit/client';
import { notFound } from 'next/navigation';
import { setRequestLocale } from 'next-intl/server';
import { ForgotPasswordForm } from '@/uikit/components/ForgotPasswordForm';
import { AuthCardPage } from '@/uikit/components-app/AuthCardPage';
import { i18nConfig } from '@config/i18n';
import { COMMON_ADMIN_TITLE } from '@config/i18n-identifier/common/common';
import { PAGE_LOGIN_APP_NAME } from '@config/i18n-identifier/pages/page.login';
import {
  NS_PAGE_PASSWORD_RESET,
  passwordResetI18n
} from '@config/i18n-mapping/passwordResetI18n';
import type { PageParamsProps } from '@interfaces/AppPageRouter';
import { type PageParamsType } from '@server/render/AppPageRouteParams';
import { getI18nInterface, getLocale } from '@server/render/pageRouteParams';
import type { Metadata } from 'next';

export async function generateStaticParams() {
  return i18nConfig.supportedLngs.map((locale) => ({ locale }));
}

export async function generateMetadata({
  params
}: {
  params: Promise<PageParamsType>;
}): Promise<Metadata> {
  const locale = getLocale(await params);
  return getI18nInterface(locale, passwordResetI18n);
}

export default async function ForgotPasswordPage({ params }: PageParamsProps) {
  if (!params) {
    return notFound();
  }
  const locale = getLocale(await params);
  setRequestLocale(locale);

  const tt = await getI18nInterface(
    locale,
    {
      ...passwordResetI18n,
      appName: PAGE_LOGIN_APP_NAME,
      adminTitle: COMMON_ADMIN_TITLE
    },
    NS_PAGE_PASSWORD_RESET
  );

  return (
    <PageI18nProvider value={tt}>
      <AuthCardPage
        testId="AppRoute-ForgotPasswordPage"
        appName={tt.appName}
        adminTitle={tt.adminTitle}
        heading={tt.forgotHeading}
        subtitle={tt.forgotSubtitle}
      >
        <ForgotPasswordForm tt={tt} />
      </AuthCardPage>
    </PageI18nProvider>
  );
}
