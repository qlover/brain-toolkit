import { PAMProjectEnvironmentsPanel } from '@/uikit/components-app/pam/PAMProjectEnvironmentsPanel';
import { PageI18nProvider } from '@/uikit/context/PageI18nContext';
import {
  pamEnvironmentsI18n,
  pamEnvironmentsI18nNamespace
} from '@config/i18n-mapping/PAMEnvironmentsI18n';
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
  return await getI18nInterface(locale, pamEnvironmentsI18n);
}

/**
 * Project environments tab — env list + variables + import.
 */
export default async function ProjectEnvironmentsPage(props: PageParamsProps) {
  const resolvedParams = (await props.params!) as PageParamsType & {
    projectId: string;
  };
  const locale = getLocale(resolvedParams);
  const tt = await getI18nInterface(
    locale,
    pamEnvironmentsI18n,
    pamEnvironmentsI18nNamespace
  );

  return (
    <PageI18nProvider value={tt}>
      <PAMProjectEnvironmentsPanel projectId={resolvedParams.projectId} />
    </PageI18nProvider>
  );
}
