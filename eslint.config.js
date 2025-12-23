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
      'vitest.setup.js'
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
      '@typescript-eslint/no-explicit-any': 'error',
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
  },

  // TypeScript files with type checking for ts-class-override rule
  // This enables full type information for accurate interface/class method detection
  {
    name: 'lint-ts-class-override',
    files: ['packages/**/*.{ts,tsx}', 'examples/**/*.{ts,tsx}'],
    ignores: [
      '**/dist/**',
      '**/build/**',
      '**/ts-build/**',
      '**/node_modules/**',
      '**/.nx/**',
      '**/.cache/**',
      '**/coverage/**',
      '**/*.config.ts',
      '**/*.d.ts',
      '**/templates/**',
      '**/*.test.ts',
      '**/__mocks__/**',
      '**/__tests__/**',
      '**/*.spec.ts'
    ],
    extends: [...tseslint.configs.recommendedTypeChecked],
    languageOptions: {
      parserOptions: {
        projectService: true,
        tsconfigRootDir: import.meta.dirname
      }
    },
    plugins: {
      '@qlover-eslint': qloverEslint
    },
    rules: {
      // Only enable ts-class-override rule with full type information
      '@qlover-eslint/ts-class-override': 'error',
      // Disable other type-checked rules to avoid performance impact
      '@typescript-eslint/ban-ts-comment': 'off',
      '@typescript-eslint/restrict-template-expressions': 'off',
      '@typescript-eslint/no-unsafe-assignment': 'off',
      '@typescript-eslint/no-unnecessary-type-assertion': 'off',
      '@typescript-eslint/no-redundant-type-constituents': 'off',
      '@typescript-eslint/no-unsafe-return': 'off',
      '@typescript-eslint/no-empty-object-type': 'off',
      '@typescript-eslint/no-unsafe-call': 'off',
      '@typescript-eslint/no-unsafe-member-access': 'off',
      '@typescript-eslint/no-unsafe-argument': 'off',
      '@typescript-eslint/no-unsafe-enum-comparison': 'off',
      '@typescript-eslint/no-unsafe-literal-comparison': 'off',
      '@typescript-eslint/no-unsafe-nullish-coalescing': 'off',
      '@typescript-eslint/no-unsafe-optional-chaining': 'off',
      '@typescript-eslint/unbound-method': 'off',
      '@typescript-eslint/await-thenable': 'off',
      '@typescript-eslint/no-floating-promises': 'off',
      '@typescript-eslint/no-misused-promises': 'off',
      '@typescript-eslint/require-await': 'off',
      '@typescript-eslint/no-base-to-string': 'off',
      '@typescript-eslint/prefer-promise-reject-errors': 'off',
      '@typescript-eslint/no-duplicate-type-constituents': 'off'
    }
  },

  // Test files
  {
    name: 'lint-test-ts',
    files: ['**/*.test.{ts,tsx}', '**/*.spec.{ts,tsx}'],
    extends: [...tseslint.configs.recommended],
    rules: {
      '@qlover-eslint/require-root-testid': 'off',
      '@typescript-eslint/no-explicit-any': 'off'
    }
  }
]);
