import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import { resolve } from 'path';
import dts from 'vite-plugin-dts';

/**
 * Vite configuration for antd-blocks package
 *
 * Features:
 * - Preserves source module structure for better tree-shaking
 * - Generates both ES and CommonJS formats
 * - Supports flexible imports:
 *   - @brain-toolkit/antd-blocks (main entry)
 *   - @brain-toolkit/antd-blocks/resourceTable (module entry)
 *   - @brain-toolkit/antd-blocks/resourceTable/ResourceEvent (single file)
 */
export default defineConfig({
  plugins: [
    react(),
    dts({
      include: ['src/**/*'],
      outDir: 'dist',
      entryRoot: 'src',
      staticImport: true,
      rollupTypes: false, // 关键：在 preserveModules 模式下设为 false
      insertTypesEntry: false, // 不生成单独的 types 入口
      copyDtsFiles: true // 复制所有 d.ts 文件
    })
  ],
  build: {
    lib: {
      entry: {
        index: resolve(__dirname, 'src/index.ts'),
        'resourceTable/index': resolve(__dirname, 'src/resourceTable/index.ts')
      },
      formats: ['es', 'cjs']
    },
    rollupOptions: {
      // External dependencies that shouldn't be bundled
      // All dependencies are external, only bundle src code
      external: [
        'react',
        'react-dom',
        'react/jsx-runtime',
        'antd',
        '@ant-design/icons',
        /@brain-toolkit\/.*/,
        /@qlover\/.*/
      ],
      output: [
        {
          format: 'es',
          dir: 'dist',
          entryFileNames: '[name].js',
          preserveModules: true,
          preserveModulesRoot: 'src',
          exports: 'named',
          // 确保入口文件不被优化掉
          hoistTransitiveImports: false
        },
        {
          format: 'cjs',
          dir: 'dist',
          entryFileNames: '[name].cjs',
          preserveModules: true,
          preserveModulesRoot: 'src',
          exports: 'named',
          // 确保入口文件不被优化掉
          hoistTransitiveImports: false
        }
      ]
    },
    // Optimize for library builds
    minify: false,
    sourcemap: false
  },
  test: {
    environment: 'jsdom',
    globals: true,
    watch: false,
    include: ['__tests__/**/*.test.{ts,tsx}'],
    exclude: [
      '**/node_modules/**',
      '**/dist/**',
      '**/build/**',
      '**/.changelog/**',
      '**/.github/**',
      '**/.husky/**',
      '**/.vscode/**',
      '**/.nx/**'
    ]
  }
});
