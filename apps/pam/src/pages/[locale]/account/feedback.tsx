import { ClientSeo } from '@qlover/next-kit/client';
import { AppRoutePagePages } from '@/uikit/components-app/AppRoutePagePages';
import { PamAccountFeedbackListPanel } from '@/uikit/components-app/feedback/PamAccountFeedbackListPanel';
import { useI18nMapping } from '@/uikit/hook/useI18nMapping';
import { i18nConfig } from '@config/i18n';
import { accountFeedbackI18n } from '@config/i18n-mapping/accountFeedbackI18n';
import type { PagesRouteParamsType } from '@server/render/PagesRouteParams';
import { PagesRouteParams } from '@server/render/PagesRouteParams';
import type { GetStaticPropsContext } from 'next';

interface AccountFeedbackPageProps {
  messages: Record<string, string>;
}

const pageNamespaces = ['page_account', 'page_home'] as const;

/**
 * 当前用户反馈记录（Pages Router / CSR）。
 */
export default function AccountFeedbackPage({}: AccountFeedbackPageProps) {
  const seoMetadata = useI18nMapping(accountFeedbackI18n);

  return (
    <AppRoutePagePages
      tt={{
        title: seoMetadata.title,
        adminTitle: seoMetadata.adminTitle
      }}
      headerTitleClassName="text-brand"
      showAdminButton={false}
      showAuthButton
      authButtonShowLogoutLabel
      mainProps={{ className: 'flex flex-1 flex-col bg-primary' }}
    >
      <ClientSeo i18nInterface={seoMetadata} />
      <div
        data-testid="AccountFeedbackPage"
        className="mx-auto w-full max-w-5xl flex-1 px-4 py-8 sm:px-6 sm:py-10 lg:px-8"
      >
        <h1 className="mb-2 text-2xl font-semibold text-primary-text">
          {seoMetadata.title}
        </h1>
        <p className="mb-8 text-sm text-secondary-text">
          {seoMetadata.description}
        </p>
        <PamAccountFeedbackListPanel tt={seoMetadata} />
      </div>
    </AppRoutePagePages>
  );
}

export async function getStaticProps({
  params
}: GetStaticPropsContext<PagesRouteParamsType>) {
  const pageParams = new PagesRouteParams(params);
  const messages = await pageParams.getI18nMessages([...pageNamespaces]);

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
