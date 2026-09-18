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

/** 优先用 `getState()`，以便保留子类 / patch 上的 meta（如 `targetId`）。 */
type InferAsyncState<TStore extends AsyncStoreInterface<any>> = ReturnType<
  TStore['getState']
>;

/**
 * 带类型化 `result` 的 AsyncStore **状态**。请始终把 state 作为泛型参数，
 * 需要 meta 时再交叉扩展；不要把 result 类型直接当作 `useAsyncStore` 的泛型。
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
 * 挂载期内稳定的 AsyncStore + 响应式 state，返回 `[state, store]`（类似 `useState`）。
 *
 * - 无参 / 对象 → 默认 `AsyncStore`（`draft`，`loading: false`）；对象合并进 `defaultState`
 * - 子类构造函数 → `new Ctor()`（默认状态由 ctor 负责；不接受 factory 函数）
 *
 * 列表面板若希望首屏就显示 loading，请用 {@link usePendingAsyncStore}。
 *
 * 已有 IOC / facade store 只订阅：{@link useAsyncStoreState}。
 *
 * ```ts
 * const [role, roleStore] = useAsyncStore<RoleSaveState>({ targetId: null });
 * const [state, store] = useAsyncStore(RoleSaveStore);
 * ```
 *
 * 仅首次渲染的参数生效（`useState` 初始化器）。
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
 * 同 {@link useAsyncStore}，但挂载时已是 `loading` / `pending`
 *（避免首次 `runAsyncStore` 前闪空）。
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
   * `start` 时带上已有 `result`，刷新时 UI 可继续展示旧数据
   *（如 OTP 自动刷新）。
   *
   * `keep` 是 `keepResultOnStart` 的短别名。
   */
  keepResultOnStart?: boolean;
  keep?: boolean;
  /** 传给 `start` 的乐观 / 种子 result。 */
  startResult?: T;
};

/** 已在飞行中的 Promise，或延迟执行的 factory。 */
export type RunAsyncStoreTask<T> = Promise<T> | (() => Promise<T>);

function resolveRunTask<T>(task: RunAsyncStoreTask<T>): Promise<T> {
  return typeof task === 'function' ? task() : task;
}

/**
 * `start` → await 任务 → `success` / `failed` / `stopped`。
 *
 * 成功时返回任务结果；失败或 abort 返回 `undefined` 且**不抛出** —
 * 可以使用 `store.isFailed()` / `store.isStopped()` / `store.isSuccess()` 判断
 *（展示文案放在渲染层映射，不要在这里写）。
 *
 * 接受 `Promise<T>` 或 `() => Promise<T>`。若需要先 `start()` 再开跑，优先用 factory。
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
    if (isAbortError(error)) {
      store.stopped(error);
      return undefined;
    }
    store.failed(error);
    return undefined;
  }
}

export type UseAsyncStoreStateOmitOptions<
  S extends AsyncStoreStateInterface<any>,
  K extends keyof S
> = {
  /** 建议用模块级 `as const` 数组，保证 selector 引用稳定。 */
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
 * 订阅**已有** AsyncStore（IOC / facade / 共享实例）。
 * 面板本地 store 优先用 {@link useAsyncStore} / {@link usePendingAsyncStore}，
 * 它们已返回 `[state, store]`。
 *
 * - 无第二参 → 全量 state（推荐默认）
 * - selector → 派生切片
 * - `{ omit }` → 全量 state 去掉指定字段
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
