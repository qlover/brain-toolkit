import { PageI18nProvider } from '@qlover/next-kit/client';
import { AppRoutePage } from '@/uikit/components-app/AppRoutePage';
import { PAMProjectDetailShell } from '@/uikit/components-app/pam/PAMProjectDetailShell';
import { i18nConfig } from '@config/i18n';
import {
  pamProjectI18n,
  pamProjectI18nNamespace
} from '@config/i18n-mapping/PAMProjectI18n';
import type { PageLayoutProps } from '@interfaces/AppPageRouter';
import {
  getI18nInterface,
  getLocale,
  type PageParamsType
} from '@server/render/pageRouteParams';
import type { Metadata } from 'next';

type ProjectLayoutParamsType = PageParamsType & {
  projectId: string;
};

export async function generateMetadata({
  params
}: {
  params: Promise<PageParamsType>;
}): Promise<Metadata> {
  const resolvedParams = await params;
  const locale = getLocale(resolvedParams);
  return await getI18nInterface(locale, pamProjectI18n);
}

/**
 * Project detail layout — header tabs + pane slot for general / environments.
 */
export default async function ProjectDetailLayout({
  children,
  params
}: PageLayoutProps) {
  const resolvedParams = (await params!) as ProjectLayoutParamsType;
  const locale = getLocale(resolvedParams);
  const projectId = resolvedParams.projectId;
  const tt = await getI18nInterface(
    locale,
    pamProjectI18n,
    pamProjectI18nNamespace
  );

  return (
    <PageI18nProvider value={tt}>
      <AppRoutePage
        data-testid="AppRoute-PAMProjectDetailLayout"
        tt={tt}
        showAuthButton
        authButtonLoginOnly
        authButtonShowLogoutLabel
        showHeaderLogo
      >
        <PAMProjectDetailShell projectId={projectId}>
          {children}
        </PAMProjectDetailShell>
      </AppRoutePage>
    </PageI18nProvider>
  );
}

export function generateStaticParams() {
  return i18nConfig.supportedLngs.map((locale) => ({ locale }));
}
