# brain-toolkit

English | [简体中文](./README.md)

Frontend toolkit for Brain AI - Providing powerful frontend tools collection for AI applications

## 📖 Table of Contents

- [Project Overview](#-project-overview)
- [Features](#-features)
- [Quick Start](#-quick-start)
  - [Requirements](#requirements)
  - [Installation](#installation)
  - [Basic Usage](#basic-usage)
- [Package List](#-package-list)
- [Development Guide](#-development-guide)
  - [Project Build and Dependency Management](./docs/en/project-builder.md)
  - [Commit Convention](./docs/en/commit-convention.md)
  - [Project Release](./docs/en/project-release.md)
  - [How to Add a Subpackage](./docs/en/how-to-add-a-subpackage.md)
  - [Testing Guide](./docs/en/testing-guide.md)
  - [Build Formats Guide](./docs/en/build-formats.md)
- [Script Commands](#-script-commands)
- [Tech Stack](#-tech-stack)
- [Project Structure](#-project-structure)
- [Contributing](#-contributing)
- [Version Release](#-version-release)
- [FAQ](#-faq)
- [License](#-license)

## 📋 Project Overview

brain-toolkit is a collection of tools specifically designed for AI frontend applications, using a monorepo architecture to provide modular frontend solutions.

## ✨ Features

- 🎯 **Modular Design** - Monorepo architecture based on pnpm workspace
- 🔧 **TypeScript Support** - Complete type definitions and intelligent hints
- 📦 **Independent Publishing** - Each package can be installed and used independently
- 🚀 **Modern Toolchain** - Using modern tools like Vite, ESLint, Prettier
- 🔄 **Automated Release** - Version management and release process based on Changesets
- 🧪 **Test Coverage** - Integrated Vitest testing framework

## 🚀 Quick Start

### Requirements

- Node.js >= 20.19.0
- pnpm >= 8.0.0

### Installation

```bash
# Clone the project
git clone https://github.com/qlover/brain-toolkit.git
cd brain-toolkit

# Install dependencies
pnpm install

# Build all packages
pnpm build
```

### Basic Usage

```bash
# Install specific package
npm install @brain-toolkit/element-sizer

# Or use pnpm
pnpm add @brain-toolkit/element-sizer
```

## 📦 Package List

| Package Name                                                                   | Version                                                                 | Description                                         |
| ------------------------------------------------------------------------------ | ----------------------------------------------------------------------- | --------------------------------------------------- |
| [@brain-toolkit/element-sizer](./packages/element-sizer/README_EN.md)          | ![npm](https://img.shields.io/npm/v/@brain-toolkit/element-sizer)       | DOM element expand/collapse animation tool          |
| [@brain-toolkit/ts2locales](./packages/ts2locales/README_EN.md)                | ![npm](https://img.shields.io/npm/v/@brain-toolkit/ts2locales)          | TypeScript internationalization file generator      |
| [@brain-toolkit/antd-theme-override](./packages/antd-theme-override/README.md) | ![npm](https://img.shields.io/npm/v/@brain-toolkit/antd-theme-override) | Ant Design theme override and customization utility |
| [@brain-toolkit/brain-user](./packages/brain-user/README.en.md)                | ![npm](https://img.shields.io/npm/v/@brain-toolkit/brain-user)          | Brain user authentication and management library    |

## 🛠️ Development Guide

- [Project Build and Dependency Management](./docs/en/project-builder.md)
- [Commit Convention](./docs/en/commit-convention.md)
- [Project Release](./docs/en/project-release.md)
- [How to Add a Subpackage](./docs/en/how-to-add-a-subpackage.md)
- [Testing Guide](./docs/en/testing-guide.md)
- [Build Formats Guide](./docs/en/build-formats.md)

## 📜 Script Commands

```bash
# Build all packages
pnpm build

# Code linting and formatting
pnpm lint
pnpm prettier

# Run tests
pnpm test

# Clean build artifacts
pnpm clean:build

# Commit code (using commitizen)
pnpm commit

# Check package dependencies
pnpm check-packages
```

## 🔧 Tech Stack

- **Build Tools**: Vite, Rollup, tsup
- **Package Management**: pnpm workspace
- **Code Quality**: ESLint, Prettier, Husky
- **Testing Framework**: Vitest
- **Version Management**: Changesets
- **Task Runner**: Nx
- **Language**: TypeScript

## 📁 Project Structure

```
brain-toolkit/
├── packages/                 # Subpackage directory
│   ├── element-sizer/        # DOM element animation tool
│   └── brain-user/           # Brain user authentication and management library
├── docs/                     # Documentation directory
│   ├── zh/                   # Chinese documentation
│   └── en/                   # English documentation
├── .github/                  # GitHub configuration
├── .changeset/               # Version change configuration
├── package.json              # Root package configuration
├── pnpm-workspace.yaml       # pnpm workspace configuration
├── fe-config.json            # Frontend tool configuration
└── README.md                 # Project description
```

## 🤝 Contributing

1. Fork this repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`pnpm commit`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Create a Pull Request

## 📋 Version Release

This project uses [Changesets](https://github.com/changesets/changesets) for version management:

```bash
# Add change record
pnpm changeset

# Release version
pnpm changeset version
pnpm changeset publish
```

## ❓ FAQ

- [How to Add a Subpackage](./docs/en/how-to-add-a-subpackage.md)

## 📄 License

[ISC](./LICENSE)
