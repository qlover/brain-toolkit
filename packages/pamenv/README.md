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
| `pamenv projects` | 列出你可访问的项目 |
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
| `--local` | 登录和同步状态只保存在当前目录的 `.pam/`，与全局登录隔离；请把 `.pam/` 加入 `.gitignore` |

`--url` 与 `--domain` 不能同时使用。

```bash
pamenv --domain pam.localhost:3400 login
pamenv --local --domain pam.localhost:3400 login
pamenv --local projects
```

## 环境与本地文件

- `-e <env>` 指定环境；`-e local` 对应 `.env.local`，`-e staging` 对应 `.env.staging`。
- 不传 `-e` 时使用项目的第一个环境（`remove` 必须传 `-e`）。
- `--file <path>` 改用其它文件，相对当前目录（或 `-o` 指定的目录），也可以写绝对路径。

```bash
pamenv pull <slug> -e local --file .env   # 写入 .env 而不是 .env.local
pamenv push <slug> -e local --file .env   # 从 .env 读取并推到 local
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

把环境变量注入子进程后运行命令。变量只存在于 pamenv 和子进程的内存中，不写文件，也不会打印变量值。

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

如果环境在网页端被设为「受保护」，只有项目 admin / owner 可以 `run`。

## `pamenv render`

把非敏感环境变量按指定格式输出，默认输出到 stdout，需要导出权限（项目 admin / owner）。敏感变量会被省略，并在 stderr 提示被省略的键名。

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
```

- `pull` 需要导出权限（项目 admin / owner）；敏感变量只写 `# pam:sensitive` 和键名，值留空。日常开发推荐用 `pamenv run`。
- `push` 时，已在 PAM 上标记为敏感的键如果本地值为空，表示「保留 PAM 上的值」；填了新值则表示轮换。推送成功后，本地文件里的敏感值会被清空。
- 以上次 pull/push 的同步基线逐个键合并：只有一边改过的键自动采用那一边，两边都改了同一个键才算冲突。
- `pull` 冲突时默认用远端值，`push` 冲突时默认用本地值；会列出冲突键并让你确认（可选另一边或取消），之后提示你手动编辑本地文件再 `push`。
- `pull` 会保留本地还没推送的修改并提示；`push` 会把远端单独改过的键合并进本地文件，不会覆盖掉。
- 从没在此处 pull/push 过（没有基线）时，所有不同的键都按冲突处理。
- `pull` 会尽量保留本地文件里的注释。如果只有远端改过、本地没改，`push` 会提示先 `pull`。
- 差异预览默认把所有值显示为 `*****`；`--show-values` 只显示非敏感变量的明文（名称像 `*_SECRET`、`*_TOKEN` 的也按敏感处理）。
- `-e` 指定的环境不存在时，`push` 会先询问环境 URL，确认无误后再一并创建环境并写入变量。

### `-y` 与 `-f`

| 参数 | 作用 |
| --- | --- |
| `-y` | 跳过普通确认：首次推送、最终推送、新变量的敏感标记、创建缺失环境、`remove` 确认 |
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

敏感变量的值在 PAM 中加密保存，只有 `run` 会在服务端解密并注入子进程，CLI 不会打印。网页、`render`、`pull` 和 `fork` 都拿不到明文，owner 也一样。明文唯一可能出现的地方，是被运行的程序自己打印出来。

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

## 登录有效期

- CLI 登录默认 **30 天**有效，过期后重新 `pamenv login`。
- `pamenv logout` 会让当前凭证在服务端立即失效，并清除本地的登录和同步记录。

## 项目权限

权限由项目上的团队角色决定，团队在 PAM 网页端管理。

| 角色 | run | push | pull / render（不含敏感值） | remove 环境 |
| --- | --- | --- | --- | --- |
| owner / admin | ✓ | ✓ | ✓ | ✓ |
| member | ✓（受保护环境除外） | ✓ | — | — |

- 每次 `run`、`pull`、`render` 读取变量都会记录访问日志（谁、哪个环境、多少个键，不记录值），admin / owner 可在网页端环境页查看。
- 成员被移出团队后，CLI 凭证立即无法再读取该项目的变量。

项目转让和删除只能由项目拥有者在网页端「General」中操作，CLI 不提供这两个命令。
