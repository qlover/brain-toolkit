# brain-toolkit

[English](./README_EN.md) | 简体中文

Brain AI 前端工具包 - 为 AI 应用提供强大的前端工具集合

## 📖 目录

- [项目简介](#-项目简介)
- [特性](#-特性)
- [快速开始](#-快速开始)
  - [环境要求](#环境要求)
  - [安装](#安装)
  - [基础使用](#基础使用)
- [包列表](#-包列表)
- [开发指南](#-开发指南)
  - [项目的构建与依赖管理](./docs/zh/project-builder.md)
  - [提交规范](./docs/zh/commit-convention.md)
  - [项目发布](./docs/zh/project-release.md)
  - [如何增加一个子包](./docs/zh/how-to-add-a-subpackage.md)
  - [测试指南](./docs/zh/testing-guide.md)
  - [打包格式指南](./docs/zh/build-formats.md)
- [脚本命令](#-脚本命令)
- [技术栈](#-技术栈)
- [项目结构](#-项目结构)
- [贡献指南](#-贡献指南)
- [版本发布](#-版本发布)
- [常见问题](#-常见问题)
- [许可证](#-许可证)

## 📋 项目简介

brain-toolkit 是一个专为 AI 前端应用设计的工具包集合，采用 monorepo 架构，提供模块化的前端解决方案。

## ✨ 特性

- 🎯 **模块化设计** - 基于 pnpm workspace 的 monorepo 架构
- 🔧 **TypeScript 支持** - 完整的类型定义和智能提示
- 📦 **独立发布** - 每个包可独立安装和使用
- 🚀 **现代化工具链** - 使用 Vite、ESLint、Prettier 等现代工具
- 🔄 **自动化发布** - 基于 Changesets 的版本管理和发布流程
- 🧪 **测试覆盖** - 集成 Vitest 测试框架

## 🚀 快速开始

### 环境要求

- Node.js >= 20.19.0
- pnpm >= 8.0.0

### 安装

```bash
# 克隆项目
git clone https://github.com/qlover/brain-toolkit.git
cd brain-toolkit

# 安装依赖
pnpm install

# 构建所有包
pnpm build
```

### 基础使用

```bash
# 安装特定包
npm install @brain-toolkit/element-sizer

# 或使用 pnpm
pnpm add @brain-toolkit/element-sizer
```

## 📦 包列表

| 包名                                                                           | 版本                                                                    | 描述                            |
| ------------------------------------------------------------------------------ | ----------------------------------------------------------------------- | ------------------------------- |
| [@brain-toolkit/element-sizer](./packages/element-sizer/README.md)             | ![npm](https://img.shields.io/npm/v/@brain-toolkit/element-sizer)       | DOM 元素展开/折叠动画工具       |
| [@brain-toolkit/ts2locales](./packages/ts2locales/README.md)                   | ![npm](https://img.shields.io/npm/v/@brain-toolkit/ts2locales)          | TypeScript 国际化文件生成工具   |
| [@brain-toolkit/antd-theme-override](./packages/antd-theme-override/README.md) | ![npm](https://img.shields.io/npm/v/@brain-toolkit/antd-theme-override) | Ant Design 主题覆盖和自定义工具 |
| [@brain-toolkit/brain-user](./packages/brain-user/README.md)                   | ![npm](https://img.shields.io/npm/v/@brain-toolkit/brain-user)          | Brain 用户认证和管理库          |

## 🛠️ 开发指南

- [项目的构建与依赖管理](./docs/zh/project-builder.md)
- [提交规范](./docs/zh/commit-convention.md)
- [项目发布](./docs/zh/project-release.md)
- [如何增加一个子包](./docs/zh/how-to-add-a-subpackage.md)
- [测试指南](./docs/zh/testing-guide.md)
- [打包格式指南](./docs/zh/build-formats.md)

## 📜 脚本命令

```bash
# 构建所有包
pnpm build

# 代码检查和格式化
pnpm lint
pnpm prettier

# 运行测试
pnpm test

# 清理构建产物
pnpm clean:build

# 提交代码（使用 commitizen）
pnpm commit

# 检查包依赖
pnpm check-packages
```

## 🔧 技术栈

- **构建工具**: Vite, Rollup, tsup
- **包管理**: pnpm workspace
- **代码质量**: ESLint, Prettier, Husky
- **测试框架**: Vitest
- **版本管理**: Changesets
- **任务运行**: Nx
- **语言**: TypeScript

## 📁 项目结构

```
brain-toolkit/
├── packages/                 # 子包目录
│   ├── element-sizer/        # DOM 元素动画工具
│   └── brain-user/           # Brain 用户认证和管理库
├── docs/                     # 文档目录
│   ├── zh/                   # 中文文档
│   └── en/                   # 英文文档
├── .github/                  # GitHub 配置
├── .changeset/               # 版本变更配置
├── package.json              # 根包配置
├── pnpm-workspace.yaml       # pnpm 工作空间配置
├── fe-config.json            # 前端工具配置
└── README.md                 # 项目说明
```

## 🤝 贡献指南

1. Fork 本仓库
2. 创建特性分支 (`git checkout -b feature/amazing-feature`)
3. 提交更改 (`pnpm commit`)
4. 推送到分支 (`git push origin feature/amazing-feature`)
5. 创建 Pull Request

## 📋 版本发布

本项目使用 [Changesets](https://github.com/changesets/changesets) 进行版本管理：

```bash
# 添加变更记录
pnpm changeset

# 发布版本
pnpm changeset version
pnpm changeset publish
```

## ❓ 常见问题

- [如何增加一个子包](./docs/zh/how-to-add-a-subpackage.md)

## 📄 许可证

[ISC](./LICENSE)
