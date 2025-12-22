import js from '@eslint/js';
import qloverEslint from '@qlover/eslint-plugin';
import reactHooks from 'eslint-plugin-react-hooks';
import reactRefresh from 'eslint-plugin-react-refresh';
import tseslint from 'typescript-eslint';
import prettier from 'eslint-plugin-prettier';
import prettierConfig from './.prettierrc.js';

/**
 * @type {import('eslint').Linter.Config[]}
 */
export default tseslint.config([
  {
    ignores: [
      '**/dist/**',
      '**/build/**',
      '**/ts-build/**',
      '**/node_modules/**',
      '**/.nx/**',
      '**/.cache/**',
      '**/coverage/**',
      '**/*.d.ts',
      'vitest.setup.js',
      'packages/bridge'
    ]
  },

  {
    name: 'lint-general-js',
    files: ['**/*.{js,jsx}'],
    extends: [js.configs.recommended],
    languageOptions: {
      globals: {
        process: true,
        console: true
      }
    },
    plugins: {
      prettier: prettier
    },
    rules: {
      ...js.configs.recommended.rules,
      'prettier/prettier': ['error', prettierConfig],
      'spaced-comment': 'error'
    }
  },

  // TypeScript files without type checking (faster, for most rules)
  {
    name: 'lint-general-ts',
    files: ['**/*.{ts,tsx}'],
    ignores: ['**/*.test.{ts,tsx}', '**/*.spec.{ts,tsx}'],
    extends: [...tseslint.configs.recommended],
    languageOptions: {
      parserOptions: {
        // Removed projectService: true for better performance
        // Only enable if you need type-aware rules like:
        // - @typescript-eslint/await-thenable
        // - @typescript-eslint/no-floating-promises
        // - @typescript-eslint/no-misused-promises
        // - @typescript-eslint/require-await
        tsconfigRootDir: import.meta.dirname
      }
    },
    plugins: {
      '@qlover-eslint': qloverEslint,
      'react-hooks': reactHooks,
      'react-refresh': reactRefresh
    },
    rules: {
      ...reactHooks.configs.recommended.rules,
      ...qloverEslint.configs.recommended.rules,
      '@qlover-eslint/ts-class-override': 'off',
      '@qlover-eslint/require-root-testid': [
        'error',
        {
          exclude: '/Provider$/'
        }
      ],
      '@typescript-eslint/explicit-function-return-type': 'off',
      '@typescript-eslint/no-empty-object-type': 'off',
      '@typescript-eslint/no-explicit-any': 'off',
      '@typescript-eslint/no-unused-vars': [
        'error',
        {
          vars: 'all',
          varsIgnorePattern: '^_',
          args: 'after-used',
          argsIgnorePattern: '^_'
        }
      ],
      '@typescript-eslint/ban-ts-comment': 'off',
      // Type-checked rules
      '@typescript-eslint/require-await': 'off',
      'react-refresh/only-export-components': [
        'warn',
        { allowConstantExport: true }
      ]
    }
  }
]);
