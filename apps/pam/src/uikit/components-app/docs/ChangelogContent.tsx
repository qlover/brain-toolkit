import { ChevronRightIcon } from '@heroicons/react/24/outline';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { docsMarkdownComponents } from './CliDocsContent';

const EXPANDED_RELEASES = 3;

export interface ChangelogContentProps {
  releases: readonly { version: string; body: string }[];
  currentVersion: string;
  githubUrl: string;
  tt: {
    title: string;
    description: string;
    current: string;
    viewOnGithub: string;
  };
}

export function ChangelogContent({
  releases,
  currentVersion,
  githubUrl,
  tt
}: ChangelogContentProps) {
  return (
    <article
      data-testid="ChangelogContent"
      className="mx-auto w-full max-w-3xl flex-1 px-4 py-8 sm:px-6 sm:py-12"
    >
      <header className="mb-8">
        <h1 className="mb-3 text-2xl font-bold text-primary-text sm:text-3xl">
          {tt.title}
        </h1>
        <p className="text-sm leading-relaxed text-secondary-text">
          {tt.description}
          <span className="text-tertiary-text"> · </span>
          <a
            href={githubUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-brand hover:text-brand-hover"
          >
            {tt.viewOnGithub}
          </a>
        </p>
      </header>

      <div className="flex flex-col gap-3">
        {releases.map((release, index) => (
          <details
            key={release.version}
            id={`v${release.version}`}
            data-testid="ChangelogRelease"
            open={index < EXPANDED_RELEASES}
            className="group rounded-xl border border-primary-border bg-bg-container"
          >
            <summary className="flex cursor-pointer list-none items-center gap-2 px-4 py-3 sm:px-5 [&::-webkit-details-marker]:hidden">
              <ChevronRightIcon className="h-4 w-4 shrink-0 text-tertiary-text transition-transform group-open:rotate-90" />
              <span className="font-mono text-base font-semibold text-primary-text">
                v{release.version}
              </span>
              {release.version === currentVersion ? (
                <span className="rounded-full bg-brand/10 px-2 py-0.5 text-xs font-medium text-brand">
                  {tt.current}
                </span>
              ) : null}
            </summary>
            <div className="border-t border-primary-border px-4 pb-2 pt-1 sm:px-5 [&>h3:first-child]:mt-4">
              <ReactMarkdown
                remarkPlugins={[remarkGfm]}
                components={docsMarkdownComponents}
              >
                {release.body}
              </ReactMarkdown>
            </div>
          </details>
        ))}
      </div>
    </article>
  );
}
