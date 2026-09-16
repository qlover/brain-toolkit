import { PageI18nProvider } from '@qlover/next-kit/client';
import { AppRoutePage } from '@/uikit/components-app/AppRoutePage';
import { PAMTeamsPage } from '@/uikit/components-app/pam/PAMTeamsPage';
import { i18nConfig } from '@config/i18n';
import {
  pamTeamsI18n,
  pamTeamsI18nNamespace
} from '@config/i18n-mapping/PAMTeamsI18n';
import type { PageParamsProps } from '@interfaces/AppPageRouter';
import {
  getI18nInterface,
  getLocale,
  type PageParamsType
} from '@server/render/pageRouteParams';
import type { Metadata } from 'next';

export async function generateStaticParams() {
  return i18nConfig.supportedLngs.map((locale) => ({ locale }));
}

export async function generateMetadata({
  params
}: {
  params: Promise<PageParamsType>;
}): Promise<Metadata> {
  const resolvedParams = await params;
  const locale = getLocale(resolvedParams);
  return await getI18nInterface(locale, pamTeamsI18n);
}

export default async function TeamsPage({ params }: PageParamsProps) {
  const resolvedParams = await params!;
  const locale = getLocale(resolvedParams);
  const tt = await getI18nInterface(
    locale,
    pamTeamsI18n,
    pamTeamsI18nNamespace
  );

  return (
    <PageI18nProvider value={tt}>
      <AppRoutePage
        tt={tt}
        showAuthButton
        showHeaderLogo
        authButtonShowLogoutLabel
      >
        <PAMTeamsPage />
      </AppRoutePage>
    </PageI18nProvider>
  );
}
