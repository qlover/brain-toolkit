import { AdminSettingsView } from '@/uikit/components-app/admin/AdminSettingsView';
import { AdminShell } from '@/uikit/components-app/admin/AdminShell';
import { useI18nMapping } from '@/uikit/hook/useI18nMapping';
import { i18nConfig } from '@config/i18n';
import { adminSettings18n } from '@config/i18n-mapping/admin18n';
import type { PagesRouteParamsType } from '@server/render/PagesRouteParams';
import { PagesRouteParams } from '@server/render/PagesRouteParams';
import type { GetStaticPropsContext } from 'next';

interface AdminSettingsPageProps {
  messages: Record<string, string>;
}

export default function AdminSettingsPage({}: AdminSettingsPageProps) {
  const seo = useI18nMapping(adminSettings18n);

  return (
    <AdminShell active="settings" seo={seo} adminOnly>
      <AdminSettingsView />
    </AdminShell>
  );
}

export async function getStaticProps({
  params
}: GetStaticPropsContext<PagesRouteParamsType>) {
  const pageParams = new PagesRouteParams(params);
  const messages = await pageParams.getI18nMessages([
    'admin_settings',
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
