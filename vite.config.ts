import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import { resolve } from 'path';

export default defineConfig({
  plugins: [react()],
  resolve: {
    // Fix for @qlover/corekit-bridge directory import issue
    extensions: ['.mjs', '.js', '.ts', '.jsx', '.tsx', '.json'],
    alias: {
      '@brain-toolkit/element-sizer': resolve(
        __dirname,
        'packages/element-sizer/__mocks__'
      )
    }
  },
  server: {
    fs: {
      // Allow serving files from node_modules
      allow: ['..']
    }
  },
  test: {
    environment: 'jsdom',
    globals: true,
    watch: false,
    include: ['packages/**/__tests__/**/*.test.{ts,tsx}'],
    exclude: [
      '**/node_modules/**',
      '**/dist/**',
      '**/build/**',
      '**/.changelog/**',
      '**/.github/**',
      '**/.husky/**',
      '**/.vscode/**',
      '**/.nx/**'
    ],
    // Setup file for test environment
    setupFiles: ['./vitest.setup.js'],
    // Server configuration for test environment
    server: {
      deps: {
        // Inline problematic dependencies to avoid ES module issues
        inline: ['@qlover/corekit-bridge']
      }
    }
  }
});
