# @brain-toolkit/element-sizer

## 0.2.2

### Patch Changes

#### ♻️ Refactors

- **ElementSizer:** Update repository and homepage URLs in element-sizer package.json ([9a0e7be](https://github.com/qlover/brain-toolkit/commit/9a0e7be536ff8db4681e695bbc88b986e2a335e4)) ([#8](https://github.com/qlover/brain-toolkit/pull/8))

  - Changed repository URL to reflect the new project location in brain-toolkit.
  - Updated homepage URL to match the new project structure.

## 0.2.1

### Patch Changes

#### ✨ Features

- **ElementResizer:** Add mock implementation for ElementResizer class ([cfbe003](https://github.com/qlover/brain-toolkit/commit/cfbe0036ade3d5d4552f0e3155a9f895343ffacf)) ([#6](https://github.com/qlover/brain-toolkit/pull/6))

  - Introduced a new mock file for the ElementResizer class to facilitate testing.
  - Implemented mock methods for expand, collapse, fixedCurrentTargetRect, and cancelAnimation.
  - Added utility functions for size calculations and element rect retrieval to enhance testing capabilities.

## 0.2.0

### Minor Changes

#### ✨ Features

- **ElementSizer:** Add Element Resizer package with comprehensive tests and configuration files ([60ef22c](https://github.com/qlover/brain-toolkit/commit/60ef22cd76b1dadb023ac45115d51fc48437493e)) ([#1](https://github.com/qlover/brain-toolkit/pull/1))

  - Introduced `@brain-toolkit/element-sizer` package for managing element resize animations.
  - Implemented core functionality in `src/index.ts` with options for target elements, animation states, and placeholder management.
  - Added extensive unit tests in `__tests__/index.test.ts` to validate behavior and edge cases.
  - Updated `vite.config.ts` to use jsdom environment for testing.
  - Included necessary configuration files such as `package.json`, `tsconfig.json`, and changelog for the new package.

#### 📝 Documentation

- **ElementSizer:** Add detailed README documentation for Element Resizer package ([6ccb857](https://github.com/qlover/brain-toolkit/commit/6ccb8571cf3b00ee87f59a4a2e839f8c016252fa)) ([#1](https://github.com/qlover/brain-toolkit/pull/1))

  - Expanded README_EN.md and README.md to include comprehensive usage instructions, API documentation, and examples for the Element Resizer package.
  - Highlighted features, installation steps, and advanced usage scenarios to enhance user understanding and facilitate quick integration.
  - Included troubleshooting tips and performance optimization notes to assist developers in effectively utilizing the package.
