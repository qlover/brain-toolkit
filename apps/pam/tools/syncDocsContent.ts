import { copyFileSync, existsSync, mkdirSync } from 'fs';
import { join } from 'path';

/**
 * 把页面需要的 Markdown（CHANGELOG / pamenv README）复制到 `apps/pam/content`。
 *
 * ### 为何要复制
 * 页面在 SSG 期需要这些文件全文，但直接读 monorepo 其它目录（`../../packages/...`）
 * 属于「动态路径 + 跳出 app 根」，Turbopack 无法静态界定范围，会把整仓 trace
 * 进 NFT 清单并报 *Encountered unexpected file in NFT list*。
 * 复制到 app 内的固定子目录后，读取路径是静态常量，问题消失；
 * 源文件仍是唯一真源，只是每次构建刷新副本。
 *
 * @param projectRoot - app 根目录（含 next.config.ts）
 * @returns 复制到的目标目录
 */
export function syncDocsContent(projectRoot: string): string {
  const targetDir = join(projectRoot, 'content');
  mkdirSync(targetDir, { recursive: true });

  const copies: Array<{ from: string; to: string }> = [
    {
      from: join(projectRoot, 'CHANGELOG.md'),
      to: join(targetDir, 'CHANGELOG.md')
    },
    {
      from: join(projectRoot, '..', '..', 'packages', 'pamenv', 'README.md'),
      to: join(targetDir, 'PAMENV_README.md')
    },
    {
      from: join(projectRoot, '..', '..', 'packages', 'pamenv', 'README_EN.md'),
      to: join(targetDir, 'PAMENV_README_EN.md')
    }
  ];

  for (const { from, to } of copies) {
    if (!existsSync(from)) {
      throw new Error(`docs source not found: ${from}`);
    }
    copyFileSync(from, to);
  }

  return targetDir;
}
