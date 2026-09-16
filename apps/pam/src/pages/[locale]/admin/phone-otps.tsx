import { AdminPageShell } from '@/uikit/components-pages/AdminPageShell';
import { AdminPhoneOtpsPanel } from '@/uikit/components-pages/AdminPhoneOtpsPanel';
import { useI18nMapping } from '@/uikit/hook/useI18nMapping';
import { i18nConfig } from '@config/i18n';
import { adminPhoneOtps18n } from '@config/i18n-mapping/admin18n';
import type { PagesRouteParamsType } from '@server/render/PagesRouteParams';
import { PagesRouteParams } from '@server/render/PagesRouteParams';
import type { GetStaticPropsContext } from 'next';

interface AdminPhoneOtpsPageProps {
  messages: Record<string, string>;
}

const namespace = 'admin_phone_otps';

/**
 * Platform admin phone OTP monitor (Pages Router / CSR).
 * Shell chrome comes from `_app` {@link AdminPagesAppShell}.
 */
export default function AdminPhoneOtpsPage({}: AdminPhoneOtpsPageProps) {
  const seoMetadata = useI18nMapping(adminPhoneOtps18n);

  return (
    <AdminPageShell
      title={seoMetadata.title}
      description={seoMetadata.description}
      seoMetadata={seoMetadata}
    >
      <AdminPhoneOtpsPanel tt={seoMetadata} />
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
