/* eslint-disable @typescript-eslint/no-explicit-any */
import { factory } from '@qlover/slice-store-react';
import { useMemo } from 'react';

/**
 * Type for class constructor
 *
 * Represents a constructor that can be instantiated with new keyword
 */
type ConstructorType<T, TArgs extends any[]> = new (...args: TArgs) => T;

/**
 * Type for factory function
 *
 * Represents a function that returns an instance without new keyword
 */
type FactoryFunction<T, TArgs extends any[]> = (...args: TArgs) => T;

/**
 * Hook to create a stable instance of a class or result of a factory function
 *
 * Significance: Ensures single instance creation throughout component lifecycle
 * Core idea: Memoizes instance creation, preventing unnecessary re-instantiation
 * Main function: Creates and maintains a stable reference to class/factory instances
 * Main purpose: Optimize performance and maintain instance identity across re-renders
 *
 * Key features:
 * - Creates instance only once during initial render
 * - Supports both class constructors and factory functions
 * - Type-safe with full TypeScript support
 * - Arguments are passed during creation and remain stable
 *
 * Use cases:
 * - Creating service instances that should persist across renders
 * - Instantiating store instances with initial state
 * - Creating complex objects that are expensive to construct
 * - Managing stateful instances that need identity preservation
 *
 * @param factoryOrClass - Constructor or factory function to create the instance
 * @param args - Arguments to pass to the constructor or factory function
 * @returns A stable instance that persists across component re-renders
 *
 * @example Using with class constructor
 * class UserService {
 *   constructor(private apiUrl: string) {}
 *   async getUser(id: string) {
 *     return fetch(`${this.apiUrl}/users/${id}`);
 *   }
 * }
 *
 * function UserComponent() {
 *   const userService = useFactory(UserService, '/api');
 *   // userService instance remains stable across re-renders
 * }
 *
 * @example Using with factory function
 * function createLogger(namespace: string) {
 *   return {
 *     log: (msg: string) => console.log(`[${namespace}] ${msg}`),
 *     error: (msg: string) => console.error(`[${namespace}] ${msg}`)
 *   };
 * }
 *
 * function LoggerComponent() {
 *   const logger = useFactory(createLogger, 'MyComponent');
 *   logger.log('Component rendered'); // Always the same logger instance
 * }
 *
 * @example Creating store instance
 * class CounterStore {
 *   constructor(private initialValue: number) {}
 *   state = { count: this.initialValue };
 *   increment() { this.state.count++; }
 * }
 *
 * function Counter({ initial }: { initial: number }) {
 *   const store = useFactory(CounterStore, initial);
 *   // Store is created once with initial value
 *   // Subsequent renders with different initial prop won't recreate store
 * }
 *
 * @example Complex service with dependencies
 * class TodoService {
 *   constructor(
 *     private apiClient: ApiClient,
 *     private userId: string
 *   ) {}
 *
 *   async fetchTodos() {
 *     return this.apiClient.get(`/users/${this.userId}/todos`);
 *   }
 * }
 *
 * function TodoList({ apiClient, userId }: Props) {
 *   const todoService = useFactory(TodoService, apiClient, userId);
 *   // Service instance is stable even when component re-renders
 * }
 *
 * @example With no arguments
 * class SingletonService {
 *   private static instance: SingletonService;
 *   // ... singleton logic
 * }
 *
 * function App() {
 *   const service = useFactory(SingletonService);
 *   // No arguments needed
 * }
 */
export function useFactory<T, TArgs extends any[]>(
  factoryOrClass: ConstructorType<T, TArgs>,
  ...args: TArgs
): T;
export function useFactory<T, TArgs extends any[]>(
  factoryOrClass: FactoryFunction<T, TArgs>,
  ...args: TArgs
): T;
export function useFactory<T>(
  factoryOrClass: ConstructorType<T, any[]> | FactoryFunction<T, any[]>,
  ...args: any[]
): T {
  // eslint-disable-next-line react-hooks/exhaustive-deps
  return useMemo(() => factory(factoryOrClass as any, ...args), []);
}
