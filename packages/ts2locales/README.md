# @brain-toolkit/ts2locales

`@brain-toolkit/ts2locales` 是一个用于从 TypeScript 文件中提取国际化信息并生成本地化文件的工具。它可以帮助你管理多语言翻译，使国际化过程更加简单和规范。

## 特性

- 从 TypeScript 文件中提取国际化信息
- 支持多语言本地化文件生成
- 自动合并已存在的翻译文件
- 支持 JSDoc 注释中的翻译说明
- 支持 Vite 插件集成

## 安装

```bash
npm install @brain-toolkit/ts2locales --save-dev
# 或
yarn add @brain-toolkit/ts2locales -D
# 或
pnpm add @brain-toolkit/ts2locales -D
```

## 使用方法

### 1. 在 TypeScript 文件中定义国际化内容

在你的 TypeScript 文件中使用特定格式的 JSDoc 注释来定义国际化内容：

```typescript
/**
 * @description 用户名不能为空
 * @localZh 用户名不能为空
 * @localEn Username cannot be empty
 */
export const USERNAME_EMPTY = 'error.username.empty';

/**
 * @description 密码长度必须大于 6 位
 * @localZh 密码长度必须大于 6 位
 * @localEn Password must be longer than 6 characters
 */
export const PASSWORD_TOO_SHORT = 'error.password.length';
```

### 2. 使用 API

```typescript
import { Ts2Locales } from '@brain-toolkit/ts2locales';

const ts2locales = new Ts2Locales(['zh', 'en']);

await ts2locales.generate({
  source: './src/constants/errors.ts',
  target: './src/locales/{{lng}}/errors.json'
});
```

### 3. 在 Vite 中使用

```typescript
// vite.config.ts
import { defineConfig } from 'vite';
import { ts2localesVitePlugin } from '@brain-toolkit/ts2locales/vite';

export default defineConfig({
  plugins: [
    ts2localesVitePlugin({
      locales: ['zh', 'en'],
      values: [
        {
          source: './src/constants/errors.ts',
          target: './src/locales/{{lng}}/errors.json'
        }
      ]
    })
  ]
});
```

## 配置说明

### Ts2Locales 构造函数

- `locales`: string[] - 支持的语言代码数组，例如 `['zh', 'en']`

### generate 方法参数

- `source`: string - 源文件路径
- `target`: string - 目标文件路径，使用 `{{lng}}` 作为语言代码占位符

### Vite 插件配置

- `locales`: string[] - 支持的语言代码数组
- `values`: Array<{ source: string; target: string }> - 源文件和目标文件的映射配置

## 生成的文件示例

对于上述示例代码，将会生成如下格式的本地化文件：

```json
// locales/zh/errors.json
{
  "error.username.empty": "用户名不能为空",
  "error.password.length": "密码长度必须大于 6 位"
}

// locales/en/errors.json
{
  "error.username.empty": "Username cannot be empty",
  "error.password.length": "Password must be longer than 6 characters"
}
```

## 注意事项

1. 源文件中的 JSDoc 注释必须包含 `@description` 标签
2. 语言特定的翻译使用 `@local` 前缀，如 `@localZh`、`@localEn` 等
3. 如果某个语言没有提供翻译，将使用 `description` 作为默认值
4. 生成的本地化文件会自动合并已存在的翻译，不会覆盖未更新的内容
