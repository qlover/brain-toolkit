import { defineConfig } from 'tsup';
import pkg from './package.json';
import { toPureCamelCase } from '../../tools/toPureCamelCase.js';
import { builtinModules } from 'module';

const pkgName = toPureCamelCase(pkg.name);
const external = [
  ...builtinModules,
  ...builtinModules.map((mod) => `node:${mod}`),
  ...Object.keys(pkg.dependencies || {})
];

export default defineConfig([
  // Main entry: CJS format
  {
    entry: ['src/index.ts'],
    format: ['cjs'],
    dts: false,
    minify: false,
    clean: true,
    silent: true,
    bundle: false,
    outExtension: () => ({ js: '.cjs' }),
    outDir: 'dist'
  },
  // Main entry: ESM format with TypeScript declarations
  {
    entry: ['src/index.ts'],
    format: ['esm'],
    splitting: false,
    dts: {
      compilerOptions: {
        composite: false,
        incremental: false
      }
    },
    minify: false,
    silent: true,
    bundle: false,
    outDir: 'dist',
    external
  },
  // Main entry: IIFE format for CDN usage
  {
    entry: ['src/index.ts'],
    format: ['iife'],
    dts: false,
    minify: false,
    silent: true,
    globalName: pkgName,
    outExtension: () => ({ js: '.iife.js' }),
    outDir: 'dist'
  },
  {
    entry: ['src/index.ts'],
    format: ['iife'],
    dts: false,
    minify: true,
    globalName: pkgName,
    outExtension: () => ({ js: '.min.iife.js' }),
    outDir: 'dist'
  }
]);

