# @brain-toolkit/ts2locales

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
