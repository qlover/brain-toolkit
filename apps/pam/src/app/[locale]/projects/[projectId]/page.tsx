import { PageI18nProvider } from '@qlover/next-kit/client';
import { PAMProjectOverviewPanel } from '@/uikit/components-app/pam/PAMProjectOverviewPanel';
import { pamI18n, pamI18nNamespace } from '@config/i18n-mapping/PAMI18n';
import { pamProjectI18n } from '@config/i18n-mapping/PAMProjectI18n';
import type { PageParamsProps } from '@interfaces/AppPageRouter';
import {
  getI18nInterface,
  getLocale,
  type PageParamsType
} from '@server/render/pageRouteParams';
import type { Metadata } from 'next';

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
 * Project overview tab — rendered description, quick entries, project info.
 */
export default async function ProjectOverviewPage(props: PageParamsProps) {
  const resolvedParams = await props.params!;
  const locale = getLocale(resolvedParams);
  const tt = await getI18nInterface(locale, pamI18n, pamI18nNamespace);

  return (
    <PageI18nProvider value={tt}>
      <PAMProjectOverviewPanel />
    </PageI18nProvider>
  );
}
