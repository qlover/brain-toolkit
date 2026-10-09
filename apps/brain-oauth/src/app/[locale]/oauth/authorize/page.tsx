import { buildSwitchAccountHref } from '@brain-toolkit/next-app-kit/shared';
import { PageI18nProvider } from '@qlover/next-kit/client';
import { redirect } from 'next/navigation';
import { Suspense } from 'react';
import { BrainFooter } from '@/uikit/components/brain/BrainFooter';
import { BrainScene } from '@/uikit/components/brain/BrainScene';
import { AppRoutePage } from '@/uikit/components-app/AppRoutePage';
import { OAuthAuthorizeCard } from '@/uikit/components-app/oauth/OAuthAuthorizeCard';
import { OAuthAuthorizeErrorCard } from '@/uikit/components-app/oauth/OAuthAuthorizeErrorCard';
import { i18nConfig } from '@config/i18n';
import {
  oauthAuthorizeI18n,
  oauthAuthorizeI18nNamespace,
  resolveAuthorizeErrorMessage
} from '@config/i18n-mapping/OAuthAuthorizeI18n';
import { localePage, ROUTE_LOGIN, ROUTE_OAUTH_AUTHORIZE } from '@config/route';
import type { PageParamsProps } from '@interfaces/AppPageRouter';
import { BootstrapServer } from '@server/BootstrapServer';
import { OAuthWrapperController } from '@server/controllers/OAuthWrapperController';
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
  return await pageParams.getI18nInterface(oauthAuthorizeI18n);
}

type OAuthAuthorizePageProps = PageParamsProps & {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

export default async function OAuthAuthorizePage(
  props: OAuthAuthorizePageProps
) {
  const params = await props.params!;
  const pageParams = new AppPageRouteParams(params);
  const tt = await pageParams.getI18nInterface(
    oauthAuthorizeI18n,
    oauthAuthorizeI18nNamespace
  );

  const rawSearchParams = (await props.searchParams) ?? {};
  const IOC = new BootstrapServer('OAuthAuthorizePage').getIOC();
  const oauthContoller = IOC(OAuthWrapperController);
  const authorizeResult =
    await oauthContoller.resolveAuthorizePage(rawSearchParams);

  if (authorizeResult.ok) {
    const trustedRedirect = await oauthContoller.tryAutoConsent(
      authorizeResult.data
    );
    if (trustedRedirect) {
      redirect(trustedRedirect);
    }
  }

  const account = authorizeResult.ok
    ? await oauthContoller.getAuthorizingUser()
    : null;
  const locale = pageParams.getLocale();
  const switchAccountHref = buildSwitchAccountHref(
    localePage(ROUTE_LOGIN, locale),
    localePage(ROUTE_OAUTH_AUTHORIZE, locale),
    rawSearchParams
  );

  return (
    <PageI18nProvider value={tt}>
      <AppRoutePage
        data-testid="AppRoute-OAuthAuthorizePage"
        tt={{ title: tt.title, adminTitle: tt.adminTitle }}
        headerVariant="brain"
        showHeaderNav={false}
        showAuthButton={false}
      >
        <BrainScene />

        <div className="flex flex-1 items-center justify-center px-6 pt-8 pb-16">
          {authorizeResult.ok ? (
            <Suspense>
              <OAuthAuthorizeCard
                tt={tt}
                authorizeData={authorizeResult.data}
                account={
                  account
                    ? {
                        name: account.name,
                        email: account.email,
                        phone: account.phone
                      }
                    : null
                }
                switchAccountHref={switchAccountHref}
              />
            </Suspense>
          ) : (
            <OAuthAuthorizeErrorCard
              tt={tt}
              message={resolveAuthorizeErrorMessage(
                tt,
                authorizeResult.error.errorKey,
                authorizeResult.error.message
              )}
            />
          )}
        </div>

        <BrainFooter />
      </AppRoutePage>
    </PageI18nProvider>
  );
}
