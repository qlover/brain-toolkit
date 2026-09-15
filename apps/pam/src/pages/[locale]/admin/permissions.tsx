import dynamic from 'next/dynamic';
import { AdminPageShell } from '@/uikit/components-pages/AdminPageShell';
import { AdminPermissionsPanel } from '@/uikit/components-pages/AdminPermissionsPanel';
import { useI18nMapping } from '@/uikit/hook/useI18nMapping';
import { defaultNavItems } from '@config/adminNavs';
import { i18nConfig } from '@config/i18n';
import { adminPermissions18n } from '@config/i18n-mapping/admin18n';
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

interface AdminPermissionsPageProps {
  messages: Record<string, string>;
}

const namespace = ['admin_permissions', 'permission', 'common'] as const;

/**
 * Super-admin permission catalog management (Pages Router / CSR).
 */
export default function AdminPermissionsPage({}: AdminPermissionsPageProps) {
  const seoMetadata = useI18nMapping(adminPermissions18n);

  return (
    <AdminLayout seoMetadata={seoMetadata} navItems={defaultNavItems}>
      <AdminPageShell
        title={seoMetadata.title}
        description={seoMetadata.description}
      >
        <AdminPermissionsPanel tt={seoMetadata} />
      </AdminPageShell>
    </AdminLayout>
  );
}

export async function getStaticProps({
  params
}: GetStaticPropsContext<PagesRouteParamsType>) {
  const pageParams = new PagesRouteParams(params);
  const messages = await pageParams.getI18nMessages([...namespace]);

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
