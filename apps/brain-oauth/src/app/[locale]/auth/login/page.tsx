import { notFound } from 'next/navigation';
import { Suspense } from 'react';
import { BrainScene } from '@/uikit/components/brain/BrainScene';
import { BrainLoginForm } from '@/uikit/components/BrainLoginForm';
import { LocaleLink } from '@/uikit/components/LocaleLink';
import { AppRoutePage } from '@/uikit/components-app/AppRoutePage';
import { i18nConfig } from '@config/i18n';
import { COMMON_ADMIN_TITLE } from '@config/i18n-identifier/common/common';
import { loginI18n, NS_PAGE_LOGIN } from '@config/i18n-mapping/loginI18n';
import { ROUTE_DOCS_OAUTH, ROUTE_LOGIN } from '@config/route';
import type { PageParamsProps } from '@interfaces/AppPageRouter';
import {
  AppPageRouteParams,
  type PageParamsType
} from '@server/render/AppPageRouteParams';
import type { Metadata } from 'next';

// Generate static params for all supported locales (used for SSG)
export async function generateStaticParams() {
  return i18nConfig.supportedLngs.map((locale) => ({ locale }));
}

// Generate localized SEO metadata per locale (Next.js 15+ best practice)
export async function generateMetadata({
  params
}: {
  params: Promise<PageParamsType>;
}): Promise<Metadata> {
  const pageParams = new AppPageRouteParams(await params);

  return await pageParams.getI18nInterface(loginI18n);
}

export default async function LoginPage(props: PageParamsProps) {
  if (!props.params) {
    return notFound();
  }

  const params = await props.params;
  const pageParams = new AppPageRouteParams(params);

  const tt = await pageParams.getI18nInterface(
    { ...loginI18n, adminTitle: COMMON_ADMIN_TITLE },
    NS_PAGE_LOGIN
  );

  return (
    <AppRoutePage
      data-testid="AppRoute-LoginPage"
      tt={{
        title: tt.title,
        adminTitle: tt.adminTitle
      }}
      headerVariant="brain"
      showHeaderNav={false}
      showAuthButton={false}
      headerHref={ROUTE_LOGIN}
    >
      <BrainScene />

      <div className="flex flex-1 items-center justify-center px-6 pt-8 pb-16">
        <div className="brain-card">
          <h1 className="brain-title">{tt.heading}</h1>
          <p className="brain-desc">{tt.subtitle}</p>
          <Suspense>
            <BrainLoginForm tt={tt} />
          </Suspense>
        </div>
      </div>

      <footer className="brain-foot">
        <span>© {new Date().getFullYear()} Brain</span>
        <LocaleLink title={tt.linkDocs} href={ROUTE_DOCS_OAUTH}>
          {tt.linkDocs}
        </LocaleLink>
      </footer>
    </AppRoutePage>
  );
}
