import { PageI18nProvider } from '@qlover/next-kit/client';
import { notFound } from 'next/navigation';
import { setRequestLocale } from 'next-intl/server';
import { Suspense } from 'react';
import { FeatureItem } from '@/uikit/components/FeatureItem';
import { LocaleLink } from '@/uikit/components/LocaleLink';
import { LoginTabSwitch } from '@/uikit/components/LoginTabSwitch';
import { AppRoutePage } from '@/uikit/components-app/AppRoutePage';
import { i18nConfig } from '@config/i18n';
import { COMMON_ADMIN_TITLE } from '@config/i18n-identifier/common/common';
import { loginI18n, NS_PAGE_LOGIN } from '@config/i18n-mapping/loginI18n';
import {
  ROUTE_DOCS_OAUTH,
  ROUTE_LOGIN,
  ROUTE_OAUTH_PLAYGROUND
} from '@config/route';
import type { PageParamsProps } from '@interfaces/AppPageRouter';
import { type PageParamsType } from '@server/render/AppPageRouteParams';
import { getI18nInterface, getLocale } from '@server/render/pageRouteParams';
import { version as appVersion } from '../../../../../package.json';
import type { Metadata } from 'next';

// Generate static params for all supported locales (used for SSG)
export async function generateStaticParams() {
  // Return one entry for each supported locale
  return i18nConfig.supportedLngs.map((locale) => ({ locale }));
}

// Generate localized SEO metadata per locale (Next.js 15+ best practice)
export async function generateMetadata({
  params
}: {
  params: Promise<PageParamsType>;
}): Promise<Metadata> {
  const resolvedParams = await params;
  const locale = getLocale(resolvedParams);
  const meta = await getI18nInterface(locale, loginI18n);

  return {
    ...meta,
    title: `${meta.title} · v${appVersion}`
  };
}

export default async function LoginPage({ params }: PageParamsProps) {
  if (!params) {
    return notFound();
  }

  const resolvedParams = await params;
  const locale = getLocale(resolvedParams);
  setRequestLocale(locale); // 建议加上

  const tt = await getI18nInterface(
    locale,
    { ...loginI18n, adminTitle: COMMON_ADMIN_TITLE },
    NS_PAGE_LOGIN
  );

  const versionLabel = `v${appVersion}`;

  return (
    <PageI18nProvider value={tt}>
      <AppRoutePage
        data-testid="AppRoute-LoginPage"
        tt={{
          title: tt.appName,
          headerSubtitle: versionLabel,
          adminTitle: tt.adminTitle
        }}
        showHeaderNav={false}
        showAuthButton={false}
        headerHref={ROUTE_LOGIN}
        mainProps={{
          className: 'text-xs1 bg-primary flex min-h-screen'
        }}
      >
        <div className="max-lg:hidden flex bg-secondary lg:w-1/2 flex-col p-12">
          <span className="border-primary-border text-brand mb-4 inline-flex w-fit items-center gap-2 rounded-full border bg-bg-container px-3 py-1 text-xs font-semibold tracking-wide uppercase">
            PAM
            <span className="text-tertiary-text font-mono font-medium normal-case tracking-normal">
              {versionLabel}
            </span>
          </span>
          <p className="text-secondary-text mb-6 text-sm font-medium">
            {tt.badge}
          </p>
          <h1 className="text-primary-text mb-4 text-4xl font-bold">
            {tt.welcome}
          </h1>
          <p className="text-secondary-text mb-8 text-lg leading-relaxed">
            {tt.subtitle}
          </p>
          <div className="space-y-4">
            <FeatureItem icon="🔐" text={tt.feature_ai_paths} />
            <FeatureItem icon="🔌" text={tt.feature_smart_recommendations} />
            <FeatureItem icon="🧪" text={tt.feature_progress_tracking} />
          </div>
          <p className="text-tertiary-text mt-10 text-sm leading-relaxed">
            {tt.demoNote}
          </p>
        </div>

        <div className="flex w-full items-center justify-center p-8 sm:p-12 lg:w-1/2">
          <div className="w-full max-w-[420px]">
            <div className="mb-8 lg:hidden">
              <span className="border-primary-border text-brand mb-3 inline-flex items-center gap-2 rounded-full border bg-bg-container px-3 py-1 text-xs font-semibold tracking-wide uppercase">
                PAM
                <span className="text-tertiary-text font-mono font-medium normal-case tracking-normal">
                  {versionLabel}
                </span>
              </span>
              <p className="text-secondary-text text-sm">{tt.badge}</p>
            </div>
            <h2 className="text-primary-text mb-2 text-2xl font-semibold">
              {tt.formTitle}
            </h2>
            <p className="text-secondary-text mb-6 text-sm leading-relaxed">
              {tt.formSubtitle}
            </p>

            <Suspense
              fallback={
                <p className="text-secondary-text text-sm">{tt.formSubtitle}</p>
              }
            >
              <LoginTabSwitch tt={tt} />
            </Suspense>

            <p className="text-tertiary-text mt-8 text-center text-xs leading-relaxed">
              <LocaleLink
                title={tt.linkDocs}
                href={ROUTE_DOCS_OAUTH}
                className="text-brand hover:underline"
              >
                {tt.linkDocs}
              </LocaleLink>
              {' · '}
              <LocaleLink
                title={tt.linkPlayground}
                href={ROUTE_OAUTH_PLAYGROUND}
                className="text-brand hover:underline"
              >
                {tt.linkPlayground}
              </LocaleLink>
            </p>
            <p className="text-tertiary-text mt-3 text-center font-mono text-[11px]">
              {versionLabel}
            </p>
          </div>
        </div>
      </AppRoutePage>
    </PageI18nProvider>
  );
}
