import { defineConfig } from 'tsup';

const entry = {
  index: 'src/index.ts',
  'react/index': 'src/react/index.ts'
};

export default defineConfig([
  {
    entry,
    format: ['esm', 'cjs'],
    dts: false,
    sourcemap: true,
    clean: true,
    minify: process.env.NODE_ENV === 'production',
    external: ['react'],
    outDir: 'dist'
  },
  {
    entry,
    format: 'esm',
    dts: {
      only: true,
      compilerOptions: {
        composite: false,
        incremental: false,
        tsBuildInfoFile: undefined
      }
    },
    external: ['react'],
    outDir: 'dist'
  }
]);
