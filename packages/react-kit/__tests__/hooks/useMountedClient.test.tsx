import { renderHook, waitFor } from '@testing-library/react';
import { render, screen, act } from '@testing-library/react';
import { useMountedClient } from '../../src/hooks/useMountedClient';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { useEffect, useState } from 'react';

/**
 * Test suite for useMountedClient hook
 *
 * Tests the functionality of detecting client-side mounting for SSR compatibility
 */
describe('useMountedClient', () => {
  describe('Basic Functionality', () => {
    /**
     * Test that hook returns false initially
     */
    it('should return false on initial render', () => {
      const { result } = renderHook(() => useMountedClient());

      expect(result.current).toBe(false);
    });

    /**
     * Test that hook returns true after mount
     */
    it('should return true after component mounts', async () => {
      const { result } = renderHook(() => useMountedClient());

      expect(result.current).toBe(false);

      await waitFor(() => {
        expect(result.current).toBe(true);
      });
    });

    /**
     * Test that mounted state persists across re-renders
     */
    it('should maintain true state across re-renders', async () => {
      const { result, rerender } = renderHook(() => useMountedClient());

      await waitFor(() => {
        expect(result.current).toBe(true);
      });

      // Multiple re-renders should maintain true state
      rerender();
      expect(result.current).toBe(true);

      rerender();
      expect(result.current).toBe(true);

      rerender();
      expect(result.current).toBe(true);
    });
  });

  describe('SSR Compatibility', () => {
    /**
     * Test that hook prevents hydration mismatches
     */
    it('should enable conditional rendering to prevent hydration mismatch', async () => {
      function ThemeToggle() {
        const mounted = useMountedClient();

        if (!mounted) {
          return <div data-testid="placeholder">Loading...</div>;
        }

        return <button data-testid="theme-button">🌙</button>;
      }

      const { container } = render(<ThemeToggle />);

      // Initially should show placeholder
      expect(screen.getByTestId('placeholder')).toBeTruthy();
      expect(screen.queryByTestId('theme-button')).toBeNull();

      // After mount, should show actual button
      await waitFor(() => {
        expect(screen.queryByTestId('placeholder')).toBeNull();
        expect(screen.getByTestId('theme-button')).toBeTruthy();
      });
    });

    /**
     * Test safe access to browser APIs
     */
    it('should enable safe access to browser APIs', async () => {
      const mockWindowWidth = 1024;
      const mockWindowHeight = 768;

      function WindowSize() {
        const mounted = useMountedClient();
        const [size, setSize] = useState({ width: 0, height: 0 });

        useEffect(() => {
          if (!mounted) return;

          // Mock window dimensions
          Object.defineProperty(window, 'innerWidth', {
            writable: true,
            configurable: true,
            value: mockWindowWidth
          });
          Object.defineProperty(window, 'innerHeight', {
            writable: true,
            configurable: true,
            value: mockWindowHeight
          });

          setSize({
            width: window.innerWidth,
            height: window.innerHeight
          });
        }, [mounted]);

        if (!mounted) {
          return <div data-testid="loading">Loading...</div>;
        }

        return (
          <div data-testid="size">
            {size.width} x {size.height}
          </div>
        );
      }

      render(<WindowSize />);

      expect(screen.getByTestId('loading')).toBeTruthy();

      await waitFor(() => {
        const sizeElement = screen.getByTestId('size');
        expect(sizeElement.textContent).toBe('1024 x 768');
      });
    });

    /**
     * Test conditional user-specific content
     */
    it('should support conditional rendering based on client state', async () => {
      function UserGreeting() {
        const mounted = useMountedClient();

        if (!mounted) {
          return <h1 data-testid="generic">Welcome!</h1>;
        }

        return <h1 data-testid="personalized">Welcome back, User!</h1>;
      }

      render(<UserGreeting />);

      expect(screen.getByTestId('generic')).toBeTruthy();
      expect(screen.queryByTestId('personalized')).toBeNull();

      await waitFor(() => {
        expect(screen.queryByTestId('generic')).toBeNull();
        expect(screen.getByTestId('personalized')).toBeTruthy();
      });
    });
  });

  describe('Client-Only Features', () => {
    /**
     * Test deferring client-only code
     */
    it('should defer client-only code execution', async () => {
      const clientOnlyCode = vi.fn();

      function ClientOnlyComponent() {
        const mounted = useMountedClient();

        useEffect(() => {
          if (mounted) {
            clientOnlyCode();
          }
        }, [mounted]);

        return <div>Component</div>;
      }

      render(<ClientOnlyComponent />);

      expect(clientOnlyCode).not.toHaveBeenCalled();

      await waitFor(() => {
        expect(clientOnlyCode).toHaveBeenCalledTimes(1);
      });
    });

    /**
     * Test loading client-side libraries
     */
    it('should enable loading client-side libraries after mount', async () => {
      const loadLibrary = vi.fn().mockResolvedValue({ name: 'TestLib' });

      function LibraryComponent() {
        const mounted = useMountedClient();
        const [lib, setLib] = useState<any>(null);

        useEffect(() => {
          if (!mounted) return;

          loadLibrary().then((library) => {
            setLib(library);
          });
        }, [mounted]);

        if (!mounted) {
          return <div data-testid="loading">Loading...</div>;
        }

        if (!lib) {
          return <div data-testid="initializing">Initializing...</div>;
        }

        return <div data-testid="loaded">Library: {lib.name}</div>;
      }

      render(<LibraryComponent />);

      expect(screen.getByTestId('loading')).toBeTruthy();
      expect(loadLibrary).not.toHaveBeenCalled();

      await waitFor(() => {
        expect(loadLibrary).toHaveBeenCalledTimes(1);
      });

      await waitFor(() => {
        expect(screen.getByTestId('loaded').textContent).toBe(
          'Library: TestLib'
        );
      });
    });

    /**
     * Test preventing flash of wrong content
     */
    it('should prevent flash of incorrect content', async () => {
      const renderLog: string[] = [];

      function ContentComponent() {
        const mounted = useMountedClient();

        if (!mounted) {
          renderLog.push('server-content');
          return <div data-testid="server">Server Content</div>;
        }

        renderLog.push('client-content');
        return <div data-testid="client">Client Content</div>;
      }

      render(<ContentComponent />);

      // Should show server content first
      expect(renderLog[0]).toBe('server-content');
      expect(screen.getByTestId('server')).toBeTruthy();

      // Then client content
      await waitFor(() => {
        expect(screen.getByTestId('client')).toBeTruthy();
        expect(renderLog[renderLog.length - 1]).toBe('client-content');
      });

      // Verify sequence
      expect(renderLog).toEqual(['server-content', 'client-content']);
    });
  });

  describe('Animation Frame Behavior', () => {
    /**
     * Test that state change uses requestAnimationFrame
     */
    it('should use requestAnimationFrame for state update', async () => {
      const rafSpy = vi.spyOn(window, 'requestAnimationFrame');

      renderHook(() => useMountedClient());

      expect(rafSpy).toHaveBeenCalled();

      rafSpy.mockRestore();
    });

    /**
     * Test cleanup cancels animation frame
     */
    it('should cancel animation frame on unmount', async () => {
      const cancelSpy = vi.spyOn(window, 'cancelAnimationFrame');

      const { unmount } = renderHook(() => useMountedClient());

      unmount();

      expect(cancelSpy).toHaveBeenCalled();

      cancelSpy.mockRestore();
    });

    /**
     * Test proper cleanup sequence
     */
    it('should properly cleanup animation frame', async () => {
      const rafIds: number[] = [];
      const originalRaf = window.requestAnimationFrame;

      window.requestAnimationFrame = vi.fn((callback) => {
        const id = originalRaf(callback);
        rafIds.push(id);
        return id;
      });

      const cancelSpy = vi.spyOn(window, 'cancelAnimationFrame');

      const { unmount } = renderHook(() => useMountedClient());

      expect(rafIds.length).toBeGreaterThan(0);

      unmount();

      expect(cancelSpy).toHaveBeenCalledWith(rafIds[0]);

      window.requestAnimationFrame = originalRaf;
      cancelSpy.mockRestore();
    });
  });

  describe('Multiple Instances', () => {
    /**
     * Test multiple components using the hook independently
     */
    it('should work correctly with multiple independent instances', async () => {
      function ComponentA() {
        const mounted = useMountedClient();
        return (
          <div data-testid="component-a">
            {mounted ? 'A: Mounted' : 'A: Not Mounted'}
          </div>
        );
      }

      function ComponentB() {
        const mounted = useMountedClient();
        return (
          <div data-testid="component-b">
            {mounted ? 'B: Mounted' : 'B: Not Mounted'}
          </div>
        );
      }

      render(
        <div>
          <ComponentA />
          <ComponentB />
        </div>
      );

      expect(screen.getByTestId('component-a').textContent).toBe(
        'A: Not Mounted'
      );
      expect(screen.getByTestId('component-b').textContent).toBe(
        'B: Not Mounted'
      );

      await waitFor(() => {
        expect(screen.getByTestId('component-a').textContent).toBe(
          'A: Mounted'
        );
        expect(screen.getByTestId('component-b').textContent).toBe(
          'B: Mounted'
        );
      });
    });

    /**
     * Test nested components with the hook
     */
    it('should work correctly in nested components', async () => {
      function ParentComponent() {
        const parentMounted = useMountedClient();

        return (
          <div>
            <div data-testid="parent">
              {parentMounted ? 'Parent: Mounted' : 'Parent: Not Mounted'}
            </div>
            <ChildComponent />
          </div>
        );
      }

      function ChildComponent() {
        const childMounted = useMountedClient();

        return (
          <div data-testid="child">
            {childMounted ? 'Child: Mounted' : 'Child: Not Mounted'}
          </div>
        );
      }

      render(<ParentComponent />);

      expect(screen.getByTestId('parent').textContent).toBe(
        'Parent: Not Mounted'
      );
      expect(screen.getByTestId('child').textContent).toBe(
        'Child: Not Mounted'
      );

      await waitFor(() => {
        expect(screen.getByTestId('parent').textContent).toBe(
          'Parent: Mounted'
        );
        expect(screen.getByTestId('child').textContent).toBe('Child: Mounted');
      });
    });
  });

  describe('Edge Cases', () => {
    /**
     * Test rapid mount/unmount cycles
     */
    it('should handle rapid mount/unmount cycles', async () => {
      function TestComponent() {
        const mounted = useMountedClient();
        return <div data-testid="test">{mounted ? 'Mounted' : 'Initial'}</div>;
      }

      // Mount and unmount rapidly
      const { unmount } = render(<TestComponent />);
      unmount();

      // Remount
      const { unmount: unmount2 } = render(<TestComponent />);

      await waitFor(() => {
        expect(screen.getByTestId('test').textContent).toBe('Mounted');
      });

      unmount2();
    });

    /**
     * Test with conditional rendering
     */
    it('should work with conditional rendering', async () => {
      function ConditionalComponent({ show }: { show: boolean }) {
        const mounted = useMountedClient();

        if (!show) return null;

        return (
          <div data-testid="conditional">
            {mounted ? 'Mounted' : 'Not Mounted'}
          </div>
        );
      }

      const { rerender } = render(<ConditionalComponent show={false} />);

      expect(screen.queryByTestId('conditional')).toBeNull();

      rerender(<ConditionalComponent show={true} />);

      expect(screen.getByTestId('conditional').textContent).toBe('Not Mounted');

      await waitFor(() => {
        expect(screen.getByTestId('conditional').textContent).toBe('Mounted');
      });
    });

    /**
     * Test with state updates
     */
    it('should work correctly with component state updates', async () => {
      function StatefulComponent() {
        const mounted = useMountedClient();
        const [count, setCount] = useState(0);

        return (
          <div>
            <div data-testid="mounted-status">
              {mounted ? 'Mounted' : 'Not Mounted'}
            </div>
            <div data-testid="count">{count}</div>
            <button onClick={() => setCount(count + 1)}>Increment</button>
          </div>
        );
      }

      render(<StatefulComponent />);

      expect(screen.getByTestId('mounted-status').textContent).toBe(
        'Not Mounted'
      );

      await waitFor(() => {
        expect(screen.getByTestId('mounted-status').textContent).toBe(
          'Mounted'
        );
      });

      // Test that state updates don't affect mounted status
      const button = screen.getByText('Increment');

      await act(async () => {
        button.click();
      });

      expect(screen.getByTestId('count').textContent).toBe('1');
      expect(screen.getByTestId('mounted-status').textContent).toBe('Mounted');

      await act(async () => {
        button.click();
      });

      expect(screen.getByTestId('count').textContent).toBe('2');
      expect(screen.getByTestId('mounted-status').textContent).toBe('Mounted');
    });
  });

  describe('Performance', () => {
    /**
     * Test that hook doesn't cause unnecessary re-renders
     */
    it('should not cause unnecessary re-renders after mounting', async () => {
      const renderCount = { count: 0 };

      function TestComponent() {
        const mounted = useMountedClient();
        renderCount.count++;

        return <div>{mounted ? 'Mounted' : 'Not Mounted'}</div>;
      }

      render(<TestComponent />);

      const initialRenderCount = renderCount.count;

      await waitFor(() => {
        // Should render initially (false) and once more (true)
        expect(renderCount.count).toBe(initialRenderCount + 1);
      });

      // Wait a bit more to ensure no additional renders
      await new Promise((resolve) => setTimeout(resolve, 50));

      expect(renderCount.count).toBe(initialRenderCount + 1);
    });

    /**
     * Test memory cleanup
     */
    it('should properly cleanup on unmount', async () => {
      const { unmount } = renderHook(() => useMountedClient());

      await waitFor(() => {
        // Hook should be mounted
      });

      // Should not throw or cause memory leaks
      expect(() => unmount()).not.toThrow();
    });
  });

  describe('Real-world Use Cases', () => {
    /**
     * Test localStorage access pattern
     */
    it('should enable safe localStorage access', async () => {
      const mockLocalStorage = {
        getItem: vi.fn().mockReturnValue('dark'),
        setItem: vi.fn()
      };

      Object.defineProperty(window, 'localStorage', {
        value: mockLocalStorage,
        writable: true
      });

      function ThemeComponent() {
        const mounted = useMountedClient();
        const [theme, setTheme] = useState<string | null>(null);

        useEffect(() => {
          if (mounted) {
            const savedTheme = localStorage.getItem('theme');
            setTheme(savedTheme);
          }
        }, [mounted]);

        if (!mounted || !theme) {
          return <div data-testid="loading">Loading theme...</div>;
        }

        return <div data-testid="theme">Theme: {theme}</div>;
      }

      render(<ThemeComponent />);

      expect(screen.getByTestId('loading')).toBeTruthy();
      expect(mockLocalStorage.getItem).not.toHaveBeenCalled();

      await waitFor(() => {
        expect(mockLocalStorage.getItem).toHaveBeenCalledWith('theme');
        expect(screen.getByTestId('theme').textContent).toBe('Theme: dark');
      });
    });

    /**
     * Test with document access
     */
    it('should enable safe document access', async () => {
      function DocumentComponent() {
        const mounted = useMountedClient();
        const [title, setTitle] = useState('');

        useEffect(() => {
          if (mounted) {
            setTitle(document.title || 'Default Title');
          }
        }, [mounted]);

        if (!mounted) {
          return <div data-testid="ssr">SSR Content</div>;
        }

        return <div data-testid="client">Document Title: {title}</div>;
      }

      // Set document title
      document.title = 'Test Page';

      render(<DocumentComponent />);

      expect(screen.getByTestId('ssr')).toBeTruthy();

      await waitFor(() => {
        expect(screen.getByTestId('client').textContent).toBe(
          'Document Title: Test Page'
        );
      });
    });
  });
});

