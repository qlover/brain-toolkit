import dynamic from 'next/dynamic';
import { AdminPageShell } from '@/uikit/components-pages/AdminPageShell';
import { AdminUsersPanel } from '@/uikit/components-pages/AdminUsersPanel';
import { useI18nMapping } from '@/uikit/hook/useI18nMapping';
import { defaultNavItems } from '@config/adminNavs';
import { i18nConfig } from '@config/i18n';
import { adminUsers18n } from '@config/i18n-mapping/admin18n';
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

interface AdminUserPageProps {
  messages: Record<string, string>;
}

const namespace = 'admin_users';

/**
 * Platform admin user management (Pages Router / CSR).
 * Entry: middleware session + platform admin gate.
 */
export default function AdminUserPage({}: AdminUserPageProps) {
  const seoMetadata = useI18nMapping(adminUsers18n);

  return (
    <AdminLayout seoMetadata={seoMetadata} navItems={defaultNavItems}>
      <AdminPageShell
        title={seoMetadata.title}
        description={seoMetadata.description}
      >
        <AdminUsersPanel tt={seoMetadata} />
      </AdminPageShell>
    </AdminLayout>
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
