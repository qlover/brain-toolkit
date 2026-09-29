import { ClientSeo } from '@qlover/next-kit/client';
import { useMemo } from 'react';
import { BrainFooter } from '@/uikit/components/brain/BrainFooter';
import { BrainHeaderNav } from '@/uikit/components/brain/BrainHeaderNav';
import { BrainScene } from '@/uikit/components/brain/BrainScene';
import { AppRoutePagePages } from '@/uikit/components-app/AppRoutePagePages';
import { DeveloperAppsPageComponent } from '@/uikit/components-app/developer/apps/DeveloperAppsPage';
import { useI18nMapping } from '@/uikit/hook/useI18nMapping';
import { i18nConfig } from '@config/i18n';
import { COMMON_ADMIN_TITLE } from '@config/i18n-identifier/common/common';
import { developerAppsI18n } from '@config/i18n-mapping/developerAppsI18n';
import { headerNavI18n } from '@config/i18n-mapping/headerNavI18n';
import { ROUTE_DOCS_OAUTH, ROUTE_OAUTH_PLAYGROUND } from '@config/route';
import type { PagesRouteParamsType } from '@server/render/PagesRouteParams';
import { PagesRouteParams } from '@server/render/PagesRouteParams';
import type { OAuthClientListItem } from '@qlover/oauth-wrapper';
import type { GetStaticPropsContext } from 'next';

interface DeveloperAppsProps {
  messages: Record<string, string>;
  initialApps: OAuthClientListItem[];
}

const pageNamespaces = ['developer_apps', 'page_home'] as const;

/**
 * Developer apps console (Pages Router / CSR).
 * Entry auth is middleware via LOGINED_PAGES; page renders shell immediately.
 */
export default function DeveloperApps({ initialApps }: DeveloperAppsProps) {
  const i18nInterface = useMemo(() => {
    return {
      ...developerAppsI18n,
      adminTitle: COMMON_ADMIN_TITLE
    };
  }, []);
  const seoMetadata = useI18nMapping(i18nInterface);
  const nav = useI18nMapping(headerNavI18n);

  return (
    <AppRoutePagePages
      tt={{
        title: seoMetadata.appBrandTitle,
        adminTitle: seoMetadata.adminTitle,
        headerSubtitle: seoMetadata.consoleSubtitle
      }}
      headerVariant="brain"
      headerNav={
        <BrainHeaderNav
          items={[
            { href: ROUTE_OAUTH_PLAYGROUND, label: nav.navPlayground },
            { href: ROUTE_DOCS_OAUTH, label: nav.navDocs }
          ]}
        />
      }
      showAdminButton={false}
      showAuthButton
      authShowLogout
    >
      <ClientSeo i18nInterface={seoMetadata} />
      <BrainScene quiet />
      <DeveloperAppsPageComponent initialApps={initialApps} />
      <BrainFooter />
    </AppRoutePagePages>
  );
}

export async function getStaticProps({
  params
}: GetStaticPropsContext<PagesRouteParamsType>) {
  const pageParams = new PagesRouteParams(params);
  const messages = await pageParams.getI18nMessages([...pageNamespaces]);

  // Fetch initial apps list (server-side)
  // For now, we'll fetch on client side in the component
  const initialApps: OAuthClientListItem[] = [];

  return {
    props: {
      messages,
      initialApps
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
