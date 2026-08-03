import { PageI18nProvider } from '@qlover/next-kit/client';
import { AppRoutePage } from '@/uikit/components-app/AppRoutePage';
import { CliDocsContent } from '@/uikit/components-app/docs/CliDocsContent';
import { i18nConfig } from '@config/i18n';
import {
  cliDocsI18n,
  cliDocsI18nNamespace
} from '@config/i18n-mapping/cliDocsI18n';
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
  return await pageParams.getI18nInterface(cliDocsI18n);
}

type CliDocsPageProps = PageParamsProps;

export default async function CliDocsPage(props: CliDocsPageProps) {
  const params = await props.params!;
  const pageParams = new AppPageRouteParams(params);
  const tt = await pageParams.getI18nInterface(
    cliDocsI18n,
    cliDocsI18nNamespace
  );

  return (
    <PageI18nProvider value={tt}>
      <AppRoutePage
        data-testid="AppRoute-CliDocsPage"
        tt={{ title: tt.title, adminTitle: tt.adminTitle }}
        showAuthButton
        authButtonLoginOnly
        mainProps={{ className: 'flex flex-1 flex-col bg-primary' }}
      >
        <CliDocsContent />
      </AppRoutePage>
    </PageI18nProvider>
  );
}
