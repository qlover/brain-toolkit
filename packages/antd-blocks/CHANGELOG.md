# @brain-toolkit/antd-blocks

## 0.1.1

### Patch Changes

#### ♻️ Refactors

- **brain-user:** Restructure example project and enhance user authentication features ([51624c9](https://github.com/qlover/brain-toolkit/commit/51624c9c9c15c1acfbae8448919515dce61fd1ac)) ([#27](https://github.com/qlover/brain-toolkit/pull/27))
  - Updated the example project for the @brain-toolkit/brain-user package to improve user authentication flows.
  - Replaced the previous App and GoogleLoginPage components with a new MainApp component that manages routing between login and home pages.
  - Introduced a new LoginPage component for handling both password and Google login methods.
  - Added a HomePage component to display user information post-authentication.
  - Implemented a UserServiceProvider for centralized user service management and state handling.
  - Enhanced the LocalStorage utility for better state persistence.
  - Updated package.json to reflect changes in dependencies and scripts.
  - Removed obsolete files and components to streamline the project structure.

## 0.1.0

### Minor Changes

#### ✨ Features

- Enhance ESLint configuration and update TypeScript interfaces ([e3702ba](https://github.com/qlover/brain-toolkit/commit/e3702badd9f9290be81fa18f3c4300afc1d176b4)) ([#25](https://github.com/qlover/brain-toolkit/pull/25))
  - Updated ESLint configuration to include type-checking rules for Vitest and mock files, improving code quality checks.
  - Refactored TypeScript interfaces in ResourceTablePopup and ResourceTableSchemaForm to omit children properties, enhancing type safety.
  - Modified test cases in brain-user package to remove references to predefined storage types, streamlining the codebase.
  - Adjusted linting scripts in package.json to improve performance with caching.

- Enhance ESLint and TypeScript configurations for improved testing and code quality ([8f9f28f](https://github.com/qlover/brain-toolkit/commit/8f9f28f308d3702479998d58daa722a57f237484)) ([#25](https://github.com/qlover/brain-toolkit/pull/25))
  - Updated ESLint configuration to enforce stricter rules, including setting '@typescript-eslint/no-explicit-any' to 'error'.
  - Introduced a new linting configuration for test files, ensuring consistent linting practices across test cases.
  - Modified TypeScript configuration to include additional file references and improve type-checking for test files.
  - Added data-testid attributes to various components in the antd-blocks and react-kit packages for better testing support.
  - Enhanced example components with data-testid attributes to facilitate testing and improve accessibility.

- Enhance ESLint configuration and TypeScript support for improved code quality ([23dfaa3](https://github.com/qlover/brain-toolkit/commit/23dfaa336daa3f4113cc6ba09d61f6708e0cbda5)) ([#25](https://github.com/qlover/brain-toolkit/pull/25))
  - Introduced a new linting configuration for TypeScript files, enabling the ts-class-override rule with full type information.
  - Updated ESLint scripts in package.json for better caching and performance.
  - Enhanced example components with data-testid attributes for improved testing capabilities.
  - Updated the @qlover/eslint-plugin dependency to version 1.1.0 for additional linting features.
  - Refactored error handling in example components to simplify catch blocks.

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

## 0.0.1

### Patch Changes

#### ✨ Features

- **antd-blocks:** Introduce @brain-toolkit/antd-blocks package with resource table components ([6e298dd](https://github.com/qlover/brain-toolkit/commit/6e298dd9bdcbcefb115b4d199e1328d07ee210b3)) ([#21](https://github.com/qlover/brain-toolkit/pull/21))
  - Added a new package for managing resource tables, including components for table actions, headers, and popups.
  - Implemented state management and event handling for CRUD operations within the resource table.
  - Integrated Ant Design components for a cohesive UI experience.
  - Created comprehensive documentation and CHANGELOG for the new package.

  Co-authored-by: QRJ <renjie.qin@brain.im>

- **antd-blocks:** Enhance resource table components with new features and tests ([8384138](https://github.com/qlover/brain-toolkit/commit/8384138af50483230ad85fd88dba71cdcb2989ef)) ([#21](https://github.com/qlover/brain-toolkit/pull/21))
  - Added new dependencies for testing and React integration, including @testing-library/react and @vitejs/plugin-react.
  - Updated package.json and pnpm-lock.yaml to reflect new versions and dependencies.
  - Enhanced Vite configuration to support React and improved test environment settings.
  - Introduced comprehensive test suites for resource table components, including ResourceTable, ResourceEvent, and ResourceTablePopup.
  - Implemented new features in the ResourceEvent class for better event handling and state management.

  Co-authored-by: QRJ <renjie.qin@brain.im>

- **antd-blocks:** Add interactive examples and enhance documentation ([8394d3e](https://github.com/qlover/brain-toolkit/commit/8394d3e55414c57f53089fd450ebf168019ff72f)) ([#21](https://github.com/qlover/brain-toolkit/pull/21))
  - Introduced a new example directory showcasing various use cases of the ResourceTable component, including basic, form-based, and custom action examples.
  - Updated README files in both English and Chinese to provide detailed instructions for running examples and understanding component functionalities.
  - Added Vite configuration for example development, enabling easy local testing and demonstration of features.
  - Enhanced the ResourceTableSchemaForm and related services to support CRUD operations in the examples.

  Co-authored-by: QRJ <renjie.qin@brain.im>

#### 📝 Documentation

- **antd-blocks:** Update documentation and enhance resource table components ([eb1da31](https://github.com/qlover/brain-toolkit/commit/eb1da319a25f534f338c75e95c2632e715ad0bc2)) ([#21](https://github.com/qlover/brain-toolkit/pull/21))
  - Expanded README files in both English and Chinese to provide comprehensive information about the @brain-toolkit/antd-blocks package, including features, installation instructions, and usage examples.
  - Improved the ResourceEvent class with detailed comments and examples for better understanding of CRUD operations and state management.
  - Enhanced the ResourceTable component documentation to clarify props and usage scenarios, ensuring a better developer experience.

  Co-authored-by: QRJ <renjie.qin@brain.im>
