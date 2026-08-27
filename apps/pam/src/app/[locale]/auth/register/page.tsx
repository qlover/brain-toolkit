import { redirect } from 'next/navigation';
import { setRequestLocale } from 'next-intl/server';
import { i18nConfig } from '@config/i18n';
import { ROUTE_LOGIN } from '@config/route';
import type { PageParamsProps } from '@interfaces/AppPageRouter';
import type { PageParamsType } from '@server/render/AppPageRouteParams';
import { getLocale } from '@server/render/pageRouteParams';

export async function generateStaticParams() {
  return i18nConfig.supportedLngs.map((locale) => ({ locale }));
}

/**
 * Registration is no longer offered — email magic-link / password login
 * covers account access. Keep the route so old links land on login.
 */
export default async function RegisterPage({ params }: PageParamsProps) {
  const resolvedParams = (await params) as PageParamsType;
  const locale = getLocale(resolvedParams);
  setRequestLocale(locale);
  redirect(`/${locale}${ROUTE_LOGIN}`);
}
