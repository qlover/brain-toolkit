# pamenv-cli

本地多环境 env 同步工具：用交互式 `init` 从当前目录创建 PAM 项目，再 `pull` / `push` 同步 `.env.<环境名>`。安装后命令名为 `pamenv`。

## 安装

```bash
npm install -g pamenv-cli
# 或
npx pamenv --help

# monorepo
pnpm --filter pamenv-cli build
pnpm --filter pamenv-cli link --global
pnpm pamenv --help
```

改 CLI 源码后需先 `pnpm --filter pamenv-cli build`，根目录的 `pnpm pamenv` 才会用到最新 `dist`。

## 常用命令

```bash
pnpm pamenv login
pnpm pamenv --domain pam.localhost:3400 login          # 指定本地 PAM（裸主机 → http）
pnpm pamenv --local --domain pam.localhost:3400 login  # 凭证写入 cwd/.pam（与 ~/.pam 隔离）
pnpm pamenv --local projects
pnpm pamenv projects
pnpm pamenv init                       # 交互创建项目（扫描 cwd）
pnpm pamenv init -o ./packages/app     # 指定工作目录
pnpm pamenv fork <slug|id>             # Fork 可读项目（敏感值清空）
pnpm pamenv fork <slug|id> -y          # 使用默认 slug/name，跳过确认
pnpm pamenv pull <slug|id>             # → ./.env.<环境名>
pnpm pamenv pull <slug|id> -e staging
pnpm pamenv pull <slug|id> -e staging -f   # 仅跳过「覆盖本地」冲突确认
pnpm pamenv push <slug|id> -e staging      # diff + 同步冲突检测后回写
pnpm pamenv push <slug|id> -e staging -y   # 跳过普通确认（不含冲突覆盖）
pnpm pamenv push <slug|id> -e staging -f   # 仅跳过同步冲突覆盖确认（不等于 -y）
pnpm pamenv push <slug|id> -e staging --show-values  # review 显示非敏感明文
pnpm pamenv remove <slug|id> -e local   # 删除远端环境（两次确认）
pnpm pamenv remove <slug|id> -e local -y
pnpm pamenv logout
pnpm pamenv --local logout             # 清理 cwd/.pam 下的 token/sync
```

### 全局参数（本地联调）

| 参数 | 含义 |
| --- | --- |
| `--url <url>` | 本进程覆盖 PAM origin（如 `http://pam.localhost:3400`） |
| `--domain <host>` | 同 `--url`，可写裸主机；`localhost` / 私网默认 `http`，其余 `https` |
| `--local` | 配置与 sync 使用 **当前目录**（或命令 `-o`）下的 `.pam/`，**不**回落 `~/.pam` 的 token |

请勿同时传 `--url` 与 `--domain`。项目若使用 `--local`，建议把 `.pam/` 加入 `.gitignore`（内含 token）。

### 持久配置与文案

```bash
pamenv --local config set domain pam.localhost:3400
pamenv --local config set locale zh          # 自动 pull `/api/locales/json`
pamenv --local config list
pamenv --local locales pull                 # 强制刷新文案缓存
```

| key | 作用 |
| --- | --- |
| `domain` / `url` | 持久化 `baseUrl` |
| `locale` | `en` \| `zh`；错误 `id` 会译成对应语言 |

文案缓存：`{pamRoot}/locales/{locale}.json`。API 失败时优先显示译文，并附带 `id` / `requestId`。

API 失败时 CLI 会打印可读文案（若已缓存 locale），并附带稳定错误码 `id`（即 PAM 业务 i18n key，如 `api:not_authorized`）与 `requestId`，便于对照服务端日志。

本地文件：`.env.<环境名>`（例如环境 `local` → `.env.local`）。未传 `-e` 时用环境列表**第一个**（`remove` 除外，必须传 `-e`）。

---

## `pamenv init`（交互创建）

在项目目录登录后执行，类似 `npm init`：扫描当前目录给默认值，你确认后再创建。

```bash
pamenv login
cd your-project
pamenv init
```

### 扫描默认值

| 字段               | 有来源时                                                                              | 无来源时                         |
| ------------------ | ------------------------------------------------------------------------------------- | -------------------------------- |
| **name**           | `package.json` 的 `name`；否则 git `origin` 仓库名（URL 最后一段）                    | 手填                             |
| **slug**           | 由你确认后的 **name** 转成 slug（小写、非字母数字 → `-`；`@scope/foo` → `scope-foo`） | 转不出则无默认，手填             |
| **description**    | `package.json` 的 `description`                                                       | 可空                             |
| **category**       | —                                                                                     | 选择 `后端` / `前端`（默认后端） |
| **repository url** | git `origin`（尽量转成 https）                                                        | 可空                             |
| **environments**   | 见下方                                                                                | 可能不创建任何环境               |

### 环境（environments）

1. 扫描 `.env`、`.env.local`、`.env.<xxx>`（非递归）。
2. 命名规则：
   - `.env` / `.env.local` → 环境名 **`local`**（合并为一个）
   - `.env.xxx` → 环境名 **`xxx`**
3. **有 env 文件**：多选要创建的环境 → 逐个确认 **env name** 与 **env url**。  
   url 默认优先用 `package.json` 的 **homepage**（合法 http/https）；没有则需手填。API 要求 url 必须是合法 URL。
4. **没有 env 文件**：不创建任何 environment（即使有 homepage 也不单独建 env）。
5. `init` **只建项目与空环境**，不把本地变量上传；变量请随后：

```bash
pamenv push <slug> -e local
```

### slug 规则

- **全局唯一**（仅对未软删项目）：表上为「未删除行」唯一索引，软删后可复用同名 slug。
- 若 slug 已存在且是你的项目：提示已存在，请直接 `push`。
- 若被他人占用：换 slug 再 `init`。

### 典型流程

```text
login → init（建项目 + 可选空 env）→ 编辑 .env.* → push → 之后 pull / push 往返
```

---

## `pamenv fork`

Fork 可读项目（自己的或公开的）为私有副本，**敏感变量值会清空**，结构与非敏感值会复制。

```bash
pamenv fork <slug|id>
pamenv fork <slug|id> --slug my-app-fork --name "My App (fork)"
pamenv fork <slug|id> -y   # 默认 {slug}-fork / {name} (fork)，跳过确认
```

成功后提示用 `pamenv push <new-slug> -e <env>` 填入密钥。

---

## Pull / Push 同步

`pull` 会尽量保留本地注释；语义内容不同时交互选择覆盖/取消。  
`push` 用 `~/.pam/sync` 基线做三方比较（可发现 Web 端修改）：仅远端变更会提示先 pull；双方都改则冲突交互。

若 `-e` 指定的环境不存在，会先收集 URL 并走完本地校验/确认，**全部通过后再创建环境并写入变量**（不会先建空环境）。`-y` 时若能解析到默认 URL 则延后创建，否则报错。

`pamenv remove <slug> -e <env>` 删除远端环境（仅 owner），默认两次确认；`-y` 跳过确认。成功后清除对应 `~/.pam/sync` 基线，不删除本地 `.env.*` 文件。

**Flags：** `-f` 只跳过冲突覆盖确认；`-y` 跳过普通确认（无基线、最终 push、新 key 敏感标记、创建缺失环境、remove 确认）。两者互不隐含。  
**Diff：** 默认全部打码为 `*****`；`--show-values` 仅明文显示非敏感（含名称启发式，如 `*_SECRET` / `*_TOKEN`）。

敏感标记：`# pam:sensitive`（可紧挨变量上方，中间可夹注释）。变量上方注释与行尾注释会随文件保留。

```bash
# DB password
# pam:sensitive
API_TOKEN=xxxx # production only
NORMAL=1
```

---

## 本地状态与权限

本地状态：`~/.pam/config.json`（登录，`0600`）+ `~/.pam/sync/<projectId>/<env>.json`（同步基线，`0600`）。  
`pull` / `push` 写出的 `.env.<env>` 同样按 `0600` 落盘（POSIX；Windows 权限模型有限）。  
`pamenv logout` 会先请求服务端吊销当前 Token，再清除本地 token，并删除整个 `~/.pam/sync`。  
CLI Token 默认 **30d**（`PAM_CLI_TOKEN_EXPIRES_IN` 可改，如 `21d`），带 `jti` 登记，可服务端吊销；旧版无 `jti` 的 Token 将失效，需重新 `login`。

导出解密与 `push` 仅项目 **owner** 可用。
