import { readFile } from 'node:fs/promises';
import path from 'node:path';

export interface PamChangelogRelease {
  version: string;
  /** 某个 `## <version>` 标题下的一段 Markdown 正文。 */
  body: string;
}

export interface PamChangelogEntry {
  /** `####` 标题去掉前导 emoji 后的分类名，如 `Features`。 */
  category: string;
  scope: string | null;
  text: string;
}

/**
 * 读取 `content/CHANGELOG.md` 并按版本切分，新版本在前。
 *
 * ### 为何读 `content/` 而不是仓库根
 * 读取路径被静态限定在 app 内的 `content` 子目录（官方建议的
 * `path.join(process.cwd(), 'content', file)` 形态），Turbopack 可界定
 * 追踪范围；若直接读 `../../packages/...` 这类跳出 app 根的动态路径，
 * 会被判定为「整仓被 trace」并把源码打进 serverless 清单。
 * `content/` 由 `next.config.ts` 在构建期从真源复制，避免两份内容漂移。
 *
 * @returns 按版本切分后的发布列表，新版本在前
 */
export async function readPamChangelog(): Promise<PamChangelogRelease[]> {
  const file = path.join(process.cwd(), 'content', 'CHANGELOG.md');
  return parsePamChangelog(await readFile(file, 'utf8'));
}

/**
 * 把发布工具生成的 CHANGELOG 按 `## <version>` 切分，新版本在前。
 *
 * @param markdown - 原始 CHANGELOG Markdown 文本
 * @returns 按版本切分后的发布列表
 */
export function parsePamChangelog(markdown: string): PamChangelogRelease[] {
  const releases: PamChangelogRelease[] = [];
  let current: PamChangelogRelease | null = null;
  const lines: string[] = [];

  const flush = (): void => {
    if (current) {
      current.body = lines.join('\n').trim();
      releases.push(current);
    }
    lines.length = 0;
  };

  for (const line of markdown.replace(/\r\n/g, '\n').split('\n')) {
    const heading = /^##\s+(.+?)\s*$/.exec(line);
    if (heading) {
      flush();
      current = { version: heading[1]!, body: '' };
      continue;
    }
    if (current) {
      lines.push(line);
    }
  }
  flush();

  return releases;
}

/**
 * 取某版本正文里的一级 bullet，压成纯文本（去掉 commit / PR 链接）。
 *
 * @param body - {@link parsePamChangelog} 得到的单个版本正文
 * @returns 分类后的条目列表，供 About 页「最近更新」摘要使用
 */
export function summarizePamChangelogRelease(
  body: string
): PamChangelogEntry[] {
  const entries: PamChangelogEntry[] = [];
  let category = '';

  for (const line of body.split('\n')) {
    const heading = /^####\s+(.+?)\s*$/.exec(line);
    if (heading) {
      category = heading[1]!.replace(/^[^\p{L}]+/u, '');
      continue;
    }
    const bullet = /^- (.+)$/.exec(line);
    if (!bullet) {
      continue;
    }
    let text = bullet[1]!
      .replace(/\s*\(\[[^\]]*\]\([^)]*\)\)/g, '')
      .replace(/\[([^\]]*)\]\([^)]*\)/g, '$1')
      .trim();
    let scope: string | null = null;
    const scoped = /^\*\*([^*]+?):\*\*\s*(.*)$/.exec(text);
    if (scoped) {
      scope = scoped[1]!;
      text = scoped[2]!;
    }
    if (text) {
      entries.push({ category, scope, text });
    }
  }

  return entries;
}
