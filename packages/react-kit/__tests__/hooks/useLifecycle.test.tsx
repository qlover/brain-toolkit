import { renderHook, waitFor } from '@testing-library/react';
import { render, screen, act } from '@testing-library/react';
import {
  useLifecycle,
  useLifecycleCreated,
  useLifecycleUpdated,
  useLifecycleDestroyed
} from '../../src/hooks/useLifecycle';
import { describe, it, expect, vi } from 'vitest';
import type { LifecycleInterface } from '@qlover/corekit-bridge';
import { useState } from 'react';

/**
 * Test suite for lifecycle hooks
 *
 * Tests the functionality of component lifecycle management hooks
 */
describe('Lifecycle Hooks', () => {
  describe('useLifecycleCreated', () => {
    /**
     * Test that callback is called once when component mounts
     */
    it('should call callback once on component mount', async () => {
      const callback = vi.fn();

      renderHook(() => useLifecycleCreated(callback));

      await waitFor(() => {
        expect(callback).toHaveBeenCalledTimes(1);
      });
    });

    /**
     * Test that callback is not called again on re-renders
     */
    it('should not call callback again on re-renders', async () => {
      const callback = vi.fn();

      const { rerender } = renderHook(() => useLifecycleCreated(callback));

      await waitFor(() => {
        expect(callback).toHaveBeenCalledTimes(1);
      });

      // Trigger multiple re-renders
      rerender();
      rerender();
      rerender();

      await new Promise((resolve) => setTimeout(resolve, 50));

      // Should still only be called once
      expect(callback).toHaveBeenCalledTimes(1);
    });

    /**
     * Test in actual React component
     */
    it('should work in React component', async () => {
      const callback = vi.fn();

      function TestComponent() {
        useLifecycleCreated(callback);
        return <div>Test</div>;
      }

      render(<TestComponent />);

      await waitFor(() => {
        expect(callback).toHaveBeenCalledTimes(1);
      });
    });

    /**
     * Test that callback executes with requestAnimationFrame timing
     */
    it('should execute callback via requestAnimationFrame', async () => {
      const executionOrder: string[] = [];

      function TestComponent() {
        useLifecycleCreated(() => {
          executionOrder.push('lifecycle-created');
        });

        // Synchronous code
        executionOrder.push('render');

        return <div>Test</div>;
      }

      render(<TestComponent />);

      // Initially, only render should be called
      expect(executionOrder).toEqual(['render']);

      // After animation frame, callback should execute
      await waitFor(() => {
        expect(executionOrder).toEqual(['render', 'lifecycle-created']);
      });
    });
  });

  describe('useLifecycleUpdated', () => {
    /**
     * Test that callback is not called on initial mount
     */
    it('should not call callback on initial mount', async () => {
      const callback = vi.fn();

      renderHook(() => useLifecycleUpdated(callback));

      await new Promise((resolve) => setTimeout(resolve, 50));

      expect(callback).not.toHaveBeenCalled();
    });

    /**
     * Test that callback is called on updates
     */
    it('should call callback on component updates', async () => {
      const callback = vi.fn();

      const { rerender } = renderHook(() => useLifecycleUpdated(callback));

      expect(callback).not.toHaveBeenCalled();

      rerender();

      await waitFor(() => {
        expect(callback).toHaveBeenCalledTimes(1);
      });

      rerender();

      await waitFor(() => {
        expect(callback).toHaveBeenCalledTimes(2);
      });
    });

    /**
     * Test with dependency array
     */
    it('should respect dependency array', async () => {
      const callback = vi.fn();

      const { rerender } = renderHook(
        ({ count }) => useLifecycleUpdated(callback, [count]),
        {
          initialProps: { count: 0 }
        }
      );

      expect(callback).not.toHaveBeenCalled();

      // Update with same count - should not trigger
      rerender({ count: 0 });
      await new Promise((resolve) => setTimeout(resolve, 50));
      expect(callback).not.toHaveBeenCalled();

      // Update with different count - should trigger
      rerender({ count: 1 });
      await waitFor(() => {
        expect(callback).toHaveBeenCalledTimes(1);
      });

      // Update with different count again
      rerender({ count: 2 });
      await waitFor(() => {
        expect(callback).toHaveBeenCalledTimes(2);
      });
    });

    /**
     * Test in actual React component
     */
    it('should work in React component', async () => {
      const callback = vi.fn();

      function TestComponent({ count }: { count: number }) {
        useLifecycleUpdated(callback, [count]);
        return <div>{count}</div>;
      }

      const { rerender } = render(<TestComponent count={0} />);

      expect(callback).not.toHaveBeenCalled();

      rerender(<TestComponent count={1} />);

      await waitFor(() => {
        expect(callback).toHaveBeenCalledTimes(1);
      });
    });

    /**
     * Test with empty dependency array
     */
    it('should work with empty dependency array', async () => {
      const callback = vi.fn();

      const { rerender } = renderHook(() => useLifecycleUpdated(callback, []));

      expect(callback).not.toHaveBeenCalled();

      // Rerender should not trigger callback with empty deps
      rerender();
      await new Promise((resolve) => setTimeout(resolve, 50));

      expect(callback).not.toHaveBeenCalled();
    });
  });

  describe('useLifecycleDestroyed', () => {
    /**
     * Test that callback is called when component unmounts
     */
    it('should call callback on component unmount', async () => {
      const callback = vi.fn();

      const { unmount } = renderHook(() => useLifecycleDestroyed(callback));

      expect(callback).not.toHaveBeenCalled();

      unmount();

      await waitFor(() => {
        expect(callback).toHaveBeenCalledTimes(1);
      });
    });

    /**
     * Test that callback is not called during re-renders
     */
    it('should not call callback on re-renders', async () => {
      const callback = vi.fn();

      const { rerender } = renderHook(() => useLifecycleDestroyed(callback));

      rerender();
      rerender();
      rerender();

      await new Promise((resolve) => setTimeout(resolve, 50));

      expect(callback).not.toHaveBeenCalled();
    });

    /**
     * Test in actual React component
     */
    it('should work in React component', async () => {
      const callback = vi.fn();

      function TestComponent() {
        useLifecycleDestroyed(callback);
        return <div>Test</div>;
      }

      const { unmount } = render(<TestComponent />);

      expect(callback).not.toHaveBeenCalled();

      unmount();

      await waitFor(() => {
        expect(callback).toHaveBeenCalledTimes(1);
      });
    });

    /**
     * Test that callback executes with requestAnimationFrame timing
     */
    it('should execute callback via requestAnimationFrame', async () => {
      const executionOrder: string[] = [];

      function TestComponent() {
        useLifecycleDestroyed(() => {
          executionOrder.push('lifecycle-destroyed');
        });

        return <div>Test</div>;
      }

      const { unmount } = render(<TestComponent />);

      unmount();

      // Initially, nothing should be called
      expect(executionOrder).toEqual([]);

      // After animation frame, callback should execute
      await waitFor(() => {
        expect(executionOrder).toEqual(['lifecycle-destroyed']);
      });
    });

    /**
     * Test cleanup with state changes
     */
    it('should handle cleanup with state changes', async () => {
      const callback = vi.fn();

      function TestComponent() {
        const [count, setCount] = useState(0);

        useLifecycleDestroyed(() => {
          callback(count);
        });

        return (
          <div>
            <span>{count}</span>
            <button onClick={() => setCount(count + 1)}>Increment</button>
          </div>
        );
      }

      const { unmount } = render(<TestComponent />);

      unmount();

      await waitFor(() => {
        expect(callback).toHaveBeenCalledWith(0);
      });
    });
  });

  describe('useLifecycle - Unified Lifecycle Management', () => {
    /**
     * Test basic lifecycle interface
     */
    it('should call all lifecycle methods in correct order', async () => {
      const calls: string[] = [];

      class TestLifecycle implements LifecycleInterface {
        /**
         * @override
         */
        public created(): void {
          calls.push('created');
        }

        /**
         * @override
         */
        public updated(): void {
          calls.push('updated');
        }

        /**
         * @override
         */
        public destroyed(): void {
          calls.push('destroyed');
        }
      }

      const lifecycle = new TestLifecycle();

      const { rerender, unmount } = renderHook(() => useLifecycle(lifecycle));

      // Initially, no calls yet (created is async via requestAnimationFrame)
      expect(calls).toEqual([]);

      // Wait for created
      await waitFor(() => {
        expect(calls).toEqual(['created']);
      });

      // Trigger update
      rerender();

      await waitFor(() => {
        expect(calls).toEqual(['created', 'updated']);
      });

      // Unmount
      unmount();

      await waitFor(() => {
        expect(calls).toEqual(['created', 'updated', 'destroyed']);
      });
    });

    /**
     * Test lifecycle without updated method
     */
    it('should work without updated method', async () => {
      const calls: string[] = [];

      class MinimalLifecycle implements LifecycleInterface {
        /**
         * @override
         */
        public created(): void {
          calls.push('created');
        }

        /**
         * @override
         */
        public destroyed(): void {
          calls.push('destroyed');
        }

        /**
         * @override
         */
        public updated(): void {
          // Should still be called
        }
      }

      const lifecycle = new MinimalLifecycle();

      const { rerender, unmount } = renderHook(() => useLifecycle(lifecycle));

      await waitFor(() => {
        expect(calls).toEqual(['created']);
      });

      // Rerender should not call updated since it doesn't exist
      rerender();
      await new Promise((resolve) => setTimeout(resolve, 50));

      expect(calls).toEqual(['created']);

      unmount();

      await waitFor(() => {
        expect(calls).toEqual(['created', 'destroyed']);
      });
    });

    /**
     * Test with dependency array
     */
    it('should respect dependency array for updates', async () => {
      const calls: string[] = [];

      class CounterLifecycle implements LifecycleInterface {
        /**
         * @override
         */
        public created(): void {
          calls.push('created');
        }

        /**
         * @override
         */
        public updated(): void {
          calls.push('updated');
        }

        /**
         * @override
         */
        public destroyed(): void {
          calls.push('destroyed');
        }
      }

      const lifecycle = new CounterLifecycle();

      const { rerender, unmount } = renderHook(
        ({ count }) => useLifecycle(lifecycle, [count]),
        {
          initialProps: { count: 0 }
        }
      );

      await waitFor(() => {
        expect(calls).toEqual(['created']);
      });

      // Update with same count - should not trigger updated
      rerender({ count: 0 });
      await new Promise((resolve) => setTimeout(resolve, 50));
      expect(calls).toEqual(['created']);

      // Update with different count - should trigger updated
      rerender({ count: 1 });
      await waitFor(() => {
        expect(calls).toEqual(['created', 'updated']);
      });

      unmount();

      await waitFor(() => {
        expect(calls).toEqual(['created', 'updated', 'destroyed']);
      });
    });

    /**
     * Test in actual React component
     */
    it('should work in React component', async () => {
      const calls: string[] = [];

      class ComponentLifecycle implements LifecycleInterface {
        /**
         * @override
         */
        public created(): void {
          calls.push('created');
        }

        /**
         * @override
         */
        public updated(): void {
          calls.push('updated');
        }

        /**
         * @override
         */
        public destroyed(): void {
          calls.push('destroyed');
        }
      }

      const lifecycle = new ComponentLifecycle();

      function TestComponent({ count }: { count: number }) {
        useLifecycle(lifecycle, [count]);
        return <div>{count}</div>;
      }

      const { rerender, unmount } = render(<TestComponent count={0} />);

      await waitFor(() => {
        expect(calls).toEqual(['created']);
      });

      rerender(<TestComponent count={1} />);

      await waitFor(() => {
        expect(calls).toEqual(['created', 'updated']);
      });

      unmount();

      await waitFor(() => {
        expect(calls).toEqual(['created', 'updated', 'destroyed']);
      });
    });

    /**
     * Test multiple updates
     */
    it('should handle multiple updates', async () => {
      const calls: string[] = [];

      class MultiUpdateLifecycle implements LifecycleInterface {
        /**
         * @override
         */
        public created(): void {
          calls.push('created');
        }

        /**
         * @override
         */
        public updated(): void {
          calls.push('updated');
        }

        /**
         * @override
         */
        public destroyed(): void {
          calls.push('destroyed');
        }
      }

      const lifecycle = new MultiUpdateLifecycle();

      const { rerender, unmount } = renderHook(() => useLifecycle(lifecycle));

      await waitFor(() => {
        expect(calls).toEqual(['created']);
      });

      // Multiple updates
      rerender();
      await waitFor(() => {
        expect(calls).toEqual(['created', 'updated']);
      });

      rerender();
      await waitFor(() => {
        expect(calls).toEqual(['created', 'updated', 'updated']);
      });

      rerender();
      await waitFor(() => {
        expect(calls).toEqual(['created', 'updated', 'updated', 'updated']);
      });

      unmount();

      await waitFor(() => {
        expect(calls).toEqual([
          'created',
          'updated',
          'updated',
          'updated',
          'destroyed'
        ]);
      });
    });

    /**
     * Test lifecycle with state management
     */
    it('should integrate with state management', async () => {
      const lifecycleCalls: Array<{ method: string; count: number }> = [];

      function TestComponent() {
        const [count, setCount] = useState(0);

        class StateLifecycle implements LifecycleInterface {
          /**
           * @override
           */
          public created(): void {
            lifecycleCalls.push({ method: 'created', count });
          }

          /**
           * @override
           */
          public updated(): void {
            lifecycleCalls.push({ method: 'updated', count });
          }

          /**
           * @override
           */
          public destroyed(): void {
            lifecycleCalls.push({ method: 'destroyed', count });
          }
        }

        const lifecycle = new StateLifecycle();
        useLifecycle(lifecycle, [count]);

        return (
          <div>
            <span data-testid="count">{count}</span>
            <button onClick={() => setCount(count + 1)}>Increment</button>
          </div>
        );
      }

      const { unmount } = render(<TestComponent />);

      await waitFor(() => {
        expect(lifecycleCalls[0]).toEqual({ method: 'created', count: 0 });
      });

      const button = screen.getByText('Increment');

      await act(async () => {
        button.click();
      });

      await waitFor(() => {
        expect(lifecycleCalls).toHaveLength(2);
        expect(lifecycleCalls[1]).toEqual({ method: 'updated', count: 1 });
      });

      unmount();

      await waitFor(() => {
        expect(lifecycleCalls).toHaveLength(3);
        expect(lifecycleCalls[2].method).toBe('destroyed');
      });
    });

    /**
     * Test with empty dependency array
     */
    it('should work with empty dependency array', async () => {
      const calls: string[] = [];

      class EmptyDepsLifecycle implements LifecycleInterface {
        /**
         * @override
         */
        public created(): void {
          calls.push('created');
        }

        /**
         * @override
         */
        public updated(): void {
          calls.push('updated');
        }

        /**
         * @override
         */
        public destroyed(): void {
          calls.push('destroyed');
        }
      }

      const lifecycle = new EmptyDepsLifecycle();

      const { rerender, unmount } = renderHook(() =>
        useLifecycle(lifecycle, [])
      );

      await waitFor(() => {
        expect(calls).toEqual(['created']);
      });

      // Rerender should not trigger updated with empty deps
      rerender();
      await new Promise((resolve) => setTimeout(resolve, 50));

      expect(calls).toEqual(['created']);

      unmount();

      await waitFor(() => {
        expect(calls).toEqual(['created', 'destroyed']);
      });
    });
  });

  describe('Edge Cases and Error Handling', () => {
    /**
     * Test lifecycle with error in created
     */
    it('should handle errors in created method', () => {
      const error = new Error('Created error');

      class ErrorLifecycle implements LifecycleInterface {
        /**
         * @override
         */
        public created(): void {
          throw error;
        }

        /**
         * @override
         */
        public updated(): void {
          // Should still be called
        }

        /**
         * @override
         */
        public destroyed(): void {
          // Should still be called
        }
      }

      const lifecycle = new ErrorLifecycle();

      // Mock requestAnimationFrame to execute callback immediately
      const originalRAF = window.requestAnimationFrame;
      window.requestAnimationFrame = ((callback: FrameRequestCallback) => {
        callback(0);
        return 0;
      }) as typeof window.requestAnimationFrame;

      try {
        expect(() => {
          renderHook(() => useLifecycle(lifecycle));
        }).toThrow(error);
      } finally {
        window.requestAnimationFrame = originalRAF;
      }
    });

    /**
     * Test lifecycle with async operations
     */
    it('should work with async lifecycle methods', async () => {
      const calls: string[] = [];

      class AsyncLifecycle implements LifecycleInterface {
        /**
         * @override
         */
        public async created(): Promise<void> {
          await new Promise((resolve) => setTimeout(resolve, 10));
          calls.push('created');
        }

        /**
         * @override
         */
        public async updated(): Promise<void> {
          await new Promise((resolve) => setTimeout(resolve, 10));
          calls.push('updated');
        }

        /**
         * @override
         */
        public async destroyed(): Promise<void> {
          await new Promise((resolve) => setTimeout(resolve, 10));
          calls.push('destroyed');
        }
      }

      const lifecycle = new AsyncLifecycle();

      const { rerender, unmount } = renderHook(() => useLifecycle(lifecycle));

      // Wait for async created
      await waitFor(
        () => {
          expect(calls).toContain('created');
        },
        { timeout: 100 }
      );

      rerender();

      await waitFor(
        () => {
          expect(calls).toContain('updated');
        },
        { timeout: 100 }
      );

      unmount();

      await waitFor(
        () => {
          expect(calls).toContain('destroyed');
        },
        { timeout: 100 }
      );
    });
  });
});
