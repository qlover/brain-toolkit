import { createPamenvPlugin } from '@pamenv/next';
import createNextIntlPlugin from 'next-intl/plugin';
import { generateApiRoutes } from './tools/generateApiRoutes';
import { generateAppThemeCss } from './tools/generateAppThemeCss';
import { generateLocales } from './tools/generateLocales';
import { getLocalIpAddress } from './tools/getLocalIpAddress';
import type { NextConfig } from 'next';

const withNextIntl = createNextIntlPlugin('./src/i18n/request.ts');

/** 固定 apps/brain-oauth，避免 monorepo 下 process.cwd() 漂移。 */
const PAMENV_APP_ROOT = __dirname;

/**
 * 解析 PAM 环境名：显式 `PAM_ENV` 优先；否则按 Vercel 部署面映射。
 * - Preview → `preview`
 * - Production → `dev`（暂无独立 prod PAM 环境）
 * - 本地 → `local`
 */
function resolvePamEnv(): string {
  const explicit = process.env.PAM_ENV?.trim();
  if (explicit) {
    return explicit;
  }
  if (process.env.VERCEL === '1') {
    if (process.env.VERCEL_ENV === 'preview') {
      return 'preview';
    }
    if (process.env.VERCEL_ENV === 'production') {
      return 'dev';
    }
  }
  return 'local';
}

const resolvedPamEnv = resolvePamEnv();

/**
 * 构建期 / `next dev` 注入 PAM 环境。
 * brain-oauth 非 PAM 自托管：Production 也保持插件开启（OIDC + 密封快照）。
 */
const withPamenv = createPamenvPlugin({
  slug: 'brain-oauth',
  env: resolvedPamEnv,
  cwd: PAMENV_APP_ROOT,
  oidc: 'vercel',
  keepEnv: ['APP_ENV'],
  debug: true,
  enabled: true
});

generateApiRoutes(__dirname, { outFile: './shared/config/apiRoutes.ts' }).catch(
  (error) => {
    console.error('Failed to generate API routes:', error);
  }
);

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

const localIp = getLocalIpAddress();

const nextConfig: NextConfig = {
  transpilePackages: [
    '@qlover/fe-corekit',
    '@qlover/corekit-bridge',
    '@qlover/next-kit',
    '@brain-toolkit/react-kit',
    '@brain-toolkit/next-app-kit'
  ],
  serverExternalPackages: [
    'node-fetch',
    'https-proxy-agent',
    'pamenv-cli',
    '@pamenv/next'
  ],
  outputFileTracingIncludes: {
    '/**/*': ['./.pam/deploy-snapshot.json']
  },
  env: {
    APP_ENV: process.env.APP_ENV,
    PAM_ENV: resolvedPamEnv,
    PAMENV_SNAPSHOT_PATH: '.pam/deploy-snapshot.json'
  },
  allowedDevOrigins: localIp ? [localIp as string] : []
};

export default withPamenv(withNextIntl(nextConfig));
