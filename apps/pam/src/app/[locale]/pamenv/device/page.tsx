import { PageI18nProvider } from '@qlover/next-kit/client';
import { notFound } from 'next/navigation';
import { setRequestLocale } from 'next-intl/server';
import { Suspense } from 'react';
import { AppRoutePage } from '@/uikit/components-app/AppRoutePage';
import { PamCliDeviceApprovePanel } from '@/uikit/components-app/pam/PamCliDeviceApprovePanel';
import { i18nConfig } from '@config/i18n';
import {
  pamenvDeviceI18n,
  pamenvDeviceI18nNamespace
} from '@config/i18n-mapping/PamenvDeviceI18n';
import { ROUTE_PAMENV_DEVICE } from '@config/route';
import type { PageParamsProps } from '@interfaces/AppPageRouter';
import {
  AppPageRouteParams,
  type PageParamsType
} from '@server/render/AppPageRouteParams';
import { getLocale } from '@server/render/pageRouteParams';
import type { Metadata } from 'next';

export function generateStaticParams() {
  return i18nConfig.supportedLngs.map((locale) => ({ locale }));
}

export async function generateMetadata({
  params
}: {
  params: Promise<PageParamsType>;
}): Promise<Metadata> {
  const pageParams = new AppPageRouteParams(await params);
  return await pageParams.getI18nInterface(pamenvDeviceI18n);
}

export default async function PamenvDevicePage({ params }: PageParamsProps) {
  if (!params) {
    return notFound();
  }

  const resolvedParams = await params;
  const locale = getLocale(resolvedParams as PageParamsType);
  setRequestLocale(locale);

  const pageParams = new AppPageRouteParams(resolvedParams as PageParamsType);
  const tt = await pageParams.getI18nInterface(
    pamenvDeviceI18n,
    pamenvDeviceI18nNamespace
  );

  return (
    <PageI18nProvider value={tt}>
      <AppRoutePage
        data-testid="AppRoute-PamenvDevicePage"
        tt={{
          title: tt.title,
          headerSubtitle: tt.headerSubtitle,
          adminTitle: tt.adminTitle
        }}
        showHeaderNav={false}
        showAuthButton={true}
        headerHref={ROUTE_PAMENV_DEVICE}
        mainProps={{
          className: 'text-xs1 bg-primary flex min-h-screen text-primary-text'
        }}
      >
        <Suspense
          fallback={
            <div className="p-8 text-sm text-secondary-text">{tt.loading}</div>
          }
        >
          <PamCliDeviceApprovePanel />
        </Suspense>
      </AppRoutePage>
    </PageI18nProvider>
  );
}
