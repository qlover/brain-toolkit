# @brain-toolkit/brain-user

Brain User Service - User authentication and management library for Brain platform

## Installation

```bash
pnpm add @brain-toolkit/brain-user
```

## Quick Start

```ts
import { BrainUserService } from '@brain-toolkit/brain-user';

const service = new BrainUserService({
  env: 'production'
});

// Login with Google
const credentials = await service.loginWithGoogle({
  authorization_code: 'google-oauth-code'
});

// Get user info
const user = await service.getUserInfo();
console.log(user.email, user.name);
```

## Documentation

For detailed documentation, please refer to the [Brain User Service documentation](./docs/README.md).

## License

ISC

