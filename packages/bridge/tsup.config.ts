import { defineConfig } from 'tsup';
import pkg from './package.json';
import { toPureCamelCase } from '../../make/toPureCamelCase';
import { outExtension, outExtensionMini } from '../../make/outExtension';

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
    dts: true,
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
