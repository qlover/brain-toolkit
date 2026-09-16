import dynamic from 'next/dynamic';
import { AdminPageShell } from '@/uikit/components-pages/AdminPageShell';
import { AdminRolesPanel } from '@/uikit/components-pages/AdminRolesPanel';
import { useI18nMapping } from '@/uikit/hook/useI18nMapping';
import { defaultNavItems } from '@config/adminNavs';
import { i18nConfig } from '@config/i18n';
import { adminRoles18n } from '@config/i18n-mapping/admin18n';
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

interface AdminRolesPageProps {
  messages: Record<string, string>;
}

const namespace = ['admin_roles', 'permission'] as const;

/**
 * Platform admin role → permission management (Pages Router / CSR).
 */
export default function AdminRolesPage({}: AdminRolesPageProps) {
  const seoMetadata = useI18nMapping(adminRoles18n);

  return (
    <AdminLayout seoMetadata={seoMetadata} navItems={defaultNavItems}>
      <AdminPageShell
        title={seoMetadata.title}
        description={seoMetadata.description}
      >
        <AdminRolesPanel tt={seoMetadata} />
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
