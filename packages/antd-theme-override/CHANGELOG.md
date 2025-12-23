# @brain-toolkit/antd-theme-override

## 0.1.1

### Patch Changes

#### 🐞 Bug Fixes

- Update package.json and README files to enhance formatting and add new package details ([88c5ad5](https://github.com/qlover/brain-toolkit/commit/88c5ad5b277c98a4189ce175c89732f491f4734e)) ([#27](https://github.com/qlover/brain-toolkit/pull/27))
  - Modified the prettier script in package.json to include markdown files for formatting.
  - Updated README files to improve table formatting and added a new online demo link for the @brain-toolkit/brain-user package.
  - Enhanced documentation for the @brain-toolkit/element-sizer and @brain-toolkit/antd-theme-override packages with clearer examples and configuration options.
  - Cleaned up whitespace and formatting inconsistencies across various documentation files.

## 0.1.0

### Minor Changes

#### ✨ Features

- Enhance TypeScript and ESLint configurations for improved type safety and code quality ([f1338e6](https://github.com/qlover/brain-toolkit/commit/f1338e65317ce287db1db537b1d6e8dd167652c4)) ([#25](https://github.com/qlover/brain-toolkit/pull/25))
  - Added `@typescript-eslint/consistent-type-imports` rule to enforce consistent type imports across the codebase.
  - Updated TypeScript configuration to use `moduleResolution: "bundler"` for better module handling.
  - Refactored imports in various test files and services to utilize `import type` for type-only imports, enhancing clarity and performance.
  - Updated dependencies in `pnpm-lock.yaml` to include the latest version of `@react-oauth/google` for improved functionality.

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

## 0.0.4

### Patch Changes

#### ✨ Features

- Add new packages and enhance build scripts ([fdecb64](https://github.com/qlover/brain-toolkit/commit/fdecb64edda8daf459e2ef00e1b218848b424b88)) ([#19](https://github.com/qlover/brain-toolkit/pull/19))
  - Introduced new packages: @brain-toolkit/antd-theme-override, @brain-toolkit/bridge, @brain-toolkit/element-sizer, and @brain-toolkit/ts2locales, each with their own build configurations.
  - Updated package.json to include a new script for force building with Nx.
  - Modified CI workflows to utilize the new nx:build:force command for building packages, addressing cache issues in CI environments.

  Co-authored-by: github-actions[bot] <github-actions[bot]@users.noreply.github.com>

## 0.0.3

### Patch Changes

#### 🐞 Bug Fixes

- **antd-theme-override:** Add helper function for directory resolution ([dcc2f16](https://github.com/qlover/brain-toolkit/commit/dcc2f16a518dec6a53d04162eb77c27d6902b14e)) ([#15](https://github.com/qlover/brain-toolkit/pull/15))
  - Introduced a `getDirname` function to handle directory resolution for both ESM and CJS environments, improving compatibility across different module systems.
  - Updated the `templatePath` resolution in the Vite plugin to utilize the new helper function, ensuring correct path handling regardless of the module type.

## 0.0.2

### Patch Changes

#### ✨ Features

- **antd-theme-override:** Introduce @brain-toolkit/antd-theme-override package ([d88b2ba](https://github.com/qlover/brain-toolkit/commit/d88b2baead5769c0773011894549d7e91524c770)) ([#13](https://github.com/qlover/brain-toolkit/pull/13))
  - Added a new package for managing and overriding Ant Design themes and global APIs.
  - Implemented core components including AntdThemeProvider and AntdStaticProvider for theme management and static API handling.
  - Integrated Vite for build processes and included TypeScript support.
  - Created comprehensive documentation in both English and Chinese, detailing features, installation, usage, and configuration options.
  - Added CHANGELOG for tracking changes and updates.

  Co-authored-by: QRJ <renjie.qin@brain.im>

#### 📝 Documentation

- Update README files to include new package and improve clarity ([8b570e8](https://github.com/qlover/brain-toolkit/commit/8b570e84ef23e2da504734bdbd7f9b025f503e72)) ([#13](https://github.com/qlover/brain-toolkit/pull/13))

- Added links to the English and Chinese versions in both README files.
- Updated the description of the toolkit to enhance clarity.
- Included the new @brain-toolkit/antd-theme-override package in the tools list for better visibility.
