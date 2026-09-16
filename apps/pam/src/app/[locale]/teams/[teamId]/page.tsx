import { PageI18nProvider } from '@qlover/next-kit/client';
import { AppRoutePage } from '@/uikit/components-app/AppRoutePage';
import { PAMTeamDetailPage } from '@/uikit/components-app/pam/PAMTeamDetailPage';
import {
  pamTeamsI18n,
  pamTeamsI18nNamespace
} from '@config/i18n-mapping/PAMTeamsI18n';
import type { PageParamsProps } from '@interfaces/AppPageRouter';
import {
  getI18nInterface,
  getLocale,
  type PageParamsType
} from '@server/render/pageRouteParams';
import type { Metadata } from 'next';

type TeamPageParams = PageParamsType & { teamId: string };

export async function generateMetadata({
  params
}: {
  params: Promise<PageParamsType>;
}): Promise<Metadata> {
  const resolvedParams = await params;
  const locale = getLocale(resolvedParams);
  return await getI18nInterface(locale, pamTeamsI18n);
}

export default async function TeamDetailRoute(props: PageParamsProps) {
  const resolvedParams = (await props.params!) as TeamPageParams;
  const locale = getLocale(resolvedParams);
  const tt = await getI18nInterface(
    locale,
    pamTeamsI18n,
    pamTeamsI18nNamespace
  );

  return (
    <PageI18nProvider value={tt}>
      <AppRoutePage
        tt={tt}
        showAuthButton
        showHeaderLogo
        authButtonShowLogoutLabel
      >
        <PAMTeamDetailPage teamId={resolvedParams.teamId} />
      </AppRoutePage>
    </PageI18nProvider>
  );
}
