# @brain-toolkit/antd-theme-override

A toolkit for managing and overriding Ant Design themes and global APIs.

## Features

- 🎨 Simple and efficient theme override mechanism
- 🛡️ Global API usage control
- 🔧 Vite build integration
- 📦 Out-of-the-box TypeScript support

## Installation

```bash
npm install @brain-toolkit/antd-theme-override
# or
yarn add @brain-toolkit/antd-theme-override
# or
pnpm add @brain-toolkit/antd-theme-override
```

## Usage

### 1. Theme Override

#### React Component Approach

```tsx
import { AntdThemeProvider } from '@brain-toolkit/antd-theme-override';

function App() {
  return (
    <AntdThemeProvider
      theme={{
        token: {
          colorPrimary: '#00b96b'
        }
      }}
    >
      <YourApp />
    </AntdThemeProvider>
  );
}
```

### 2. Global API Management

#### Vite Configuration

```typescript
// vite.config.ts
import antdDeprecated from '@brain-toolkit/antd-theme-override/vite';

export default {
  plugins: [
    antdDeprecated({
      // Mode selection
      mode: 'noGlobals', // or 'overrideStatic'

      // Type file generation path (optional)
      targetPath: './src/types/deprecated-antd.d.ts',

      // CSS injection file path (optional)
      inLoadCssFile: './src/main.tsx',

      // Override style file path (optional, only effective in overrideStatic mode)
      overriedCssFilePath: './src/styles/antd-override.css'
    })
  ]
};
```

## Configuration Options

### AntdThemeProvider Props

| Prop Name | Type                         | Default | Description                    |
| --------- | ---------------------------- | ------- | ------------------------------ |
| theme     | ConfigProviderProps['theme'] | -       | Ant Design theme configuration |
| staticApi | AntdStaticApiInterface       | -       | Static API configuration       |
| children  | ReactNode                    | -       | Child components               |

### Vite Plugin Options

| Option Name         | Type                            | Default                            | Description               |
| ------------------- | ------------------------------- | ---------------------------------- | ------------------------- |
| mode                | 'noGlobals' \| 'overrideStatic' | 'noGlobals'                        | Plugin working mode       |
| targetPath          | string                          | './src/types/deprecated-antd.d.ts' | Type file generation path |
| inLoadCssFile       | string                          | './src/main.tsx'                   | CSS injection file path   |
| overriedCssFilePath | string                          | './src/styles/antd-override.css'   | Override style file path  |

## Working Modes

### noGlobals Mode

In this mode, the plugin will:

- Generate type definition files to prohibit the use of Ant Design global APIs
- Including: `message`, `Modal.confirm`, `notification`, etc.
- Force developers to use component-based approaches for these functionalities

### overrideStatic Mode

In this mode, the plugin will:

- Allow the use of global APIs but override their default behavior through custom styles
- Automatically inject override style files
- Provide unified visual style management

## Best Practices

1. **Theme Management**

```tsx
// theme.ts
export const myTheme = {
  token: {
    colorPrimary: '#00b96b',
    borderRadius: 6
  }
};

// App.tsx
import { myTheme } from './theme';

function App() {
  return (
    <AntdThemeProvider theme={myTheme}>
      <YourApp />
    </AntdThemeProvider>
  );
}
```

2. **Global API Alternatives**

```tsx
// Not recommended
message.success('Operation successful');

// Recommended
import { Message } from 'antd';

function MyComponent() {
  return <Message type="success">Operation successful</Message>;
}
```

## FAQ

1. **Why avoid using global APIs?**
   - Better testability
   - Clearer component dependency relationships
   - Easier theme customization

2. **How to migrate existing global API usage?**
   - Use component-based alternatives
   - Utilize IDE type checking prompts for refactoring
   - Progressive migration, starting with overrideStatic mode

## Contributing

Contributions via Issues and Pull Requests are welcome. Before submitting a PR, please ensure:

1. Add/update test cases
2. Update relevant documentation
3. Follow existing code style

## License

ISC
