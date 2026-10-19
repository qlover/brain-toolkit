# pamenv-cli

`pamenv` 用来使用和管理 PAM 上的多环境变量：

- 日常开发用 `pamenv run` 把变量直接注入命令进程，本地不留明文文件。
- 需要文件时用 `pamenv render` 输出 dotenv / JSON / YAML / TOML，或用 `pull` / `push` 与 `.env.<环境名>` 双向同步。
- **敏感变量的值只会通过 `run` 注入进程**，网页、`render`、`pull` 都不会给出明文（见下文「标记敏感变量」）。
- `init` 从当前目录创建项目。

## 安装

```bash
npm install -g pamenv-cli
# 或临时使用
npx pamenv --help
```

## 快速开始

```bash
pamenv login                      # 浏览器授权登录
cd your-project
pamenv init                       # 交互创建项目（按当前目录给默认值）
pamenv push <slug> -e local       # 上传 .env.local
pamenv run <slug> -e local -- pnpm dev   # 注入变量并启动，不写文件
pamenv pull <slug> -e staging     # 拉取到 .env.staging（需导出权限）
```

## 命令一览

| 命令 | 说明 |
| --- | --- |
| `pamenv login` | 打开浏览器完成授权登录 |
| `pamenv logout` | 退出登录，并使当前 CLI 凭证失效 |
| `pamenv projects` | 列出项目（核心字段：slug / name / 身份 / envs / id） |
| `pamenv init` | 交互创建项目 |
| `pamenv fork <slug\|id>` | 把可读项目 fork 为自己的私有项目 |
| `pamenv run <slug\|id> -- <命令>` | 把环境变量注入子进程并运行命令，不写文件 |
| `pamenv render <slug\|id>` | 按 dotenv / json / yaml / toml 输出环境变量 |
| `pamenv pull <slug\|id>` | 把远端环境变量写入本地文件 |
| `pamenv push <slug\|id>` | 把本地文件的变量推送到远端 |
| `pamenv remove <slug\|id> -e <env>` | 删除远端环境 |
| `pamenv config set\|list` | 查看或修改 CLI 配置 |

`<slug|id>` 可以是项目 slug，也可以是项目 id。

### 全局参数

| 参数 | 说明 |
| --- | --- |
| `--url <url>` | 指定 PAM 地址，如 `https://pam.example.com` |
| `--domain <host>` | 同 `--url`，可只写主机名；`localhost` 与内网地址默认 `http`，其余 `https` |
| `--local` | 强制使用当前目录 `.pam/`；只要存在 `.pam/`，不写也会自动隔离（不读 `~/.pam`） |
| `-g, --global` | 强制使用 `~/.pam`（即使 cwd 已有 `.pam/`） |

`--url` 与 `--domain` 不能同时使用；`--local` 与 `--global` 也不能同时使用。请把 `.pam/` 加入 `.gitignore`。

```bash
pamenv --domain pam.localhost:3400 login
pamenv --local --domain pam.localhost:3400 login   # 首次写入 cwd/.pam
pamenv projects                                   # 有 .pam/ 时只用本地身份（未登录会失败，不会偷用全局）
pamenv -g projects                                # 明确要用全局登录时
```

## `pamenv projects`

列出当前身份可见的项目。与 Web 首页共用 `GET /api/pam/search`；**CLI 只输出一行核心字段**（slug / name / 身份 / envs / id），不展示 Web 卡片上的描述、分类、时间戳等。

身份列：`owner` · `admin` · `member` · `member, writable` · `readonly`。

```bash
pamenv projects
pamenv projects fe
pamenv projects --visibility private
pamenv projects --category frontend --sort updated_at --order desc
pamenv projects --mine
pamenv projects --writable
pamenv projects --page 2
pamenv projects fe --writable --page 1 --page-size 20
```

| 参数 | 线上对应 | 说明 |
| --- | --- | --- |
| `[keyword]` | `keyword` | 可选搜索关键词（slug / 名称；compact 视图不搜描述等卡片字段） |
| `--category <name>` | `filters.category` | 按分类过滤（与 Web 一致） |
| `--visibility <public\|private>` | `filters.visibility` | 可见性；省略时为「全部可见范围」（公开 + 自己的 / 团队的） |
| `--sort <created_at\|updated_at>` | `sort` | 排序字段（服务端仍会先按 `is_public` 再按此字段） |
| `--order <asc\|desc>` | `sort` | 排序方向，默认 `desc` |
| `--page <n>` | `page` | 页码，从 1 开始，默认 `1`；要看更多请翻页 |
| `--page-size <n>` | `pageSize` | 每页条数，**默认 `10`（与 Web 一致）**，最大 `100` |
| `--mine` | `filters.mine` | **服务端**过滤：仅严格项目 owner（`owner_id = me`） |
| `--writable` | `filters.writable` | **服务端**过滤：owner 或活跃团队成员（可编辑）；可与 `--mine` 同时用（取交集） |
| （固定） | `view=compact` | CLI 默认精简字段（id/slug/name/envs/…）；Web 卡片用 `full`（默认） |

另可叠加全局参数：`--url` / `--domain` / `--local` / `-g`。

- `--mine` / `--writable` 在数据库分页前过滤，分页总数正确，不是拉回后再滤。
- 分页严格按 `--page` / `--page-size`（与 Web 行为一致）。

## 测试

```bash
# 默认：单元 + mock 契约集成（不需要 PAM 账号）
pnpm --filter pamenv-cli test

# 可选：对接真实 PAM（专用项目 + token，切勿提交密钥）
# Windows PowerShell: $env:PAMENV_LIVE=1; $env:PAMENV_BASE_URL=...; ...
PAMENV_LIVE=1 \
PAMENV_BASE_URL=https://pam.example.com \
PAMENV_OWNER_TOKEN=... \
PAMENV_MEMBER_TOKEN=... \
PAMENV_PROJECT_SLUG=ci-pamenv-harness \
PAMENV_ENV_NAME=dev \
PAMENV_PROTECTED_ENV_NAME=secret \
pnpm --filter pamenv-cli test:live
```

契约测试（约 78）用内存 mock PAM 覆盖：身份/精确 slug/`-o`、pull（403/401/明文泄漏/多环境/`--file`）、绑定与 `--force` TTY、run（403/protected/404 回退/slug mismatch/keepEnv/预警）、push/pull 三方同步与冲突、render（yaml/toml/`--only`）、remove（清 snapshot）、过宽文件权限等。

## 安全模型

- **身份隔离**：cwd 存在 `.pam/` 时只用本地凭证，绝不回退到 `~/.pam`；缺 token 立即失败。`-g` 才强制全局。
- **精确项目**：`pull` / `push` / `run` / `render` / `remove` / `fork` 只接受**精确** slug 或 uuid（不会 `pam` 误匹配 `pamenv-…`）。
- **权限 fail-closed**：以服务端返回的 `permissions[]` 为准；缺权限或 401/403 时零落盘、零注入。CLI 预检不能替代服务端鉴权。
- **pull ≠ run**：`pull` / `render` 需要 `pam_environments_export`（admin+），敏感值为 placeholder；`run` 需要 `pam_environments_inject`（member+），明文只进子进程。
- **protected 环境**：`is_protected=true` 时，resolve 和变量写入都要求 export 档权限——成员既不能 `run`，也不能 `push` 或在网页上改这个环境的变量。
- **落盘**：目标文件若对 group/other 可读则拒绝覆盖；写入为 atomic + `0600`。Windows 上会授予当前用户并去掉 Everyone / Users（best-effort）。`--force` 换绑需交互确认（非 TTY 拒绝）。

## 环境与本地文件

- `-e <env>` 指定环境；`-e local` 对应 `.env.local`，`-e staging` 对应 `.env.staging`。
- 不传 `-e` 时使用项目的第一个环境（`remove` 必须传 `-e`）。
- `--file <path>` 改用其它文件，相对当前目录（或 `-o` 指定的目录），也可以写绝对路径。
- **同目录多项目**：默认文件名只含环境名。若已 `pull fe-base -e dev`（占用 `.env.dev`），再 `pull pam -e dev` 会被拒绝；请用 `--file .env.pam.dev`、换目录，或在终端用 `--force` 并确认后覆盖绑定。

```bash
pamenv pull <slug> -e local --file .env   # 写入 .env 而不是 .env.local
pamenv push <slug> -e local --file .env   # 从 .env 读取并推到 local
pamenv pull pam -e dev --file .env.pam.dev
```

## `pamenv init`

登录后在项目目录执行，类似 `npm init`：先扫描当前目录给出默认值，你确认后才创建。

```bash
pamenv init
pamenv init -o ./packages/app     # 指定工作目录
```

### 默认值来源

| 字段 | 默认值 | 没有时 |
| --- | --- | --- |
| **name** | `package.json` 的 `name`，否则 git `origin` 仓库名 | 手动填写 |
| **slug** | 由确认后的 name 转换（小写，`@scope/foo` → `scope-foo`） | 手动填写 |
| **description** | `package.json` 的 `description` | 可留空 |
| **category** | — | 选择「后端」或「前端」（默认后端） |
| **repository url** | git `origin`（尽量转为 https） | 可留空 |
| **environments** | 见下方 | 可能不创建环境 |

### 环境识别

1. 扫描当前目录下的 `.env`、`.env.local`、`.env.<xxx>`（不递归）。
2. `.env` 与 `.env.local` 合并为环境 **`local`**；`.env.xxx` 对应环境 **`xxx`**。
3. 有 env 文件时，多选要创建的环境，并逐个确认环境名和环境 URL。URL 默认取 `package.json` 的 `homepage`，没有则需要手填，必须是合法的 http/https 地址。
4. 没有 env 文件时不创建环境。
5. `init` 只创建项目和空环境，**不会上传变量**。创建后执行：

```bash
pamenv push <slug> -e local
```

### slug 规则

- slug 在所有未删除项目中唯一；项目删除后 slug 可以被再次使用。
- slug 已存在且是你的项目：CLI 会提示直接 `push`。
- slug 被他人占用：换一个 slug 重新 `init`。

## `pamenv fork`

把你可读的项目（自己的或公开的）复制为私有项目。结构和非敏感值会复制，**敏感变量的值会被清空**。

```bash
pamenv fork <slug|id>
pamenv fork <slug|id> --slug my-app-fork --name "My App (fork)"
pamenv fork <slug|id> -y          # 使用默认 slug / name 并跳过确认
```

fork 后用 `pamenv push <new-slug> -e <env>` 填入密钥。

## `pamenv run`

把环境变量注入子进程后运行命令。变量只存在于 pamenv 和子进程的内存中，不写文件，CLI 也不会打印变量值。

**明文边界：** 敏感值在子进程的环境里是真实明文。CLI 保证不落盘、不打印；拦不住的是——被启动的程序自己 `console.log` / 写日志、同机其它进程读该进程环境、以及调试器附加。请勿在应用里打印密钥；生产注入面尽量用 `--only` 收窄。

```bash
pamenv run <slug|id> -e local -- pnpm dev
pamenv run <slug|id> -e local --only DATABASE_URL,API_KEY -- node server.js
pamenv run <slug|id> -e local --keep-env PORT -- pnpm dev
```

| 参数 | 说明 |
| --- | --- |
| `-e, --env <name>` | 环境名，默认第一个 |
| `--only <keys>` | 只注入这些键，逗号分隔 |
| `--keep-env <keys>` | 这些键如果当前 shell 已有值，就保留 shell 的值 |
| `--no-warn` | 关闭启动前的检查提示 |

- `--` 之后的内容原样交给子进程，包括子命令自己的参数。
- 同名变量以 PAM 为准（`--keep-env` 例外）。
- `Ctrl+C` 等信号会转发给子进程，pamenv 的退出码与子进程一致。
- 可以写进 `package.json`，团队成员不需要 `.env` 文件：

```json
{
  "scripts": {
    "dev": "pamenv run my-app -e local -- next dev"
  }
}
```

启动前会检查以下情况并在 stderr 提示（不阻止运行）：

| 检查 | 原因 |
| --- | --- |
| 当前目录的 `.env*` 文件里有同名键 | 若项目用 dotenv 加载且开启 `override`，文件里的值会覆盖注入值 |
| 敏感变量以 `NEXT_PUBLIC_` / `VITE_` 开头 | 会在构建时写进前端代码包 |
| `turbo.json` 是严格环境变量模式，且变量未声明 | Turbo 会过滤未声明的变量 |

如果环境在网页端被设为「受保护」，只有项目 admin / owner 可以 `run` 或修改它的变量（含 `push`）。

## `pamenv render`

把环境变量按指定格式输出，默认输出到 stdout，需要导出权限（项目 admin / owner）。敏感变量的值输出为本环境的占位符（`__PAM_SENSITIVE_…__`），并在 stderr 提示这些键名；真实值只能通过 `pamenv run` 注入进程。

```bash
pamenv render <slug|id> -e dev                              # dotenv 到 stdout
pamenv render <slug|id> -e dev --format json
pamenv render <slug|id> -e dev --format toml --out config.toml
pamenv render <slug|id> -e dev --out .env.local --only API_URL,API_KEY
```

| 参数 | 说明 |
| --- | --- |
| `--format <format>` | `dotenv`（默认，保留注释）、`json`、`yaml`、`toml`；后三种为平铺键值，值统一用双引号转义 |
| `--out <file>` | 写入文件（权限 0600）；省略或 `-` 时输出到 stdout |
| `--only <keys>` | 只输出这些键 |

## `pamenv pull` / `pamenv push`

```bash
pamenv pull <slug|id> -e staging
pamenv pull <slug|id> -e staging -f            # 冲突键不询问，直接用远端值
pamenv push <slug|id> -e staging
pamenv push <slug|id> -e staging -y            # 跳过普通确认
pamenv push <slug|id> -e staging -f            # 冲突键不询问，直接用本地值
pamenv push <slug|id> -e staging --show-values # 预览时显示非敏感变量的值
pamenv push <slug|id> -e staging JWT_SECRET=new…   # 行内覆盖（叠在本地文件上）
pamenv push <slug|id> -e staging --unset OLD_KEY   # 删除指定键（成功后同步删本地行）
```

- `pull` 需要导出权限（项目 admin / owner）。**已标记敏感**的变量写 `# pam:sensitive` 和本环境占位符 `__PAM_SENSITIVE_…__`（每个环境不同）；本地残留的敏感明文会被盖掉。未标记的变量（即使键名像 `DATABASE_URL`）仍按普通值写出。若服务端未提供占位符，敏感键写成空值并保留键名（空值 push 表示 keep）。日常开发推荐用 `pamenv run`。
- **文件 push = 完整期望状态**：文件里少一个键表示远端要删除该键；不要依赖 push 自动补回敏感键。
- `push` 时，已敏感的键本地值如果是本环境占位符（或为空），表示「保留 PAM 上的值」；填了新值则表示轮换。新键未标敏感时会交互勾选（键名像密钥的会预勾提示）；`-y` 跳过勾选，只提示疑似密钥。可用 `# pam:sensitive` 把已有普通键升级为敏感，不能从敏感改回普通。确认推送成功之前，不会把远端值写进本地文件。推送成功后，本地文件里的敏感值会换回占位符（无占位符时清成空）。
- 行内 `KEY=value` 叠在本地文件上再全量推送；`--unset <keys>` 从最终集合中删键（可与行内覆盖同用：先覆盖再 unset）。
- 不属于本环境的占位符（比如从别的环境的文件复制过来）会被拒绝，避免把占位符当成密钥保存。

| 本地最终值 | 已敏感键 | 普通键 |
| --- | --- | --- |
| 本环境占位符 | keep | （一般不应出现） |
| 空字符串 | keep | 键保留，值清空 |
| 新明文 | 轮换 | 更新 |
| 行不存在 / `--unset` | 删除 | 删除 |

- 以上次 pull/push 的同步基线逐个键合并：只有一边改过的键自动采用那一边，两边都改了同一个键才算冲突。
- `pull` 冲突时默认用远端值，`push` 冲突时默认用本地值；会列出冲突键并让你确认（可选另一边或取消），之后提示你手动编辑本地文件再 `push`。
- `pull` 会保留普通键还没推送的修改并提示；已敏感键一律换回占位符。`push` 在推送成功后才把远端单独改过的键合并进本地文件，不会覆盖掉你的其它修改。
- **没有基线**（此处从未 pull/push）时：只出现在一边的键会保留；两边同键但值不同才算冲突。因此首次 `push` 不会默默删掉远端独有键（要用 `--unset` 或先同步再删行）；首次 `pull` 也不会默默丢掉本地独有键。
- 有基线后，文件缺键 / `--unset` 才表示删除（完整期望状态）。
- `pull` 会尽量保留本地文件里的注释。如果只有远端改过、本地没改，`push` 会提示先 `pull`。
- 差异预览默认把所有值显示为 `*****`；`--show-values` 只显示非敏感变量的明文。键名像 `SECRET`、`TOKEN`、`PASSWORD`、`ACCESS_KEY`、`APIKEY`、`JWT`、`SESSION`、`COOKIE`、`DATABASE_URL` 的仍遮盖。
- `-e` 指定的环境不存在时，`push` 会先询问环境 URL，确认无误后再一并创建环境并写入变量。

### `-y` 与 `-f`

| 参数 | 作用 |
| --- | --- |
| `-y` | 跳过普通确认：无基线提示、最终推送、创建缺失环境、敏感勾选、`remove` 确认。对疑似密钥的新键只会提示，不会自动标敏感。若变更很大且会删远端键，仍会再问一次 |
| `-f` | 只跳过冲突确认，按默认一边处理（pull 用远端，push 用本地） |

两者互不包含，需要都跳过时一起传。

### 标记敏感变量

在变量上方写 `# pam:sensitive`（中间可以隔着其它注释）。变量上方的注释和行尾注释都会保留。

```bash
# DB password
# pam:sensitive
API_TOKEN=xxxx # production only
NORMAL=1
```

敏感变量的值在 PAM 中加密保存，只有 `run` 会在服务端解密并注入子进程，CLI 不会打印。网页、`render`、`pull` 和 `fork` 都拿不到明文，owner 也一样。明文只存在于子进程环境；若程序自行打印、写日志或被同机读环境，不在 CLI 防护范围内。

## `pamenv remove`

删除远端环境，需要项目 **admin**（包括项目拥有者）权限，默认会确认两次。本地 `.env.*` 文件不会被删除。

```bash
pamenv remove <slug|id> -e local
pamenv remove <slug|id> -e local -y
```

## 配置与语言

```bash
pamenv config set domain pam.example.com   # 保存默认 PAM 地址
pamenv config set locale zh                 # 固定界面语言（en | zh）
pamenv config list
pamenv locales pull                         # 刷新服务端错误提示文案
```

| key | 说明 |
| --- | --- |
| `domain` / `url` | 默认 PAM 地址，之后无需每次传 `--domain` |
| `locale` | `en` 或 `zh`；设置后浏览器登录不会再改变 CLI 语言 |

未设置 `locale` 时，CLI 会跟随浏览器登录页的语言。

接口出错时，CLI 会显示可读的错误说明，并附带错误码（如 `api:not_authorized`）和 `requestId`，反馈问题时请一并提供。

## 登录与本地凭证

- CLI 登录默认 **30 天**有效，过期后重新 `pamenv login`。
- `pamenv logout` 会让当前凭证在服务端立即失效，并清除本地的登录和同步记录。
- `config.json`（0600）只存 baseUrl / locale / email 等非密钥字段；Bearer token 写入 OS 绑定保险库：Windows 为 DPAPI 加密的 `credentials.enc`，macOS 为登录钥匙串，其它平台为同目录下 0600 私有文件。旧版写在 config.json 里的 token 会在下次读取时自动迁出。

## 项目权限

权限由项目上的团队角色决定，团队在 PAM 网页端管理。

| 角色 | run | push | pull / render（不含敏感值） | remove 环境 |
| --- | --- | --- | --- | --- |
| owner / admin | ✓ | ✓ | ✓ | ✓ |
| member | ✓（受保护环境除外） | ✓（受保护环境除外） | — | — |

- 每次 `run`、`pull`、`render` 读取变量都会记录访问日志（谁、哪个环境、多少个键，不记录值），admin / owner 可在网页端环境页查看。
- 成员被移出团队后，CLI 凭证立即无法再读取该项目的变量。

项目转让和删除只能由项目拥有者在网页端「General」中操作，CLI 不提供这两个命令。
