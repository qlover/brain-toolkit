import { isPAMGitHostUrl } from './PAMSiteIconUtil';

/**
 * Lightweight helpers for list views: read a project's Markdown description
 * without loading a Markdown renderer.
 */

export type PAMDescLinkKind = 'design' | 'issue' | 'doc' | 'link';

export interface PAMDescLink {
  title: string;
  url: string;
  kind: PAMDescLinkKind;
}

const LINK_RE = /\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)/g;

const KIND_RULES: readonly { kind: PAMDescLinkKind; hosts: RegExp }[] = [
  {
    kind: 'design',
    hosts: /(^|\.)figma\.com$|(^|\.)mastergo\.com$|(^|\.)lanhuapp\.com$/
  },
  {
    kind: 'issue',
    hosts: /(^|\.)atlassian\.net$|(^|\.)linear\.app$|(^|\.)tapd\.cn$/
  },
  {
    kind: 'doc',
    hosts:
      /(^|\.)(feishu\.cn|larksuite\.com|notion\.so|notion\.site|yuque\.com|confluence\.[^.]+|apifox\.com|swagger\.io)$/
  }
];

export function getPAMDescLinkKind(url: string): PAMDescLinkKind {
  let host = '';
  try {
    host = new URL(url).hostname.toLowerCase();
  } catch {
    return 'link';
  }
  return KIND_RULES.find((rule) => rule.hosts.test(host))?.kind ?? 'link';
}

/** Strip inline Markdown so a paragraph can be shown as plain text. */
function stripInlineMarkdown(text: string): string {
  return text
    .replace(/!\[[^\]]*\]\([^)]*\)/g, '')
    .replace(/\[([^\]]+)\]\([^)]*\)/g, '$1')
    .replace(/`([^`]+)`/g, '$1')
    .replace(/(\*\*|__)(.+?)\1/g, '$2')
    .replace(/(\*|_)(.+?)\1/g, '$2')
    .replace(/~~(.+?)~~/g, '$1')
    .replace(/\s+/g, ' ')
    .trim();
}

const NON_PARAGRAPH_RE = /^(#{1,6}\s|[-*+]\s|\d+\.\s|>|```|\||---|\*\*\*)/;

/**
 * First body paragraph (headings, lists, quotes, code and tables are skipped),
 * as plain text. Plain-text descriptions are returned as-is (whitespace collapsed).
 */
export function extractPAMDescSummary(desc: string | null | undefined): string {
  const blocks = (desc || '').split(/\n\s*\n/);
  for (const block of blocks) {
    const first = block.trim();
    if (!first || NON_PARAGRAPH_RE.test(first)) {
      continue;
    }
    const text = stripInlineMarkdown(first);
    if (text) {
      return text;
    }
  }
  return '';
}

/**
 * `[title](url)` links in the description, de-duplicated by URL.
 * Repository hosts are skipped: the repo is already reachable via `repo_url`.
 */
export function extractPAMDescLinks(
  desc: string | null | undefined
): PAMDescLink[] {
  const links: PAMDescLink[] = [];
  const seen = new Set<string>();
  for (const match of (desc || '').matchAll(LINK_RE)) {
    const [, title, url] = match;
    if (seen.has(url) || isPAMGitHostUrl(url)) {
      continue;
    }
    seen.add(url);
    links.push({ title: title.trim(), url, kind: getPAMDescLinkKind(url) });
  }
  return links;
}
