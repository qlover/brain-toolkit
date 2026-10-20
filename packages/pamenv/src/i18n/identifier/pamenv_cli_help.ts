/**
 * pamenv `--help` copy (commands, arguments, options, section titles).
 */

/**
 * @description PAM 环境变量命令行工具
 * @localZh PAM 环境变量命令行工具
 * @localEn PAM environment variables CLI
 */
export const PAMENV_HELP_PROGRAM = 'pamenv_help:program';

/**
 * @description 显示命令帮助
 * @localZh 显示命令帮助
 * @localEn display help for command
 */
export const PAMENV_HELP_HELP_OPTION = 'pamenv_help:help_option';

/**
 * @description 显示指定命令的帮助
 * @localZh 显示指定命令的帮助
 * @localEn display help for command
 */
export const PAMENV_HELP_HELP_COMMAND = 'pamenv_help:help_command';

/**
 * @description 显示版本号
 * @localZh 显示版本号
 * @localEn output the version number
 */
export const PAMENV_HELP_VERSION_OPTION = 'pamenv_help:version_option';

/**
 * @description 用法:
 * @localZh 用法:
 * @localEn Usage:
 */
export const PAMENV_HELP_TITLE_USAGE = 'pamenv_help:title_usage';

/**
 * @description 参数:
 * @localZh 参数:
 * @localEn Arguments:
 */
export const PAMENV_HELP_TITLE_ARGUMENTS = 'pamenv_help:title_arguments';

/**
 * @description 选项:
 * @localZh 选项:
 * @localEn Options:
 */
export const PAMENV_HELP_TITLE_OPTIONS = 'pamenv_help:title_options';

/**
 * @description 全局选项:
 * @localZh 全局选项:
 * @localEn Global Options:
 */
export const PAMENV_HELP_TITLE_GLOBAL_OPTIONS =
  'pamenv_help:title_global_options';

/**
 * @description 命令:
 * @localZh 命令:
 * @localEn Commands:
 */
export const PAMENV_HELP_TITLE_COMMANDS = 'pamenv_help:title_commands';

/**
 * @description 本次进程使用的 PAM 地址（覆盖配置）
 * @localZh 本次进程使用的 PAM 地址（覆盖配置）
 * @localEn PAM base URL for this process (overrides config)
 */
export const PAMENV_HELP_OPT_URL = 'pamenv_help:opt_url';

/**
 * @description 同 --url，可只写主机（如 pam.localhost:3400）
 * @localZh 同 --url，可只写主机（如 pam.localhost:3400）
 * @localEn Same as --url; bare host allowed (e.g. pam.localhost:3400)
 */
export const PAMENV_HELP_OPT_DOMAIN = 'pamenv_help:opt_domain';

/**
 * @description 强制使用工作目录 ./.pam（通常可省略：存在 .pam/ 时自动隔离，不读 ~/.pam）
 * @localZh 强制使用工作目录 ./.pam（通常可省略：存在 .pam/ 时自动隔离，不读 ~/.pam）
 * @localEn Force cwd ./.pam (usually optional: .pam/ auto-isolates from ~/.pam)
 */
export const PAMENV_HELP_OPT_LOCAL = 'pamenv_help:opt_local';

/**
 * @description 强制使用 ~/.pam（-g；即使当前目录已有 ./.pam）
 * @localZh 强制使用 ~/.pam（-g；即使当前目录已有 ./.pam）
 * @localEn Force ~/.pam (-g; even when ./.pam exists in cwd)
 */
export const PAMENV_HELP_OPT_GLOBAL = 'pamenv_help:opt_global';

/**
 * @description 项目 slug 或项目 id
 * @localZh 项目 slug 或项目 id
 * @localEn Project slug or project id
 */
export const PAMENV_HELP_ARG_PROJECT = 'pamenv_help:arg_project';

/**
 * @description 环境名（默认：第一个）
 * @localZh 环境名（默认：第一个）
 * @localEn Environment name (default: first)
 */
export const PAMENV_HELP_OPT_ENV = 'pamenv_help:opt_env';

/**
 * @description 本地 dotenv 文件（默认 .env.<env>；如 -e local 时用 --file .env）
 * @localZh 本地 dotenv 文件（默认 .env.<env>；如 -e local 时用 --file .env）
 * @localEn Local dotenv file (default: .env.<env>; e.g. --file .env with -e local)
 */
export const PAMENV_HELP_OPT_FILE = 'pamenv_help:opt_file';

/**
 * @description 工作目录（默认：当前目录）
 * @localZh 工作目录（默认：当前目录）
 * @localEn Working directory (default: cwd)
 */
export const PAMENV_HELP_OPT_WORKDIR = 'pamenv_help:opt_workdir';

/**
 * @description 登录并保存 CLI token（默认浏览器登录；--local 写入 cwd/.pam）
 * @localZh 登录并保存 CLI token（默认浏览器登录；--local 写入 cwd/.pam）
 * @localEn Login and store CLI token (browser by default; --local writes cwd/.pam)
 */
export const PAMENV_HELP_LOGIN = 'pamenv_help:login';

/**
 * @description PAM 地址（覆盖配置 / --domain）
 * @localZh PAM 地址（覆盖配置 / --domain）
 * @localEn PAM base URL (overrides config / --domain)
 */
export const PAMENV_HELP_LOGIN_OPT_URL = 'pamenv_help:login_opt_url';

/**
 * @description 强制使用浏览器设备登录（默认）
 * @localZh 强制使用浏览器设备登录（默认）
 * @localEn Force browser device login (default)
 */
export const PAMENV_HELP_LOGIN_OPT_BROWSER = 'pamenv_help:login_opt_browser';

/**
 * @description 改用邮箱 / 密码登录
 * @localZh 改用邮箱 / 密码登录
 * @localEn Use email/password login instead of browser
 */
export const PAMENV_HELP_LOGIN_OPT_PASSWORD = 'pamenv_help:login_opt_password';

/**
 * @description 账号邮箱（密码登录）
 * @localZh 账号邮箱（密码登录）
 * @localEn Account email (password login)
 */
export const PAMENV_HELP_LOGIN_OPT_EMAIL = 'pamenv_help:login_opt_email';

/**
 * @description 非交互密码登录时使用的密码
 * @localZh 非交互密码登录时使用的密码
 * @localEn Account password for non-interactive password login
 */
export const PAMENV_HELP_LOGIN_OPT_PASSWORD_VALUE =
  'pamenv_help:login_opt_password_value';

/**
 * @description 吊销服务端 CLI token 并清除本地登录 / 同步数据
 * @localZh 吊销服务端 CLI token 并清除本地登录 / 同步数据
 * @localEn Revoke CLI token on server and clear local auth/sync state
 */
export const PAMENV_HELP_LOGOUT = 'pamenv_help:logout';

/**
 * @description 读取或设置 pamenv 配置（domain、locale 等）
 * @localZh 读取或设置 pamenv 配置（domain、locale 等）
 * @localEn Get or set pamenv config (domain, locale, …)
 */
export const PAMENV_HELP_CONFIG = 'pamenv_help:config';

/**
 * @description 设置配置项
 * @localZh 设置配置项
 * @localEn Set a config value
 */
export const PAMENV_HELP_CONFIG_SET = 'pamenv_help:config_set';

/**
 * @description 读取配置项
 * @localZh 读取配置项
 * @localEn Get a config value
 */
export const PAMENV_HELP_CONFIG_GET = 'pamenv_help:config_get';

/**
 * @description 列出非敏感配置
 * @localZh 列出非敏感配置
 * @localEn List non-secret config values
 */
export const PAMENV_HELP_CONFIG_LIST = 'pamenv_help:config_list';

/**
 * @description 配置值
 * @localZh 配置值
 * @localEn Config value
 */
export const PAMENV_HELP_CONFIG_ARG_VALUE = 'pamenv_help:config_arg_value';

/**
 * @description 刷新 PAM API 错误文案（仅内存）
 * @localZh 刷新 PAM API 错误文案（仅内存）
 * @localEn Refresh PAM API error messages (memory only)
 */
export const PAMENV_HELP_LOCALES = 'pamenv_help:locales';

/**
 * @description 从 /api/locales/json 拉取 api:* 文案（不保存到本地）
 * @localZh 从 /api/locales/json 拉取 api:* 文案（不保存到本地）
 * @localEn Fetch api:* messages from /api/locales/json (not saved locally)
 */
export const PAMENV_HELP_LOCALES_PULL = 'pamenv_help:locales_pull';

/**
 * @description 列出 PAM 项目
 * @localZh 列出 PAM 项目
 * @localEn List PAM projects
 */
export const PAMENV_HELP_PROJECTS = 'pamenv_help:projects';

/**
 * @description 可选搜索关键词
 * @localZh 可选搜索关键词
 * @localEn Optional search keyword
 */
export const PAMENV_HELP_PROJECTS_ARG_KEYWORD = 'pamenv_help:projects_arg_keyword';

/**
 * @description 按分类过滤（与 Web filters.category 一致）
 * @localZh 按分类过滤（与 Web filters.category 一致）
 * @localEn Filter by category (same as Web filters.category)
 */
export const PAMENV_HELP_PROJECTS_OPT_CATEGORY =
  'pamenv_help:projects_opt_category';

/**
 * @description 可见性：public | private（与 Web filters.visibility 一致）
 * @localZh 可见性：public | private（与 Web filters.visibility 一致）
 * @localEn Visibility: public | private (same as Web filters.visibility)
 */
export const PAMENV_HELP_PROJECTS_OPT_VISIBILITY =
  'pamenv_help:projects_opt_visibility';

/**
 * @description 排序字段：created_at | updated_at
 * @localZh 排序字段：created_at | updated_at
 * @localEn Sort field: created_at | updated_at
 */
export const PAMENV_HELP_PROJECTS_OPT_SORT = 'pamenv_help:projects_opt_sort';

/**
 * @description 排序方向：asc | desc
 * @localZh 排序方向：asc | desc
 * @localEn Sort order: asc | desc
 */
export const PAMENV_HELP_PROJECTS_OPT_ORDER = 'pamenv_help:projects_opt_order';

/**
 * @description 页码（从 1 开始，默认 1；要看更多请传 --page；与 --mine/--writable 同时使用时会自动翻页）
 * @localZh 页码（从 1 开始，默认 1；要看更多请传 --page；与 --mine/--writable 同时使用时会自动翻页）
 * @localEn Page number (1-based, default 1; pass --page for more; auto-pages with --mine/--writable)
 */
export const PAMENV_HELP_PROJECTS_OPT_PAGE = 'pamenv_help:projects_opt_page';

/**
 * @description 每页条数（默认 10，与 Web 一致；最大 100）
 * @localZh 每页条数（默认 10，与 Web 一致；最大 100）
 * @localEn Page size (default 10, same as Web; max 100)
 */
export const PAMENV_HELP_PROJECTS_OPT_PAGE_SIZE =
  'pamenv_help:projects_opt_page_size';

/**
 * @description 仅列出我拥有的项目（严格 owner）
 * @localZh 仅列出我拥有的项目（严格 owner）
 * @localEn Only projects I own (strict owner)
 */
export const PAMENV_HELP_PROJECTS_OPT_MINE = 'pamenv_help:projects_opt_mine';

/**
 * @description 仅列出可编辑的项目（含团队可写）
 * @localZh 仅列出可编辑的项目（含团队可写）
 * @localEn Only writable projects (includes team editors)
 */
export const PAMENV_HELP_PROJECTS_OPT_WRITABLE =
  'pamenv_help:projects_opt_writable';

/**
 * @description 根据当前目录交互式创建 PAM 项目
 * @localZh 根据当前目录交互式创建 PAM 项目
 * @localEn Interactively create a PAM project from the current directory
 */
export const PAMENV_HELP_INIT = 'pamenv_help:init';

/**
 * @description Fork 一个可读的 PAM 项目（敏感值会被清空）
 * @localZh Fork 一个可读的 PAM 项目（敏感值会被清空）
 * @localEn Fork a readable PAM project (sensitive values cleared)
 */
export const PAMENV_HELP_FORK = 'pamenv_help:fork';

/**
 * @description 源项目 slug 或项目 id
 * @localZh 源项目 slug 或项目 id
 * @localEn Source project slug or project id
 */
export const PAMENV_HELP_FORK_ARG_SOURCE = 'pamenv_help:fork_arg_source';

/**
 * @description Fork 后项目的 slug
 * @localZh Fork 后项目的 slug
 * @localEn Slug for the forked project
 */
export const PAMENV_HELP_FORK_OPT_SLUG = 'pamenv_help:fork_opt_slug';

/**
 * @description Fork 后项目的显示名
 * @localZh Fork 后项目的显示名
 * @localEn Display name for the forked project
 */
export const PAMENV_HELP_FORK_OPT_NAME = 'pamenv_help:fork_opt_name';

/**
 * @description 使用默认值 / 参数，不再确认
 * @localZh 使用默认值 / 参数，不再确认
 * @localEn Use defaults / flags without confirmation
 */
export const PAMENV_HELP_FORK_OPT_YES = 'pamenv_help:fork_opt_yes';

/**
 * @description 把环境变量拉取到当前目录（敏感变量写占位符）
 * @localZh 把环境变量写入当前目录的 .env，敏感变量的值写成本环境的占位符 __PAM_SENSITIVE_…__（需导出权限；日常开发推荐 run）
 * @localEn Write variables to a .env file; sensitive values are written as this environment's placeholder __PAM_SENSITIVE_…__ (export permission; prefer `run` for development)
 */
export const PAMENV_HELP_PULL = 'pamenv_help:pull';

/**
 * @description run 命令说明
 * @localZh 把环境变量注入子进程并运行命令（不写文件）
 * @localEn Run a command with environment variables injected (no files written)
 */
export const PAMENV_HELP_RUN = 'pamenv_help:run';

/**
 * @description run 命令参数
 * @localZh 要运行的命令及其参数（放在 -- 之后）
 * @localEn Command and arguments to run (after --)
 */
export const PAMENV_HELP_RUN_ARG_COMMAND = 'pamenv_help:run_arg_command';

/**
 * @description --only 选项
 * @localZh 只使用这些键，逗号分隔
 * @localEn Only use these keys (comma-separated)
 */
export const PAMENV_HELP_OPT_ONLY = 'pamenv_help:opt_only';

/**
 * @description --keep-env 选项
 * @localZh 这些键如果当前 shell 已有值，就保留不覆盖（逗号分隔）
 * @localEn Keep these keys from the current shell when already set (comma-separated)
 */
export const PAMENV_HELP_RUN_OPT_KEEP_ENV = 'pamenv_help:run_opt_keep_env';

/**
 * @description --no-warn 选项
 * @localZh 关闭启动前的绕过检查提示
 * @localEn Disable pre-run bypass warnings
 */
export const PAMENV_HELP_RUN_OPT_NO_WARN = 'pamenv_help:run_opt_no_warn';

/**
 * @description --env-priority 选项
 * @localZh 同名键优先级：remote（默认，PAM 优先）| local（process → 磁盘 .env* → PAM，便于本地改值测试）
 * @localEn Key priority: remote (default, PAM wins) | local (process → on-disk .env* → PAM, for local overrides)
 */
export const PAMENV_HELP_RUN_OPT_ENV_PRIORITY =
  'pamenv_help:run_opt_env_priority';

/**
 * @description --client-public-prefixes 选项
 * @localZh 敏感变量「公开前缀」告警用的前缀列表，逗号分隔（默认内置 VITE_/NEXT_PUBLIC_ 等）；传空字符串可关闭该告警
 * @localEn Comma-separated prefixes for the sensitive client-bundle warning (default: built-in VITE_/NEXT_PUBLIC_/…); pass empty to disable
 */
export const PAMENV_HELP_RUN_OPT_CLIENT_PUBLIC_PREFIXES =
  'pamenv_help:run_opt_client_public_prefixes';

/**
 * @description render 命令说明
 * @localZh 把环境变量输出为 dotenv / json / yaml / toml，敏感变量输出占位符（需导出权限；真实敏感值请用 run 注入）
 * @localEn Output variables as dotenv / json / yaml / toml; sensitive values are placeholders (export permission; use `run` for real sensitive values)
 */
export const PAMENV_HELP_RENDER = 'pamenv_help:render';

/**
 * @description render --format 选项
 * @localZh 输出格式：dotenv | json | yaml | toml（默认 dotenv）
 * @localEn Output format: dotenv | json | yaml | toml (default: dotenv)
 */
export const PAMENV_HELP_RENDER_OPT_FORMAT = 'pamenv_help:render_opt_format';

/**
 * @description render --out 选项
 * @localZh 输出文件（权限 0600）；省略或 - 时输出到 stdout
 * @localEn Output file (mode 0600); omit or use - for stdout
 */
export const PAMENV_HELP_RENDER_OPT_OUT = 'pamenv_help:render_opt_out';

/**
 * @description 输出目录（默认：当前目录）
 * @localZh 输出目录（默认：当前目录）
 * @localEn Output directory (default: cwd)
 */
export const PAMENV_HELP_PULL_OPT_OUT = 'pamenv_help:pull_opt_out';

/**
 * @description 冲突键不询问，直接使用远端值
 * @localZh 冲突键不询问，直接使用远端值
 * @localEn Resolve conflicting keys with remote values without asking
 */
export const PAMENV_HELP_PULL_OPT_FORCE = 'pamenv_help:pull_opt_force';

/**
 * @description 冲突预览中显示非敏感变量的值（默认全部遮盖）
 * @localZh 冲突预览中显示非敏感变量的值（默认全部遮盖）
 * @localEn Show non-sensitive values in conflict review (default: mask all)
 */
export const PAMENV_HELP_PULL_OPT_SHOW_VALUES = 'pamenv_help:pull_opt_show_values';

/**
 * @description 把本地 dotenv 文件推送回 PAM 环境
 * @localZh 把本地 dotenv 文件推送回 PAM 环境
 * @localEn Push local dotenv files back to PAM environments
 */
export const PAMENV_HELP_PUSH = 'pamenv_help:push';

/**
 * @description 本地目录（默认：当前目录）
 * @localZh 本地目录（默认：当前目录）
 * @localEn Local directory (default: cwd)
 */
export const PAMENV_HELP_PUSH_OPT_OUT = 'pamenv_help:push_opt_out';

/**
 * @description 跳过普通确认（不包括同步冲突的选择）
 * @localZh 跳过普通确认（不包括同步冲突的选择）
 * @localEn Skip ordinary confirmation prompts (not sync-conflict resolution)
 */
export const PAMENV_HELP_PUSH_OPT_YES = 'pamenv_help:push_opt_yes';

/**
 * @description 冲突键不询问，直接使用本地值（不包含 -y）
 * @localZh 冲突键不询问，直接使用本地值（不包含 -y）
 * @localEn Resolve conflicting keys with local values without asking (does not imply -y)
 */
export const PAMENV_HELP_PUSH_OPT_FORCE = 'pamenv_help:push_opt_force';

/**
 * @description 推送预览中显示非敏感变量的值（默认全部遮盖）
 * @localZh 推送预览中显示非敏感变量的值（默认全部遮盖）
 * @localEn Show non-sensitive values in push review (default: mask all)
 */
export const PAMENV_HELP_PUSH_OPT_SHOW_VALUES = 'pamenv_help:push_opt_show_values';

/**
 * @description push 行内 KEY=value 覆盖（叠在本地文件上）
 * @localZh 覆盖或新增变量（KEY=value，可多个；叠在本地文件上）
 * @localEn Override or add variables (KEY=value, repeatable; applied on top of the local file)
 */
export const PAMENV_HELP_PUSH_ARG_ASSIGNMENTS =
  'pamenv_help:push_arg_assignments';

/**
 * @description push 时从最终集合中删除指定键
 * @localZh 从本次推送中删除这些键（逗号分隔；成功后同步删本地行）
 * @localEn Remove these keys from this push (comma-separated; local lines removed after success)
 */
export const PAMENV_HELP_PUSH_OPT_UNSET = 'pamenv_help:push_opt_unset';

/**
 * @description 删除项目中的一个 PAM 环境（需管理员及以上）
 * @localZh 删除项目中的一个 PAM 环境（需管理员及以上）
 * @localEn Delete a PAM environment from a project (admin+)
 */
export const PAMENV_HELP_REMOVE = 'pamenv_help:remove';

/**
 * @description 要删除的环境名
 * @localZh 要删除的环境名
 * @localEn Environment name to delete
 */
export const PAMENV_HELP_REMOVE_OPT_ENV = 'pamenv_help:remove_opt_env';

/**
 * @description 跳过确认
 * @localZh 跳过确认
 * @localEn Skip confirmation prompts
 */
export const PAMENV_HELP_REMOVE_OPT_YES = 'pamenv_help:remove_opt_yes';
