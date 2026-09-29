'use client';

import {
  Cog6ToothIcon,
  CommandLineIcon,
  FingerPrintIcon,
  LockClosedIcon,
  Squares2X2Icon,
  UserGroupIcon
} from '@heroicons/react/24/outline';
import { clsx } from 'clsx';
import { useLocale } from 'next-intl';
import type { AboutI18nInterface } from '@config/i18n-mapping/AboutI18n';
import { ROUTE_CHANGELOG } from '@config/route';
import { GithubIcon } from '../components/icons';
import { LocaleLink } from '../components/LocaleLink';

export type AboutUpdateKind = 'feature' | 'fix';

export interface AboutRecentRelease {
  version: string;
  entries: { kind: AboutUpdateKind; text: string }[];
}

export interface AboutContentProps {
  tt: AboutI18nInterface;
  version: string;
  githubUrl: string;
  recentReleases: readonly AboutRecentRelease[];
}

export function AboutContent({
  tt,
  version,
  githubUrl,
  recentReleases
}: AboutContentProps) {
  const locale = useLocale();
  const features = [
    { icon: Squares2X2Icon, title: tt.feature1Title, desc: tt.feature1Desc },
    { icon: LockClosedIcon, title: tt.feature2Title, desc: tt.feature2Desc },
    { icon: UserGroupIcon, title: tt.feature3Title, desc: tt.feature3Desc },
    { icon: CommandLineIcon, title: tt.feature4Title, desc: tt.feature4Desc },
    { icon: FingerPrintIcon, title: tt.feature5Title, desc: tt.feature5Desc },
    { icon: Cog6ToothIcon, title: tt.feature6Title, desc: tt.feature6Desc }
  ];

  return (
    <div
      data-testid="AboutContent"
      className="mx-auto w-full max-w-5xl flex-1 px-4 py-10 sm:px-6 sm:py-14 lg:px-8"
    >
      <section data-testid="AboutIntro" className="max-w-3xl">
        <p className="mb-4 text-sm font-medium tracking-wide text-tertiary-text">
          {tt.badge}
        </p>
        <h1 className="text-3xl font-semibold tracking-tight text-primary-text sm:text-4xl">
          {tt.introTitle}
        </h1>
        <div className="mt-6 space-y-4 text-sm leading-relaxed text-secondary-text sm:text-base">
          <p>{tt.introP1}</p>
          <p>{tt.introP2}</p>
          <p>{tt.introP3}</p>
        </div>
        <div className="mt-6 flex flex-wrap items-center gap-3">
          <a
            href={githubUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 rounded-[10px] border border-primary-border bg-primary px-4 py-2 text-sm font-medium text-primary-text transition hover:bg-elevated"
          >
            <GithubIcon className="h-4 w-4" />
            {tt.introGithub}
          </a>
          <span className="inline-flex items-center gap-2 rounded-full border border-primary-border px-3 py-1 text-xs text-tertiary-text">
            {tt.versionLabel}
            <span className="font-mono font-medium text-brand">v{version}</span>
          </span>
        </div>
      </section>

      <section data-testid="AboutFeatures" className="mt-14">
        <h2 className="text-lg font-semibold text-primary-text">
          {tt.featuresTitle}
        </h2>
        <ul className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {features.map(({ icon: Icon, title, desc }) => (
            <li
              data-testid="AboutContent"
              key={title}
              className="rounded-xl border border-primary-border bg-bg-container p-5"
            >
              <Icon className="h-6 w-6 text-brand" />
              <h3 className="mt-3 text-sm font-semibold text-primary-text">
                {title}
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-secondary-text">
                {desc}
              </p>
            </li>
          ))}
        </ul>
      </section>

      {recentReleases.length > 0 ? (
        <section data-testid="AboutRecentUpdates" className="mt-14">
          <div className="flex flex-wrap items-baseline justify-between gap-2">
            <h2 className="text-lg font-semibold text-primary-text">
              {tt.updatesTitle}
            </h2>
            <LocaleLink
              href={ROUTE_CHANGELOG}
              locale={locale}
              title={tt.updatesViewAll}
              className="text-sm font-medium text-brand transition hover:text-brand-hover"
            >
              {tt.updatesViewAll}
            </LocaleLink>
          </div>
          <ol className="mt-6 space-y-6 border-l border-primary-border pl-5">
            {recentReleases.map((release) => (
              <li
                data-testid="AboutContent"
                key={release.version}
                className="relative"
              >
                <span className="absolute -left-[25px] top-1.5 h-2.5 w-2.5 rounded-full bg-brand" />
                <LocaleLink
                  href={{
                    pathname: ROUTE_CHANGELOG,
                    hash: `v${release.version}`
                  }}
                  locale={locale}
                  title={`v${release.version}`}
                  className="font-mono text-sm font-semibold text-primary-text transition hover:text-brand"
                >
                  v{release.version}
                </LocaleLink>
                <ul className="mt-2 space-y-1.5">
                  {release.entries.map((entry) => (
                    <li
                      data-testid="AboutContent"
                      key={`${entry.kind}-${entry.text}`}
                      className="flex items-start gap-2 text-sm leading-relaxed text-secondary-text"
                    >
                      <span
                        className={clsx(
                          'mt-0.5 shrink-0 rounded px-1.5 py-0.5 text-[11px] font-medium leading-none',
                          entry.kind === 'feature'
                            ? 'bg-brand/10 text-brand'
                            : 'bg-elevated text-tertiary-text'
                        )}
                      >
                        {entry.kind === 'feature'
                          ? tt.updatesFeature
                          : tt.updatesFix}
                      </span>
                      <span className="min-w-0">{entry.text}</span>
                    </li>
                  ))}
                </ul>
              </li>
            ))}
          </ol>
        </section>
      ) : null}
    </div>
  );
}
