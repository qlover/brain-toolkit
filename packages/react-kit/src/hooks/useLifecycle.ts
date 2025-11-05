import { type LifecycleInterface } from '@qlover/corekit-bridge';
import { useEffect, useRef } from 'react';

/**
 * Lifecycle hook for component creation
 *
 * Significance: Executes callback only once when component is mounted
 * Core idea: Simplified hook for handling component creation lifecycle
 * Main function: Invokes callback during component mount phase
 * Main purpose: Provide a clean API for component initialization logic
 *
 * @param callback - Function to be called when component is created
 *
 * @example
 * useLifecycleCreated(() => {
 *   console.log('Component created');
 * });
 */
export function useLifecycleCreated(callback: () => void) {
  const mounted = useRef(false);

  useEffect(() => {
    if (!mounted.current) {
      mounted.current = true;

      requestAnimationFrame(() => {
        callback();
      });
    }
  }, [callback]);
}

/**
 * Lifecycle hook for component updates
 *
 * Significance: Executes callback on every component update after initial mount
 * Core idea: Tracks component updates excluding the first mount
 * Main function: Invokes callback during component update phase
 * Main purpose: Provide a clean API for handling component update logic
 *
 * @param callback - Function to be called when component is updated
 * @param deps - Optional dependency array to control when updates are triggered
 *
 * @example
 * useLifecycleUpdated(() => {
 *   console.log('Component updated');
 * }, [count]);
 */
export function useLifecycleUpdated(
  callback: () => void,
  deps?: React.DependencyList
) {
  const mounted = useRef(false);

  useEffect(() => {
    if (mounted.current) {
      callback();
    } else {
      mounted.current = true;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);
}

/**
 * Lifecycle hook for component destruction
 *
 * Significance: Executes cleanup callback when component unmounts
 * Core idea: Simplified hook for handling component cleanup lifecycle with safe async handling
 * Main function: Invokes callback during component unmount phase using requestAnimationFrame
 * Main purpose: Provide a clean API for component cleanup and resource disposal
 *
 * @param callback - Function to be called when component is destroyed
 *
 * @example
 * useLifecycleDestroyed(() => {
 *   console.log('Component destroyed');
 * });
 */
export function useLifecycleDestroyed(callback: () => void) {
  const isComponentMounted = useRef(false);

  useEffect(() => {
    isComponentMounted.current = true;

    return () => {
      requestAnimationFrame(() => {
        if (!isComponentMounted.current) {
          callback();
        }
      });
      isComponentMounted.current = false;
    };
  }, [callback]);
}

/**
 * Lifecycle hook for managing component lifecycle
 *
 * Significance: Provides a unified interface for component lifecycle management
 * Core idea: Integrates React hooks with lifecycle interface pattern in a single useEffect
 * Main function: Manages complete component lifecycle (created, updated, destroyed)
 * Main purpose: Bridge React component lifecycle with custom lifecycle interface
 *
 * Implementation:
 * - Uses a single useEffect to handle all lifecycle phases
 * - created(): Called once on component mount via requestAnimationFrame
 * - updated(): Called on every re-render after mount (if method exists)
 * - destroyed(): Called on component unmount via requestAnimationFrame
 * - Automatically detects if lifecycle interface has updated() method
 *
 * @param lifecycle - The lifecycle interface to be invoked
 * @param deps - Optional dependency array to control when updated lifecycle is triggered
 *
 * @example Basic usage
 * const lifecycle = new MyLifecycle();
 * useLifecycle(lifecycle);
 *
 * @example With dependencies for updated lifecycle
 * const lifecycle = new MyLifecycle();
 * useLifecycle(lifecycle, [count, name]);
 */
export function useLifecycle(
  lifecycle: LifecycleInterface,
  deps?: React.DependencyList
) {
  const mounted = useRef(false);
  const isComponentMounted = useRef(false);

  useEffect(() => {
    // Handle created lifecycle on first mount
    if (!mounted.current) {
      mounted.current = true;
      isComponentMounted.current = true;

      requestAnimationFrame(() => {
        lifecycle.created();
      });
    } else {
      // Handle updated lifecycle on subsequent renders
      if ('updated' in lifecycle && typeof lifecycle.updated === 'function') {
        lifecycle.updated();
      }
    }

    // Handle destroyed lifecycle on unmount
    return () => {
      requestAnimationFrame(() => {
        if (!isComponentMounted.current) {
          lifecycle.destroyed();
        }
      });
      isComponentMounted.current = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);
}
