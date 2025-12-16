import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import { resolve } from 'path';

export default defineConfig({
  plugins: [react()],
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
    alias: {
      '@brain-toolkit/element-sizer': resolve(
        __dirname,
        'packages/element-sizer/__mocks__'
      )
    }
  }
});
