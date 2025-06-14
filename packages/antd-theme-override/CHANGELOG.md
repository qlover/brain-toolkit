# @brain-toolkit/antd-theme-override

## 0.0.3

### Patch Changes

#### 🐞 Bug Fixes

- **antd-theme-override:** Add helper function for directory resolution ([dcc2f16](https://github.com/qlover/brain-toolkit/commit/dcc2f16a518dec6a53d04162eb77c27d6902b14e)) ([#15](https://github.com/qlover/brain-toolkit/pull/15))

  - Introduced a `getDirname` function to handle directory resolution for both ESM and CJS environments, improving compatibility across different module systems.
  - Updated the `templatePath` resolution in the Vite plugin to utilize the new helper function, ensuring correct path handling regardless of the module type.

## 0.0.2

### Patch Changes

#### ✨ Features

- **antd-theme-override:** Introduce @brain-toolkit/antd-theme-override package ([d88b2ba](https://github.com/qlover/brain-toolkit/commit/d88b2baead5769c0773011894549d7e91524c770)) ([#13](https://github.com/qlover/brain-toolkit/pull/13))

  - Added a new package for managing and overriding Ant Design themes and global APIs.
  - Implemented core components including AntdThemeProvider and AntdStaticProvider for theme management and static API handling.
  - Integrated Vite for build processes and included TypeScript support.
  - Created comprehensive documentation in both English and Chinese, detailing features, installation, usage, and configuration options.
  - Added CHANGELOG for tracking changes and updates.

  Co-authored-by: QRJ <renjie.qin@brain.im>

#### 📝 Documentation

- Update README files to include new package and improve clarity ([8b570e8](https://github.com/qlover/brain-toolkit/commit/8b570e84ef23e2da504734bdbd7f9b025f503e72)) ([#13](https://github.com/qlover/brain-toolkit/pull/13))

- Added links to the English and Chinese versions in both README files.
- Updated the description of the toolkit to enhance clarity.
- Included the new @brain-toolkit/antd-theme-override package in the tools list for better visibility.
