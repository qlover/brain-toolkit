import { PageI18nProvider } from '@qlover/next-kit/client';
import { AppRoutePage } from '@/uikit/components-app/AppRoutePage';
import { ChangelogContent } from '@/uikit/components-app/docs/ChangelogContent';
import { githubRepoUrl } from '@config/common';
import { i18nConfig } from '@config/i18n';
import {
  changelogI18n,
  changelogI18nNamespace
} from '@config/i18n-mapping/changelogI18n';
import type { PageParamsProps } from '@interfaces/AppPageRouter';
import {
  AppPageRouteParams,
  type PageParamsType
} from '@server/render/AppPageRouteParams';
import { readPamChangelog } from '@server/render/readPamChangelog';
import { repository, version as appVersion } from '../../../../package.json';
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
  return await pageParams.getI18nInterface(changelogI18n);
}

export default async function ChangelogPage(props: PageParamsProps) {
  const params = await props.params!;
  const pageParams = new AppPageRouteParams(params);
  const tt = await pageParams.getI18nInterface(
    changelogI18n,
    changelogI18nNamespace
  );
  const releases = await readPamChangelog();

  return (
    <PageI18nProvider value={tt}>
      <AppRoutePage
        data-testid="AppRoute-ChangelogPage"
        tt={{ title: tt.title, adminTitle: tt.adminTitle }}
        showAuthButton
        authButtonLoginOnly
        mainProps={{ className: 'flex flex-1 flex-col bg-primary' }}
      >
        <ChangelogContent
          releases={releases}
          currentVersion={appVersion}
          githubUrl={`${githubRepoUrl}/blob/master/${repository.directory}/CHANGELOG.md`}
          tt={tt}
        />
      </AppRoutePage>
    </PageI18nProvider>
  );
}
