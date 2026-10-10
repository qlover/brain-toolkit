import ReactMarkdown, { type Components } from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { docsMarkdownComponents } from '@/uikit/components-app/docs/CliDocsContent';

/** Docs styles with tighter headings: descriptions live in panels, not full pages. */
const descMarkdownComponents: Components = {
  ...docsMarkdownComponents,
  h1: ({ children }) => (
    <h1
      data-testid="descMarkdownComponents"
      className="mt-5 mb-2 text-lg font-semibold text-primary-text first:mt-0"
    >
      {children}
    </h1>
  ),
  h2: ({ children }) => (
    <h2
      data-testid="descMarkdownComponents"
      className="mt-5 mb-2 border-b border-primary-border pb-1.5 text-base font-semibold text-primary-text first:mt-0"
    >
      {children}
    </h2>
  ),
  h3: ({ children }) => (
    <h3
      data-testid="descMarkdownComponents"
      className="mt-4 mb-1.5 text-sm font-semibold text-primary-text first:mt-0"
    >
      {children}
    </h3>
  ),
  p: ({ children }) => (
    <p
      data-testid="descMarkdownComponents"
      className="mb-3 text-sm leading-relaxed text-secondary-text last:mb-0"
    >
      {children}
    </p>
  )
};

export function PAMProjectDescMarkdown({ markdown }: { markdown: string }) {
  return (
    <div data-testid="PAMProjectDescMarkdown" className="min-w-0 break-words">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={descMarkdownComponents}
      >
        {markdown}
      </ReactMarkdown>
    </div>
  );
}
