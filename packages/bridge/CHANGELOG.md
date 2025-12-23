# @brain-toolkit/bridge

## 0.1.0

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

## 0.0.2

### Patch Changes

#### ✨ Features

- Add new packages and enhance build scripts ([fdecb64](https://github.com/qlover/brain-toolkit/commit/fdecb64edda8daf459e2ef00e1b218848b424b88)) ([#19](https://github.com/qlover/brain-toolkit/pull/19))
  - Introduced new packages: @brain-toolkit/antd-theme-override, @brain-toolkit/bridge, @brain-toolkit/element-sizer, and @brain-toolkit/ts2locales, each with their own build configurations.
  - Updated package.json to include a new script for force building with Nx.
  - Modified CI workflows to utilize the new nx:build:force command for building packages, addressing cache issues in CI environments.

  Co-authored-by: github-actions[bot] <github-actions[bot]@users.noreply.github.com>

## 0.0.1

### Patch Changes

#### ✨ Features

- **bridge:** Introduce @brain-toolkit/bridge package with authentication API ([29e4b46](https://github.com/qlover/brain-toolkit/commit/29e4b466c409f5c48183c4ef897e7861d33efa81)) ([#17](https://github.com/qlover/brain-toolkit/pull/17))
  - Added the @brain-toolkit/bridge package, implementing the ImagicaAuthApi and ImagicaAuthService for user authentication.
  - Included core functionalities such as login, registration, and user info retrieval.
  - Established default configurations and storage options for token management.
  - Created comprehensive test suites for the authentication API and service to ensure reliability.
  - Updated pnpm-lock.yaml to include new dependencies and versions.

  Co-authored-by: QRJ <renjie.qin@brain.im>

- **imagica-auth:** add imagica auth ([e16d5a9](https://github.com/qlover/brain-toolkit/commit/e16d5a96be34904aecc942f718f5844ce241dc10)) ([#17](https://github.com/qlover/brain-toolkit/pull/17))

- **bridge:** update dependencies and enhance ImagicaAuth API ([b4f2d9e](https://github.com/qlover/brain-toolkit/commit/b4f2d9e00faab416d7130275ba4751cdc3654f3d)) ([#17](https://github.com/qlover/brain-toolkit/pull/17))
  - Updated @qlover/corekit-bridge to version 1.2.0 and @qlover/fe-corekit to version 1.5.0 in package.json.
  - Refactored ImagicaAuthApi and ImagicaAuthService to improve type safety and configuration handling.
  - Introduced new default options for user storage and credential management in consts.ts.
  - Enhanced request configuration and merged options functionality for better integration.
  - Updated pnpm-lock.yaml to reflect new dependency versions and configurations.

  Co-authored-by: QRJ <renjie.qin@brain.im>

- **bridge:** update ImagicaAuth API and improve test coverage ([de30de7](https://github.com/qlover/brain-toolkit/commit/de30de774c6e82d6d747b310a5cbf466a6b77bd5)) ([#17](https://github.com/qlover/brain-toolkit/pull/17))
  - Updated dependencies in pnpm-lock.yaml, including @types/node and various other packages for enhanced compatibility.
  - Refactored ImagicaAuthApi and ImagicaAuthService to improve type safety and configuration handling.
  - Introduced ImagicaAuthState for better state management in authentication processes.
  - Enhanced test cases for ImagicaAuthApi, focusing on constructor, request methods, and error handling.
  - Removed outdated ImagicaAuthService tests to streamline the test suite.

  Co-authored-by: QRJ <renjie.qin@brain.im>

- **bridge:** enhance ImagicaAuth tests and improve API integration ([03e07c4](https://github.com/qlover/brain-toolkit/commit/03e07c4d87238c6acca32441acb741f973b64d98)) ([#17](https://github.com/qlover/brain-toolkit/pull/17))
  - Updated ImagicaAuthApi and ImagicaAuthService tests to cover additional scenarios and edge cases.
  - Introduced new tests for ImagicaAuthPlugin to validate plugin functionality and response handling.
  - Enhanced existing tests for login, registration, and user info retrieval to ensure robust error handling and state management.
  - Refactored test setup to improve clarity and maintainability.
  - Added real request tests for ImagicaAuthService to validate integration with the actual API.

  Co-authored-by: QRJ <renjie.qin@brain.im>

- **bridge:** update dependencies and configuration for build process ([33300e4](https://github.com/qlover/brain-toolkit/commit/33300e477bfc3e753d3a6887769a3094fbe04597)) ([#17](https://github.com/qlover/brain-toolkit/pull/17))
  - Updated dependencies in pnpm-lock.yaml, including @qlover/corekit-bridge to version 1.4.0 and @qlover/fe-corekit to version 2.0.1.
  - Replaced Rollup configuration with tsup for building the bridge package, streamlining the build process.
  - Added new utility functions for output file extensions and package name formatting.
  - Removed outdated TypeScript configuration files to simplify the project structure.

#### ♻️ Refactors

- **bridge:** streamline configuration and enhance ImagicaAuthService tests ([ba374db](https://github.com/qlover/brain-toolkit/commit/ba374db2c2b1230305df74c542cf1ae5e89070d5)) ([#17](https://github.com/qlover/brain-toolkit/pull/17))
  - Removed workspaces configuration from package.json for simplification.
  - Updated Vite SSR configuration to exclude unnecessary external dependencies.
  - Added comprehensive tests for ImagicaAuthService to improve test coverage and reliability.
  - Introduced a reset method in ImagicaAuthService for better state management during tests.
