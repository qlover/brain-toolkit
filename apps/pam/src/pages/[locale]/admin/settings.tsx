import { PageI18nProvider } from '@qlover/next-kit/client';
import dynamic from 'next/dynamic';
import { useMemo } from 'react';
import { AdminPageShell } from '@/uikit/components-pages/AdminPageShell';
import { useI18nMapping } from '@/uikit/hook/useI18nMapping';
import { i18nConfig } from '@config/i18n';
import { adminSettings18n } from '@config/i18n-mapping/admin18n';
import type { PagesRouteParamsType } from '@server/render/PagesRouteParams';
import { PagesRouteParams } from '@server/render/PagesRouteParams';
import type { GetStaticPropsContext } from 'next';

const AdminSiteSettingsPanel = dynamic(
  () =>
    import('@/uikit/components-pages/AdminSiteSettingsPanel').then(
      (mod) => mod.AdminSiteSettingsPanel
    ),
  { ssr: false }
);

interface AdminSettingsProps {
  messages: Record<string, string>;
}

const namespace = 'admin_settings';

/**
 * Admin site settings (Pages Router / CSR).
 * Shell chrome comes from `_app` {@link AdminPagesAppShell}.
 */
export default function AdminSettingsPage({}: AdminSettingsProps) {
  const pageI18n = useMemo(() => adminSettings18n, []);
  const seoMetadata = useI18nMapping(pageI18n);

  return (
    <PageI18nProvider value={seoMetadata}>
      <AdminPageShell
        title={seoMetadata.title}
        description={seoMetadata.description}
        seoMetadata={seoMetadata}
      >
        <AdminSiteSettingsPanel tt={seoMetadata} />
      </AdminPageShell>
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
