import { readFile } from 'node:fs/promises';
import path from 'node:path';

/** 构建期由 `tools/syncDocsContent.ts` 复制进来的文档目录。 */
const CONTENT_DIR_NAME = 'content';

/**
 * 返回 pamenv README Markdown（按 locale）。
 *
 * 读取路径被静态限定在 app 内的 `content` 子目录（官方建议的
 * `path.join(process.cwd(), 'content', file)` 形态），Turbopack 可界定
 * 追踪范围，不会把整仓 trace 进 serverless 清单。文件由 `next.config.ts`
 * 在构建期从 `packages/pamenv/README*.md` 复制，避免文案漂移。
 *
 * @param locale - 语言代码；非 `zh` 一律取英文版
 */
export async function readPamenvReadme(locale: string): Promise<string> {
  const fileName = locale === 'zh' ? 'PAMENV_README.md' : 'PAMENV_README_EN.md';
  const file = path.join(process.cwd(), CONTENT_DIR_NAME, fileName);
  return readFile(file, 'utf8');
}
