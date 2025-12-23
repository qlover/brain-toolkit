import { defineConfig } from 'tsup';
import pkg from './package.json';
import { toPureCamelCase } from '../../tools/toPureCamelCase';
import { outExtension, outExtensionMini } from '../../tools/outExtension';

const pkgName = toPureCamelCase(pkg.name);
export default defineConfig([
  {
    entry: ['src/index.ts'],
    format: ['cjs', 'iife'],
    dts: false,
    minify: false,
    clean: true,
    silent: true,
    globalName: pkgName,
    treeshake: true,
    outExtension: outExtension,
    outDir: 'dist'
  },
  {
    entry: ['src/index.ts'],
    format: ['esm'],
    splitting: false,
    dts: {
      compilerOptions: {
        composite: false,
        incremental: false,
        tsBuildInfoFile: undefined
      }
    },
    treeshake: true
  },
  {
    entry: ['src/index.ts'],
    format: 'iife',
    minify: true,
    splitting: false,
    dts: false,
    globalName: pkgName,
    outExtension: outExtensionMini
  }
]);
