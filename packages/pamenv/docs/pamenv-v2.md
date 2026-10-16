# pamenv v2：变量注入进程，`.env` 只是一种输出格式

## 存储

变量按行存在 `pam_env_variables`（`environment_id` + `key` 唯一），不再以 `pam_environments.variables` JSONB 为读写源。旧 JSONB 列暂保留不删除，便于回滚与核对；应用只读写新表，API 仍组装成 `variables[]`。

## 目标

- PAM 是变量的唯一数据源，本地不再常驻明文。
- 日常开发默认把变量注入进程（`pamenv run`），不写文件。
- `.env`、JSON、YAML、TOML 都只是按需输出的格式（`pamenv render`）。
- 权限区分「能用」和「能看」：成员可以注入运行，但拿不到明文。
- **敏感值只经 `run` 进入进程**：网页、`render`、`pull`、`fork` 都不返回敏感明文，owner 也一样。明文只存在于「服务端解密 → 传输 → 目标进程内存」这条链路上，唯一的例外是被运行的程序自己打印出来。

## 现状与问题

| 现状                                                                                                            | 问题                                           |
| --------------------------------------------------------------------------------------------------------------- | ---------------------------------------------- |
| `pull` 调用 `GET /api/pam/:projectId/environments/:envId/export`，服务端解密后返回明文，CLI 写入 `.env`（0600） | 明文长期留在磁盘，容易误提交、误分享           |
| 导出只检查 `pam_environments_export`，团队 member 角色就有这个权限                                              | 所有成员都能拿到全部明文，包括 prod            |
| 输出格式只有 dotenv                                                                                             | 只认 TOML / YAML / JSON 配置的工具没法直接使用 |

## 核心模型

```text
PAM（按项目 / 环境 / 权限管理变量，服务端 AES-256-GCM 加密存储）
   │  CLI 用本地身份凭证（Bearer token）请求
   ▼
服务端检查权限 → 只返回本次需要的键值（不缓存）
   ├─ resolve：解密敏感值 → pamenv run 注入子进程环境变量（需要「使用」权限）
   └─ export：敏感值置空 → pamenv render / pull 输出非敏感变量（需要「导出」权限）
```

本地只保存**身份凭证**，不保存解密密钥：

- 凭证只用来证明「我是谁」，每次请求都由服务端重新检查权限。
- 凭证有有效期，可以随时吊销；成员退出团队后立即失效。
- 凭证泄露的影响限于该用户的权限范围，而且可以吊销；不存在一把能解开所有变量的本地主密钥。

## 命令设计

### `pamenv run`

```bash
pamenv run <slug|id> -e dev -- pnpm dev
pamenv run <slug|id> -e dev -- node server.js
```

项目参数必填：`init` 目前不会在当前目录记录项目绑定，省略项目留待以后。

| 选项                | 说明                                            |
| ------------------- | ----------------------------------------------- |
| `-e, --env <name>`  | 环境名，沿用现有的选择逻辑                      |
| `--only <keys>`     | 只注入指定的键，逗号分隔                        |
| `--keep-env <keys>` | 这些键如果在当前 shell 里已经有值，就保留不覆盖 |
| `--no-warn`         | 关闭下面的「绕过检查」提示                      |

行为：

1. 解析项目和环境，调用 `resolve` 接口拿到键值（只在内存中）。
2. 合并顺序：当前进程环境 < PAM 变量（同名以 PAM 为准，`--keep-env` 例外）。
3. 用 `cross-spawn` 启动子进程，兼容 Windows 下的 `.cmd` 和路径解析；`stdio: 'inherit'`。
4. 把 `SIGINT` / `SIGTERM` 转发给子进程；CLI 的退出码等于子进程的退出码。
5. 不写任何文件，不打印变量值。

### `pamenv render`

```bash
pamenv render <slug|id> -e dev --format dotenv --out .env.local
pamenv render <slug|id> -e dev --format json                 # 默认输出到 stdout
pamenv render <slug|id> -e dev --format toml --out config.toml
```

| 选项                                  | 说明                                          |
| ------------------------------------- | --------------------------------------------- |
| `--format <dotenv\|json\|yaml\|toml>` | 输出格式，默认 `dotenv`                       |
| `--out <file\|->`                     | 输出到文件（0600），`-` 或省略时输出到 stdout |
| `--only <keys>`                       | 只输出指定的键                                |

需要「导出」权限。敏感变量的值一律输出为本环境的占位符，并在 stderr 列出这些键名，stdout 保持干净；没有 `--reveal` 之类的例外开关。旧版服务端不返回占位符时，敏感变量仍会被省略。

### `pamenv pull` / `pamenv push`（保留，兼容现有用法）

- 行为基本不变：对比基线、处理冲突、保留注释、写入 `.env`。
- `pull` 时敏感变量写 `# pam:sensitive` 和本环境的占位符；本地旧文件里残留的敏感明文会在下次 `pull` 时被占位符覆盖。
- `push` 时，已在 PAM 上标记为敏感的键本地值为本环境占位符（或为空），表示保留 PAM 上的值；填了新值表示轮换。推送成功后，本地文件和同步基线里的敏感值换回占位符。

#### 敏感占位符

- 格式 `__PAM_SENSITIVE_<24 位 hex>__`，每个环境一个、固定不变：服务端用 `PAM_ENV_SECRET_KEY` 对环境 id 做 HMAC 得出，不需要存储，也猜不出来。
- export 接口把敏感值替换为占位符，并返回 `sensitivePlaceholder`；`pull` / `render` 原样写出。
- 写回时（CLI push、网页端保存、导入 dotenv），本环境的占位符等同于空值，表示保留原值；合并后仍残留的占位符（别的环境的、或新键上的）一律拒绝（`api:pam_variable_placeholder_invalid`）。CLI 在推送前也会先检查一遍。
- `run` 前若发现 `.env*` 文件里注入的键写着占位符，会额外提示：如果工具让 .env 覆盖进程环境变量，程序拿到的会是占位符。
- 旧文件里的空值仍兼容：空值同样表示保留原值。
- 权限检查改为导出权限；没有权限时提示改用 `pamenv run`。
- dotenv 适配器和 `pull` 共用 `PamCliDotenvUtil` 的序列化，只保留一份实现；`pull` 额外做按文档合并（保留本地注释）。
- 帮助信息里提示：日常开发推荐使用 `pamenv run`。

## 输出适配器

```ts
type PamEnvResolvedVarType = {
  readonly key: string;
  readonly value: string;
  readonly sensitive: boolean;
  readonly comments?: readonly string[];
};

interface PamEnvOutputAdapterInterface {
  /** 格式名，对应 `--format` */
  readonly format: 'dotenv' | 'json' | 'yaml' | 'toml';
  /** 把变量序列化为文本；不负责写文件 */
  serialize(vars: readonly PamEnvResolvedVarType[]): string;
}
```

- `dotenv`：复用现有的 `PamCliDotenvUtil`，保留注释和多行值。
- `json`：平铺的 `{ "KEY": "value" }`。
- `yaml` / `toml`：平铺的键值对；值统一用双引号字符串并转义（含换行），不依赖第三方库。
- 新增格式只需实现这个接口并注册，命令层不改。
- 是否支持嵌套结构（例如把 `DB__HOST` 展开为 `db.host`）暂不做，见待定问题。

## 权限

| 权限键                            | 作用                                                 | 默认角色                            |
| --------------------------------- | ---------------------------------------------------- | ----------------------------------- |
| `pam_environments_inject`（新增） | 调用 `resolve`，用于 `pamenv run`                    | team_member、team_admin、team_owner |
| `pam_environments_export`（已有） | 调用 `export`（不含敏感值），用于 `pull` / `render`；网页端环境安全设置 | **改为**只给 team_admin、team_owner |

- 网页端：所有读取接口本来就会清空敏感值，浏览器拿不到明文，也没有「显示」功能，无需改动。
- 这一项会改变现有成员的权限：成员原来能 `pull`，改完后只能 `run`。上线前需要通知团队；SQL 升级脚本（`001` 第 8 节）会移除 team_member 的导出权限。
- 受保护环境（`pam_environments.is_protected`）：`resolve` 除了注入权限还要求导出权限，即只有 admin / owner 能 `run`。开关和访问记录在网页端环境页，只对有导出权限的人显示。

## 服务端接口

### 新增 `POST /api/pam/:projectId/environments/:envId/resolve`

- 鉴权：Bearer token；检查 `pam_environments_inject`。
- 请求体：`{ "keys"?: string[] }`，对应 `--only`。
- 响应：`{ "variables": [{ "key", "value", "sensitive" }] }`，不返回注释（运行时用不到）。
- 响应头：`Cache-Control: no-store`。
- 使用 POST，避免键名出现在 URL 和访问日志里。

### 已有 `GET .../export`

- 权限收紧到 admin / owner，并写审计日志。
- 不再解密：敏感变量的 `value` 一律为空字符串，`sensitiveKeys` 照常返回。`resolve` 是唯一会解密敏感值的接口。

### 新增 `POST .../settings` 与 `GET .../access-logs`

- 都要求 `pam_environments_export`。
- `settings` 请求体 `{ "isProtected": boolean }`。
- `access-logs` 返回该环境最近 50 条记录。

CLI 请求带 `x-pamenv-client: pamenv-cli/<版本>`，审计日志的 `client` 字段记录它。

### 审计日志

每次调用 `resolve` 和 `export` 都记录一条：

| 字段                                      | 说明                         |
| ----------------------------------------- | ---------------------------- |
| `user_id`、`project_id`、`environment_id` | 谁、哪个项目、哪个环境       |
| `action`                                  | `resolve` / `export`         |
| `key_count`                               | 返回了多少个键（不记录键值） |
| `client`                                  | `cli` / `web`，以及 CLI 版本 |
| `ip`、`created_at`                        | 来源和时间                   |

项目设置里可以按环境查看最近的访问记录。

## 绕过检查（`run` 启动前的提示）

| 检测项                                      | 提示内容                                                                  |
| ------------------------------------------- | ------------------------------------------------------------------------- |
| 当前目录存在 `.env*` 文件，且与注入的键重名 | 文件里的值可能覆盖注入值（例如 dotenv 设置了 `override: true`），建议删除 |
| 敏感变量名以 `NEXT_PUBLIC_` / `VITE_` 开头  | 这类变量会在构建时写进前端代码包，不应存放密钥                            |
| `turbo.json` 开启了严格环境变量模式         | 未声明的变量会被 Turbo 过滤，需要在配置中声明                             |

只提示，不阻止运行；可以用 `--no-warn` 关闭。

## 本地凭证

- 第一阶段沿用现有方式：`~/.pam/config.json`（0600），有效期由站点设置 `AUTH_CLI_TOKEN_EXPIRES_IN` 控制。
- 第二阶段可选改为存入系统钥匙串（Windows 凭据管理器、macOS 钥匙串、Linux Secret Service），配置文件里只保留 baseUrl 等非敏感信息。

## 不在本次范围

- 端到端加密（服务端无法解密）。
- 服务端代理第三方 API 密钥。
- 动态凭证（按次生成数据库账号等）。
- CI 的 OIDC 免密钥接入：思路同 npm Trusted Publishing，放到第三阶段单独设计。

## 分阶段

| 阶段 | 内容                                                                                                       |
| ---- | ---------------------------------------------------------------------------------------------------------- |
| 一   | `resolve` 接口、`pam_environments_inject` 权限与审计日志；`pamenv run`；绕过检查（已完成）                 |
| 二   | `pamenv render` 与四种适配器；`export` 权限收紧且不再返回敏感值；受保护环境；访问记录（已完成）            |
| 三   | 钥匙串存储凭证；CI 的 OIDC 接入                                                                            |

## 待定问题

1. ~~`run` 同名变量以谁为准~~：已实现为以 PAM 为准，`--keep-env` 处理例外。
2. 收紧 `export` 权限后，现有依赖 `pull` 的成员如何过渡：是否需要一段时间的兼容期？
3. 适配器是否需要支持嵌套结构，比如把 `DB__HOST` 展开为 `db.host`？
4. 审计日志保留多久？
