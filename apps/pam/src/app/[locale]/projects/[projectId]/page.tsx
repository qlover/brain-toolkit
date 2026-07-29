import { redirect } from 'next/navigation';
import { projectGeneralPath } from '@config/route';
import type { PageParamsProps } from '@interfaces/AppPageRouter';
import { getLocale, type PageParamsType } from '@server/render/pageRouteParams';

type ProjectPageParamsType = PageParamsType & {
  projectId: string;
};

/**
 * `/[locale]/projects/[projectId]` → redirect to general tab.
 */
export default async function ProjectDetailIndexPage(props: PageParamsProps) {
  const resolvedParams = (await props.params!) as ProjectPageParamsType;
  const locale = getLocale(resolvedParams);
  const projectId = resolvedParams.projectId;
  redirect(`/${locale}${projectGeneralPath(projectId)}`);
}
