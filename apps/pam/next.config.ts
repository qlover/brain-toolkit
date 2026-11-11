import { createPamenvPlugin } from '@pamenv/next';
import createNextIntlPlugin from 'next-intl/plugin';
import { generateApiRoutes } from './tools/generateApiRoutes';
import { generateAppThemeCss } from './tools/generateAppThemeCss';
import { generateLocales } from './tools/generateLocales';
import { getLocalIpAddress } from './tools/getLocalIpAddress';
import { syncDocsContent } from './tools/syncDocsContent';
import type { NextConfig } from 'next';

const withNextIntl = createNextIntlPlugin('./src/i18n/request.ts');

/** 固定 apps/pam，避免 monorepo 下 process.cwd() 漂移导致快照写丢。 */
const PAMENV_APP_ROOT = __dirname;

/**
 * PAM 自托管 Production：禁止构建期 OIDC 打自己（鸡生蛋），改走平台环境变量。
 * Preview / 本地仍可用插件；`PAMENV_ENABLED=0` 仍可全局强制关闭。
 */
const isPamVercelProduction =
  process.env.VERCEL === '1' && process.env.VERCEL_ENV === 'production';

/**
 * 构建期 / `next dev` 注入 PAM 环境。
 * `PAM_ENV` 由 package.json 脚本提供（`local` | `dev`；暂无独立 prod）。
 *
 * ### Production vs Preview（同一 `pnpm build`）
 * - Production（`VERCEL_ENV=production`）：`enabled: false`，并内联
 *   `PAMENV_ENABLED=0`，build / runtime 都只用 Vercel 平台变量。
 * - Preview：开插件 + OIDC + 密封快照（打已稳定的 Production PAM）。
 */
const withPamenv = createPamenvPlugin({
  /** PAM 项目 slug */
  slug: 'pam',
  /** 要拉取的 PAM 环境名，与脚本里的 `PAM_ENV` 对齐 */
  env: process.env.PAM_ENV,
  /** 快照与 .pam 相对此目录 */
  cwd: PAMENV_APP_ROOT,
  /** Vercel 上用 OIDC 换票；本地走 .pam 登录 */
  oidc: 'vercel',
  /** 打印路径 / 键名等元数据（不含变量值） */
  debug: true,
  /**
   * Production 关插件；Preview / 本地开。
   * 也可被 `PAMENV_ENABLED=0` 强制关闭（同时关掉 runtime 解封）。
   */
  enabled: !isPamVercelProduction
});

generateApiRoutes(__dirname, { outFile: './shared/config/apiRoutes.ts' }).catch(
  (error) => {
    console.error('Failed to generate API routes:', error);
  }
);

// 在构建开始时生成本地化文件（传入当前 config 所在目录作为项目根）
generateLocales(__dirname, {
  identifierDir: './shared/config/i18n-identifier'
}).catch((error) => {
  console.error('Failed to generate locales:', error);
});

try {
  generateAppThemeCss(__dirname);
} catch (error) {
  console.error('Failed to generate app theme CSS:', error);
}

// 把 CHANGELOG / pamenv README 复制进 app 内的 content/，
// 让 SSG 读盘路径静态可判定，避免 Turbopack 把整仓 trace 进 NFT 清单。
try {
  syncDocsContent(__dirname);
} catch (error) {
  console.error('Failed to sync docs content:', error);
}

const localIp = getLocalIpAddress();

const nextConfig: NextConfig = {
  // reactStrictMode: false,
  // pages 路由需要
  // Bundle kit + bridge ESM packages so Node does not hit
  // ERR_UNSUPPORTED_DIR_IMPORT on corekit-bridge's `export * from "./bootstrap"`.
  transpilePackages: [
    '@qlover/fe-corekit',
    '@qlover/corekit-bridge',
    '@qlover/next-kit',
    '@brain-toolkit/element-sizer',
    '@brain-toolkit/react-kit',
    '@brain-toolkit/next-app-kit'
  ],
  /** Avoid bundling Node HTTP proxy stack / pamenv CLI into Route handlers. */
  serverExternalPackages: [
    'node-fetch',
    'https-proxy-agent',
    'pamenv-cli',
    '@pamenv/next'
  ],
  /**
   * 密封快照仅构建期 fs 写出、运行时 fs 读取，NFT 默认不追踪；
   * `.pam/` 又在 gitignore，须显式 include 进 Serverless 产物。
   */
  outputFileTracingIncludes: {
    '/**/*': ['./.pam/deploy-snapshot.json']
  },
  env: {
    PAM_ENV: process.env.PAM_ENV,
    /**
     * Production：内联关闭解封，强制走平台变量（无密封快照）。
     * Preview：不设，沿用 OIDC 写出的快照路径。
     */
    ...(isPamVercelProduction
      ? { PAMENV_ENABLED: '0' }
      : {
          /** 运行时 ensure 与构建写出同一相对约定；绝对路径在构建机与函数间不可移植 */
          PAMENV_SNAPSHOT_PATH: '.pam/deploy-snapshot.json'
        })
  },
  allowedDevOrigins: localIp ? [localIp as string] : [],
  /**
   * 本文件的构建期副作用（生成 locales / apiRoutes / 主题 CSS、复制文档副本）
   * 含 fs 与动态路径，Turbopack 在 trace middleware 时会判定为「整仓被追踪」。
   * 这些读盘只发生在构建机、不进运行时产物，故按路径精确静默；
   * 不要放宽到全局匹配，以免掩盖真正的 NFT 问题。
   */
  turbopack: {
    ignoreIssue: [
      {
        path: 'apps/pam/next.config.ts',
        title: 'Encountered unexpected file in NFT list'
      },
      {
        path: 'packages/pamenv/dist/index.js',
        title: 'Dynamic filesystem access causes tracing of the whole project'
      },
      {
        path: 'packages/pamenv-next/dist/index.js',
        title: 'Dynamic filesystem access causes tracing of the whole project'
      }
    ]
  }
};

export default withPamenv(withNextIntl(nextConfig));
