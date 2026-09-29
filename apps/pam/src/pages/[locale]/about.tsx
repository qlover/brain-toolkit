import { ClientSeo } from '@qlover/next-kit/client';
import {
  AboutContent,
  type AboutRecentRelease,
  type AboutUpdateKind
} from '@/uikit/components-app/AboutContent';
import { PagesRoutePage } from '@/uikit/components-pages/PagesRoutePage';
import { useI18nMapping } from '@/uikit/hook/useI18nMapping';
import { githubRepoUrl } from '@config/common';
import { i18nConfig } from '@config/i18n';
import { aboutI18n, aboutI18nNamespace } from '@config/i18n-mapping/AboutI18n';
import type { PagesRouteParamsType } from '@server/render/PagesRouteParams';
import { PagesRouteParams } from '@server/render/PagesRouteParams';
import {
  readPamChangelog,
  summarizePamChangelogRelease
} from '@server/render/readPamChangelog';
import { version } from '../../../package.json';
import type { GetStaticPropsContext } from 'next';

const RECENT_RELEASES = 3;
const ENTRIES_PER_RELEASE = 5;

const UPDATE_KIND_BY_CATEGORY: Record<string, AboutUpdateKind> = {
  Features: 'feature',
  'Bug Fixes': 'fix'
};

interface AboutProps {
  messages: Record<string, string>;
  recentReleases: AboutRecentRelease[];
}

export default function About({ recentReleases }: AboutProps) {
  const tt = useI18nMapping(aboutI18n);

  return (
    <PagesRoutePage
      data-testid="AboutPage"
      tt={{ title: tt.title, adminTitle: tt.adminTitle }}
      showAdminButton={false}
      showAuthButton
      authButtonLoginOnly
      mainProps={{ className: 'flex flex-1 flex-col bg-primary' }}
    >
      <ClientSeo i18nInterface={tt} />
      <AboutContent
        tt={tt}
        version={version}
        githubUrl={githubRepoUrl}
        recentReleases={recentReleases}
      />
    </PagesRoutePage>
  );
}

async function loadRecentReleases(): Promise<AboutRecentRelease[]> {
  const releases = await readPamChangelog();
  const recent: AboutRecentRelease[] = [];
  for (const release of releases) {
    const entries = summarizePamChangelogRelease(release.body)
      .flatMap((entry) => {
        const kind = UPDATE_KIND_BY_CATEGORY[entry.category];
        return kind ? [{ kind, text: entry.text }] : [];
      })
      .slice(0, ENTRIES_PER_RELEASE);
    if (entries.length > 0) {
      recent.push({ version: release.version, entries });
    }
    if (recent.length >= RECENT_RELEASES) {
      break;
    }
  }
  return recent;
}

export async function getStaticProps({
  params
}: GetStaticPropsContext<PagesRouteParamsType>) {
  const pageParams = new PagesRouteParams(params);

  const [messages, recentReleases] = await Promise.all([
    pageParams.getI18nMessages(aboutI18nNamespace),
    loadRecentReleases()
  ]);

  return {
    props: {
      messages,
      recentReleases
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
