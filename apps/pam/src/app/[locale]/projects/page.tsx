import { PageI18nProvider } from '@qlover/next-kit/client';
import { AppRoutePage } from '@/uikit/components-app/AppRoutePage';
import { PAMRoot } from '@/uikit/components-app/PAMRoot';
import { i18nConfig } from '@config/i18n';
import { pamI18n, pamI18nNamespace } from '@config/i18n-mapping/PAMI18n';
import { mergePamCategories } from '@config/pamCategories';
import type { PageParamsProps } from '@interfaces/AppPageRouter';
import {
  getI18nInterface,
  getLocale,
  type PageParamsType
} from '@server/render/pageRouteParams';
import {
  getPublicCategoriesForHome,
  getPublicProjectsForHome
} from '@server/utils/getPublicProjectsForHome';
import type { Metadata } from 'next';

/** Revalidate public project list periodically (pairs with unstable_cache). */
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
  return await getI18nInterface(locale, pamI18n);
}

export default async function ProjectsPage({ params }: PageParamsProps) {
  const resolvedParams = await params!;
  const locale = getLocale(resolvedParams);
  const [tt, initialList, fetchedCategories] = await Promise.all([
    getI18nInterface(locale, pamI18n, pamI18nNamespace),
    getPublicProjectsForHome(),
    getPublicCategoriesForHome()
  ]);

  // Keep chips aligned with the SSR project list (plus full public distinct set).
  const initialCategories = mergePamCategories([
    ...fetchedCategories,
    ...(initialList?.items ?? []).map((item) => item.category ?? '')
  ]);

  return (
    <PageI18nProvider value={tt}>
      <AppRoutePage
        tt={tt}
        showAuthButton
        authButtonLoginOnly
        authButtonShowLogoutLabel
        showHeaderLogo
      >
        <PAMRoot
          initialList={initialList}
          initialCategories={initialCategories}
        />
      </AppRoutePage>
    </PageI18nProvider>
  );
}
