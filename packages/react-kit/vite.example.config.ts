import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'path';

/**
 * Vite configuration for react-kit examples
 *
 * This configuration is used to run the interactive examples
 * in the example directory during development
 */
export default defineConfig({
  plugins: [react()],
  root: resolve(__dirname, 'example'),
  publicDir: resolve(__dirname, 'example/public'),
  server: {
    port: 3010,
    open: true
  },
  resolve: {
    alias: {
      '@brain-toolkit/react-kit': resolve(__dirname, 'src'),
      '@brain-toolkit/react-kit/hooks': resolve(__dirname, 'src/hooks')
    }
  },
  build: {
    outDir: resolve(__dirname, 'example/dist'),
    emptyOutDir: true
  }
});
