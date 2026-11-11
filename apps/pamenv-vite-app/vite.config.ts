import path from 'node:path';
import { fileURLToPath } from 'node:url';
import pamenv from '@pamenv/vite';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

const appRoot = path.dirname(fileURLToPath(import.meta.url));

/**
 * 示例：本地 `vite` 走 .pam；GitHub Actions `vite build` 走 oidc github。
 * 复用 PAM 项目 `pamenv-ci-smoke`（dev 需含 `VITE_PAMENV_CI_SMOKE`）。
 */
export default defineConfig({
  plugins: [
    pamenv({
      slug: 'pamenv-ci-smoke',
      env: process.env.PAM_ENV ?? 'local',
      cwd: appRoot,
      oidc: 'github',
      debug: process.env.PAMENV_DEBUG === '1',
      clientPublicPrefixes: ['VITE_']
    }),
    react()
  ]
});
