# @brain-toolkit/element-sizer

## 0.3.0

### Minor Changes

#### ✨ Features

- Enhance TypeScript and ESLint configurations for improved type safety and code quality ([f1338e6](https://github.com/qlover/brain-toolkit/commit/f1338e65317ce287db1db537b1d6e8dd167652c4)) ([#25](https://github.com/qlover/brain-toolkit/pull/25))
  - Added `@typescript-eslint/consistent-type-imports` rule to enforce consistent type imports across the codebase.
  - Updated TypeScript configuration to use `moduleResolution: "bundler"` for better module handling.
  - Refactored imports in various test files and services to utilize `import type` for type-only imports, enhancing clarity and performance.
  - Updated dependencies in `pnpm-lock.yaml` to include the latest version of `@react-oauth/google` for improved functionality.

#### 🐞 Bug Fixes

- Update TypeScript configuration across multiple packages ([197805e](https://github.com/qlover/brain-toolkit/commit/197805e34e2ca80ab5f15afbeedaa2da808f077e)) ([#25](https://github.com/qlover/brain-toolkit/pull/25))
  - Added `tsBuildInfoFile: undefined` to the TypeScript compiler options in the tsup.config.ts files for brain-user, bridge, element-sizer, and ts2locales packages.
  - Ensured consistency in TypeScript settings by updating the incremental build option across these packages.

#### ♻️ Refactors

- Update ESLint and TypeScript configurations for improved performance and type safety ([b54b406](https://github.com/qlover/brain-toolkit/commit/b54b406d443d2ffd95c02ce8493f908ff59953a9)) ([#25](https://github.com/qlover/brain-toolkit/pull/25))
  - Simplified ESLint configuration by removing unused globals and optimizing linting rules for JavaScript and TypeScript files.
  - Introduced a new TypeScript configuration file for tests, enhancing type-checking and excluding unnecessary files.
  - Updated package.json scripts for linting and type-checking to improve performance with caching.
  - Refactored TypeScript settings across multiple packages to ensure consistent compiler options and output directories.
  - Removed obsolete example files and configurations to streamline the project structure.

- Clean up imports and improve code formatting across multiple files ([009f1b7](https://github.com/qlover/brain-toolkit/commit/009f1b710c106ae97accfa7cfc4ca8c901f87290)) ([#25](https://github.com/qlover/brain-toolkit/pull/25))
  - Refactored import statements to use consistent type-only imports for clarity and performance.
  - Enhanced formatting in various files, including test cases and configuration files, for better readability.
  - Removed unnecessary trailing whitespace in several files to maintain a clean codebase.
  - Updated TypeScript configuration to ensure consistent exclusion patterns across packages.

## 0.2.3

### Patch Changes

#### ✨ Features

- Add new packages and enhance build scripts ([fdecb64](https://github.com/qlover/brain-toolkit/commit/fdecb64edda8daf459e2ef00e1b218848b424b88)) ([#19](https://github.com/qlover/brain-toolkit/pull/19))
  - Introduced new packages: @brain-toolkit/antd-theme-override, @brain-toolkit/bridge, @brain-toolkit/element-sizer, and @brain-toolkit/ts2locales, each with their own build configurations.
  - Updated package.json to include a new script for force building with Nx.
  - Modified CI workflows to utilize the new nx:build:force command for building packages, addressing cache issues in CI environments.

  Co-authored-by: github-actions[bot] <github-actions[bot]@users.noreply.github.com>

## 0.2.2

### Patch Changes

#### ♻️ Refactors

- **ElementSizer:** Update repository and homepage URLs in element-sizer package.json ([9a0e7be](https://github.com/qlover/brain-toolkit/commit/9a0e7be536ff8db4681e695bbc88b986e2a335e4)) ([#8](https://github.com/qlover/brain-toolkit/pull/8))
  - Changed repository URL to reflect the new project location in brain-toolkit.
  - Updated homepage URL to match the new project structure.

## 0.2.1

### Patch Changes

#### ✨ Features

- **ElementResizer:** Add mock implementation for ElementResizer class ([cfbe003](https://github.com/qlover/brain-toolkit/commit/cfbe0036ade3d5d4552f0e3155a9f895343ffacf)) ([#6](https://github.com/qlover/brain-toolkit/pull/6))
  - Introduced a new mock file for the ElementResizer class to facilitate testing.
  - Implemented mock methods for expand, collapse, fixedCurrentTargetRect, and cancelAnimation.
  - Added utility functions for size calculations and element rect retrieval to enhance testing capabilities.

## 0.2.0

### Minor Changes

#### ✨ Features

- **ElementSizer:** Add Element Resizer package with comprehensive tests and configuration files ([60ef22c](https://github.com/qlover/brain-toolkit/commit/60ef22cd76b1dadb023ac45115d51fc48437493e)) ([#1](https://github.com/qlover/brain-toolkit/pull/1))
  - Introduced `@brain-toolkit/element-sizer` package for managing element resize animations.
  - Implemented core functionality in `src/index.ts` with options for target elements, animation states, and placeholder management.
  - Added extensive unit tests in `__tests__/index.test.ts` to validate behavior and edge cases.
  - Updated `vite.config.ts` to use jsdom environment for testing.
  - Included necessary configuration files such as `package.json`, `tsconfig.json`, and changelog for the new package.

#### 📝 Documentation

- **ElementSizer:** Add detailed README documentation for Element Resizer package ([6ccb857](https://github.com/qlover/brain-toolkit/commit/6ccb8571cf3b00ee87f59a4a2e839f8c016252fa)) ([#1](https://github.com/qlover/brain-toolkit/pull/1))
  - Expanded README_EN.md and README.md to include comprehensive usage instructions, API documentation, and examples for the Element Resizer package.
  - Highlighted features, installation steps, and advanced usage scenarios to enhance user understanding and facilitate quick integration.
  - Included troubleshooting tips and performance optimization notes to assist developers in effectively utilizing the package.
