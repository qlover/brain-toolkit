'use client';

/**
 * Marketing landing: hero + product preview, how-it-works, CLI snippet,
 * and a short public-projects list.
 */
import { usePageI18nMapping } from '@qlover/next-kit/client';
import { clsx } from 'clsx';
import { Link } from '@/i18n/routing';
import type { HomeI18nInterface } from '@config/i18n-mapping/homeI18n';
import {
  ROUTE_DOCS_CLI,
  ROUTE_DOCS_OAUTH,
  ROUTE_LOGIN,
  ROUTE_PROJECT_GENERAL,
  ROUTE_PROJECTS
} from '@config/route';
import type { SearchPAMProject } from '@schemas/PAMProjectSchema';
import { getPAMAvatarLetter } from '../components/pam/PAMProjectDisplayUtil';
import { useUserAuth } from '../hook/useUserAuth';

const CLI_SNIPPET = `npm install -g pamenv-cli
pamenv login
pamenv pull <slug> -e local`;

const FEATURED_LIMIT = 4;

export type HomeLandingProps = {
  featuredProjects?: readonly SearchPAMProject[];
  /** PAM app version from package.json (e.g. `2.3.0`). */
  appVersion?: string;
};

export function HomeLanding({
  featuredProjects = [],
  appVersion
}: HomeLandingProps) {
  const tt = usePageI18nMapping<HomeI18nInterface>();
  const { success: isAuthenticated, loading: authLoading } = useUserAuth();
  const previewEnvs = tt.previewEnvs.split(',').map((s) => s.trim());
  const featured = featuredProjects.slice(0, FEATURED_LIMIT);
  const steps = [
    { title: tt.step1Title, body: tt.step1Body },
    { title: tt.step2Title, body: tt.step2Body },
    { title: tt.step3Title, body: tt.step3Body }
  ];

  return (
    <div
      data-testid="HomeLanding"
      className="relative flex flex-1 flex-col bg-primary"
    >
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 h-112 bg-linear-to-b from-elevated/70 via-primary to-primary"
      />

      <section
        data-testid="HomeLandingHero"
        className="relative mx-auto grid w-full max-w-6xl gap-10 px-4 py-14 sm:px-6 sm:py-20 lg:grid-cols-2 lg:items-center lg:gap-14 lg:px-8"
      >
        <div data-testid="HomeLandingHeroCopy">
          <p className="mb-4 text-sm font-medium tracking-wide text-tertiary-text">
            {tt.heroBadge}
          </p>
          <h1 className="text-4xl font-semibold tracking-tight text-primary-text sm:text-5xl">
            {tt.title}
          </h1>
          <p className="mt-4 text-lg text-secondary-text sm:text-xl">
            {tt.heroTitle1}
          </p>
          <p className="mt-1 text-base text-tertiary-text sm:text-lg">
            {tt.heroTitle2}
          </p>
          <p className="mt-6 max-w-xl text-sm leading-relaxed text-secondary-text sm:text-base">
            {tt.heroDesc}
          </p>

          <div className="mt-10 flex flex-col items-stretch gap-3 sm:flex-row sm:items-center">
            <Link
              href={ROUTE_PROJECTS}
              className="inline-flex items-center justify-center rounded-[10px] bg-brand px-5 py-2.5 text-sm font-medium text-on-brand shadow-sm transition hover:bg-brand-hover active:bg-brand-active"
            >
              {tt.heroProjects}
            </Link>
            {!authLoading && !isAuthenticated ? (
              <Link
                href={ROUTE_LOGIN}
                className="inline-flex items-center justify-center rounded-[10px] border border-primary-border bg-primary px-5 py-2.5 text-sm font-medium text-primary-text transition hover:bg-elevated"
              >
                {tt.heroLogin}
              </Link>
            ) : null}
            <Link
              href={ROUTE_DOCS_CLI}
              className="inline-flex items-center justify-center px-2 py-2.5 text-sm font-medium text-secondary-text transition hover:text-primary-text sm:ml-1"
            >
              {tt.heroDocs}
            </Link>
          </div>

          <nav
            className="mt-8 flex flex-wrap gap-x-6 gap-y-2 text-sm"
            aria-label="Docs"
          >
            <Link
              href={ROUTE_DOCS_CLI}
              className="text-secondary-text transition hover:text-brand"
            >
              {tt.linkCli}
            </Link>
            <Link
              href={ROUTE_DOCS_OAUTH}
              className="text-secondary-text transition hover:text-brand"
            >
              {tt.linkOauth}
            </Link>
          </nav>
        </div>

        <div
          data-testid="HomeLandingPreview"
          className="min-w-0 rounded-xl border border-primary-border bg-primary/80 shadow-sm backdrop-blur-sm"
        >
          <div className="flex items-center justify-between border-b border-primary-border px-4 py-2.5">
            <p className="text-xs font-medium text-tertiary-text">
              {tt.previewCaption}
            </p>
            <span className="flex gap-1.5" aria-hidden>
              <span className="h-2 w-2 rounded-full bg-elevated" />
              <span className="h-2 w-2 rounded-full bg-elevated" />
              <span className="h-2 w-2 rounded-full bg-elevated" />
            </span>
          </div>
          <div className="space-y-4 p-4">
            <div className="flex items-center gap-3">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-primary-border bg-elevated text-sm font-bold text-brand">
                {getPAMAvatarLetter(tt.previewProject)}
              </span>
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold text-primary-text">
                  {tt.previewProject}
                </p>
                <p className="truncate font-mono text-xs text-tertiary-text">
                  sample-app
                </p>
              </div>
            </div>

            <div className="flex flex-wrap gap-2">
              {previewEnvs.map((env, index) => (
                <span
                  key={env}
                  data-testid={`HomeLandingPreviewEnv-${env}`}
                  className={clsx(
                    'rounded-md border px-2.5 py-1 text-xs font-medium',
                    index === 0
                      ? 'border-brand/40 bg-brand/10 text-brand'
                      : 'border-primary-border text-secondary-text'
                  )}
                >
                  {env}
                </span>
              ))}
            </div>

            <div className="rounded-lg border border-primary-border bg-elevated px-3 py-2.5">
              <p className="font-mono text-xs text-secondary-text">
                <span className="text-tertiary-text">{tt.previewVar}</span>
                <span className="text-tertiary-text">=</span>
                <span className="text-primary-text">••••••••</span>
              </p>
            </div>

            <pre className="overflow-x-auto rounded-lg border border-primary-border bg-elevated p-3 font-mono text-xs leading-relaxed text-secondary-text">
              <code>{`pamenv pull sample-app -e local
# .env.local updated`}</code>
            </pre>
          </div>
        </div>
      </section>

      <section
        data-testid="HomeLandingSteps"
        className="relative border-t border-primary-border"
      >
        <div className="mx-auto w-full max-w-6xl px-4 py-12 sm:px-6 sm:py-16 lg:px-8">
          <h2 className="text-lg font-semibold text-primary-text">
            {tt.stepsTitle}
          </h2>
          <ol className="mt-8 grid gap-8 sm:grid-cols-3 sm:gap-6">
            {steps.map((step, index) => (
              <li
                key={step.title}
                data-testid={`HomeLandingStep-${index + 1}`}
                className="min-w-0"
              >
                <p className="font-mono text-xs font-semibold text-brand">
                  {String(index + 1).padStart(2, '0')}
                </p>
                <h3 className="mt-2 text-base font-semibold text-primary-text">
                  {step.title}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-secondary-text">
                  {step.body}
                </p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section
        data-testid="HomeLandingCli"
        className="relative border-t border-primary-border bg-elevated/30"
      >
        <div className="mx-auto grid w-full max-w-6xl gap-6 px-4 py-12 sm:px-6 sm:py-14 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.2fr)] lg:items-center lg:gap-10 lg:px-8">
          <div data-testid="HomeLandingCliCopy">
            <h2 className="text-lg font-semibold text-primary-text">
              {tt.cliTitle}
            </h2>
            <p className="mt-2 text-sm leading-relaxed text-secondary-text">
              {tt.cliBody}
            </p>
            <Link
              href={ROUTE_DOCS_CLI}
              className="mt-4 inline-flex text-sm font-medium text-brand transition hover:text-brand-hover"
            >
              {tt.linkCli}
            </Link>
          </div>
          <pre
            data-testid="HomeLandingCliSnippet"
            className="overflow-x-auto rounded-[10px] border border-primary-border bg-primary p-4 font-mono text-sm leading-relaxed text-secondary-text"
          >
            <code>{CLI_SNIPPET}</code>
          </pre>
        </div>
      </section>

      {featured.length > 0 ? (
        <section
          data-testid="HomeLandingFeatured"
          className="relative border-t border-primary-border"
        >
          <div className="mx-auto w-full max-w-6xl px-4 py-12 sm:px-6 sm:py-14 lg:px-8">
            <div className="flex items-baseline justify-between gap-4">
              <h2 className="text-lg font-semibold text-primary-text">
                {tt.featuredTitle}
              </h2>
              <Link
                href={ROUTE_PROJECTS}
                className="shrink-0 text-sm font-medium text-brand transition hover:text-brand-hover"
              >
                {tt.featuredViewAll}
              </Link>
            </div>
            <ul className="mt-6 divide-y divide-primary-border border-y border-primary-border">
              {featured.map((project) => (
                <li
                  key={project.id}
                  data-testid={`HomeLandingFeatured-${project.slug}`}
                >
                  <Link
                    href={{
                      pathname: ROUTE_PROJECT_GENERAL,
                      params: { projectId: project.slug }
                    }}
                    className="flex items-center gap-3 py-3.5 transition hover:bg-elevated/50"
                  >
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-primary-border bg-elevated text-sm font-bold text-brand">
                      {getPAMAvatarLetter(project.name)}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-semibold text-primary-text">
                        {project.name}
                      </span>
                      <span className="block truncate font-mono text-xs text-tertiary-text">
                        {project.slug}
                      </span>
                    </span>
                    {project.description ? (
                      <span className="hidden max-w-xs truncate text-sm text-secondary-text md:block">
                        {project.description}
                      </span>
                    ) : null}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </section>
      ) : null}

      <footer
        data-testid="HomeLandingFooter"
        className="relative mt-auto border-t border-primary-border"
      >
        <div className="mx-auto flex w-full max-w-6xl flex-col gap-2 px-4 py-8 text-sm text-secondary-text sm:flex-row sm:items-center sm:justify-between sm:px-6 lg:px-8">
          <p>
            © {new Date().getFullYear()} {tt.title}
            <span className="text-tertiary-text"> · </span>
            {tt.footerTagline}
          </p>
          <p className="font-mono text-xs text-tertiary-text">
            PAM{appVersion ? ` v${appVersion}` : ''}
          </p>
        </div>
      </footer>
    </div>
  );
}
