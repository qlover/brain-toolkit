import { defineConfig } from 'vitest/config';
import { resolve } from 'path';

export default defineConfig({
  test: {
    environment: 'jsdom',
    globals: true,
    watch: false,
    include: ['packages/**/__tests__/**/*.test.{ts,tsx}'],
    exclude: [
      // workspace:* case link to local package, has __tests__ folder
      'packages/**/node_modules/**'
    ],
    alias: {
      '@brain-toolkit/element-sizer': resolve(
        __dirname,
        'packages/element-sizer/__mocks__'
      )
    }
  },
  ssr: {
    noExternal: ['@qlover/corekit-bridge']
  }
});
