import { defineConfig } from 'tsup';

const entry = {
  index: 'src/index.ts',
  'feedback/index': 'src/feedback/index.ts'
};

/**
 * 双入口：根协议 + /feedback 编排；esm/cjs + 独立 dts。
 */
export default defineConfig([
  {
    entry,
    format: ['esm', 'cjs'],
    dts: false,
    sourcemap: true,
    clean: true,
    minify: process.env.NODE_ENV === 'production',
    external: ['jsonwebtoken'],
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
    external: ['jsonwebtoken'],
    outDir: 'dist'
  }
]);
