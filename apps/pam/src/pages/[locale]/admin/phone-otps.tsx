import dynamic from 'next/dynamic';
import { AdminPageShell } from '@/uikit/components-pages/AdminPageShell';
import { AdminPhoneOtpsPanel } from '@/uikit/components-pages/AdminPhoneOtpsPanel';
import { useI18nMapping } from '@/uikit/hook/useI18nMapping';
import { defaultNavItems } from '@config/adminNavs';
import { i18nConfig } from '@config/i18n';
import { adminPhoneOtps18n } from '@config/i18n-mapping/admin18n';
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

interface AdminPhoneOtpsPageProps {
  messages: Record<string, string>;
}

const namespace = 'admin_phone_otps';

/**
 * Platform admin phone OTP monitor (Pages Router / CSR).
 */
export default function AdminPhoneOtpsPage({}: AdminPhoneOtpsPageProps) {
  const seoMetadata = useI18nMapping(adminPhoneOtps18n);

  return (
    <AdminLayout seoMetadata={seoMetadata} navItems={defaultNavItems}>
      <AdminPageShell
        title={seoMetadata.title}
        description={seoMetadata.description}
      >
        <AdminPhoneOtpsPanel tt={seoMetadata} />
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
