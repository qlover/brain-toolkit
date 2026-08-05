import { PageI18nProvider } from '@qlover/next-kit/client';
import { AppRoutePage } from '@/uikit/components-app/AppRoutePage';
import { HomeLanding } from '@/uikit/components-app/HomeLanding';
import { i18nConfig } from '@config/i18n';
import { homeI18n, homeI18nNamespace } from '@config/i18n-mapping/homeI18n';
import type { PageParamsProps } from '@interfaces/AppPageRouter';
import {
  getI18nInterface,
  getLocale,
  type PageParamsType
} from '@server/render/pageRouteParams';
import { getPublicProjectsForHome } from '@server/utils/getPublicProjectsForHome';
import { version as appVersion } from '../../../package.json';
import type { Metadata } from 'next';

/** Featured public projects on the landing page (pairs with unstable_cache). */
export const revalidate = 60;

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
  return await getI18nInterface(locale, homeI18n);
}

export default async function Home({ params }: PageParamsProps) {
  const resolvedParams = await params!;
  const locale = getLocale(resolvedParams);
  const [tt, initialList] = await Promise.all([
    getI18nInterface(locale, homeI18n, homeI18nNamespace),
    getPublicProjectsForHome()
  ]);

  return (
    <PageI18nProvider value={tt}>
      <AppRoutePage
        tt={tt}
        showAuthButton
        authButtonLoginOnly
        authButtonShowLogoutLabel
        showHeaderLogo
        mainProps={{ className: 'flex flex-1 flex-col bg-primary' }}
      >
        <HomeLanding
          featuredProjects={initialList?.items ?? []}
          appVersion={appVersion}
        />
      </AppRoutePage>
    </PageI18nProvider>
  );
}
