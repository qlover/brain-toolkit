import { PageI18nProvider } from '@qlover/next-kit/client';
import { BrainFooter } from '@/uikit/components/brain/BrainFooter';
import { BrainHeaderNav } from '@/uikit/components/brain/BrainHeaderNav';
import { BrainScene } from '@/uikit/components/brain/BrainScene';
import { AppRoutePage } from '@/uikit/components-app/AppRoutePage';
import { OAuthDocsContent } from '@/uikit/components-app/docs/OAuthDocsContent';
import { i18nConfig } from '@config/i18n';
import {
  oauthDocsI18n,
  oauthDocsI18nNamespace
} from '@config/i18n-mapping/oauthDocsI18n';
import { ROUTE_DEVELOPER_APPS, ROUTE_OAUTH_PLAYGROUND } from '@config/route';
import type { PageParamsProps } from '@interfaces/AppPageRouter';
import {
  AppPageRouteParams,
  type PageParamsType
} from '@server/render/AppPageRouteParams';
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
  return await pageParams.getI18nInterface(oauthDocsI18n);
}

type OAuthDocsPageProps = PageParamsProps;

export default async function OAuthDocsPage(props: OAuthDocsPageProps) {
  const params = await props.params!;
  const pageParams = new AppPageRouteParams(params);
  const tt = await pageParams.getI18nInterface(
    oauthDocsI18n,
    oauthDocsI18nNamespace
  );

  return (
    <PageI18nProvider value={tt}>
      <AppRoutePage
        data-testid="AppRoute-OAuthDocsPage"
        tt={{
          title: tt.appName,
          adminTitle: tt.adminTitle,
          headerSubtitle: tt.headerSub
        }}
        headerVariant="brain"
        headerNav={
          <BrainHeaderNav
            items={[
              { href: ROUTE_OAUTH_PLAYGROUND, label: tt.navPlayground },
              { href: ROUTE_DEVELOPER_APPS, label: tt.navConsole }
            ]}
          />
        }
        showAuthButton
      >
        <BrainScene quiet />
        <OAuthDocsContent />
        <BrainFooter showAbout />
      </AppRoutePage>
    </PageI18nProvider>
  );
}
