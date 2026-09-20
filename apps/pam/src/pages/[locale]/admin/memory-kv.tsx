import { AdminMemoryKvPanel } from '@/uikit/components-pages/AdminMemoryKvPanel';
import { AdminPageShell } from '@/uikit/components-pages/AdminPageShell';
import { useI18nMapping } from '@/uikit/hook/useI18nMapping';
import { i18nConfig } from '@config/i18n';
import { adminMemoryKv18n } from '@config/i18n-mapping/admin18n';
import type { PagesRouteParamsType } from '@server/render/PagesRouteParams';
import { PagesRouteParams } from '@server/render/PagesRouteParams';
import type { GetStaticPropsContext } from 'next';

interface AdminMemoryKvPageProps {
  messages: Record<string, string>;
}

const namespace = 'admin_memory_kv';

/**
 * Super-admin Memory KV inspect (Pages Router / CSR).
 * Shell chrome comes from `_app` {@link AdminPagesAppShell}.
 */
export default function AdminMemoryKvPage({}: AdminMemoryKvPageProps) {
  const seoMetadata = useI18nMapping(adminMemoryKv18n);

  return (
    <AdminPageShell
      title={seoMetadata.title}
      description={seoMetadata.description}
      seoMetadata={seoMetadata}
    >
      <AdminMemoryKvPanel tt={seoMetadata} />
    </AdminPageShell>
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
