/**
 * @description CLI docs page title
 * @localZh pamenv CLI 使用指南
 * @localEn pamenv CLI Guide
 */
export const PAGE_DOCS_CLI_TITLE = 'page_docs_cli:title';

/**
 * @description CLI docs meta description
 * @localZh 用 pamenv 初始化项目并在本地拉取与回写 PAM 多环境变量
 * @localEn Initialize projects and pull/push PAM multi-environment variables with pamenv
 */
export const PAGE_DOCS_CLI_DESCRIPTION = 'page_docs_cli:description';

/**
 * @description CLI docs content label
 * @localZh CLI 文档
 * @localEn CLI docs
 */
export const PAGE_DOCS_CLI_CONTENT = 'page_docs_cli:content';

/**
 * @description CLI docs keywords
 * @localZh pamenv, CLI, dotenv, init, pull, push, 环境变量
 * @localEn pamenv, CLI, dotenv, init, pull, push, environment variables
 */
export const PAGE_DOCS_CLI_KEYWORDS = 'page_docs_cli:keywords';

/**
 * @description Page intro
 * @localZh pamenv 可从当前目录交互式创建 PAM 项目（init），并把环境变量同步到 `.env.<环境名>`，本地改完后再 push 回去。适合本地开发与手工同步。
 * @localEn pamenv can interactively create a PAM project from your working directory (init), sync environments into `.env.<environment>`, then push local edits back. It is meant for local development and manual sync.
 */
export const PAGE_DOCS_CLI_INTRO = 'page_docs_cli:intro';

/**
 * @description Install section title
 * @localZh 安装
 * @localEn Install
 */
export const PAGE_DOCS_CLI_SECTION_INSTALL = 'page_docs_cli:section__install';

/**
 * @description Install body
 * @localZh 需要 Node.js ≥ 20.19。发布后可全局安装，或在本仓库用 pnpm 调用。
 * @localEn Requires Node.js ≥ 20.19. Install globally after publish, or run via pnpm in this monorepo.
 */
export const PAGE_DOCS_CLI_INSTALL_BODY = 'page_docs_cli:install__body';

/**
 * @description Login section title
 * @localZh 登录
 * @localEn Login
 */
export const PAGE_DOCS_CLI_SECTION_LOGIN = 'page_docs_cli:section__login';

/**
 * @description Login body
 * @localZh 默认走浏览器设备授权：CLI 打印验证码与链接，浏览器登录并批准后，Token 写入 `~/.pam/config.json`（POSIX 下文件权限 0600）。Token 默认有效期 30 天（服务端 `PAM_CLI_TOKEN_EXPIRES_IN`，如 `21d`），带 `jti` 可吊销；`pamenv logout` 会先吊销服务端 Token，再清理本地登录态与同步基线。
 * @localEn Browser device authorization is the default: the CLI prints a user code and URL; after you approve in the browser, the token is stored in `~/.pam/config.json` (mode 0600 on POSIX). Tokens last 30 days by default (`PAM_CLI_TOKEN_EXPIRES_IN`, e.g. `21d`) and are revocable via `jti`. `pamenv logout` revokes the server token, then clears local auth and sync baselines.
 */
export const PAGE_DOCS_CLI_LOGIN_BODY = 'page_docs_cli:login__body';

/**
 * @description Commands section title
 * @localZh 常用命令
 * @localEn Commands
 */
export const PAGE_DOCS_CLI_SECTION_COMMANDS = 'page_docs_cli:section__commands';

/**
 * @description Commands body
 * @localZh 本地文件名为 `.env.<环境名>`（如环境 local 对应 `.env.local`）。未传 `-e` 时使用环境列表中的第一个环境。新建项目请用 `pamenv init`。
 * @localEn Local files are named `.env.<environment>` (e.g. env `local` → `.env.local`). Without `-e`, the first environment in the list is used. Use `pamenv init` to create a new project.
 */
export const PAGE_DOCS_CLI_COMMANDS_BODY = 'page_docs_cli:commands__body';

/**
 * @description Init section title
 * @localZh Init 创建项目
 * @localEn Init (create project)
 */
export const PAGE_DOCS_CLI_SECTION_INIT = 'page_docs_cli:section__init';

/**
 * @description Init body
 * @localZh 登录后在项目目录运行 `pamenv init`（可用 `-o` 指定目录）。CLI 扫描 package.json（name / description / homepage）与 git origin；无 package 时用仓库名作为默认 project name。你先确认 name，再确认由 name 转换的 slug（转不出则无默认）。有 `.env` / `.env.local` / `.env.xxx` 时多选环境并确认 env name 与 url（url 默认优先 homepage）；`.env` 与 `.env.local` 合并为 local。无 env 文件时不创建环境。init 只创建空环境，变量请随后 `pamenv push <slug> -e <env>`。slug 在未删除项目间全局唯一；软删后可复用。已存在且属于你则提示改用 push。
 * @localEn After login, run `pamenv init` in the project directory (`-o` sets the cwd). The CLI scans package.json (name / description / homepage) and git origin; without a package it uses the repo name as the default project name. You confirm name first, then the slug derived from that name (no default if conversion is empty). When `.env` / `.env.local` / `.env.xxx` exist, multi-select environments and confirm each env name and url (url defaults to homepage when valid); `.env` and `.env.local` merge into `local`. With no env files, no environments are created. init creates empty envs only — upload with `pamenv push <slug> -e <env>`. Slugs are globally unique among non-deleted projects and reusable after soft-delete. If the slug already exists and you own it, use push instead.
 */
export const PAGE_DOCS_CLI_INIT_BODY = 'page_docs_cli:init__body';

/**
 * @description Fork section title
 * @localZh Fork 项目
 * @localEn Fork project
 */
export const PAGE_DOCS_CLI_SECTION_FORK = 'page_docs_cli:section__fork';

/**
 * @description Fork body
 * @localZh `pamenv fork <slug|id>` 将可读项目（自己的或公开的）复制为私有项目。敏感变量值会被清空，环境结构与非敏感值会保留。可交互确认 slug/name，或用 `--slug` / `--name` / `-y`。成功后用 `pamenv push <新slug> -e <env>` 填入密钥。
 * @localEn `pamenv fork <slug|id>` copies a readable project (yours or public) into a private project. Sensitive values are cleared; env structure and non-sensitive values are kept. Confirm slug/name interactively, or pass `--slug` / `--name` / `-y`. Then fill secrets with `pamenv push <new-slug> -e <env>`.
 */
export const PAGE_DOCS_CLI_FORK_BODY = 'page_docs_cli:fork__body';

/**
 * @description Sync section title
 * @localZh Pull / Push 同步
 * @localEn Pull / Push sync
 */
export const PAGE_DOCS_CLI_SECTION_SYNC = 'page_docs_cli:section__sync';

/**
 * @description Sync body
 * @localZh `pull` 以远端为准写入本地，并尽量保留本地注释；语义冲突时可选择覆盖或中止。`push` 用 `~/.pam/sync` 基线做三方比较：仅远端变更时提示先 pull；双方都改则冲突交互。`-f` 只跳过冲突覆盖确认；`-y` 跳过普通确认（无基线、最终 push、新 key 敏感标记等），二者互不隐含。Diff 默认将值打码为 `*****`；`--show-values` 仅明文显示非敏感值。
 * @localEn `pull` writes remote values into the local file and preserves local comments when possible; on semantic conflicts you can overwrite or abort. `push` uses `~/.pam/sync` baselines for a three-way compare: remote-only changes ask you to pull first; both sides changed triggers a conflict prompt. `-f` only skips conflict overwrite confirms; `-y` skips ordinary confirms (missing baseline, final push, new-key sensitivity), and neither implies the other. Diff review masks values as `*****` by default; `--show-values` shows non-sensitive plaintext only.
 */
export const PAGE_DOCS_CLI_SYNC_BODY = 'page_docs_cli:sync__body';

/**
 * @description Sensitive section title
 * @localZh 敏感变量
 * @localEn Sensitive variables
 */
export const PAGE_DOCS_CLI_SECTION_SENSITIVE =
  'page_docs_cli:section__sensitive';

/**
 * @description Sensitive body
 * @localZh 在变量上方使用 `# pam:sensitive` 标记（可紧挨变量，中间可夹注释）。行尾注释与上方注释会随文件保留。
 * @localEn Mark sensitive keys with `# pam:sensitive` above the variable (adjacent is fine; comments may sit in between). Header and inline comments are preserved with the file.
 */
export const PAGE_DOCS_CLI_SENSITIVE_BODY = 'page_docs_cli:sensitive__body';

/**
 * @description Notes section title
 * @localZh 权限与注意
 * @localEn Permissions and notes
 */
export const PAGE_DOCS_CLI_SECTION_NOTES = 'page_docs_cli:section__notes';

/**
 * @description Notes body
 * @localZh 导出解密与 push 仅项目 owner 可用。本地 `~/.pam/config.json`、`~/.pam/sync/...` 与写出的 `.env.<env>` 在 POSIX 上按 0600 落盘。改 CLI 源码后需先 build 再执行。旧版无 `jti` 的 Token 会失效，需重新 `pamenv login`。
 * @localEn Decrypted export and push are owner-only. Local `~/.pam/config.json`, `~/.pam/sync/...`, and written `.env.<env>` files use mode 0600 on POSIX. Rebuild the CLI after source changes before running. Legacy tokens without `jti` are rejected; run `pamenv login` again.
 */
export const PAGE_DOCS_CLI_NOTES_BODY = 'page_docs_cli:notes__body';

/**
 * @description Link to OAuth docs
 * @localZh OAuth 集成文档
 * @localEn OAuth integration guide
 */
export const PAGE_DOCS_CLI_LINK_OAUTH = 'page_docs_cli:link__oauth';

/**
 * @description Link to API reference
 * @localZh API 参考
 * @localEn API reference
 */
export const PAGE_DOCS_CLI_LINK_API = 'page_docs_cli:link__api';
