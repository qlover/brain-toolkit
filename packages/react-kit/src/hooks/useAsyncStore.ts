/* eslint-disable @typescript-eslint/no-unsafe-function-type */
/* eslint-disable @typescript-eslint/no-explicit-any */

import {
  AsyncStore,
  AsyncStoreStatus,
  createAsyncState,
  type AsyncStoreInterface,
  type AsyncStoreStateInterface
} from '@qlover/corekit-bridge/store-state';
import { isAbortError } from '@qlover/fe-corekit/aborter';
import { useMemo, useState } from 'react';
import { useStore } from './useStore';

type AsyncStoreCtor<TStore> = new () => TStore;

/** Prefer `getState()` so subclass / patch meta (e.g. `targetId`) is kept. */
type InferAsyncState<TStore extends AsyncStoreInterface<any>> = ReturnType<
  TStore['getState']
>;

/**
 * Async store **state** with typed `result`. Prefer this over passing result as
 * the `useAsyncStore` type arg — always type the state, extend it for meta.
 *
 * @example
 * ```ts
 * type ListState = AsyncState<Item[]>;
 * type RoleSaveState = AsyncState<true> & { targetId: string | null };
 * ```
 */
export type AsyncState<T> = AsyncStoreStateInterface<T>;

const PENDING_DEFAULT = {
  loading: true,
  status: AsyncStoreStatus.PENDING
} as const satisfies Partial<AsyncStoreStateInterface<unknown>>;

function isAsyncStoreCtor(
  value: unknown
): value is AsyncStoreCtor<AsyncStoreInterface<any>> {
  return (
    typeof value === 'function' &&
    typeof (value as Function).prototype === 'object' &&
    (value as Function).prototype instanceof AsyncStore
  );
}

function mergeAsyncState<S extends AsyncStoreStateInterface<any>>(
  base: S,
  patch?: Partial<S>
): S {
  if (!patch) {
    return base;
  }
  return Object.assign(base, patch);
}

function createDefaultAsyncStore<S extends AsyncStoreStateInterface<any>>(
  patch?: Partial<S>
): AsyncStore<S, string> {
  return new AsyncStore<S, string>({
    defaultState: () => mergeAsyncState(createAsyncState() as S, patch)
  });
}

/**
 * Mount-stable AsyncStore + reactive state as `[state, store]` (like `useState`).
 *
 * - no arg / object → default `AsyncStore` (`draft`, `loading: false`); object
 *   is merged into `defaultState`
 * - subclass ctor → `new Ctor()` (ctor owns default state; no factory fn)
 *
 * For list panels that should show a spinner before the first fetch, use
 * {@link usePendingAsyncStore} instead.
 *
 * Subscribe-only to an existing IOC/facade store: {@link useAsyncStoreState}.
 *
 * ```ts
 * const [role, roleStore] = useAsyncStore<RoleSaveState>({ targetId: null });
 * const [state, store] = useAsyncStore(RoleSaveStore);
 * ```
 *
 * Only the first render's arg is used (`useState` initializer).
 */
export function useAsyncStore<TStore extends AsyncStoreInterface<any>>(
  Store: AsyncStoreCtor<TStore>
): [InferAsyncState<TStore>, TStore];
export function useAsyncStore(): [
  AsyncStoreStateInterface<unknown>,
  AsyncStore<AsyncStoreStateInterface<unknown>, string>
];
export function useAsyncStore<S extends AsyncStoreStateInterface<any>>(
  initial?: Partial<S>
): [S, AsyncStore<S, string>];
export function useAsyncStore<P extends object>(
  initial: P
): [
  AsyncStoreStateInterface<unknown> & P,
  AsyncStore<AsyncStoreStateInterface<unknown> & P, string>
];
export function useAsyncStore(
  storeOrInitial?:
    | Partial<AsyncStoreStateInterface<any>>
    | (Partial<AsyncStoreStateInterface<any>> & Record<string, unknown>)
    | AsyncStoreCtor<AsyncStoreInterface<any>>
): [AsyncStoreStateInterface<any>, AsyncStoreInterface<any>] {
  const [store] = useState(() => {
    if (isAsyncStoreCtor(storeOrInitial)) {
      return new storeOrInitial();
    }
    return createDefaultAsyncStore(
      storeOrInitial as Partial<AsyncStoreStateInterface<any>> | undefined
    );
  });
  const state = useStore(store.getStore());
  return [state, store];
}

/**
 * Like {@link useAsyncStore}, but mounts already `loading` / `pending`
 * (avoids empty flash before the first `runAsyncStore`).
 *
 * ```ts
 * const [list, listStore] = usePendingAsyncStore<AsyncState<Item[]>>();
 * ```
 */
export function usePendingAsyncStore(): [
  AsyncStoreStateInterface<unknown>,
  AsyncStore<AsyncStoreStateInterface<unknown>, string>
];
export function usePendingAsyncStore<S extends AsyncStoreStateInterface<any>>(
  initial?: Partial<S>
): [S, AsyncStore<S, string>];
export function usePendingAsyncStore<P extends object>(
  initial: P
): [
  AsyncStoreStateInterface<unknown> & P,
  AsyncStore<AsyncStoreStateInterface<unknown> & P, string>
];
export function usePendingAsyncStore(
  initial?:
    | Partial<AsyncStoreStateInterface<any>>
    | (Partial<AsyncStoreStateInterface<any>> & Record<string, unknown>)
): [AsyncStoreStateInterface<any>, AsyncStoreInterface<any>] {
  return useAsyncStore({
    ...PENDING_DEFAULT,
    ...(initial ?? {})
  });
}

export type RunAsyncStoreOptions<T> = {
  /**
   * Pass previous `result` into `start` so UI can keep showing stale data
   * while refreshing (e.g. OTP auto-refresh).
   *
   * `keep` is a short alias for `keepResultOnStart`.
   */
  keepResultOnStart?: boolean;
  keep?: boolean;
  /** Map thrown errors before `failed` (e.g. to an i18n string). */
  mapError?: (error: unknown) => unknown;
  /** Optional optimistic / seed result passed to `start`. */
  startResult?: T;
};

/** Promise already in flight, or a deferred factory. */
export type RunAsyncStoreTask<T> = Promise<T> | (() => Promise<T>);

function resolveRunTask<T>(task: RunAsyncStoreTask<T>): Promise<T> {
  return typeof task === 'function' ? task() : task;
}

/**
 * `start` → await task → `success` / `failed`.
 *
 * Errors are written to `store` via `failed` and **not** rethrown — returns
 * `undefined` on failure so callers can skip success side-effects without
 * empty `catch` blocks.
 *
 * Accepts `Promise<T>` or `() => Promise<T>`. Prefer a factory when you need
 * `start()` to run before the work begins.
 */
export async function runAsyncStore<
  T,
  S extends AsyncStoreStateInterface<T> = AsyncStoreStateInterface<T>
>(
  store: AsyncStoreInterface<S>,
  task: RunAsyncStoreTask<T>,
  options?: RunAsyncStoreOptions<T>
): Promise<T | undefined> {
  const keep = options?.keepResultOnStart === true || options?.keep === true;
  const startResult =
    options?.startResult !== undefined
      ? options.startResult
      : keep
        ? ((store.getResult() as T | null) ?? undefined)
        : undefined;

  store.start(startResult as S['result'] | undefined);

  try {
    const result = await resolveRunTask(task);
    store.success(result as S['result']);
    return result;
  } catch (error) {
    // Abort is cancellation, not a failed load — leave UI as-is.
    if (isAbortError(error)) {
      return undefined;
    }
    store.failed(options?.mapError?.(error) ?? error);
    return undefined;
  }
}

export type UseAsyncStoreStateOmitOptions<
  S extends AsyncStoreStateInterface<any>,
  K extends keyof S
> = {
  /** Prefer a module-level `as const` array so the selector stays stable. */
  omit: readonly K[];
};

function omitStateKeys<S extends object, K extends keyof S>(
  state: S,
  keys: readonly K[]
): Omit<S, K> {
  const next = { ...state };
  for (const key of keys) {
    delete next[key];
  }
  return next;
}

/**
 * Subscribe to an **existing** AsyncStore (IOC / facade / shared instance).
 * Panel-local stores: prefer {@link useAsyncStore} / {@link usePendingAsyncStore}
 * which already return `[state, store]`.
 *
 * - No 2nd arg → full state (recommended default)
 * - Selector → derived slice
 * - `{ omit }` → full state minus fields
 */
export function useAsyncStoreState<TStore extends AsyncStoreInterface<any>>(
  store: TStore
): InferAsyncState<TStore>;
export function useAsyncStoreState<TStore extends AsyncStoreInterface<any>, T>(
  store: TStore,
  selector: (state: InferAsyncState<TStore>) => T
): T;
export function useAsyncStoreState<
  TStore extends AsyncStoreInterface<any>,
  K extends keyof InferAsyncState<TStore>
>(
  store: TStore,
  options: UseAsyncStoreStateOmitOptions<InferAsyncState<TStore>, K>
): Omit<InferAsyncState<TStore>, K>;
export function useAsyncStoreState<TStore extends AsyncStoreInterface<any>>(
  store: TStore,
  selectorOrOmit?:
    | ((state: InferAsyncState<TStore>) => unknown)
    | UseAsyncStoreStateOmitOptions<
        InferAsyncState<TStore>,
        keyof InferAsyncState<TStore>
      >
): unknown {
  type S = InferAsyncState<TStore>;
  const selector = useMemo(() => {
    if (typeof selectorOrOmit === 'function') {
      return selectorOrOmit;
    }
    if (selectorOrOmit && Array.isArray(selectorOrOmit.omit)) {
      const keys = selectorOrOmit.omit;
      return (state: S) => omitStateKeys(state, keys);
    }
    return undefined;
  }, [selectorOrOmit]);

  return useStore(
    store.getStore(),
    selector as ((state: S) => unknown) | undefined
  );
}

export function asyncErrorMessage(error: unknown): string | null {
  if (error == null) {
    return null;
  }
  if (typeof error === 'string') {
    return error;
  }
  if (error instanceof Error && error.message) {
    return error.message;
  }
  return String(error);
}
