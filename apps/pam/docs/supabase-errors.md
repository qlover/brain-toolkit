# PAM Supabase 错误处理

## 约定

**统一使用 `throwIfError(result)`**：覆盖 PostgREST（`from` / `rpc`）与 Auth（`auth.*`）等所有返回 `{ data, error }`（或等价 result）的调用。

`PAMSupabaseRepo` 已 override `throwIfError`（`toStableApiExecutorError`）。IOC 里 `SupabaseRepo` 与 `PAMSupabaseRepo` **绑定同一实例**。

不主推 supabase 原生 `.throwOnError()`：Auth 等没有同名链式 API，两套写法不利于统一。

## 用法

```ts
const result = await this.getAdminSupabase().from('pam_locales').select('*');
this.throwIfError(result);
return result.data ?? [];

// Auth 同样
const result = await admin.auth.admin.getUserById(id);
this.supabaseBridge.throwIfError(result);
```

- 禁止新代码：`if (error) throw new Error(error.message)`。
- **客户端信封**：`api:server__error` 在 production **不**附带诊断 `data`（明细只打服务端日志）；`NODE_ENV !== 'production'` 仍可带回 `data`。`NextApiHandler` 也会把偶发的原生 `PostgrestError` / AuthError 收成稳定 id。

## 例外（可以不用 throwIfError）

| 场景 | 做法 |
|------|------|
| 可恢复 RPC / 缺迁移 / range 越界 | `try/catch` 后再 fallback |
| 权限探测 fail-closed（如 `checkPlatformAdmin`） | `if (error) return false` |
| 业务语义映射（如 OTP 无效 → 固定 `api:*`） | 抛带业务 id 的 `ExecutorError` |
| 批量部分失败 / Auth 可选 enrichment | 按产品语义 soft-handle |

Cursor rule：见 `.cursor/rules/general.mdc` §七（PAM 专项）。
