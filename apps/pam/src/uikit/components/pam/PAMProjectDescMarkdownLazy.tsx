'use client';

import dynamic from 'next/dynamic';

/** Markdown renderer loaded on first use, so it stays out of the list and other tabs' first load. */
export const PAMProjectDescMarkdownLazy = dynamic(
  () =>
    import('./PAMProjectDescMarkdown').then((m) => m.PAMProjectDescMarkdown),
  {
    ssr: false,
    loading: () => (
      <div
        data-testid="PAMProjectDescMarkdown"
        className="animate-pulse space-y-2"
        aria-hidden
      >
        <div className="h-3 w-full rounded bg-elevated" />
        <div className="h-3 w-4/5 rounded bg-elevated" />
        <div className="h-3 w-2/3 rounded bg-elevated" />
      </div>
    )
  }
);
