# PAM Supabase 错误处理

## 约定

**PostgREST**（`from` / `rpc` 等 query builder）默认使用 **`.throwOnError()`**。原生 `PostgrestError` 抛到 [`NextApiHandler`](../server/utils/NextApiHandler.ts)，经 `toExecutorErrorFromThrown` 收成稳定的 `api:server__error`。

**不必**使用 `throwOnError` 的情况见下方例外（Auth、可恢复错误、业务 `api:*` 等）——这些继续 `throwIfError`、业务 `ExecutorError`，或显式 soft-handle。

IOC 里 `SupabaseRepo` 与 `PAMSupabaseRepo` **绑定同一实例**（`throwIfError` 仍带 `toStableApiExecutorError` remap，供 Auth 等非 builder 路径使用）。

## 用法

```ts
// 推荐：PostgREST
const { data } = await this.supabaseBridge
  .getAdminSupabase()
  .from('pam_role_teams')
  .select('*')
  .maybeSingle()
  .throwOnError();

// Auth / 无 throwOnError 的 result：仍用 throwIfError
const result = await admin.auth.admin.getUserById(id);
this.supabaseBridge.throwIfError(result);
```

- 禁止新代码：`if (error) throw new Error(error.message)`。
- 未走 `NextApiHandler` 的路径（CLI / SSR / 后台）若用 `.throwOnError()`，须自行保证错误被转换或记录；更稳妥可用 `throwIfError`。
- **客户端信封**：`api:server__error` 在 production **不**附带 PostgREST / `UNKNOWN_ASYNC` 诊断 `data`（明细只打服务端日志）；`NODE_ENV !== 'production'` 仍可带回 `data` 方便排查。

## 例外（可以不用 throwOnError）

| 场景 | 做法 |
|------|------|
| Auth SDK（`auth.*`） | `throwIfError(result)`（无 query builder 链） |
| 可恢复 RPC / 缺迁移 / range 越界 | `try/catch` 后再 fallback |
| 权限探测 fail-closed（如 `checkPlatformAdmin`） | `if (error) return false` |
| 业务语义映射（如 OTP 无效 → 固定 `api:*`） | 抛带业务 id 的 `ExecutorError` |
| 批量部分失败 / Auth 可选 enrichment | 按产品语义 soft-handle |

Cursor rule：`.cursor/rules/pam-supabase.mdc`。
