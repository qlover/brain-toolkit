# @brain-toolkit/ts2locales

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

## 0.2.4

### Patch Changes

#### ✨ Features

- Add new packages and enhance build scripts ([fdecb64](https://github.com/qlover/brain-toolkit/commit/fdecb64edda8daf459e2ef00e1b218848b424b88)) ([#19](https://github.com/qlover/brain-toolkit/pull/19))
  - Introduced new packages: @brain-toolkit/antd-theme-override, @brain-toolkit/bridge, @brain-toolkit/element-sizer, and @brain-toolkit/ts2locales, each with their own build configurations.
  - Updated package.json to include a new script for force building with Nx.
  - Modified CI workflows to utilize the new nx:build:force command for building packages, addressing cache issues in CI environments.

  Co-authored-by: github-actions[bot] <github-actions[bot]@users.noreply.github.com>

#### ♻️ Refactors

- **tests:** replace rmdirSync with rmSync for directory cleanup ([f33f8ad](https://github.com/qlover/brain-toolkit/commit/f33f8ade9f9a3795131ecd0b1120d8b41e983b25)) ([#17](https://github.com/qlover/brain-toolkit/pull/17))
  - Updated test files to use rmSync instead of rmdirSync for removing test directories, ensuring compatibility with Node.js file system operations.
  - Added force option to rmSync calls to handle non-empty directories during cleanup.

## 0.2.3

### Patch Changes

#### ✨ Features

- **ts2locales:** Add new package for TypeScript localization utilities ([891348c](https://github.com/qlover/brain-toolkit/commit/891348c11924c82974a29fe160d27f45447c407b)) ([#11](https://github.com/qlover/brain-toolkit/pull/11))
  - Introduced the @brain-toolkit/ts2locales package to facilitate internationalization by extracting and generating localization files from TypeScript source files.
  - Implemented core functionality in Ts2Locales class, including methods for parsing source files and generating locale-specific JSON files.
  - Added configuration files, README, and CHANGELOG for the new package.
  - Integrated with Vite for seamless localization during build processes.

  Co-authored-by: QRJ <renjie.qin@brain.im>

- **ts2locales:** Enhance README and add tests for ts2locales package ([be9eb80](https://github.com/qlover/brain-toolkit/commit/be9eb80f16bda1daaefa8da59fe344141b764594)) ([#11](https://github.com/qlover/brain-toolkit/pull/11))
  - Updated README files to include the new @brain-toolkit/ts2locales package, detailing its features, installation, and usage instructions.
  - Added comprehensive test cases for the Ts2Locales class, covering parsing, validation, and file generation functionalities.
  - Introduced Vite plugin tests to ensure proper integration and functionality within Vite projects.
  - Improved documentation clarity and structure for better developer experience.

  Co-authored-by: QRJ <renjie.qin@brain.im>
