import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'path';

/**
 * Vite configuration for brain-user example
 */
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@brain-toolkit/brain-user': resolve(
        __dirname,
        '../../packages/brain-user/src'
      )
    }
  },
  server: {
    port: 3001,
    open: true
  }
});

