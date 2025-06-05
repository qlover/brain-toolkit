import { defineConfig } from 'tsup';

export default defineConfig([
  {
    entry: ['src/index.ts'],
    format: ['esm', 'cjs'],
    dts: false,
    sourcemap: true,
    clean: true,
    minify: process.env.NODE_ENV === 'production',
    outDir: 'dist'
  },
  {
    entry: ['src/vite/index.ts'],
    format: ['esm', 'cjs'],
    dts: false,
    sourcemap: true,
    clean: true,
    minify: process.env.NODE_ENV === 'production',
    outDir: 'dist/vite'
  },
  {
    entry: ['src/index.ts'],
    format: 'esm',
    dts: true,
    outDir: 'dist'
  },
  {
    entry: ['src/vite/index.ts'],
    format: 'esm',
    dts: true,
    outDir: 'dist/vite'
  }
]);
