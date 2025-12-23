# @brain-toolkit/brain-user

## 0.1.0

### Minor Changes

#### ✨ Features

- **brain-user:** Introduce Brain User package with authentication and management features ([2d1c644](https://github.com/qlover/brain-toolkit/commit/2d1c644a8abd40eb2938e31da00348c8ba85a091)) ([#25](https://github.com/qlover/brain-toolkit/pull/25))
  - Added the @brain-toolkit/brain-user package, providing user authentication and management functionalities.
  - Implemented core classes including BrainUserApi, BrainUserGateway, BrainUserService, and BrainUserStore for handling user operations.
  - Created comprehensive test suites for various components to ensure functionality and reliability.
  - Updated package.json and pnpm-lock.yaml to include new dependencies and configurations.
  - Enhanced documentation with usage examples and installation instructions for the new package.

- **brain-user-example:** Add initial example project for Brain User package ([9bbf75c](https://github.com/qlover/brain-toolkit/commit/9bbf75c4b7d9021cca0d220fd6483cec0c21e7f7)) ([#25](https://github.com/qlover/brain-toolkit/pull/25))
  - Created a new example project demonstrating the usage of the @brain-toolkit/brain-user package.
  - Included essential files such as index.html, package.json, and TypeScript configuration.
  - Implemented a basic React application structure with user authentication features.
  - Added a README.md for setup instructions and usage details.
  - Configured Vite for development and included a .gitignore to manage ignored files.

- Enhance ESLint configuration and update TypeScript interfaces ([e3702ba](https://github.com/qlover/brain-toolkit/commit/e3702badd9f9290be81fa18f3c4300afc1d176b4)) ([#25](https://github.com/qlover/brain-toolkit/pull/25))
  - Updated ESLint configuration to include type-checking rules for Vitest and mock files, improving code quality checks.
  - Refactored TypeScript interfaces in ResourceTablePopup and ResourceTableSchemaForm to omit children properties, enhancing type safety.
  - Modified test cases in brain-user package to remove references to predefined storage types, streamlining the codebase.
  - Adjusted linting scripts in package.json to improve performance with caching.

- Enhance TypeScript and ESLint configurations for improved type safety and code quality ([f1338e6](https://github.com/qlover/brain-toolkit/commit/f1338e65317ce287db1db537b1d6e8dd167652c4)) ([#25](https://github.com/qlover/brain-toolkit/pull/25))
  - Added `@typescript-eslint/consistent-type-imports` rule to enforce consistent type imports across the codebase.
  - Updated TypeScript configuration to use `moduleResolution: "bundler"` for better module handling.
  - Refactored imports in various test files and services to utilize `import type` for type-only imports, enhancing clarity and performance.
  - Updated dependencies in `pnpm-lock.yaml` to include the latest version of `@react-oauth/google` for improved functionality.

- **brain-user-example:** Refactor example project for improved user authentication ([6a98f17](https://github.com/qlover/brain-toolkit/commit/6a98f17746244d56682fd5c4b7921777686f9286)) ([#25](https://github.com/qlover/brain-toolkit/pull/25))
  - Renamed example from `brain-user-example` to `brain-user` for clarity.
  - Updated dependencies in `pnpm-lock.yaml` to the latest versions, including `@qlover/fe-corekit` and `@react-oauth/google`.
  - Simplified TypeScript configuration by removing obsolete paths and integrating a new `LocalStorage` utility for state management.
  - Enhanced the main application structure to support both normal and Google login flows, improving user experience.
  - Added a new `GoogleLoginPage` component for Google OAuth integration, along with a `UserInfo` component to display user details post-authentication.
  - Streamlined the `App` component to focus on user interactions and state management.

#### 🐞 Bug Fixes

- Update TypeScript configuration across multiple packages ([197805e](https://github.com/qlover/brain-toolkit/commit/197805e34e2ca80ab5f15afbeedaa2da808f077e)) ([#25](https://github.com/qlover/brain-toolkit/pull/25))
  - Added `tsBuildInfoFile: undefined` to the TypeScript compiler options in the tsup.config.ts files for brain-user, bridge, element-sizer, and ts2locales packages.
  - Ensured consistency in TypeScript settings by updating the incremental build option across these packages.

#### 📝 Documentation

- **brain-user:** Add English documentation for @brain-toolkit/brain-user package ([0c213f1](https://github.com/qlover/brain-toolkit/commit/0c213f1feca4f74ee57a830d975b4d2d7ed19285)) ([#25](https://github.com/qlover/brain-toolkit/pull/25))
  - Introduced a comprehensive README.en.md file detailing installation, quick start, features, configuration options, API reference, usage examples, common use cases, and advanced topics for the Brain User Service.
  - Enhanced the existing README.md to link to the new English documentation and updated the content to reflect the service's capabilities in Chinese.
  - Improved overall documentation structure for better accessibility and user onboarding.

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

- **brain-user-example:** Simplify TypeScript configuration and enhance code clarity ([0e65da4](https://github.com/qlover/brain-toolkit/commit/0e65da4574a60101fae9ab2fb700d8737e849e4a)) ([#25](https://github.com/qlover/brain-toolkit/pull/25))
  - Removed obsolete path mappings and type-only imports from tsconfig.json and vite.config.ts for improved clarity and maintainability.
  - Updated App.tsx and GoogleLoginPage.tsx to utilize type-safe state management with BrainUserStateInterface.
  - Enhanced UserInfo component with a data-testid attribute for better testing support.
  - Adjusted BrainUserApi and BrainUserGateway methods to include detailed JSDoc comments for improved documentation and understanding of API usage.
