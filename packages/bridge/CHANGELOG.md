# @brain-toolkit/bridge

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
