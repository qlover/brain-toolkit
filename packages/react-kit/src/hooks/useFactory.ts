/* eslint-disable @typescript-eslint/no-explicit-any */
import { useMemo } from 'react';

/**
 * Type for class constructor
 *
 * Represents a constructor that can be instantiated with new keyword
 */
type ConstructorType<T, TArgs extends any[]> = new (...args: TArgs) => T;

/**
 * Internal factory function to create instances using constructor
 *
 * Significance: Simple and direct instance creation with 'new' keyword
 * Core idea: Always use 'new' to instantiate - no ambiguity
 * Main function: Create instances from class constructors
 * Main purpose: Provide a clear, predictable instantiation mechanism
 *
 * @param Constructor - Class constructor function
 * @param args - Arguments to pass to constructor
 * @returns Created instance
 *
 * @example ES6 class
 * class Service { constructor(name) { this.name = name; } }
 * factory(Service, 'test') // new Service('test')
 *
 * @example ES5 constructor
 * function Person(name) { this.name = name; }
 * factory(Person, 'Alice') // new Person('Alice')
 */
function factory<T, TArgs extends any[]>(
  Constructor: ConstructorType<T, TArgs>,
  ...args: TArgs
): T {
  return new Constructor(...args);
}

/**
 * Hook to create a stable instance of a class constructor
 *
 * Significance: Ensures instance creation with automatic recreation on argument changes
 * Core idea: Memoizes constructor instantiation with 'new' keyword and tracks argument changes
 * Main function: Creates and maintains a stable reference to class instances
 * Main purpose: Optimize performance and maintain instance identity across re-renders while responding to argument changes
 *
 * Key features:
 * - Creates instance during initial render using 'new'
 * - Automatically recreates instance when arguments change
 * - Supports ES6 classes, ES5 constructors, and TypeScript classes
 * - Type-safe with full TypeScript support
 * - Arguments are tracked and changes trigger recreation
 *
 * Important notes:
 * - This hook ONLY supports constructors (functions that should be called with 'new')
 * - Instance will be recreated when any argument changes (uses shallow comparison)
 * - For factory functions, use useMemo directly:
 *   `const obj = useMemo(() => createObject(args), [args])`
 *
 * Use cases:
 * - Creating service instances that should persist across renders
 * - Instantiating store instances with initial state
 * - Creating complex objects that are expensive to construct
 * - Managing stateful instances that need identity preservation
 *
 * @param Constructor - Class constructor to instantiate
 * @param args - Arguments to pass to the constructor
 * @returns A stable instance that persists across component re-renders (unless args change)
 *
 * @example Using with ES6 class
 * class UserService {
 *   constructor(private apiUrl: string) {}
 *   async getUser(id: string) {
 *     return fetch(`${this.apiUrl}/users/${id}`);
 *   }
 * }
 *
 * function UserComponent({ apiUrl }: Props) {
 *   const userService = useFactory(UserService, apiUrl);
 *   // userService instance remains stable across re-renders
 *   // but will be recreated if apiUrl changes
 * }
 *
 * @example Using with ES5 constructor
 * function Person(name, age) {
 *   this.name = name;
 *   this.age = age;
 * }
 * Person.prototype.greet = function() {
 *   return `Hello, I'm ${this.name}`;
 * };
 *
 * function PersonComponent({ name, age }: Props) {
 *   const person = useFactory(Person, name, age);
 *   // person will be recreated when name or age changes
 *   console.log(person.greet()); // "Hello, I'm Alice"
 * }
 *
 * @example Creating store instance
 * class CounterStore {
 *   constructor(private initialValue: number) {
 *     this.state = { count: initialValue };
 *   }
 *   state: { count: number };
 *   increment() { this.state.count++; }
 * }
 *
 * function Counter({ initial }: { initial: number }) {
 *   const store = useFactory(CounterStore, initial);
 *   // Store is created with initial value
 *   // Store will be recreated when initial prop changes
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
 *   // Service instance will be recreated if apiClient or userId changes
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
 *   // No arguments needed, instance created once
 * }
 *
 * @example For factory functions, use useMemo instead
 * function createLogger(namespace: string) {
 *   return {
 *     log: (msg: string) => console.log(`[${namespace}] ${msg}`)
 *   };
 * }
 *
 * function LoggerComponent() {
 *   // DON'T use useFactory for factory functions
 *   // DO use useMemo:
 *   const logger = useMemo(() => createLogger('MyComponent'), []);
 *   logger.log('Component rendered');
 * }
 */
export function useFactory<T, TArgs extends any[]>(
  Constructor: ConstructorType<T, TArgs>,
  ...args: TArgs
): T {
  // Spread args into array literal so useMemo can track each argument change
  // Constructor is stable and doesn't need to be in dependencies
  // We disable exhaustive-deps because ESLint cannot statically verify spread elements
  // eslint-disable-next-line react-hooks/exhaustive-deps
  return useMemo(() => factory(Constructor, ...args), [...args]);
}
