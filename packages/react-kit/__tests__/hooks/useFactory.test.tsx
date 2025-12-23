import { renderHook } from '@testing-library/react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useFactory } from '../../src/hooks/useFactory';
import { describe, it, expect, vi } from 'vitest';
import { useState } from 'react';

/**
 * Test suite for useFactory hook
 *
 * Tests the functionality of creating instances with automatic recreation on argument changes
 */
describe('useFactory', () => {
  describe('Basic Instance Creation', () => {
    /**
     * Test class without arguments
     */
    it('should create instance from class constructor without arguments', () => {
      class SimpleService {
        public value = 42;
      }

      const { result } = renderHook(() => useFactory(SimpleService));

      expect(result.current).toBeInstanceOf(SimpleService);
      expect(result.current.value).toBe(42);
    });

    /**
     * Test class with single argument
     */
    it('should create instance from class constructor with single argument', () => {
      class UserService {
        constructor(public apiUrl: string) {}
      }

      const { result } = renderHook(() => useFactory(UserService, '/api'));

      expect(result.current).toBeInstanceOf(UserService);
      expect(result.current.apiUrl).toBe('/api');
    });

    /**
     * Test class with multiple arguments
     */
    it('should create instance from class constructor with multiple arguments', () => {
      class ConfigService {
        constructor(
          public host: string,
          public port: number,
          public secure: boolean
        ) {}
      }

      const { result } = renderHook(() =>
        useFactory(ConfigService, 'localhost', 3000, true)
      );

      expect(result.current).toBeInstanceOf(ConfigService);
      expect(result.current.host).toBe('localhost');
      expect(result.current.port).toBe(3000);
      expect(result.current.secure).toBe(true);
    });
  });

  describe('Instance Stability Without Args', () => {
    /**
     * Test that instance remains stable across re-renders when no args are provided
     */
    it('should return same instance across re-renders when no args provided', () => {
      const constructorSpy = vi.fn();

      class StableService {
        public id = Math.random();
        constructor() {
          constructorSpy();
        }
      }

      const { result, rerender } = renderHook(() => useFactory(StableService));

      const firstInstance = result.current;
      const firstId = firstInstance.id;

      expect(constructorSpy).toHaveBeenCalledTimes(1);

      // Trigger multiple re-renders
      rerender();
      rerender();
      rerender();

      const lastInstance = result.current;
      const lastId = lastInstance.id;

      // Should be the exact same instance
      expect(lastInstance).toBe(firstInstance);
      expect(lastId).toBe(firstId);
      // Constructor should only be called once
      expect(constructorSpy).toHaveBeenCalledTimes(1);
    });
  });

  describe('Instance Stability With Stable Args', () => {
    /**
     * Test that instance remains stable when args don't change
     */
    it('should return same instance when args remain the same (primitive)', () => {
      const constructorSpy = vi.fn();

      class ConfigurableService {
        constructor(public config: string) {
          constructorSpy(config);
        }
      }

      const { result, rerender } = renderHook(() =>
        useFactory(ConfigurableService, 'stable-value')
      );

      const firstInstance = result.current;
      expect(constructorSpy).toHaveBeenCalledTimes(1);
      expect(constructorSpy).toHaveBeenCalledWith('stable-value');

      // Re-render multiple times with same value
      rerender();
      rerender();
      rerender();

      // Should be same instance
      expect(result.current).toBe(firstInstance);
      expect(result.current.config).toBe('stable-value');
      // Constructor should still only be called once
      expect(constructorSpy).toHaveBeenCalledTimes(1);
    });

    /**
     * Test with multiple stable args
     */
    it('should return same instance when multiple args remain the same', () => {
      const constructorSpy = vi.fn();

      class MultiArgService {
        constructor(
          public arg1: string,
          public arg2: number,
          public arg3: boolean
        ) {
          constructorSpy(arg1, arg2, arg3);
        }
      }

      const { result, rerender } = renderHook(() =>
        useFactory(MultiArgService, 'test', 42, true)
      );

      const firstInstance = result.current;
      expect(constructorSpy).toHaveBeenCalledTimes(1);

      // Re-render multiple times
      rerender();
      rerender();

      // Should be same instance
      expect(result.current).toBe(firstInstance);
      expect(constructorSpy).toHaveBeenCalledTimes(1);
    });
  });

  describe('Instance Recreation On Args Change', () => {
    /**
     * Test that instance is recreated when single arg changes
     */
    it('should create new instance when single argument changes', () => {
      const constructorSpy = vi.fn();

      class ConfigurableService {
        constructor(public config: string) {
          constructorSpy(config);
        }
      }

      const { result, rerender } = renderHook(
        ({ config }) => useFactory(ConfigurableService, config),
        {
          initialProps: { config: 'initial' }
        }
      );

      const firstInstance = result.current;
      expect(firstInstance.config).toBe('initial');
      expect(constructorSpy).toHaveBeenCalledTimes(1);
      expect(constructorSpy).toHaveBeenCalledWith('initial');

      // Re-render with different config
      rerender({ config: 'updated' });

      const secondInstance = result.current;

      // Should be different instance with new config
      expect(secondInstance).not.toBe(firstInstance);
      expect(secondInstance.config).toBe('updated');
      expect(constructorSpy).toHaveBeenCalledTimes(2);
      expect(constructorSpy).toHaveBeenCalledWith('updated');

      // Re-render with same config
      rerender({ config: 'updated' });

      // Should remain same instance
      expect(result.current).toBe(secondInstance);
      expect(constructorSpy).toHaveBeenCalledTimes(2);
    });

    /**
     * Test recreation when any of multiple args changes
     */
    it('should recreate instance when any argument changes', () => {
      const constructorSpy = vi.fn();

      class MultiArgService {
        constructor(
          public arg1: string,
          public arg2: number
        ) {
          constructorSpy(arg1, arg2);
        }
      }

      const { result, rerender } = renderHook(
        ({ arg1, arg2 }) => useFactory(MultiArgService, arg1, arg2),
        {
          initialProps: { arg1: 'test', arg2: 42 }
        }
      );

      const firstInstance = result.current;
      expect(constructorSpy).toHaveBeenCalledTimes(1);

      // Change first argument only
      rerender({ arg1: 'updated', arg2: 42 });

      expect(result.current).not.toBe(firstInstance);
      expect(result.current.arg1).toBe('updated');
      expect(result.current.arg2).toBe(42);
      expect(constructorSpy).toHaveBeenCalledTimes(2);

      const secondInstance = result.current;

      // Change second argument only
      rerender({ arg1: 'updated', arg2: 100 });

      expect(result.current).not.toBe(secondInstance);
      expect(result.current.arg1).toBe('updated');
      expect(result.current.arg2).toBe(100);
      expect(constructorSpy).toHaveBeenCalledTimes(3);

      // Keep both arguments same
      rerender({ arg1: 'updated', arg2: 100 });

      const thirdInstance = result.current;
      expect(result.current).toBe(thirdInstance);
      expect(constructorSpy).toHaveBeenCalledTimes(3);
    });

    /**
     * Test recreation with primitive type changes
     */
    it('should recreate instance when primitive args change', () => {
      class NumberService {
        constructor(public value: number) {}
      }

      const { result, rerender } = renderHook(
        ({ value }) => useFactory(NumberService, value),
        {
          initialProps: { value: 1 }
        }
      );

      const firstInstance = result.current;

      // Change from 1 to 2
      rerender({ value: 2 });
      expect(result.current).not.toBe(firstInstance);
      expect(result.current.value).toBe(2);

      // Change from 2 to 0
      rerender({ value: 0 });
      expect(result.current.value).toBe(0);

      const thirdInstance = result.current;

      // Keep at 0
      rerender({ value: 0 });
      expect(result.current).toBe(thirdInstance);
    });

    /**
     * Test with object reference changes
     */
    it('should recreate instance when object reference changes', () => {
      interface Config {
        timeout: number;
        retries: number;
      }

      class ApiClient {
        constructor(public config: Config) {}
      }

      const config1: Config = { timeout: 5000, retries: 3 };
      const config2: Config = { timeout: 5000, retries: 3 }; // Same values, different reference

      const { result, rerender } = renderHook(
        ({ config }) => useFactory(ApiClient, config),
        {
          initialProps: { config: config1 }
        }
      );

      const firstInstance = result.current;
      expect(firstInstance.config).toBe(config1);

      // Same reference, no recreation
      rerender({ config: config1 });
      expect(result.current).toBe(firstInstance);

      // Different reference, should recreate
      rerender({ config: config2 });
      expect(result.current).not.toBe(firstInstance);
      expect(result.current.config).toBe(config2);
    });
  });

  describe('Complex Use Cases', () => {
    /**
     * Test with store-like class that maintains state
     */
    it('should work with store-like class maintaining state', () => {
      class CounterStore {
        constructor(private initialValue: number) {
          this.state = { count: this.initialValue };
        }
        public state: { count: number };

        public increment(): void {
          this.state.count++;
        }

        public getCount(): number {
          return this.state.count;
        }
      }

      const { result, rerender } = renderHook(
        ({ initial }) => useFactory(CounterStore, initial),
        {
          initialProps: { initial: 10 }
        }
      );

      expect(result.current.getCount()).toBe(10);

      // Increment
      result.current.increment();
      expect(result.current.getCount()).toBe(11);

      // Re-render with same initial value - instance should persist, state should remain
      rerender({ initial: 10 });
      expect(result.current.getCount()).toBe(11); // State preserved

      // Re-render with different initial value - new instance created
      rerender({ initial: 20 });
      expect(result.current.getCount()).toBe(20); // New instance with new initial value
    });

    /**
     * Test with service having dependencies
     */
    it('should work with service having multiple dependencies', () => {
      class Logger {
        constructor(public prefix: string) {}
        public log(message: string): string {
          return `[${this.prefix}] ${message}`;
        }
      }

      const { result, rerender } = renderHook(
        ({ prefix }) => useFactory(Logger, prefix),
        {
          initialProps: { prefix: 'INFO' }
        }
      );

      expect(result.current.log('test')).toBe('[INFO] test');

      // Change prefix
      rerender({ prefix: 'DEBUG' });

      expect(result.current.log('test')).toBe('[DEBUG] test');
    });

    /**
     * Test with class having methods and state
     */
    it('should properly handle class with methods and internal state', () => {
      class Calculator {
        private history: number[] = [];

        constructor(public multiplier: number) {}

        public multiply(value: number): number {
          const result = value * this.multiplier;
          this.history.push(result);
          return result;
        }

        public getHistory(): number[] {
          return this.history;
        }
      }

      const { result, rerender } = renderHook(
        ({ multiplier }) => useFactory(Calculator, multiplier),
        {
          initialProps: { multiplier: 2 }
        }
      );

      // Use calculator
      expect(result.current.multiply(5)).toBe(10);
      expect(result.current.multiply(3)).toBe(6);
      expect(result.current.getHistory()).toEqual([10, 6]);

      // Re-render with same multiplier - state should persist
      rerender({ multiplier: 2 });
      expect(result.current.getHistory()).toEqual([10, 6]);

      // Re-render with different multiplier - new instance
      rerender({ multiplier: 3 });
      expect(result.current.multiply(5)).toBe(15);
      expect(result.current.getHistory()).toEqual([15]); // New history
    });
  });

  describe('Edge Cases', () => {
    /**
     * Test with empty class
     */
    it('should work with empty class', () => {
      class EmptyClass {}

      const { result } = renderHook(() => useFactory(EmptyClass));

      expect(result.current).toBeInstanceOf(EmptyClass);
    });

    /**
     * Test with class that has private properties
     */
    it('should work with class that has private properties', () => {
      class PrivateService {
        private secret = 'hidden';

        constructor(public publicValue: string) {}

        public getSecret(): string {
          return this.secret;
        }
      }

      const { result, rerender } = renderHook(
        ({ value }) => useFactory(PrivateService, value),
        {
          initialProps: { value: 'visible' }
        }
      );

      expect(result.current.publicValue).toBe('visible');
      expect(result.current.getSecret()).toBe('hidden');

      // Change public value
      rerender({ value: 'updated' });

      expect(result.current.publicValue).toBe('updated');
      expect(result.current.getSecret()).toBe('hidden');
    });

    /**
     * Test with null/undefined arguments
     */
    it('should handle null and undefined arguments correctly', () => {
      class NullableService {
        constructor(
          public value1: string | null,
          public value2: number | undefined
        ) {}
      }

      const { result, rerender } = renderHook(
        ({ v1, v2 }) => useFactory(NullableService, v1, v2),
        {
          initialProps: {
            v1: null as string | null,
            v2: undefined as number | undefined
          }
        }
      );

      const firstInstance = result.current;
      expect(firstInstance.value1).toBeNull();
      expect(firstInstance.value2).toBeUndefined();

      // Change null to string
      rerender({ v1: 'test', v2: undefined });

      expect(result.current).not.toBe(firstInstance);
      expect(result.current.value1).toBe('test');

      const secondInstance = result.current;

      // Change undefined to number
      rerender({ v1: 'test', v2: 42 });

      expect(result.current).not.toBe(secondInstance);
      expect(result.current.value2).toBe(42);
    });

    /**
     * Test with boolean arguments (including falsy values)
     */
    it('should handle boolean arguments including false', () => {
      class BooleanService {
        constructor(public enabled: boolean) {}
      }

      const { result, rerender } = renderHook(
        ({ enabled }) => useFactory(BooleanService, enabled),
        {
          initialProps: { enabled: true }
        }
      );

      expect(result.current.enabled).toBe(true);

      // Change to false
      rerender({ enabled: false });

      expect(result.current.enabled).toBe(false);

      const secondInstance = result.current;

      // Keep at false
      rerender({ enabled: false });

      expect(result.current).toBe(secondInstance);
    });
  });

  describe('Type Safety', () => {
    /**
     * Test type inference works correctly
     */
    it('should correctly infer return type from class', () => {
      class TypedService {
        public value: number = 42;
        public name: string = 'test';
      }

      const { result } = renderHook(() => useFactory(TypedService));

      // TypeScript should infer correct types
      const value: number = result.current.value;
      const name: string = result.current.name;

      expect(value).toBe(42);
      expect(name).toBe('test');
    });
  });

  describe('Real Component Tests', () => {
    /**
     * Test with real component - no args, instance stability
     */
    it('should maintain stable instance across component re-renders (no args)', async () => {
      const constructorSpy = vi.fn();

      class SingletonService {
        public id = Math.random();
        constructor() {
          constructorSpy();
        }
        public getId(): number {
          return this.id;
        }
      }

      function TestComponent() {
        const [count, setCount] = useState(0);
        const service = useFactory(SingletonService);

        return (
          <div>
            <div data-testid="service-id">{service.getId()}</div>
            <div data-testid="render-count">{count}</div>
            <button onClick={() => setCount(count + 1)}>Re-render</button>
          </div>
        );
      }

      const { rerender } = render(<TestComponent />);

      const firstId = screen.getByTestId('service-id').textContent;
      expect(constructorSpy).toHaveBeenCalledTimes(1);

      // Force re-render
      rerender(<TestComponent />);

      const secondId = screen.getByTestId('service-id').textContent;

      // Should be same instance
      expect(secondId).toBe(firstId);
      expect(constructorSpy).toHaveBeenCalledTimes(1);
    });

    /**
     * Test with real component - args change triggers recreation
     */
    it('should recreate instance when props change in component', () => {
      const constructorSpy = vi.fn();

      class ConfigService {
        constructor(public apiUrl: string) {
          constructorSpy(apiUrl);
        }
        public getUrl(): string {
          return this.apiUrl;
        }
      }

      function TestComponent({ apiUrl }: { apiUrl: string }) {
        const service = useFactory(ConfigService, apiUrl);

        return (
          <div>
            <div data-testid="service-url">{service.getUrl()}</div>
          </div>
        );
      }

      const { rerender } = render(<TestComponent apiUrl="/api/v1" />);

      expect(screen.getByTestId('service-url').textContent).toBe('/api/v1');
      expect(constructorSpy).toHaveBeenCalledTimes(1);
      expect(constructorSpy).toHaveBeenCalledWith('/api/v1');

      // Change prop
      rerender(<TestComponent apiUrl="/api/v2" />);

      expect(screen.getByTestId('service-url').textContent).toBe('/api/v2');
      expect(constructorSpy).toHaveBeenCalledTimes(2);
      expect(constructorSpy).toHaveBeenCalledWith('/api/v2');

      // Keep same prop
      rerender(<TestComponent apiUrl="/api/v2" />);

      expect(screen.getByTestId('service-url').textContent).toBe('/api/v2');
      expect(constructorSpy).toHaveBeenCalledTimes(2);
    });

    /**
     * Test with counter component - state persistence
     */
    it('should maintain service state across component re-renders', async () => {
      const user = userEvent.setup();

      class CounterService {
        private count = 0;

        public increment(): void {
          this.count++;
        }

        public getCount(): number {
          return this.count;
        }
      }

      function CounterComponent() {
        const [renderCount, setRenderCount] = useState(0);
        const counter = useFactory(CounterService);

        return (
          <div>
            <div data-testid="counter-value">{counter.getCount()}</div>
            <div data-testid="render-count">{renderCount}</div>
            <button
              data-testid="increment-btn"
              onClick={() => {
                counter.increment();
                setRenderCount((c) => c + 1); // Force re-render to show updated count
              }}
            >
              Increment
            </button>
            <button
              data-testid="rerender-btn"
              onClick={() => setRenderCount((c) => c + 1)}
            >
              Re-render
            </button>
          </div>
        );
      }

      const { rerender } = render(<CounterComponent />);

      const incrementButton = screen.getByTestId('increment-btn');
      const rerenderButton = screen.getByTestId('rerender-btn');

      // Initial state
      expect(screen.getByTestId('counter-value').textContent).toBe('0');

      // Increment counter
      await user.click(incrementButton);
      expect(screen.getByTestId('render-count').textContent).toBe('1');
      expect(screen.getByTestId('counter-value').textContent).toBe('1');

      // Force re-render - counter state should persist
      await user.click(rerenderButton);
      expect(screen.getByTestId('counter-value').textContent).toBe('1');

      // Increment again
      await user.click(incrementButton);
      expect(screen.getByTestId('counter-value').textContent).toBe('2');

      // Force another re-render
      rerender(<CounterComponent />);
      expect(screen.getByTestId('counter-value').textContent).toBe('2');
    });

    /**
     * Test with multiple args component
     */
    it('should recreate service when any prop changes', () => {
      const constructorSpy = vi.fn();

      class ApiService {
        constructor(
          public baseUrl: string,
          public timeout: number
        ) {
          constructorSpy(baseUrl, timeout);
        }

        public getConfig(): string {
          return `${this.baseUrl} (timeout: ${this.timeout}ms)`;
        }
      }

      function ApiComponent({
        baseUrl,
        timeout
      }: {
        baseUrl: string;
        timeout: number;
      }) {
        const api = useFactory(ApiService, baseUrl, timeout);

        return (
          <div>
            <div data-testid="api-config">{api.getConfig()}</div>
          </div>
        );
      }

      const { rerender } = render(
        <ApiComponent baseUrl="/api" timeout={5000} />
      );

      expect(screen.getByTestId('api-config').textContent).toBe(
        '/api (timeout: 5000ms)'
      );
      expect(constructorSpy).toHaveBeenCalledTimes(1);

      // Change baseUrl only
      rerender(<ApiComponent baseUrl="/api/v2" timeout={5000} />);

      expect(screen.getByTestId('api-config').textContent).toBe(
        '/api/v2 (timeout: 5000ms)'
      );
      expect(constructorSpy).toHaveBeenCalledTimes(2);

      // Change timeout only
      rerender(<ApiComponent baseUrl="/api/v2" timeout={10000} />);

      expect(screen.getByTestId('api-config').textContent).toBe(
        '/api/v2 (timeout: 10000ms)'
      );
      expect(constructorSpy).toHaveBeenCalledTimes(3);

      // Keep both same
      rerender(<ApiComponent baseUrl="/api/v2" timeout={10000} />);

      expect(constructorSpy).toHaveBeenCalledTimes(3);
    });

    /**
     * Test store pattern in real component
     */
    it('should work with store pattern - recreation on initial value change', async () => {
      const user = userEvent.setup();
      class TodoStore {
        public todos: string[];

        constructor(initialTodos: string[]) {
          this.todos = [...initialTodos];
        }

        public addTodo(todo: string): void {
          this.todos.push(todo);
        }

        public getTodos(): string[] {
          return this.todos;
        }
      }

      function TodoComponent({ initial }: { initial: string[] }) {
        const store = useFactory(TodoStore, initial);
        const [updateCount, setUpdateCount] = useState(0);

        return (
          <div>
            <div data-testid="todo-list">{store.getTodos().join(', ')}</div>
            <div data-testid="update-count">{updateCount}</div>
            <button
              data-testid="add-btn"
              onClick={() => {
                store.addTodo('New Todo');
                setUpdateCount((c) => c + 1);
              }}
            >
              Add
            </button>
          </div>
        );
      }

      const initialArray1 = ['Task 1'];
      const initialArray2 = ['Task 1', 'Task 2'];

      const { rerender } = render(<TodoComponent initial={initialArray1} />);

      expect(screen.getByTestId('todo-list').textContent).toBe('Task 1');

      const addButton = screen.getByTestId('add-btn');
      // Add todo
      await user.click(addButton);

      expect(screen.getByTestId('todo-list').textContent).toBe(
        'Task 1, New Todo'
      );

      // Re-render with same initial reference - store persists
      rerender(<TodoComponent initial={initialArray1} />);
      expect(screen.getByTestId('todo-list').textContent).toBe(
        'Task 1, New Todo'
      );

      // Re-render with different initial reference - new store created
      rerender(<TodoComponent initial={initialArray2} />);
      expect(screen.getByTestId('todo-list').textContent).toBe(
        'Task 1, Task 2'
      );
    });

    /**
     * Test with object argument - reference identity matters
     */
    it('should recreate service when object reference changes', () => {
      const constructorSpy = vi.fn();

      interface Config {
        url: string;
        port: number;
      }

      class ConfigService {
        constructor(public config: Config) {
          constructorSpy(config);
        }

        public getInfo(): string {
          return `${this.config.url}:${this.config.port}`;
        }
      }

      function ConfigComponent({ config }: { config: Config }) {
        const service = useFactory(ConfigService, config);

        return (
          <div>
            <div data-testid="config-info">{service.getInfo()}</div>
          </div>
        );
      }

      const config1 = { url: 'localhost', port: 3000 };

      const { rerender } = render(<ConfigComponent config={config1} />);

      expect(screen.getByTestId('config-info').textContent).toBe(
        'localhost:3000'
      );
      expect(constructorSpy).toHaveBeenCalledTimes(1);

      // Re-render with same reference
      rerender(<ConfigComponent config={config1} />);
      expect(constructorSpy).toHaveBeenCalledTimes(1);

      // Re-render with new reference (same values)
      const config2 = { url: 'localhost', port: 3000 };
      rerender(<ConfigComponent config={config2} />);
      expect(constructorSpy).toHaveBeenCalledTimes(2);
    });
  });
});
