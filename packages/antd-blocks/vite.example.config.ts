import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'path';

/**
 * Vite configuration for antd-blocks examples
 *
 * This configuration is used to run the interactive examples
 * in the example directory during development
 */
export default defineConfig({
  plugins: [react()],
  root: resolve(__dirname, 'example'),
  publicDir: resolve(__dirname, 'example/public'),
  server: {
    port: 3000,
    open: true
  },
  resolve: {
    alias: {
      '@brain-toolkit/antd-blocks': resolve(__dirname, 'src'),
      '@brain-toolkit/antd-blocks/resourceTable': resolve(
        __dirname,
        'src/resourceTable'
      )
    }
  },
  build: {
    outDir: resolve(__dirname, 'example/dist'),
    emptyOutDir: true
  }
});
