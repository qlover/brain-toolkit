import { defineConfig } from 'tsup';

export default defineConfig([
  {
    entry: ['src/index.ts'],
    format: ['esm', 'cjs'],
    dts: false,
    sourcemap: true,
    clean: true,
    minify: false,
    outDir: 'dist'
  },
  {
    entry: ['src/cli.ts'],
    format: ['esm'],
    dts: false,
    sourcemap: true,
    clean: false,
    minify: false,
    outDir: 'dist',
    banner: {
      js: '#!/usr/bin/env node'
    }
  },
  {
    entry: ['src/index.ts'],
    format: 'esm',
    splitting: false,
    bundle: false,
    dts: {
      compilerOptions: {
        composite: false,
        incremental: false,
        tsBuildInfoFile: undefined
      }
    },
    outDir: 'dist'
  }
]);
