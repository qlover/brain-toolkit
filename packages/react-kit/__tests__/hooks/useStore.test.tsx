import { renderHook, waitFor } from '@testing-library/react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useStore } from '../../src/hooks/useStore';
import { describe, it, expect, vi } from 'vitest';
import { StoreInterface } from '@qlover/corekit-bridge';
import type { StoreStateInterface } from '@qlover/corekit-bridge';

/**
 * Test suite for useStore hook
 *
 * Tests the functionality of subscribing to store state changes with optional selectors
 */
describe('useStore', () => {
  describe('Basic Store Subscription', () => {
    /**
     * Test basic store subscription without selector
     */
    it('should subscribe to entire store state', () => {
      interface CounterState extends StoreStateInterface {
        count: number;
      }

      class CounterStore extends StoreInterface<CounterState> {
        constructor() {
          super(() => ({ count: 0 }));
        }

        increment(): void {
          this.emit({ count: this.state.count + 1 });
        }
      }

      const store = new CounterStore();
      const { result } = renderHook(() => useStore(store));

      expect(result.current.count).toBe(0);
    });

    /**
     * Test that component re-renders when store state changes
     */
    it('should trigger re-render when store state changes', async () => {
      interface CounterState extends StoreStateInterface {
        count: number;
      }

      class CounterStore extends StoreInterface<CounterState> {
        constructor() {
          super(() => ({ count: 0 }));
        }

        increment(): void {
          this.emit({ count: this.state.count + 1 });
        }
      }

      const store = new CounterStore();
      const { result } = renderHook(() => useStore(store));

      expect(result.current.count).toBe(0);

      store.increment();

      await waitFor(() => {
        expect(result.current.count).toBe(1);
      });
    });

    /**
     * Test store with complex state
     */
    it('should handle complex state objects', () => {
      interface UserState extends StoreStateInterface {
        profile: {
          name: string;
          email: string;
        };
        settings: {
          theme: string;
          language: string;
        };
      }

      class UserStore extends StoreInterface<UserState> {
        constructor() {
          super(() => ({
            profile: { name: 'John', email: 'john@example.com' },
            settings: { theme: 'dark', language: 'en' }
          }));
        }
      }

      const store = new UserStore();
      const { result } = renderHook(() => useStore(store));

      expect(result.current.profile.name).toBe('John');
      expect(result.current.settings.theme).toBe('dark');
    });
  });

  describe('Selector Functionality', () => {
    /**
     * Test selector to subscribe to specific part of state
     */
    it('should use selector to get specific part of state', () => {
      interface AppState extends StoreStateInterface {
        user: { name: string; id: number };
        settings: { theme: string };
        todos: Array<{ id: number; text: string }>;
      }

      class AppStore extends StoreInterface<AppState> {
        constructor() {
          super(() => ({
            user: { name: 'Alice', id: 1 },
            settings: { theme: 'light' },
            todos: []
          }));
        }
      }

      const store = new AppStore();
      const { result } = renderHook(() =>
        useStore(store, (state) => state.user)
      );

      expect(result.current).toEqual({ name: 'Alice', id: 1 });
      expect(result.current).not.toHaveProperty('settings');
      expect(result.current).not.toHaveProperty('todos');
    });

    /**
     * Test derived state with selector
     */
    it('should compute derived state in selector', () => {
      interface TodoState extends StoreStateInterface {
        items: Array<{ id: number; text: string; completed: boolean }>;
      }

      class TodoStore extends StoreInterface<TodoState> {
        constructor() {
          super(() => ({
            items: [
              { id: 1, text: 'Task 1', completed: true },
              { id: 2, text: 'Task 2', completed: false },
              { id: 3, text: 'Task 3', completed: true }
            ]
          }));
        }
      }

      const store = new TodoStore();
      const { result } = renderHook(() =>
        useStore(store, (state) => ({
          total: state.items.length,
          completed: state.items.filter((item) => item.completed).length,
          pending: state.items.filter((item) => !item.completed).length
        }))
      );

      expect(result.current.total).toBe(3);
      expect(result.current.completed).toBe(2);
      expect(result.current.pending).toBe(1);
    });

    /**
     * Test deeply nested state selection
     */
    it('should handle deeply nested state selection', () => {
      interface DeepState extends StoreStateInterface {
        data: {
          users: Record<string, { name: string; posts: string[] }>;
          meta: {
            lastUpdated: string;
            version: number;
          };
        };
      }

      class DeepStore extends StoreInterface<DeepState> {
        constructor() {
          super(() => ({
            data: {
              users: {
                user1: { name: 'User 1', posts: ['post1', 'post2'] }
              },
              meta: {
                lastUpdated: '2024-01-01',
                version: 1
              }
            }
          }));
        }
      }

      const store = new DeepStore();
      const { result } = renderHook(() =>
        useStore(store, (state) => state.data.users.user1.name)
      );

      expect(result.current).toBe('User 1');
    });

    /**
     * Test multiple selectors in same component
     */
    it('should support multiple independent selectors', () => {
      interface MultiState extends StoreStateInterface {
        user: { name: string };
        todos: Array<string>;
        stats: { count: number };
      }

      class MultiStore extends StoreInterface<MultiState> {
        constructor() {
          super(() => ({
            user: { name: 'Bob' },
            todos: ['task1', 'task2'],
            stats: { count: 42 }
          }));
        }
      }

      const store = new MultiStore();

      const { result: userResult } = renderHook(() =>
        useStore(store, (state) => state.user)
      );
      const { result: todosResult } = renderHook(() =>
        useStore(store, (state) => state.todos)
      );
      const { result: statsResult } = renderHook(() =>
        useStore(store, (state) => state.stats)
      );

      expect(userResult.current).toEqual({ name: 'Bob' });
      expect(todosResult.current).toEqual(['task1', 'task2']);
      expect(statsResult.current).toEqual({ count: 42 });
    });
  });

  describe('Performance Optimization', () => {
    /**
     * Test that selector prevents unnecessary re-renders
     */
    it('should only re-render when selected state changes', async () => {
      interface OptimizedState extends StoreStateInterface {
        counter: number;
        unrelated: string;
      }

      class OptimizedStore extends StoreInterface<OptimizedState> {
        constructor() {
          super(() => ({
            counter: 0,
            unrelated: 'initial'
          }));
        }

        updateCounter(value: number): void {
          this.emit({ ...this.state, counter: value });
        }

        updateUnrelated(value: string): void {
          this.emit({ ...this.state, unrelated: value });
        }
      }

      const store = new OptimizedStore();
      const renderSpy = vi.fn();

      const { result } = renderHook(() => {
        const counter = useStore(store, (state) => state.counter);
        renderSpy();
        return counter;
      });

      expect(result.current).toBe(0);
      expect(renderSpy).toHaveBeenCalledTimes(1);

      // Update counter - should trigger re-render
      store.updateCounter(1);
      await waitFor(() => {
        expect(result.current).toBe(1);
      });

      const callsAfterCounterUpdate = renderSpy.mock.calls.length;
      expect(callsAfterCounterUpdate).toBeGreaterThan(1);

      // Update unrelated field - selector should prevent re-render
      store.updateUnrelated('changed');

      // Wait a bit to ensure no additional renders
      await new Promise((resolve) => setTimeout(resolve, 50));

      // Render count should not increase significantly
      expect(renderSpy.mock.calls.length).toBeLessThanOrEqual(
        callsAfterCounterUpdate + 1
      );
    });
  });

  describe('Component Integration', () => {
    /**
     * Test useStore in actual component
     */
    it('should work in React component', async () => {
      interface CounterState extends StoreStateInterface {
        count: number;
      }

      class CounterStore extends StoreInterface<CounterState> {
        constructor() {
          super(() => ({ count: 0 }));
        }

        increment(): void {
          this.emit({ count: this.state.count + 1 });
        }
      }

      const store = new CounterStore();

      function Counter() {
        const state = useStore(store);

        return (
          <div>
            <span data-testid="count">{state.count}</span>
            <button onClick={() => store.increment()}>Increment</button>
          </div>
        );
      }

      render(<Counter />);

      expect(screen.getByTestId('count').textContent).toBe('0');

      const button = screen.getByText('Increment');
      await userEvent.click(button);

      await waitFor(() => {
        expect(screen.getByTestId('count').textContent).toBe('1');
      });
    });

    /**
     * Test useStore with selector in component
     */
    it('should work with selector in React component', async () => {
      interface UserState extends StoreStateInterface {
        profile: { name: string; email: string };
        settings: { theme: string };
      }

      class UserStore extends StoreInterface<UserState> {
        constructor() {
          super(() => ({
            profile: { name: 'John', email: 'john@example.com' },
            settings: { theme: 'dark' }
          }));
        }

        updateName(name: string): void {
          this.emit({
            ...this.state,
            profile: { ...this.state.profile, name }
          });
        }
      }

      const store = new UserStore();

      function UserProfile() {
        const profile = useStore(store, (state) => state.profile);

        return (
          <div>
            <span data-testid="name">{profile.name}</span>
            <button onClick={() => store.updateName('Jane')}>
              Change Name
            </button>
          </div>
        );
      }

      render(<UserProfile />);

      expect(screen.getByTestId('name').textContent).toBe('John');

      const button = screen.getByText('Change Name');
      await userEvent.click(button);

      await waitFor(() => {
        expect(screen.getByTestId('name').textContent).toBe('Jane');
      });
    });
  });

  describe('Edge Cases', () => {
    /**
     * Test with empty state
     */
    it('should handle empty state', () => {
      interface EmptyState extends StoreStateInterface {}

      class EmptyStore extends StoreInterface<EmptyState> {
        constructor() {
          super(() => ({}));
        }
      }

      const store = new EmptyStore();
      const { result } = renderHook(() => useStore(store));

      expect(result.current).toEqual({});
    });

    /**
     * Test selector returning undefined
     */
    it('should handle selector returning undefined', () => {
      interface OptionalState extends StoreStateInterface {
        data?: { value: string };
      }

      class OptionalStore extends StoreInterface<OptionalState> {
        constructor() {
          super(() => ({}));
        }
      }

      const store = new OptionalStore();
      const { result } = renderHook(() =>
        useStore(store, (state) => state.data)
      );

      expect(result.current).toBeUndefined();
    });

    /**
     * Test selector returning null
     */
    it('should handle selector returning null', () => {
      interface NullableState extends StoreStateInterface {
        value: string | null;
      }

      class NullableStore extends StoreInterface<NullableState> {
        constructor() {
          super(() => ({ value: null }));
        }
      }

      const store = new NullableStore();
      const { result } = renderHook(() =>
        useStore(store, (state) => state.value)
      );

      expect(result.current).toBeNull();
    });

    /**
     * Test with array state
     */
    it('should handle array state', () => {
      interface ArrayState extends StoreStateInterface {
        items: number[];
      }

      class ArrayStore extends StoreInterface<ArrayState> {
        constructor() {
          super(() => ({ items: [1, 2, 3, 4, 5] }));
        }
      }

      const store = new ArrayStore();
      const { result } = renderHook(() =>
        useStore(store, (state) => state.items)
      );

      expect(result.current).toEqual([1, 2, 3, 4, 5]);
      expect(Array.isArray(result.current)).toBe(true);
    });
  });

  describe('TypeScript Type Safety', () => {
    /**
     * Test that types are correctly inferred
     */
    it('should provide correct TypeScript types', () => {
      interface TypedState extends StoreStateInterface {
        count: number;
        name: string;
        active: boolean;
      }

      class TypedStore extends StoreInterface<TypedState> {
        constructor() {
          super(() => ({
            count: 0,
            name: 'test',
            active: true
          }));
        }
      }

      const store = new TypedStore();

      // Without selector - should return full state type
      const { result: fullResult } = renderHook(() => useStore(store));
      expect(typeof fullResult.current.count).toBe('number');
      expect(typeof fullResult.current.name).toBe('string');
      expect(typeof fullResult.current.active).toBe('boolean');

      // With selector - should return selected type
      const { result: selectedResult } = renderHook(() =>
        useStore(store, (state) => state.count)
      );
      expect(typeof selectedResult.current).toBe('number');
    });
  });
});
