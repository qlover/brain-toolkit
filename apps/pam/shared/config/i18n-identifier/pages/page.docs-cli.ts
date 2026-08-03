/**
 * @description CLI docs page title
 * @localZh pamenv CLI 使用指南
 * @localEn pamenv CLI Guide
 */
export const PAGE_DOCS_CLI_TITLE = 'page_docs_cli:title';

/**
 * @description CLI docs meta description
 * @localZh 用 pamenv 在本地拉取与回写 PAM 多环境变量
 * @localEn Pull and push PAM multi-environment variables with pamenv
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
 * @localZh pamenv, CLI, dotenv, pull, push, 环境变量
 * @localEn pamenv, CLI, dotenv, pull, push, environment variables
 */
export const PAGE_DOCS_CLI_KEYWORDS = 'page_docs_cli:keywords';

/**
 * @description Page intro
 * @localZh pamenv 把 PAM 项目里的环境变量同步到当前目录的 `.env.<环境名>`，本地改完后再 push 回去。适合本地开发与 CI 之外的手工同步。
 * @localEn pamenv syncs PAM project environments into `.env.<environment>` in your working directory, then pushes local edits back. It is meant for local development and manual sync outside CI.
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
 * @localZh 本地文件名为 `.env.<环境名>`。未传 `-e` 时使用环境列表中的第一个环境。
 * @localEn Local files are named `.env.<environment>`. Without `-e`, the first environment in the list is used.
 */
export const PAGE_DOCS_CLI_COMMANDS_BODY = 'page_docs_cli:commands__body';

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
 * @localZh 导出解密仅项目 owner 可用。本地 `~/.pam/config.json`、`~/.pam/sync/...` 与写出的 `.env.<env>` 在 POSIX 上按 0600 落盘。旧版无 `jti` 的 Token 会失效，需重新 `pamenv login`。
 * @localEn Decrypted export is owner-only. Local `~/.pam/config.json`, `~/.pam/sync/...`, and written `.env.<env>` files use mode 0600 on POSIX. Legacy tokens without `jti` are rejected; run `pamenv login` again.
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
