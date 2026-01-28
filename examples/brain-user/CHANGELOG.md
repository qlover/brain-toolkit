# examples/brain-user

## 0.2.0

### Minor Changes

#### ♻️ Refactors

- **brain-user:** Update package configurations and dependencies ([bb0149e](https://github.com/qlover/brain-toolkit/commit/bb0149ee36736ee17eeea3563164b054ab52fe25)) ([#29](https://github.com/qlover/brain-toolkit/pull/29))
  - Refactored package.json to streamline clean scripts and update dependency paths for local development.
  - Upgraded various dependencies in pnpm-lock.yaml to their latest versions, enhancing compatibility and functionality.
  - Improved Vite configuration for better module resolution and code organization.
  - Removed obsolete test files and added new type guard tests to ensure type safety for user-related data structures.

- **brain-user:** Update dependencies and enhance error handling in LoginPage ([0469830](https://github.com/qlover/brain-toolkit/commit/04698303b912bc57ec790ac9717f652c6e38111c)) ([#29](https://github.com/qlover/brain-toolkit/pull/29))
  - Updated dependencies in package.json for @qlover/corekit-bridge and @qlover/fe-corekit to their latest versions.
  - Enhanced the LoginPage component by adding error display functionality to improve user feedback during login attempts.
  - Refactored UserServiceProvider to streamline user service initialization.
  - Improved user service plugin to handle loading states more effectively during user actions.

## 0.1.1

### Patch Changes

#### 🐞 Bug Fixes

- Update package.json and README files to enhance formatting and add new package details ([88c5ad5](https://github.com/qlover/brain-toolkit/commit/88c5ad5b277c98a4189ce175c89732f491f4734e)) ([#27](https://github.com/qlover/brain-toolkit/pull/27))
  - Modified the prettier script in package.json to include markdown files for formatting.
  - Updated README files to improve table formatting and added a new online demo link for the @brain-toolkit/brain-user package.
  - Enhanced documentation for the @brain-toolkit/element-sizer and @brain-toolkit/antd-theme-override packages with clearer examples and configuration options.
  - Cleaned up whitespace and formatting inconsistencies across various documentation files.

- Update demo links in README files for brain-user package ([53afb21](https://github.com/qlover/brain-toolkit/commit/53afb214bec417150fe9d2c024cba6e6ef765315)) ([#27](https://github.com/qlover/brain-toolkit/pull/27))
  - Changed the online demo links in README.md, README.en.md, and the Chinese README.md to point to the new Vercel deployment URL.
  - Enhanced the tsup configuration to drop console statements from the output, improving the production build quality.

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

- **brain-user-example:** Add complete example project for Brain User package ([f52fe23](https://github.com/qlover/brain-toolkit/commit/f52fe2303875211a6423af6803f065a145d7a610)) ([#25](https://github.com/qlover/brain-toolkit/pull/25))
  - Introduced a new example project showcasing the usage of the @brain-toolkit/brain-user package.
  - Added essential files including .gitignore, index.html, package.json, and TypeScript configuration.
  - Implemented a basic React application structure with user authentication features and a user interface.
  - Included a README.md with setup instructions and usage details for easy onboarding.
  - Configured Vite for development and established a CSS file for styling.

- **brain-user-example:** Refactor example project for improved user authentication ([6a98f17](https://github.com/qlover/brain-toolkit/commit/6a98f17746244d56682fd5c4b7921777686f9286)) ([#25](https://github.com/qlover/brain-toolkit/pull/25))
  - Renamed example from `brain-user-example` to `brain-user` for clarity.
  - Updated dependencies in `pnpm-lock.yaml` to the latest versions, including `@qlover/fe-corekit` and `@react-oauth/google`.
  - Simplified TypeScript configuration by removing obsolete paths and integrating a new `LocalStorage` utility for state management.
  - Enhanced the main application structure to support both normal and Google login flows, improving user experience.
  - Added a new `GoogleLoginPage` component for Google OAuth integration, along with a `UserInfo` component to display user details post-authentication.
  - Streamlined the `App` component to focus on user interactions and state management.

#### ♻️ Refactors

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
