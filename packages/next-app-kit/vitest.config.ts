import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'jsdom',
    globals: true,
    watch: false,
    include: ['__tests__/**/*.test.{ts,tsx}'],
    server: {
      deps: {
        inline: ['@qlover/corekit-bridge']
      }
    }
  }
});
