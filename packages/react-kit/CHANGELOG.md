# @brain-toolkit/react-kit

## 0.1.0

### Minor Changes

#### ✨ Features

- **react-kit:** Introduce @brain-toolkit/react-kit package with core hooks and components ([67bfdb1](https://github.com/qlover/brain-toolkit/commit/67bfdb15b5e863c64f68cc81dd56f9a8123baba1)) ([#23](https://github.com/qlover/brain-toolkit/pull/23))
  - Added a new package for React that includes essential hooks such as useFactory, useLifecycle, useMountedClient, and useStore for state management and lifecycle handling.
  - Implemented Vite configuration for building the package, supporting both ES and CommonJS formats.
  - Created comprehensive documentation and CHANGELOG for the new package, detailing usage examples and installation instructions.
  - Updated pnpm-lock.yaml to reflect new dependencies and versions.

  Co-authored-by: QRJ <renjie.qin@brain.im>

- **react-kit:** Add tests for useFactory, useLifecycle, useMountedClient, and useStore hooks ([0e3c63b](https://github.com/qlover/brain-toolkit/commit/0e3c63ba20264659da967f46186faf9302649c75)) ([#23](https://github.com/qlover/brain-toolkit/pull/23))
  - Introduced comprehensive test suites for the useFactory, useLifecycle, useMountedClient, and useStore hooks to ensure functionality and reliability.
  - Implemented various test cases covering basic functionality, lifecycle management, SSR compatibility, and state management.
  - Enhanced documentation and examples for better understanding of hook usage and behavior in different scenarios.
  - Updated Vite configuration and dependencies to support testing frameworks and improve test environment settings.

  Co-authored-by: QRJ <renjie.qin@brain.im>

- **react-kit:** Add interactive examples and documentation for react-kit package ([69218d6](https://github.com/qlover/brain-toolkit/commit/69218d6a536d587f6117857c67ac003bdc0d5530)) ([#23](https://github.com/qlover/brain-toolkit/pull/23))
  - Updated the homepage URL in package.json to point to the new react-kit examples.
  - Refactored Vite configuration to support react-kit examples, changing the server port and aliasing paths.
  - Introduced a new example directory with interactive examples demonstrating the use of hooks like useFactory, useLifecycle, useMountedClient, and useStore.
  - Created comprehensive README files and HTML templates for the examples, enhancing user experience and understanding of the package functionalities.
  - Added global styles and structured components for a cohesive look and feel across examples.

  Co-authored-by: QRJ <renjie.qin@brain.im>

#### ♻️ Refactors

- **react-kit:** Improve test cases and type safety in hooks ([ea93b4f](https://github.com/qlover/brain-toolkit/commit/ea93b4f9313377d7315f11dc97ce05d7030396ba)) ([#23](https://github.com/qlover/brain-toolkit/pull/23))
  - Updated test files for useMountedClient and useStore hooks to enhance type safety and readability.
  - Refactored state management in CounterStore, UserStore, and other store classes to extend StoreInterface, improving initialization and update methods.
  - Cleaned up code formatting and comments across various example components for better clarity and consistency.
  - Enhanced example components with improved styling and structure for better user experience.
