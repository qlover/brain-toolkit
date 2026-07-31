import { PageI18nProvider } from '@qlover/next-kit/client';
import { PAMProjectGeneralPanel } from '@/uikit/components-app/pam/PAMProjectGeneralPanel';
import {
  pamGeneralI18n,
  pamGeneralI18nNamespace
} from '@config/i18n-mapping/PAMGeneralI18n';
import type { PageParamsProps } from '@interfaces/AppPageRouter';
import {
  getI18nInterface,
  getLocale,
  type PageParamsType
} from '@server/render/pageRouteParams';
import type { Metadata } from 'next';

type ProjectPageParamsType = PageParamsType & {
  projectId: string;
};

export async function generateMetadata({
  params
}: {
  params: Promise<PageParamsType>;
}): Promise<Metadata> {
  const resolvedParams = await params;
  const locale = getLocale(resolvedParams);
  return await getI18nInterface(locale, pamGeneralI18n);
}

/**
 * Project general tab — basics form only.
 */
export default async function ProjectGeneralPage(props: PageParamsProps) {
  const resolvedParams = (await props.params!) as ProjectPageParamsType;
  const locale = getLocale(resolvedParams);
  const tt = await getI18nInterface(
    locale,
    pamGeneralI18n,
    pamGeneralI18nNamespace
  );

  return (
    <PageI18nProvider value={tt}>
      <PAMProjectGeneralPanel projectId={resolvedParams.projectId} />
    </PageI18nProvider>
  );
}
