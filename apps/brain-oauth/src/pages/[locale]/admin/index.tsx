import { AdminOverviewView } from '@/uikit/components-app/admin/AdminOverviewView';
import { AdminShell } from '@/uikit/components-app/admin/AdminShell';
import { useI18nMapping } from '@/uikit/hook/useI18nMapping';
import { i18nConfig } from '@config/i18n';
import { admin18n } from '@config/i18n-mapping/admin18n';
import type { PagesRouteParamsType } from '@server/render/PagesRouteParams';
import { PagesRouteParams } from '@server/render/PagesRouteParams';
import type { GetStaticPropsContext } from 'next';

interface AdminPageProps {
  messages: Record<string, string>;
}

export default function AdminPage({}: AdminPageProps) {
  const seo = useI18nMapping(admin18n);

  return (
    <AdminShell active="overview" seo={seo}>
      <AdminOverviewView />
    </AdminShell>
  );
}

export async function getStaticProps({
  params
}: GetStaticPropsContext<PagesRouteParamsType>) {
  const pageParams = new PagesRouteParams(params);
  const messages = await pageParams.getI18nMessages(['admin_home']);

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
