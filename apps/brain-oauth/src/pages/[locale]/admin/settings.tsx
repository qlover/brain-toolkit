import { PageI18nProvider } from '@qlover/next-kit/client';
import dynamic from 'next/dynamic';
import { useMemo } from 'react';
import { AdminSiteSettingsPanel } from '@/uikit/components-pages/AdminSiteSettingsPanel';
import { useI18nMapping } from '@/uikit/hook/useI18nMapping';
import { defaultNavItems } from '@config/adminNavs';
import { i18nConfig } from '@config/i18n';
import { adminSettings18n } from '@config/i18n-mapping/admin18n';
import type { PagesRouteParamsType } from '@server/render/PagesRouteParams';
import { PagesRouteParams } from '@server/render/PagesRouteParams';
import type { GetStaticPropsContext } from 'next';

const AdminLayout = dynamic(
  () =>
    import('@/uikit/components-pages/AdminLayout').then(
      (mod) => mod.AdminLayout
    ),
  { ssr: false }
);

interface AdminSettingsProps {
  messages: Record<string, string>;
}

const namespace = 'admin_settings';

export default function AdminSettingsPage({}: AdminSettingsProps) {
  const pageI18n = useMemo(() => adminSettings18n, []);
  const tt = useI18nMapping(pageI18n);

  return (
    <PageI18nProvider value={tt}>
      <AdminLayout seoMetadata={tt} navItems={defaultNavItems}>
        <div>
          <h1 className="text-2xl font-semibold text-primary-text mb-6">
            {tt.title}
          </h1>
          <p className="text-secondary-text mb-6">{tt.description}</p>
          <AdminSiteSettingsPanel tt={tt} />
        </div>
      </AdminLayout>
    </PageI18nProvider>
  );
}

export async function getStaticProps({
  params
}: GetStaticPropsContext<PagesRouteParamsType>) {
  const pageParams = new PagesRouteParams(params);
  const messages = await pageParams.getI18nMessages(namespace);

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
