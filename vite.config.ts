import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',
    globals: true,
    watch: false,
    include: ['packages/**/__tests__/**/*.test.{ts,tsx}'],
    exclude: [
      // workspace:* case link to local package, has __tests__ folder
      'packages/**/node_modules/**'
    ],
    alias: {}
  }
});
