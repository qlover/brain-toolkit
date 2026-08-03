import { notFound } from 'next/navigation';
import { setRequestLocale } from 'next-intl/server';
import { Suspense } from 'react';
import { AppRoutePage } from '@/uikit/components-app/AppRoutePage';
import { PamCliDeviceApprovePanel } from '@/uikit/components-app/pam/PamCliDeviceApprovePanel';
import { i18nConfig } from '@config/i18n';
import { ROUTE_PAMENV_DEVICE } from '@config/route';
import type { PageParamsProps } from '@interfaces/AppPageRouter';
import { type PageParamsType } from '@server/render/AppPageRouteParams';
import { getLocale } from '@server/render/pageRouteParams';
import type { Metadata } from 'next';

export function generateStaticParams() {
  return i18nConfig.supportedLngs.map((locale) => ({ locale }));
}

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: 'Authorize pamenv',
    description: 'Approve a pamenv device login request'
  };
}

export default async function PamenvDevicePage({ params }: PageParamsProps) {
  if (!params) {
    return notFound();
  }

  const resolvedParams = await params;
  const locale = getLocale(resolvedParams as PageParamsType);
  setRequestLocale(locale);

  return (
    <AppRoutePage
      data-testid="AppRoute-PamenvDevicePage"
      tt={{
        title: 'pamenv',
        headerSubtitle: 'Device authorization',
        adminTitle: 'pamenv'
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
          <div className="p-8 text-sm text-secondary-text">Loading…</div>
        }
      >
        <PamCliDeviceApprovePanel />
      </Suspense>
    </AppRoutePage>
  );
}
