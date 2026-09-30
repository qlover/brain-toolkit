import { AdminRequestLogsView } from '@/uikit/components-app/admin/AdminRequestLogsView';
import { AdminShell } from '@/uikit/components-app/admin/AdminShell';
import { useI18nMapping } from '@/uikit/hook/useI18nMapping';
import { i18nConfig } from '@config/i18n';
import { adminRequestLogs18n } from '@config/i18n-mapping/admin18n';
import type { PagesRouteParamsType } from '@server/render/PagesRouteParams';
import { PagesRouteParams } from '@server/render/PagesRouteParams';
import type { GetStaticPropsContext } from 'next';

interface AdminRequestLogsProps {
  messages: Record<string, string>;
}

export default function AdminRequestLogsPage({}: AdminRequestLogsProps) {
  const seo = useI18nMapping(adminRequestLogs18n);

  return (
    <AdminShell active="logs" seo={seo}>
      <AdminRequestLogsView />
    </AdminShell>
  );
}

export async function getStaticProps({
  params
}: GetStaticPropsContext<PagesRouteParamsType>) {
  const pageParams = new PagesRouteParams(params);
  const messages = await pageParams.getI18nMessages([
    'admin_request_logs',
    'admin_home'
  ]);

  return {
    props: {
      messages
    }
  };
}

export async function getStaticPaths() {
  return {
    paths: i18nConfig.supportedLngs.map((locale) => ({
      params: { locale }
    })),
    fallback: false
  };
}
