# Brain User Example

This is a simple Vite + React example project demonstrating how to use `@brain-toolkit/brain-user`.

## Features

- Login/Logout functionality
- Get user information
- Refresh user information
- Display user store information (feature tags, profile, etc.)

## Getting Started

### Install Dependencies

```bash
pnpm install
```

### Run Development Server

```bash
pnpm dev
```

The example will be available at `http://localhost:3001`

## Usage

This example demonstrates:

1. **Service Initialization**: Creating a `BrainUserService` instance with configuration
2. **Authentication**: Login and logout operations
3. **User Information**: Getting and refreshing user information
4. **Store Access**: Accessing feature tags and user profile from the store

## Configuration

The example uses default development configuration. You can modify the service options in `src/App.tsx`:

```typescript
const options = createBrainUserOptions({
  env: 'development',
  store: {
    persistUserInfo: true
  }
});
```

## Notes

- This is a demonstration project and uses mock/test credentials
- In a real application, you would need to configure proper API endpoints and authentication
- The service automatically persists user information to localStorage when `persistUserInfo` is enabled

