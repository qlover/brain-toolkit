# @brain-toolkit/ts2locales

`@brain-toolkit/ts2locales` is a tool for extracting internationalization information from TypeScript files and generating localization files. It helps you manage multilingual translations, making the internationalization process simpler and more standardized.

## Features

- Extract internationalization information from TypeScript files
- Support for multiple language localization file generation
- Automatically merge existing translation files
- Support for translations in JSDoc comments
- Support for Vite plugin integration

## Installation

```bash
npm install @brain-toolkit/ts2locales --save-dev
# or
yarn add @brain-toolkit/ts2locales -D
# or
pnpm add @brain-toolkit/ts2locales -D
```

## Usage

### 1. Define Internationalization Content in TypeScript Files

Use JSDoc comments with specific format to define internationalization content in your TypeScript files:

```typescript
/**
 * @description Username cannot be empty
 * @localZh 用户名不能为空
 * @localEn Username cannot be empty
 */
export const USERNAME_EMPTY = 'error.username.empty';

/**
 * @description Password must be longer than 6 characters
 * @localZh 密码长度必须大于 6 位
 * @localEn Password must be longer than 6 characters
 */
export const PASSWORD_TOO_SHORT = 'error.password.length';
```

### 2. Using the API

```typescript
import { Ts2Locales } from '@brain-toolkit/ts2locales';

const ts2locales = new Ts2Locales(['zh', 'en']);

await ts2locales.generate({
  source: './src/constants/errors.ts',
  target: './src/locales/{{lng}}/errors.json'
});
```

### 3. Using with Vite

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

## Configuration

### Ts2Locales Constructor

- `locales`: string[] - Array of supported language codes, e.g., `['zh', 'en']`

### generate Method Parameters

- `source`: string - Path to the source file
- `target`: string - Path to the target file, using `{{lng}}` as language code placeholder

### Vite Plugin Configuration

- `locales`: string[] - Array of supported language codes
- `values`: Array<{ source: string; target: string }> - Mapping configuration for source and target files

## Generated File Example

For the example code above, the following localization files will be generated:

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

## Notes

1. JSDoc comments in source files must include the `@description` tag
2. Language-specific translations use the `@local` prefix, such as `@localZh`, `@localEn`, etc.
3. If a translation is not provided for a language, the `description` will be used as the default value
4. Generated localization files will automatically merge with existing translations without overwriting unchanged content

