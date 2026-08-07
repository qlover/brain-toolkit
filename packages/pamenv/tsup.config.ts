import { defineConfig } from 'tsup';
import { generatePamenvLocales } from './tools/generateLocales.mjs';

/**
 * pamenv-cli build: minified JS (no sourcemaps) + generated dist/locales.
 */
export default defineConfig([
  {
    entry: ['src/index.ts'],
    format: ['esm', 'cjs'],
    dts: false,
    sourcemap: false,
    clean: true,
    minify: true,
    outDir: 'dist'
  },
  {
    entry: ['src/cli.ts'],
    format: ['esm'],
    dts: false,
    sourcemap: false,
    clean: false,
    minify: true,
    outDir: 'dist',
    banner: {
      js: '#!/usr/bin/env node'
    },
    async onSuccess() {
      await generatePamenvLocales();
      console.log('[pamenv] generated dist/locales');
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
