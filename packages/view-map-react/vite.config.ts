import { defineConfig } from 'vitest/config';
import dts from 'vite-plugin-dts';

export default defineConfig({
  build: {
    minify: false,
    lib: {
      entry: ['./src/index.ts'],
      name: 'view-map-react',
      formats: ['es', 'cjs']
    }
  },
  plugins: [
    dts({
      include: ['src'],
      exclude: ['src/**/*.test.ts', 'src/**/*.test.tsx'],
      tsconfigPath: './tsconfig.json',
      rollupTypes: false
    })
  ]
});
