import { ClientSeo } from '@qlover/next-kit/client';
import { useMemo } from 'react';
import { BrainFooter } from '@/uikit/components/brain/BrainFooter';
import { BrainHeaderNav } from '@/uikit/components/brain/BrainHeaderNav';
import { BrainScene } from '@/uikit/components/brain/BrainScene';
import { AboutContent } from '@/uikit/components-app/about/AboutContent';
import { AppRoutePagePages } from '@/uikit/components-app/AppRoutePagePages';
import { useI18nMapping } from '@/uikit/hook/useI18nMapping';
import { i18nConfig } from '@config/i18n';
import {
  COMMON_ADMIN_TITLE,
  COMMON_APP_NAME
} from '@config/i18n-identifier/common/common';
import { aboutI18n } from '@config/i18n-mapping/AboutI18n';
import { headerNavI18n } from '@config/i18n-mapping/headerNavI18n';
import { ROUTE_DOCS_OAUTH } from '@config/route';
import type { PagesRouteParamsType } from '@server/render/PagesRouteParams';
import { PagesRouteParams } from '@server/render/PagesRouteParams';
import type { GetStaticPropsContext } from 'next';

interface AboutProps {
  messages: Record<string, string>;
}

const namespace = 'page_about';

export default function About({}: AboutProps) {
  const i18nInterface = useMemo(() => {
    return {
      ...aboutI18n,
      appName: COMMON_APP_NAME,
      adminTitle: COMMON_ADMIN_TITLE
    };
  }, []);
  const tt = useI18nMapping(i18nInterface);
  const nav = useI18nMapping(headerNavI18n);

  return (
    <AppRoutePagePages
      data-testid="AboutPage"
      tt={{ title: tt.appName, adminTitle: tt.adminTitle }}
      headerVariant="brain"
      headerNav={
        <BrainHeaderNav
          items={[
            { href: ROUTE_DOCS_OAUTH, label: nav.navDocs },
            { href: '/about', label: nav.navAbout, active: true }
          ]}
        />
      }
      showAdminButton={false}
      showAuthButton
      authShowConsole
    >
      <ClientSeo i18nInterface={tt} />
      <BrainScene quiet />
      <AboutContent tt={tt} />
      <BrainFooter />
    </AppRoutePagePages>
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
