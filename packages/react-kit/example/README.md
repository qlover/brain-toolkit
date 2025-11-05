# React Kit Examples

This directory contains interactive examples for the `@brain-toolkit/react-kit` package.

## Available Examples

- **useLifecycle** - Manage component lifecycle events
- **useFactory** - Create stable class instances
- **useStore** - Reactive state management
- **useMountedClient** - SSR-safe client-side code

## Getting Started

### Development

```bash
# From the react-kit package directory
pnpm dev:example
```

This will start a development server at http://localhost:3010

### Build

```bash
# Build the example application
pnpm build:example
```

### Preview

```bash
# Preview the built example
pnpm preview:example
```

## Project Structure

```
example/
├── src/
│   ├── examples/          # Individual hook examples
│   │   ├── LifecycleExample.tsx
│   │   ├── FactoryExample.tsx
│   │   ├── StoreExample.tsx
│   │   └── MountedClientExample.tsx
│   ├── pages/            # Application pages
│   │   └── HomePage.tsx
│   ├── App.tsx           # Main application component
│   ├── main.tsx          # Application entry point
│   ├── index.css         # Global styles
│   └── vite-env.d.ts     # Vite type definitions
├── index.html            # HTML template
├── tsconfig.json         # TypeScript configuration
└── tsconfig.node.json    # Node TypeScript configuration
```

## Features

- 🚀 **Interactive Examples**: Live demonstrations of each hook
- 📱 **Responsive Design**: Works on desktop and mobile
- 🎨 **Clean UI**: Simple and intuitive interface
- 📚 **Well Documented**: Clear explanations and use cases
- ⚡ **Fast Refresh**: Hot module replacement for quick iteration

## Learn More

- [React Kit Documentation](../README.md)
- [GitHub Repository](https://github.com/qlover/brain-toolkit)

