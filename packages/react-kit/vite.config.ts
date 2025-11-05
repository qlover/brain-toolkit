import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import { resolve } from 'path';
import dts from 'vite-plugin-dts';

/**
 * Vite configuration for react-kit package
 *
 * Features:
 * - Preserves source module structure for better tree-shaking
 * - Generates both ES and CommonJS formats
 * - Supports flexible imports:
 *   - @brain-toolkit/react-kit (main entry)
 *   - @brain-toolkit/react-kit/hooks (hooks entry)
 *   - @brain-toolkit/react-kit/hooks/useFactory (single hook)
 */
export default defineConfig({
  plugins: [
    react(),
    dts({
      include: ['src/**/*'],
      outDir: 'dist',
      entryRoot: 'src',
      staticImport: true,
      rollupTypes: false, // Critical: set to false in preserveModules mode
      insertTypesEntry: false, // Don't generate separate types entry
      copyDtsFiles: true, // Copy all d.ts files
      // Ensure JSDoc comments are preserved in generated .d.ts files
      compilerOptions: {
        removeComments: false,
        declaration: true,
        declarationMap: false
      }
    })
  ],
  build: {
    lib: {
      entry: {
        index: resolve(__dirname, 'src/index.ts'),
        'hooks/index': resolve(__dirname, 'src/hooks/index.ts')
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
          // Ensure entry files are not optimized away
          hoistTransitiveImports: false
        },
        {
          format: 'cjs',
          dir: 'dist',
          entryFileNames: '[name].cjs',
          preserveModules: true,
          preserveModulesRoot: 'src',
          exports: 'named',
          // Ensure entry files are not optimized away
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
