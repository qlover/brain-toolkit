'use client';

import {
  CubeTransparentIcon,
  DocumentTextIcon
} from '@heroicons/react/24/outline';
import { usePageI18nMapping } from '@qlover/next-kit/client';
import { clsx } from 'clsx';
import { Link } from '@/i18n/routing';
import type { CliDocsI18nInterface } from '@config/i18n-mapping/cliDocsI18n';
import { API_REFERENCE, ROUTE_DOCS_OAUTH } from '@config/route';
import type { ReactNode } from 'react';

const sectionClass = 'scroll-mt-24';
const headingClass =
  'text-lg font-semibold text-primary-text border-b border-primary-border pb-2 mb-4';
const proseClass = 'text-secondary-text text-sm leading-relaxed mb-4';
const codeBlockClass =
  'rounded-lg border border-primary-border bg-elevated p-4 overflow-x-auto';
const codeLineClass = 'text-sm font-mono text-secondary-text whitespace-pre';

function CodeBlock({ children }: { children: string }) {
  return (
    <pre data-testid="CodeBlock" className={codeBlockClass}>
      <code className={codeLineClass}>{children}</code>
    </pre>
  );
}

function DocSection({
  id,
  title,
  children
}: {
  id: string;
  title: string;
  children: ReactNode;
}) {
  return (
    <section
      data-testid="DocSection"
      id={id}
      className={clsx(sectionClass, 'mb-10')}
    >
      <h2 className={headingClass}>{title}</h2>
      {children}
    </section>
  );
}

const linkButtonClass =
  'inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-primary-border bg-primary text-primary-text text-sm font-medium hover:bg-elevated transition';

const INSTALL_SNIPPET = `npm install -g pamenv-cli
# or
npx pamenv --help

# monorepo
pnpm --filter pamenv-cli build
pnpm pamenv --help`;

const COMMANDS_SNIPPET = `pamenv login
pamenv projects
pamenv init
pamenv init -o ./packages/app
pamenv pull <slug|id>
pamenv pull <slug|id> -e staging
pamenv pull <slug|id> -e staging -f
pamenv push <slug|id> -e staging
pamenv push <slug|id> -e staging -y
pamenv push <slug|id> -e staging -f
pamenv push <slug|id> -e staging --show-values
pamenv logout`;

const INIT_SNIPPET = `pamenv login
cd your-project
pamenv init
# then upload variables
pamenv push <slug> -e local`;

const SENSITIVE_SNIPPET = `# DB password
# pam:sensitive
API_TOKEN=xxxx # production only
NORMAL=1`;

export function CliDocsContent() {
  const tt = usePageI18nMapping<CliDocsI18nInterface>();

  return (
    <article
      data-testid="CliDocsContent"
      className="mx-auto w-full max-w-3xl flex-1 px-4 py-8 sm:px-6 sm:py-12"
    >
      <header className="mb-10">
        <h1 className="text-2xl sm:text-3xl font-bold text-primary-text mb-3">
          {tt.title}
        </h1>
        <p className={proseClass}>{tt.intro}</p>
        <div className="flex flex-wrap gap-3">
          <Link href={ROUTE_DOCS_OAUTH} className={linkButtonClass}>
            <DocumentTextIcon className="h-4 w-4" />
            {tt.linkOauth}
          </Link>
          <a
            href={API_REFERENCE}
            className={linkButtonClass}
            target="_blank"
            rel="noopener noreferrer"
          >
            <CubeTransparentIcon className="h-5 w-5" />
            {tt.linkApi}
          </a>
        </div>
      </header>

      <DocSection id="install" title={tt.sectionInstall}>
        <p className={proseClass}>{tt.installBody}</p>
        <CodeBlock>{INSTALL_SNIPPET}</CodeBlock>
      </DocSection>

      <DocSection id="login" title={tt.sectionLogin}>
        <p className={proseClass}>{tt.loginBody}</p>
        <CodeBlock>{`pamenv login
pamenv logout`}</CodeBlock>
      </DocSection>

      <DocSection id="commands" title={tt.sectionCommands}>
        <p className={proseClass}>{tt.commandsBody}</p>
        <CodeBlock>{COMMANDS_SNIPPET}</CodeBlock>
      </DocSection>

      <DocSection id="init" title={tt.sectionInit}>
        <p className={proseClass}>{tt.initBody}</p>
        <CodeBlock>{INIT_SNIPPET}</CodeBlock>
      </DocSection>

      <DocSection id="sync" title={tt.sectionSync}>
        <p className={proseClass}>{tt.syncBody}</p>
      </DocSection>

      <DocSection id="sensitive" title={tt.sectionSensitive}>
        <p className={proseClass}>{tt.sensitiveBody}</p>
        <CodeBlock>{SENSITIVE_SNIPPET}</CodeBlock>
      </DocSection>

      <DocSection id="notes" title={tt.sectionNotes}>
        <p className={proseClass}>{tt.notesBody}</p>
      </DocSection>
    </article>
  );
}
