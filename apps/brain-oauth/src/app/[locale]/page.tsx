import { PageI18nProvider } from '@qlover/next-kit/client';
import { BrainFooter } from '@/uikit/components/brain/BrainFooter';
import { BrainHeaderNav } from '@/uikit/components/brain/BrainHeaderNav';
import { BrainScene } from '@/uikit/components/brain/BrainScene';
import { AppRoutePage } from '@/uikit/components-app/AppRoutePage';
import {
  HomeApiSnippet,
  HomeCta,
  HomeFeatures,
  HomeHero
} from '@/uikit/components-app/home/HomeSections';
import { i18nConfig } from '@config/i18n';
import { homeI18n, homeI18nNamespace } from '@config/i18n-mapping/HomeI18n';
import { ROUTE_DOCS_OAUTH } from '@config/route';
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
  return await getI18nInterface(locale, homeI18n);
}

export default async function Home({ params }: PageParamsProps) {
  const resolvedParams = await params!;
  const locale = getLocale(resolvedParams);
  const tt = await getI18nInterface(locale, homeI18n, homeI18nNamespace);

  return (
    <PageI18nProvider value={tt}>
      <AppRoutePage
        tt={tt}
        headerVariant="brain"
        headerNav={
          <BrainHeaderNav
            items={[
              { href: ROUTE_DOCS_OAUTH, label: tt.navDocs },
              { href: '/about', label: tt.navAbout }
            ]}
          />
        }
        showAuthButton
        authShowConsole
      >
        <BrainScene contained />
        <HomeHero tt={tt} />
        <div className="brain-content">
          <HomeFeatures tt={tt} />
          <HomeApiSnippet tt={tt} />
          <HomeCta tt={tt} />
        </div>
        <BrainFooter showAbout />
      </AppRoutePage>
    </PageI18nProvider>
  );
}
