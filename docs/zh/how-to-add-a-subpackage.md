# 如何增加一个子包

本文档详细介绍如何在 brain-toolkit 项目中添加新的子包，包括手动创建和使用 nx 工具创建两种方式。

## 📋 目录

- [创建方式选择](#创建方式选择)
- [手动创建子包](#手动创建子包)
- [使用 nx 创建](#使用-nx-创建)
- [配置文件详解](#配置文件详解)
- [最佳实践](#最佳实践)
- [常见问题](#常见问题)

## 🎯 创建方式选择

### 手动创建 vs nx 创建

| 特性         | 手动创建                | nx 创建             |
| ------------ | ----------------------- | ------------------- |
| **灵活性**   | ⭐⭐⭐⭐⭐ 完全自定义   | ⭐⭐⭐ 基于模板     |
| **速度**     | ⭐⭐ 需要手动配置       | ⭐⭐⭐⭐⭐ 快速生成 |
| **学习成本** | ⭐⭐⭐ 需要了解配置     | ⭐⭐⭐⭐ 相对简单   |
| **定制化**   | ⭐⭐⭐⭐⭐ 任意构建工具 | ⭐⭐⭐ 预设选项     |

**推荐选择**：

- 🚀 **快速开发**: 使用 nx 创建
- 🔧 **特殊需求**: 手动创建（如需要特定构建工具）

## 🛠️ 手动创建子包

### 第一步：创建包目录结构

```bash
# 在 packages 目录下创建新包
cd packages
mkdir my-new-package
cd my-new-package

# 创建标准目录结构
mkdir src
mkdir __tests__
mkdir __mocks__
mkdir dist
```

### 第二步：创建核心配置文件

#### 2.1 创建 package.json

```bash
# 创建 package.json
touch package.json
```

```json
{
  "name": "@brain-toolkit/my-new-package",
  "version": "0.1.0",
  "type": "module",
  "private": false,
  "description": "你的包描述",
  "main": "./dist/index.cjs",
  "module": "./dist/index.js",
  "types": "./dist/index.d.ts",
  "exports": {
    "./package.json": "./package.json",
    ".": {
      "types": "./dist/index.d.ts",
      "import": "./dist/index.js",
      "require": "./dist/index.cjs"
    }
  },
  "files": [
    "dist",
    "package.json",
    "README.md",
    "README_EN.md",
    "CHANGELOG.md"
  ],
  "scripts": {
    "build": "tsup",
    "dev": "tsup --watch",
    "test": "vitest run",
    "test:watch": "vitest",
    "test:coverage": "vitest run --coverage"
  },
  "repository": {
    "type": "git",
    "url": "git+https://github.com/qlover/brain-toolkit.git",
    "directory": "packages/my-new-package"
  },
  "homepage": "https://github.com/qlover/brain-toolkit#readme",
  "keywords": ["brain toolkit", "my-new-package", "你的关键词"],
  "author": "你的名字",
  "license": "ISC",
  "publishConfig": {
    "access": "public"
  },
  "devDependencies": {
    "typescript": "workspace:*",
    "tsup": "workspace:*",
    "vitest": "workspace:*"
  }
}
```

#### 2.2 创建 TypeScript 配置

```bash
# 创建 tsconfig.json
touch tsconfig.json
```

```json
{
  "extends": "../../tsconfig.json",
  "compilerOptions": {
    "outDir": "./dist",
    "rootDir": "./src"
  },
  "include": ["src/**/*"],
  "exclude": ["dist", "node_modules", "__tests__", "**/*.test.ts"]
}
```

#### 2.3 创建构建配置

```bash
# 创建 tsup.config.ts
touch tsup.config.ts
```

```typescript
import { defineConfig } from 'tsup';

export default defineConfig([
  // 主构建配置
  {
    entry: ['src/index.ts'],
    format: ['esm', 'cjs'],
    dts: false,
    sourcemap: true,
    clean: true,
    minify: process.env.NODE_ENV === 'production',
    outDir: 'dist'
  },
  // 类型定义构建
  {
    entry: ['src/index.ts'],
    format: 'esm',
    dts: true,
    outDir: 'dist'
  }
]);
```

### 第三步：创建源码文件

#### 3.1 创建主入口文件

```bash
# 创建 src/index.ts
touch src/index.ts
```

```typescript
// src/index.ts
/**
 * @brain-toolkit/my-new-package
 *
 * 你的包描述
 *
 * @author 你的名字
 * @version 0.1.0
 */

// 导出主要功能
export { MyMainClass } from './my-main-class';
export { myUtilFunction } from './utils';

// 导出类型定义
export type { MyMainClassOptions, MyUtilOptions } from './types';

// 默认导出
export { MyMainClass as default } from './my-main-class';
```

#### 3.2 创建核心功能文件

```bash
# 创建核心类文件
touch src/my-main-class.ts
touch src/utils.ts
touch src/types.ts
```

```typescript
// src/types.ts
export interface MyMainClassOptions {
  // 定义你的选项接口
  option1?: string;
  option2?: number;
}

export interface MyUtilOptions {
  // 工具函数选项
  debug?: boolean;
}
```

```typescript
// src/my-main-class.ts
import type { MyMainClassOptions } from './types';

export class MyMainClass {
  private options: MyMainClassOptions;

  constructor(options: MyMainClassOptions = {}) {
    this.options = {
      option1: 'default',
      option2: 0,
      ...options
    };
  }

  // 实现你的主要功能
  public doSomething(): void {
    console.log('MyMainClass is working!');
  }
}
```

```typescript
// src/utils.ts
import type { MyUtilOptions } from './types';

export function myUtilFunction(options: MyUtilOptions = {}): string {
  const { debug = false } = options;

  if (debug) {
    console.log('myUtilFunction called');
  }

  return 'Utility function result';
}
```

### 第四步：创建测试文件

#### 4.1 创建测试目录结构

```bash
# 创建测试文件
mkdir __tests__/unit
mkdir __tests__/integration
touch __tests__/unit/my-main-class.test.ts
touch __tests__/unit/utils.test.ts
touch __tests__/integration/index.test.ts
```

#### 4.2 编写单元测试

```typescript
// __tests__/unit/my-main-class.test.ts
import { describe, it, expect, vi } from 'vitest';
import { MyMainClass } from '../../src/my-main-class';

describe('MyMainClass', () => {
  it('should create instance with default options', () => {
    const instance = new MyMainClass();
    expect(instance).toBeInstanceOf(MyMainClass);
  });

  it('should accept custom options', () => {
    const options = { option1: 'custom', option2: 42 };
    const instance = new MyMainClass(options);
    expect(instance).toBeInstanceOf(MyMainClass);
  });

  it('should execute doSomething method', () => {
    const consoleSpy = vi.spyOn(console, 'log');
    const instance = new MyMainClass();

    instance.doSomething();

    expect(consoleSpy).toHaveBeenCalledWith('MyMainClass is working!');
    consoleSpy.mockRestore();
  });
});
```

#### 4.3 创建 Mock 文件

```bash
# 创建 Mock 入口
touch __mocks__/index.ts
```

```typescript
// __mocks__/index.ts
import { vi } from 'vitest';

// Mock 主类
export class MyMainClass {
  constructor(options: any = {}) {
    // Mock 实现
  }

  doSomething = vi.fn(() => {
    console.log('Mock: MyMainClass is working!');
  });
}

// Mock 工具函数
export const myUtilFunction = vi.fn((options: any = {}) => {
  return 'Mock: Utility function result';
});

// 默认导出
export { MyMainClass as default } from './my-main-class';
```

### 第五步：创建文档文件

#### 5.1 创建 README.md

```bash
touch README.md
```

````markdown
# @brain-toolkit/my-new-package

你的包的简短描述。

## 📦 安装

```bash
npm install @brain-toolkit/my-new-package
# 或
pnpm add @brain-toolkit/my-new-package
```
````

## 🚀 快速开始

```typescript
import { MyMainClass } from '@brain-toolkit/my-new-package';

const instance = new MyMainClass({
  option1: 'custom value',
  option2: 42
});

instance.doSomething();
```

## 📖 API 文档

### MyMainClass

主要功能类。

#### 构造函数

```typescript
new MyMainClass(options?: MyMainClassOptions)
```

#### 方法

- `doSomething(): void` - 执行主要功能

### 工具函数

#### myUtilFunction

```typescript
myUtilFunction(options?: MyUtilOptions): string
```

````

#### 5.2 创建 CHANGELOG.md

```bash
touch CHANGELOG.md
````

```markdown
# @brain-toolkit/my-new-package

## 0.1.0 (2024-01-01)

### ✨ Features

- 初始版本发布
- 添加 MyMainClass 核心功能
- 添加工具函数支持
```

### 第六步：安装依赖和构建

```bash
# 回到项目根目录
cd ../../

# 安装依赖
pnpm install

# 构建新包
pnpm build

# 运行测试
pnpm test packages/my-new-package
```

## 🤖 使用 nx 创建

### 安装 nx（如果还没有）

```bash
# 全局安装 nx
npm install -g nx

# 或在项目中安装
pnpm add -D nx @nx/js @nx/react @nx/node
```

### 创建不同类型的包

#### 创建 JavaScript/TypeScript 库

```bash
# 创建通用 JS/TS 库
nx generate @nx/js:lib my-new-package --directory=packages --bundler=tsup

# 指定更多选项
nx generate @nx/js:lib my-util-package \
  --directory=packages \
  --bundler=tsup \
  --unitTestRunner=vitest \
  --publishable=true
```

#### 创建 React 组件库

```bash
# 创建 React 组件库
nx generate @nx/react:lib my-react-components \
  --directory=packages \
  --bundler=vite \
  --unitTestRunner=vitest \
  --publishable=true
```

#### 创建 Node.js 应用

```bash
# 创建 Node.js 应用
nx generate @nx/node:app my-api \
  --directory=packages \
  --bundler=esbuild
```

### nx 创建后的配置调整

#### 调整 package.json

```bash
# 编辑生成的 package.json
cd packages/my-new-package
```

需要手动调整以下内容：

- 包名格式：`@brain-toolkit/package-name`
- 仓库信息
- 发布配置
- 关键词和描述

#### 调整构建配置

根据项目需求调整 nx 生成的构建配置，确保与项目标准一致。

### 查看项目依赖图

```bash
# 查看项目依赖关系
nx graph

# 查看特定包的依赖
nx show project my-new-package
```

## ⚙️ 配置文件详解

### package.json 关键字段

| 字段      | 说明                                | 示例                        |
| --------- | ----------------------------------- | --------------------------- |
| `name`    | 包名，必须以 `@brain-toolkit/` 开头 | `@brain-toolkit/my-package` |
| `version` | 版本号，遵循语义化版本              | `0.1.0`                     |
| `type`    | 模块类型，设置为 `module`           | `module`                    |
| `main`    | CommonJS 入口                       | `./dist/index.cjs`          |
| `module`  | ES Module 入口                      | `./dist/index.js`           |
| `types`   | TypeScript 类型定义                 | `./dist/index.d.ts`         |
| `exports` | 现代化的导出配置                    | 见上面示例                  |
| `files`   | 发布时包含的文件                    | `["dist", "README.md"]`     |

### tsup.config.ts 配置选项

| 选项        | 说明         | 推荐值                                  |
| ----------- | ------------ | --------------------------------------- |
| `entry`     | 入口文件     | `['src/index.ts']`                      |
| `format`    | 输出格式     | `['esm', 'cjs']`                        |
| `dts`       | 生成类型定义 | `true`                                  |
| `sourcemap` | 生成源码映射 | `true`                                  |
| `clean`     | 构建前清理   | `true`                                  |
| `minify`    | 代码压缩     | `process.env.NODE_ENV === 'production'` |

## 🎯 最佳实践

### 1. 命名规范

```bash
# 包名规范
@brain-toolkit/package-name

# 文件名规范
my-component.ts          # kebab-case
MyComponent.ts           # PascalCase (类文件)
utils.ts                 # 小写
types.ts                 # 类型定义文件
```

### 2. 目录结构规范

```
packages/my-new-package/
├── src/                 # 源码目录
│   ├── index.ts        # 主入口文件
│   ├── types.ts        # 类型定义
│   ├── utils.ts        # 工具函数
│   └── components/     # 组件目录（如果有）
├── __tests__/          # 测试目录
│   ├── unit/          # 单元测试
│   ├── integration/   # 集成测试
│   └── fixtures/      # 测试数据
├── __mocks__/          # Mock 文件
├── dist/               # 构建产物
├── package.json        # 包配置
├── tsconfig.json       # TS 配置
├── tsup.config.ts      # 构建配置
├── README.md           # 中文文档
├── README_EN.md        # 英文文档
└── CHANGELOG.md        # 变更日志
```

### 3. 代码规范

#### 导出规范

```typescript
// ✅ 推荐：命名导出 + 默认导出
export { MyClass } from './my-class';
export { myFunction } from './utils';
export type { MyOptions } from './types';
export { MyClass as default } from './my-class';

// ❌ 避免：只有默认导出
export default MyClass;
```

#### 类型定义规范

```typescript
// ✅ 推荐：详细的类型定义
export interface MyClassOptions {
  /** 选项1的描述 */
  option1?: string;
  /** 选项2的描述 */
  option2?: number;
  /** 回调函数 */
  onComplete?: (result: string) => void;
}

// ❌ 避免：any 类型
export interface MyClassOptions {
  options?: any;
}
```

### 4. 测试规范

#### 测试文件组织

```bash
__tests__/
├── unit/                    # 单元测试
│   ├── my-class.test.ts    # 类测试
│   └── utils.test.ts       # 工具函数测试
├── integration/             # 集成测试
│   └── index.test.ts       # 整体功能测试
└── fixtures/               # 测试数据
    └── mock-data.ts
```

#### 测试覆盖率要求

- **单元测试覆盖率**: >= 80%
- **关键功能覆盖率**: >= 95%
- **类型测试**: 必须包含

### 5. 文档规范

#### README.md 结构

```markdown
# 包名

简短描述

## 📦 安装

## 🚀 快速开始

## 📖 API 文档

## 🎯 使用场景

## 🔧 配置选项

## 📝 示例

## 🤝 贡献指南
```

## ❓ 常见问题

### Q1: 包名应该如何命名？

**A**: 包名必须以 `@brain-toolkit/` 开头，使用 kebab-case 格式：

```bash
✅ @brain-toolkit/element-sizer
✅ @brain-toolkit/ui-components
✅ @brain-toolkit/data-utils

❌ @brain-toolkit/ElementSizer
❌ @brain-toolkit/UI_Components
❌ brain-toolkit-utils
```

### Q2: 如何处理包间依赖？

**A**: 使用 `workspace:*` 引用本地包：

```json
{
  "dependencies": {
    "@brain-toolkit/other-package": "workspace:*"
  }
}
```

### Q3: 构建失败怎么办？

**A**: 检查以下几点：

1. 确保 `tsconfig.json` 配置正确
2. 检查 `tsup.config.ts` 入口文件路径
3. 确认所有依赖已安装：`pnpm install`
4. 清理后重新构建：`pnpm clean:build && pnpm build`

### Q4: 如何调试新包？

**A**: 使用以下命令：

```bash
# 监听模式构建
cd packages/my-new-package
pnpm dev

# 在其他包中测试
cd packages/other-package
pnpm add @brain-toolkit/my-new-package@workspace:*
```

### Q5: 发布前需要检查什么？

**A**: 发布检查清单：

- [ ] 包名格式正确
- [ ] 版本号符合语义化版本规范
- [ ] README.md 文档完整
- [ ] 测试通过：`pnpm test`
- [ ] 构建成功：`pnpm build`
- [ ] 类型定义正确：检查 `dist/*.d.ts`
- [ ] 发布配置正确：`publishConfig.access: "public"`

### Q6: 如何删除已创建的包？

**A**: 删除步骤：

```bash
# 1. 删除包目录
rm -rf packages/my-package

# 2. 清理依赖
pnpm install

# 3. 重新构建
pnpm build
```

## 📚 相关文档

- [项目构建与依赖管理](./project-builder.md)
- [测试指南](./testing-guide.md)
- [打包格式指南](./build-formats.md)
- [提交规范](./commit-convention.md)
- [项目发布](./project-release.md)
