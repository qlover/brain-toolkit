import { AppRoutePage } from '@/uikit/components-app/AppRoutePage';
import { PAMRoot } from '@/uikit/components-app/PAMRoot';
import { PageI18nProvider } from '@/uikit/context/PageI18nContext';
import { i18nConfig } from '@config/i18n';
import { pamI18n, pamI18nNamespace } from '@config/i18n-mapping/PAMI18n';
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
  return await getI18nInterface(locale, pamI18n);
}

export default async function Home({ params }: PageParamsProps) {
  const resolvedParams = await params!;
  const locale = getLocale(resolvedParams);
  const tt = await getI18nInterface(locale, pamI18n, pamI18nNamespace);

  return (
    <PageI18nProvider value={tt}>
      <AppRoutePage
        tt={tt}
        showAuthButton
        authButtonLoginOnly
        authButtonShowLogoutLabel
        showHeaderLogo
      >
        <PAMRoot />
      </AppRoutePage>
    </PageI18nProvider>
  );
}
