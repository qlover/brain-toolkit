# examples/brain-user

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
