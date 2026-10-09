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
 * @description 使用工作目录下的 ./.pam 配置与同步数据（而不是 ~/.pam）
 * @localZh 使用工作目录下的 ./.pam 配置与同步数据（而不是 ~/.pam）
 * @localEn Use ./.pam config + sync under the working directory (not ~/.pam)
 */
export const PAMENV_HELP_OPT_LOCAL = 'pamenv_help:opt_local';

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
 * @description 登录并保存 CLI token（默认浏览器登录；--local 时保存在 cwd/.pam）
 * @localZh 登录并保存 CLI token（默认浏览器登录；--local 时保存在 cwd/.pam）
 * @localEn Login and store CLI token (browser by default; use --local for cwd/.pam)
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
 * @description 把解密后的环境变量拉取到当前目录
 * @localZh 把解密后的环境变量拉取到当前目录
 * @localEn Pull decrypted environments into the current directory
 */
export const PAMENV_HELP_PULL = 'pamenv_help:pull';

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
