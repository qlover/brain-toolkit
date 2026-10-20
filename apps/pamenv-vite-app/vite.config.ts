import pamenv from '@pamenv/vite';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    pamenv({
      // PAM project slug — create/bind this project, then: pamenv login --local
      slug: 'pamenv-vite-test-app',
      env: 'local',
      debug: process.env.PAMENV_DEBUG === '1',
      // 只按 Vite 公开前缀告警；传 [] 可关闭该告警
      clientPublicPrefixes: ['VITE_']
    }),
    react()
  ]
});
