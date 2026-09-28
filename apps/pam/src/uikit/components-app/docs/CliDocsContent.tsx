import ReactMarkdown, { type Components } from 'react-markdown';
import remarkGfm from 'remark-gfm';

const components: Components = {
  h1: ({ children }) => (
    <h1
      data-testid="components"
      className="mb-3 text-2xl font-bold text-primary-text sm:text-3xl"
    >
      {children}
    </h1>
  ),
  h2: ({ children }) => (
    <h2
      data-testid="components"
      className="mb-4 mt-10 border-b border-primary-border pb-2 text-lg font-semibold text-primary-text"
    >
      {children}
    </h2>
  ),
  h3: ({ children }) => (
    <h3
      data-testid="components"
      className="mb-3 mt-6 text-base font-semibold text-primary-text"
    >
      {children}
    </h3>
  ),
  p: ({ children }) => (
    <p
      data-testid="components"
      className="mb-4 text-sm leading-relaxed text-secondary-text"
    >
      {children}
    </p>
  ),
  ul: ({ children }) => (
    <ul
      data-testid="components"
      className="mb-4 list-disc space-y-1 pl-5 text-sm leading-relaxed text-secondary-text"
    >
      {children}
    </ul>
  ),
  ol: ({ children }) => (
    <ol
      data-testid="components"
      className="mb-4 list-decimal space-y-1 pl-5 text-sm leading-relaxed text-secondary-text"
    >
      {children}
    </ol>
  ),
  strong: ({ children }) => (
    <strong
      data-testid="components"
      className="font-semibold text-primary-text"
    >
      {children}
    </strong>
  ),
  a: ({ children, href }) => (
    <a
      data-testid="components"
      href={href}
      className="text-brand hover:text-brand-hover"
      target="_blank"
      rel="noopener noreferrer"
    >
      {children}
    </a>
  ),
  pre: ({ children }) => (
    <pre
      data-testid="components"
      className="mb-4 overflow-x-auto rounded-lg border border-primary-border bg-elevated p-4 text-sm [&>code]:bg-transparent [&>code]:p-0"
    >
      {children}
    </pre>
  ),
  code: ({ children }) => (
    <code
      data-testid="components"
      className="rounded bg-elevated px-1 py-0.5 font-mono text-[0.85em] text-primary-text"
    >
      {children}
    </code>
  ),
  table: ({ children }) => (
    <div data-testid="components" className="mb-4 overflow-x-auto">
      <table className="w-full border-collapse text-left text-sm">
        {children}
      </table>
    </div>
  ),
  th: ({ children }) => (
    <th
      data-testid="components"
      className="border-b border-primary-border px-3 py-2 font-semibold text-primary-text"
    >
      {children}
    </th>
  ),
  td: ({ children }) => (
    <td
      data-testid="components"
      className="border-b border-primary-border px-3 py-2 align-top text-secondary-text"
    >
      {children}
    </td>
  ),
  hr: () => (
    <hr data-testid="components" className="my-8 border-primary-border" />
  )
};

export function CliDocsContent({ markdown }: { markdown: string }) {
  return (
    <article
      data-testid="CliDocsContent"
      className="mx-auto w-full max-w-3xl flex-1 px-4 py-8 sm:px-6 sm:py-12"
    >
      <ReactMarkdown remarkPlugins={[remarkGfm]} components={components}>
        {markdown}
      </ReactMarkdown>
    </article>
  );
}
