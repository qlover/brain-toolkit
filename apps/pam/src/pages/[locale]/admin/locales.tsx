import { PageI18nProvider } from '@qlover/next-kit/client';
import dynamic from 'next/dynamic';
import { useMemo } from 'react';
import { AdminPageShell } from '@/uikit/components-pages/AdminPageShell';
import { useI18nMapping } from '@/uikit/hook/useI18nMapping';
import { i18nConfig } from '@config/i18n';
import { adminLocales18n } from '@config/i18n-mapping/admin18n';
import type { PagesRouteParamsType } from '@server/render/PagesRouteParams';
import { PagesRouteParams } from '@server/render/PagesRouteParams';
import type { GetStaticPropsContext } from 'next';

const AdminLocalesPanel = dynamic(
  () =>
    import('@/uikit/components-pages/AdminLocalesPanel').then(
      (mod) => mod.AdminLocalesPanel
    ),
  { ssr: false }
);

interface AdminLocalesProps {
  messages: Record<string, string>;
}

const namespace = 'admin_locales';

/**
 * Admin locales CMS (Pages Router / CSR).
 * Shell chrome comes from `_app` {@link AdminPagesAppShell}.
 */
export default function AdminLocalesPage({}: AdminLocalesProps) {
  const pageI18n = useMemo(() => adminLocales18n, []);
  const seoMetadata = useI18nMapping(pageI18n);

  return (
    <PageI18nProvider value={seoMetadata}>
      <AdminPageShell
        title={seoMetadata.title}
        description={seoMetadata.description}
        seoMetadata={seoMetadata}
      >
        <AdminLocalesPanel tt={seoMetadata} />
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
