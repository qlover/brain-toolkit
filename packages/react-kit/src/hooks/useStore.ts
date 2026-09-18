import {
  SliceStoreAdapter,
  type StoreInterface,
  type StoreStateInterface
} from '@qlover/corekit-bridge/store-state';
import { useSliceStore, type SliceStore } from '@qlover/slice-store-react';
import { useSyncExternalStore } from 'react';

/**
 * {@link useStore} 的最小可读 store 端口。
 *
 * 调用方优先用本类型，而不是直接依赖 `StoreInterface`，避免 pam / next-kit /
 * react-kit 因 `@qlover/corekit-bridge` 多实例导致 TypeScript 赋值不兼容。
 */
export type ReadableStore<S> = {
  getState: () => S;
  subscribe: (listener: (state: S, prevState: S) => void) => () => void;
};

/**
 * 运行时收窄：是否为 {@link SliceStoreAdapter} 承载的 {@link StoreInterface}。
 */
export function isSliceStoreAdapter<S extends StoreStateInterface>(
  store: StoreInterface<S>
): store is SliceStoreAdapter<S> {
  return store instanceof SliceStoreAdapter;
}

/**
 * 目标为 {@link SliceStore} 或 {@link SliceStoreAdapter}（取其内部 store）时，
 * 通过 `useSliceStore` 订阅。
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
 * 任意可读 store 的 React hook（基于 `subscribe` / `getState`）。
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
