import { AdminShell } from '@/uikit/components-app/admin/AdminShell';
import { AdminUsersView } from '@/uikit/components-app/admin/AdminUsersView';
import { useI18nMapping } from '@/uikit/hook/useI18nMapping';
import { i18nConfig } from '@config/i18n';
import { adminUsers18n } from '@config/i18n-mapping/admin18n';
import type { PagesRouteParamsType } from '@server/render/PagesRouteParams';
import { PagesRouteParams } from '@server/render/PagesRouteParams';
import type { GetStaticPropsContext } from 'next';

interface AdminUsersPageProps {
  messages: Record<string, string>;
}

export default function AdminUsersPage({}: AdminUsersPageProps) {
  const seo = useI18nMapping(adminUsers18n);

  return (
    <AdminShell active="users" seo={seo} adminOnly>
      <AdminUsersView />
    </AdminShell>
  );
}

export async function getStaticProps({
  params
}: GetStaticPropsContext<PagesRouteParamsType>) {
  const pageParams = new PagesRouteParams(params);
  const messages = await pageParams.getI18nMessages([
    'admin_users',
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
