import {
  SliceStoreAdapter,
  type StoreInterface,
  type StoreStateInterface
} from '@qlover/corekit-bridge/store-state';
import { useSliceStore, type SliceStore } from '@qlover/slice-store-react';
import { useSyncExternalStore } from 'react';

/**
 * Minimal store port for {@link useStore}.
 *
 * Prefer this over importing `StoreInterface` at call sites so pam / next-kit /
 * react-kit do not need identical `@qlover/corekit-bridge` package instances
 * for TypeScript assignability.
 */
export type ReadableStore<S> = {
  getState: () => S;
  subscribe: (listener: (state: S, prevState: S) => void) => () => void;
};

/**
 * Runtime narrow for {@link SliceStoreAdapter}-backed {@link StoreInterface} ports.
 */
export function isSliceStoreAdapter<S extends StoreStateInterface>(
  store: StoreInterface<S>
): store is SliceStoreAdapter<S> {
  return store instanceof SliceStoreAdapter;
}

/**
 * Subscribe via `useSliceStore` when the target is a {@link SliceStore} or
 * {@link SliceStoreAdapter} (inner store is used).
 */
export function useSliceStoreAdapter<S extends StoreStateInterface, R = S>(
  store: SliceStoreAdapter<S> | SliceStore<S>,
  selector?: (state: S) => R
): R {
  const inner: SliceStore<S> =
    store instanceof SliceStoreAdapter ? store.getStore() : store;
  const select = (selector ?? ((s: S) => s as unknown as R)) as (state: S) => R;
  return useSliceStore(inner, select);
}

/**
 * React hook for any readable store using `subscribe` / `getState`.
 */
export function useStore<S, R = S>(
  store: ReadableStore<S>,
  selector?: (state: S) => R
): R {
  const select = (selector ?? ((s: S) => s as unknown as R)) as (state: S) => R;

  const snapshot = useSyncExternalStore(
    (onChange) =>
      store.subscribe((_next, _prev) => {
        onChange();
      }),
    () => store.getState(),
    () => store.getState()
  );
  return select(snapshot);
}
