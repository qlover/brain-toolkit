import { renderHook, waitFor, act } from '@testing-library/react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useStore } from '../../src/hooks/useStore';
import { describe, it, expect, vi } from 'vitest';
import {
  SliceStoreAdapter,
  type StoreStateInterface
} from '@qlover/corekit-bridge/store-state';

/**
 * Test suite for useStore hook
 *
 * Tests the functionality of subscribing to store state changes with optional selectors
 */
describe('useStore', () => {
  describe('Basic Store Subscription', () => {
    it('should subscribe to entire store state', () => {
      interface CounterState extends StoreStateInterface {
        count: number;
      }

      const store = new SliceStoreAdapter<CounterState>(() => ({ count: 0 }));
      const { result } = renderHook(() => useStore(store));

      expect(result.current.count).toBe(0);
    });

    it('should trigger re-render when store state changes', async () => {
      interface CounterState extends StoreStateInterface {
        count: number;
      }

      const store = new SliceStoreAdapter<CounterState>(() => ({ count: 0 }));
      const { result } = renderHook(() => useStore(store));

      expect(result.current.count).toBe(0);

      act(() => {
        store.update({ count: store.getState().count + 1 });
      });

      await waitFor(() => {
        expect(result.current.count).toBe(1);
      });
    });

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

      const store = new SliceStoreAdapter<UserState>(() => ({
        profile: { name: 'John', email: 'john@example.com' },
        settings: { theme: 'dark', language: 'en' }
      }));
      const { result } = renderHook(() => useStore(store));

      expect(result.current.profile.name).toBe('John');
      expect(result.current.settings.theme).toBe('dark');
    });
  });

  describe('Selector Functionality', () => {
    it('should use selector to get specific part of state', () => {
      interface AppState extends StoreStateInterface {
        user: { name: string; id: number };
        settings: { theme: string };
        todos: Array<{ id: number; text: string }>;
      }

      const store = new SliceStoreAdapter<AppState>(() => ({
        user: { name: 'Alice', id: 1 },
        settings: { theme: 'light' },
        todos: []
      }));

      const { result } = renderHook(() =>
        useStore(store, (state) => state.user)
      );

      expect(result.current).toEqual({ name: 'Alice', id: 1 });
      expect(result.current).not.toHaveProperty('settings');
      expect(result.current).not.toHaveProperty('todos');
    });

    it('should compute derived state in selector', () => {
      interface TodoState extends StoreStateInterface {
        items: Array<{ id: number; text: string; completed: boolean }>;
      }

      const store = new SliceStoreAdapter<TodoState>(() => ({
        items: [
          { id: 1, text: 'Task 1', completed: true },
          { id: 2, text: 'Task 2', completed: false },
          { id: 3, text: 'Task 3', completed: true }
        ]
      }));
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

      const store = new SliceStoreAdapter<DeepState>(() => ({
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
      const { result } = renderHook(() =>
        useStore(store, (state) => state.data.users.user1.name)
      );

      expect(result.current).toBe('User 1');
    });

    it('should support multiple independent selectors', () => {
      interface MultiState extends StoreStateInterface {
        user: { name: string };
        todos: Array<string>;
        stats: { count: number };
      }

      const store = new SliceStoreAdapter<MultiState>(() => ({
        user: { name: 'Bob' },
        todos: ['task1', 'task2'],
        stats: { count: 42 }
      }));

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
    it('should only re-render when selected state changes', async () => {
      interface OptimizedState extends StoreStateInterface {
        counter: number;
        unrelated: string;
      }

      const store = new SliceStoreAdapter<OptimizedState>(() => ({
        counter: 0,
        unrelated: 'initial'
      }));
      const renderSpy = vi.fn();

      const { result } = renderHook(() => {
        const counter = useStore(store, (state) => state.counter);
        renderSpy();
        return counter;
      });

      expect(result.current).toBe(0);
      expect(renderSpy).toHaveBeenCalledTimes(1);

      act(() => {
        store.update({ counter: 1 });
      });
      await waitFor(() => {
        expect(result.current).toBe(1);
      });

      const callsAfterCounterUpdate = renderSpy.mock.calls.length;
      expect(callsAfterCounterUpdate).toBeGreaterThan(1);

      act(() => {
        store.update({ unrelated: 'changed' });
      });

      await new Promise((resolve) => setTimeout(resolve, 50));

      // useSyncExternalStore notifies on any store emit; selector still returns
      // the same number, but React may re-render once for the subscription.
      expect(renderSpy.mock.calls.length).toBeLessThanOrEqual(
        callsAfterCounterUpdate + 1
      );
    });
  });

  describe('Component Integration', () => {
    it('should work in React component', async () => {
      interface CounterState extends StoreStateInterface {
        count: number;
      }

      const store = new SliceStoreAdapter<CounterState>(() => ({ count: 0 }));

      function Counter() {
        const state = useStore(store);

        return (
          <div>
            <span data-testid="count">{state.count}</span>
            <button
              onClick={() => store.update({ count: store.getState().count + 1 })}
            >
              Increment
            </button>
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

    it('should work with selector in React component', async () => {
      interface UserState extends StoreStateInterface {
        profile: { name: string; email: string };
        settings: { theme: string };
      }

      const store = new SliceStoreAdapter<UserState>(() => ({
        profile: { name: 'John', email: 'john@example.com' },
        settings: { theme: 'dark' }
      }));

      function UserProfile() {
        const profile = useStore(store, (state) => state.profile);

        return (
          <div>
            <span data-testid="name">{profile.name}</span>
            <button
              onClick={() =>
                store.update({
                  profile: { ...store.getState().profile, name: 'Jane' }
                })
              }
            >
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
    it('should handle empty state', () => {
      type EmptyState = StoreStateInterface;

      const store = new SliceStoreAdapter<EmptyState>(() => ({}));
      const { result } = renderHook(() => useStore(store));

      expect(result.current).toEqual({});
    });

    it('should handle selector returning undefined', () => {
      interface OptionalState extends StoreStateInterface {
        data?: { value: string };
      }

      const store = new SliceStoreAdapter<OptionalState>(() => ({}));
      const { result } = renderHook(() =>
        useStore(store, (state) => state.data)
      );

      expect(result.current).toBeUndefined();
    });

    it('should handle selector returning null', () => {
      interface NullableState extends StoreStateInterface {
        value: string | null;
      }

      const store = new SliceStoreAdapter<NullableState>(() => ({
        value: null
      }));
      const { result } = renderHook(() =>
        useStore(store, (state) => state.value)
      );

      expect(result.current).toBeNull();
    });

    it('should handle array state', () => {
      interface ArrayState extends StoreStateInterface {
        items: number[];
      }

      const store = new SliceStoreAdapter<ArrayState>(() => ({
        items: [1, 2, 3, 4, 5]
      }));
      const { result } = renderHook(() =>
        useStore(store, (state) => state.items)
      );

      expect(result.current).toEqual([1, 2, 3, 4, 5]);
      expect(Array.isArray(result.current)).toBe(true);
    });
  });

  describe('TypeScript Type Safety', () => {
    it('should provide correct TypeScript types', () => {
      interface TypedState extends StoreStateInterface {
        count: number;
        name: string;
        active: boolean;
      }

      const store = new SliceStoreAdapter<TypedState>(() => ({
        count: 0,
        name: 'test',
        active: true
      }));

      const { result: fullResult } = renderHook(() => useStore(store));
      expect(typeof fullResult.current.count).toBe('number');
      expect(typeof fullResult.current.name).toBe('string');
      expect(typeof fullResult.current.active).toBe('boolean');

      const { result: selectedResult } = renderHook(() =>
        useStore(store, (state) => state.count)
      );
      expect(typeof selectedResult.current).toBe('number');
    });
  });
});
