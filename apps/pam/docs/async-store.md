# PAM AsyncStore 约定

客户端异步操作（拉列表、保存、导入等）统一用 `@qlover/corekit-bridge` 的 **`AsyncStore`** 管理生命周期（`loading` / `error` / `status` / `result` / `stop`），不要再手写一套 `setLoading` + `setError` + `try/finally`。

已有范例：[`PAMFacade`](../src/impls/PAMfacade.ts)、[`UserService.capabilitiesStore`](../src/impls/UserService.ts)、[`useUserAuth`](../src/uikit/hook/useUserAuth.ts)。

面板侧优先用 `@brain-toolkit/react-kit` 的 `useAsyncStore` + `runAsyncStore` + `useAsyncStoreState`（实现见 [`packages/react-kit/src/hooks/useAsyncStore.ts`](../../../packages/react-kit/src/hooks/useAsyncStore.ts)）。

## 适合 vs 不适合

| 场景                                                  | 做法                                                             |
| ----------------------------------------------------- | ---------------------------------------------------------------- |
| 列表 / 详情 / 一次性 fetch                            | **AsyncStore**（`result` 即数据）                                |
| 保存 / 导入 / 提交                                    | **独立 AsyncStore**（与 list 分开）                              |
| 行级 / 分区级 pending（`pendingId`、`savingSection`） | mutation store + **`targetId` meta**（`emit`），不要全局 boolean |
| 弹窗、draft、`mode: create\|edit`、搜索框文案         | **`useState`**                                                   |
| `useCan` / `useUserAuth` 的 loading                   | **不叠第二层**（已是 AsyncStore 派生）                           |
| 极简单、无复用的单次按钮 await                        | 可暂留；出现第二处再升                                           |

## 关键原则

1. **一个 AsyncStore = 一种操作**。`loading` + `saving` + `importing` → 三个 store，不要揉成一个。
2. **创建 store**：`const [state, store] = useAsyncStore(...)` / `usePendingAsyncStore(...)`（列表首屏用 pending）。
   - 对象 patch → 合并进 `defaultState`；Ctor → 子类实例
   - 已有 IOC/facade store 只订阅：`useAsyncStoreState(store)`
   - 不接受 factory 函数；禁止 render 时 `new AsyncStore()`
3. **订阅**：tuple 已含全量 state；切片 / omit 仍可用 `useAsyncStoreState(store, selector | { omit })`。
4. **跑异步**：`runAsyncStore(store, promise | () => promise, { keep?, mapError? })`；失败只写 `store.error`，返回 `undefined`，不抛。
5. **成功后的列表**：写入 list store 的 `result`，或 mutation 成功后再 `runAsyncStore(listStore, …)`。
6. **错误展示**：`failed` 时写入可读文案；短暂 success toast 可用 `useState`。
7. **静默刷新**：`runAsyncStore(..., { keep: true })`，避免表格闪空。

## 推荐写法

```ts
import {
  useAsyncStore,
  usePendingAsyncStore,
  runAsyncStore,
  type AsyncState
} from '@brain-toolkit/react-kit';

const [list, listStore] = usePendingAsyncStore<AsyncState<Item[]>>();
const [save, saveStore] = useAsyncStore<AsyncState<Item[]>>();

type RoleSaveState = AsyncState<true> & { targetId: string | null };
const [role, roleStore] = useAsyncStore<RoleSaveState>({ targetId: null });

const next = await runAsyncStore(listStore, api.list(), {
  keep: true,
  mapError: () => msg
});
if (next === undefined) return;
```

## 反例

- 为开关弹窗建 AsyncStore。
- list / save 共用一个 store 上的多个 boolean。
- 在已订阅 User store 的组件上再包一层 AsyncStore 表示「鉴权 loading」。
- 把 result 类型直接当 `useAsyncStore<Item[]>`（应写 `useAsyncStore<AsyncState<Item[]>>`）。
- 对同一 store 连写多行 selector 只取 `loading` / `error` / `result`。
