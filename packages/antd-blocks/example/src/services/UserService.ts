/**
 * Mock User Service
 *
 * Significance: Demonstrates ResourceServiceInterface implementation
 * Core idea: Provide in-memory CRUD operations for testing
 * Main function: Simulate backend API with mock data
 * Main purpose: Enable ResourceTable component testing without real backend
 *
 * @example
 * ```typescript
 * const userService = new UserService();
 * const users = await userService.search({ page: 1, pageSize: 10 });
 * ```
 */
import type {
  ResourceServiceInterface,
  ResourceStateInterface,
  ResourceQuery
} from '@qlover/corekit-bridge';
import {
  ResourceStore
} from '@qlover/corekit-bridge';
import type { User } from './types';
import { ResourceState } from './ResourceState';

/**
 * Resource list result type
 */
export interface ResourceListResult<T> {
  list: T[];
  total: number;
}

/**
 * Mock user data storage
 */
const mockUsers: User[] = [
  {
    id: 1,
    name: 'Alice Johnson',
    email: 'alice@example.com',
    role: 'admin',
    age: 28,
    phone: '123-456-7890'
  },
  {
    id: 2,
    name: 'Bob Smith',
    email: 'bob@example.com',
    role: 'user',
    age: 35,
    phone: '234-567-8901'
  },
  {
    id: 3,
    name: 'Charlie Brown',
    email: 'charlie@example.com',
    role: 'user',
    age: 42,
    phone: '345-678-9012'
  },
  {
    id: 4,
    name: 'Diana Prince',
    email: 'diana@example.com',
    role: 'admin',
    age: 31,
    phone: '456-789-0123'
  },
  {
    id: 5,
    name: 'Eve Wilson',
    email: 'eve@example.com',
    role: 'guest',
    age: 26,
    phone: '567-890-1234'
  },
  {
    id: 6,
    name: 'Frank Miller',
    email: 'frank@example.com',
    role: 'user',
    age: 39,
    phone: '678-901-2345'
  },
  {
    id: 7,
    name: 'Grace Lee',
    email: 'grace@example.com',
    role: 'user',
    age: 29,
    phone: '789-012-3456'
  },
  {
    id: 8,
    name: 'Henry Davis',
    email: 'henry@example.com',
    role: 'admin',
    age: 45,
    phone: '890-123-4567'
  }
];

let nextId = 9;

/**
 * UserService - Mock implementation of ResourceServiceInterface
 *
 * Provides CRUD operations with simulated async behavior
 */
export class UserService
  implements
    ResourceServiceInterface<User, ResourceStore<ResourceStateInterface>>
{
  public store = new ResourceStore(() => new ResourceState());

  // Interface required properties (not used in this mock example)
  public unionKey = 'users' as const;
  public serviceName = 'UserService' as const;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  public resourceApi = null as any; // Mock services don't need actual API
  public export = async () => ({}); // Mock export function

  /**
   * Get the resource store instance
   *
   * @override
   * @returns Resource store for state management
   */
  public getStore(): ResourceStore<ResourceStateInterface> {
    return this.store;
  }

  /**
   * Create a new user
   *
   * @override
   * @param data - User data to create
   * @returns Newly created user with assigned ID
   */
  public async create(data: unknown): Promise<User> {
    // Simulate API delay
    await new Promise((resolve) => setTimeout(resolve, 500));

    const userData = data as Omit<User, 'id'>;
    const newUser: User = {
      ...userData,
      id: nextId++
    };

    mockUsers.push(newUser);
    return newUser;
  }

  /**
   * Update an existing user
   *
   * @override
   * @param data - Partial user data with ID
   * @returns Updated user
   */
  public async update(data: Partial<User>): Promise<User> {
    // Simulate API delay
    await new Promise((resolve) => setTimeout(resolve, 500));

    const index = mockUsers.findIndex((u) => u.id === data.id);
    if (index === -1) {
      throw new Error(`User with ID ${data.id} not found`);
    }

    mockUsers[index] = { ...mockUsers[index], ...data } as User;
    return mockUsers[index];
  }

  /**
   * Remove a user
   *
   * @override
   * @param data - User data containing ID to remove
   */
  public async remove(data: unknown): Promise<void> {
    // Simulate API delay
    await new Promise((resolve) => setTimeout(resolve, 500));

    const userId = (data as User).id;
    const index = mockUsers.findIndex((u) => u.id === userId);
    if (index === -1) {
      throw new Error(`User with ID ${userId} not found`);
    }

    mockUsers.splice(index, 1);
  }

  /**
   * Search users with pagination
   *
   * @override
   * @param query - Search query with page and pageSize
   * @returns Paginated list of users
   */
  public async search(query: ResourceQuery): Promise<ResourceListResult<User>> {
    // Simulate API delay
    await new Promise((resolve) => setTimeout(resolve, 300));

    const { page = 1, pageSize = 10 } = query;
    const start = (page - 1) * pageSize;
    const end = start + pageSize;

    const paginatedUsers = mockUsers.slice(start, end);

    return {
      list: paginatedUsers,
      total: mockUsers.length
    };
  }

  /**
   * Lifecycle hook - called when component is created

   * @override
      */
  public created(): void {
    // Initialize if needed
    console.log('UserService created');
    this.search({ page: 1, pageSize: 10 });
  }

  /**
   * Lifecycle hook - called when component is updated

   * @override
      */
  public updated(): void {
    // Handle updates if needed
  }

  /**
   * Lifecycle hook - called when component is destroyed

   * @override
      */
  public destroyed(): void {
    // Cleanup if needed
    console.log('UserService destroyed');
  }
}
