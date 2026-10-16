/**
 * pamenv CLI UX i18n identifiers (consumed by ts2locales).
 *
 * Significance: Typed keys for interactive CLI copy.
 * Core idea: JSDoc @localZh/@localEn → dist/locales via Ts2Locales。
 * CLI 运行时加载本地 JSON；PAM `api:*` 错误另从 `/api/locales/json` 请求。
 * Main purpose: Avoid stringly-typed PamCliI18n.t keys.
 */

/**
 * @description 使用 {{kind}} 配置: {{path}} ({{email}})
 * @localZh 使用 {{kind}} 配置: {{path}} ({{email}})
 * @localEn Using {{kind}} config: {{path}} ({{email}})
 */
export const PAMENV_CLI_USING_CONFIG = 'pamenv_cli:using_config';

/**
 * @description PAM 地址
 * @localZh PAM 地址
 * @localEn PAM base URL
 */
export const PAMENV_CLI_PROMPT_BASE_URL = 'pamenv_cli:prompt_base_url';

/**
 * @description 邮箱
 * @localZh 邮箱
 * @localEn Email
 */
export const PAMENV_CLI_PROMPT_EMAIL = 'pamenv_cli:prompt_email';

/**
 * @description 密码
 * @localZh 密码
 * @localEn Password
 */
export const PAMENV_CLI_PROMPT_PASSWORD = 'pamenv_cli:prompt_password';

/**
 * @description 邮箱和密码不能为空
 * @localZh 邮箱和密码不能为空
 * @localEn Email and password are required
 */
export const PAMENV_CLI_EMAIL_PASSWORD_REQUIRED = 'pamenv_cli:email_password_required';

/**
 * @description 请在浏览器打开以下链接以授权 pamenv：
 * @localZh 请在浏览器打开以下链接以授权 pamenv：
 * @localEn Open the URL below in your browser to authorize pamenv:
 */
export const PAMENV_CLI_LOGIN_OPEN_BROWSER = 'pamenv_cli:login_open_browser';

/**
 * @description 用户码: {{code}}
 * @localZh 用户码: {{code}}
 * @localEn User code: {{code}}
 */
export const PAMENV_CLI_LOGIN_USER_CODE = 'pamenv_cli:login_user_code';

/**
 * @description 等待授权中...
 * @localZh 等待授权中...
 * @localEn Waiting for authorization...
 */
export const PAMENV_CLI_LOGIN_WAITING = 'pamenv_cli:login_waiting';

/**
 * @description （无法自动打开浏览器 — 请手动打开上方链接。）
 * @localZh （无法自动打开浏览器 — 请手动打开上方链接。）
 * @localEn (Could not open browser automatically — open the URL manually.)
 */
export const PAMENV_CLI_LOGIN_BROWSER_OPEN_FAILED = 'pamenv_cli:login_browser_open_failed';

/**
 * @description 浏览器中拒绝了授权
 * @localZh 浏览器中拒绝了授权
 * @localEn Authorization denied in browser
 */
export const PAMENV_CLI_LOGIN_DENIED = 'pamenv_cli:login_denied';

/**
 * @description 设备码已过期。请重新运行 `pamenv login`。
 * @localZh 设备码已过期。请重新运行 `pamenv login`。
 * @localEn Device code expired. Run `pamenv login` again.
 */
export const PAMENV_CLI_LOGIN_EXPIRED = 'pamenv_cli:login_expired';

/**
 * @description 等待浏览器授权超时
 * @localZh 等待浏览器授权超时
 * @localEn Timed out waiting for browser authorization
 */
export const PAMENV_CLI_LOGIN_TIMEOUT = 'pamenv_cli:login_timeout';

/**
 * @description 已登录为 {{email}}
 * @localZh 已登录为 {{email}}
 * @localEn Logged in as {{email}}
 */
export const PAMENV_CLI_LOGIN_SUCCESS = 'pamenv_cli:login_success';

/**
 * @description 令牌过期时间 {{expiresAt}}
 * @localZh 令牌过期时间 {{expiresAt}}
 * @localEn Token expires at {{expiresAt}}
 */
export const PAMENV_CLI_LOGIN_EXPIRES = 'pamenv_cli:login_expires';

/**
 * @description 配置已保存到 {{path}}
 * @localZh 配置已保存到 {{path}}
 * @localEn Config saved to {{path}}
 */
export const PAMENV_CLI_LOGIN_CONFIG_SAVED = 'pamenv_cli:login_config_saved';

/**
 * @description 已从浏览器同步语言: {{locale}}
 * @localZh 已从浏览器同步语言: {{locale}}
 * @localEn Locale set from browser: {{locale}}
 */
export const PAMENV_CLI_LOGIN_LOCALE_SYNCED = 'pamenv_cli:login_locale_synced';

/**
 * @description 已从 PAM 加载 {{count}} 条文案
 * @localZh 已从 PAM 加载 {{count}} 条文案
 * @localEn Loaded {{count}} locale messages from PAM
 */
export const PAMENV_CLI_LOCALES_CACHED = 'pamenv_cli:locales_cached';

/**
 * @description 拉取文案失败（API 报错时会重试）: {{message}}
 * @localZh 拉取文案失败（API 报错时会重试）: {{message}}
 * @localEn Failed to pull locale messages (will retry on API errors): {{message}}
 */
export const PAMENV_CLI_LOCALES_PULL_FAILED = 'pamenv_cli:locales_pull_failed';

/**
 * @description 配置项 `{{key}}` 缺少值
 * @localZh 配置项 `{{key}}` 缺少值
 * @localEn Missing value for config key `{{key}}`
 */
export const PAMENV_CLI_CONFIG_MISSING_VALUE = 'pamenv_cli:config_missing_value';

/**
 * @description 不支持的语言 `{{value}}`。可用: {{supported}}
 * @localZh 不支持的语言 `{{value}}`。可用: {{supported}}
 * @localEn Unsupported locale `{{value}}`. Use: {{supported}}
 */
export const PAMENV_CLI_CONFIG_UNSUPPORTED_LOCALE = 'pamenv_cli:config_unsupported_locale';

/**
 * @description 未知配置项 `{{key}}`。支持: {{supported}}
 * @localZh 未知配置项 `{{key}}`。支持: {{supported}}
 * @localEn Unknown config key `{{key}}`. Supported: {{supported}}
 */
export const PAMENV_CLI_CONFIG_UNKNOWN_KEY = 'pamenv_cli:config_unknown_key';

/**
 * @description baseUrl = {{url}}
 * @localZh baseUrl = {{url}}
 * @localEn baseUrl = {{url}}
 */
export const PAMENV_CLI_CONFIG_BASE_URL_SET = 'pamenv_cli:config_base_url_set';

/**
 * @description 配置: {{path}}
 * @localZh 配置: {{path}}
 * @localEn Config: {{path}}
 */
export const PAMENV_CLI_CONFIG_PATH = 'pamenv_cli:config_path';

/**
 * @description locale = {{locale}}
 * @localZh locale = {{locale}}
 * @localEn locale = {{locale}}
 */
export const PAMENV_CLI_CONFIG_LOCALE_SET = 'pamenv_cli:config_locale_set';

/**
 * @description path     {{path}}
 * @localZh path     {{path}}
 * @localEn path     {{path}}
 */
export const PAMENV_CLI_CONFIG_LIST_PATH = 'pamenv_cli:config_list_path';

/**
 * @description baseUrl  {{url}}
 * @localZh baseUrl  {{url}}
 * @localEn baseUrl  {{url}}
 */
export const PAMENV_CLI_CONFIG_LIST_BASE_URL = 'pamenv_cli:config_list_base_url';

/**
 * @description locale   {{locale}}{{locked}}
 * @localZh locale   {{locale}}{{locked}}
 * @localEn locale   {{locale}}{{locked}}
 */
export const PAMENV_CLI_CONFIG_LIST_LOCALE = 'pamenv_cli:config_list_locale';

/**
 * @description  (已锁定)
 * @localZh  (已锁定)
 * @localEn  (locked)
 */
export const PAMENV_CLI_CONFIG_LIST_LOCALE_LOCKED = 'pamenv_cli:config_list_locale_locked';

/**
 * @description messages {{count}} 条{{pulled}}
 * @localZh messages {{count}} 条{{pulled}}
 * @localEn messages {{count}} keys{{pulled}}
 */
export const PAMENV_CLI_CONFIG_LIST_MESSAGES = 'pamenv_cli:config_list_messages';

/**
 * @description  (拉取于 {{at}})
 * @localZh  (拉取于 {{at}})
 * @localEn  (pulled {{at}})
 */
export const PAMENV_CLI_CONFIG_LIST_MESSAGES_PULLED = 'pamenv_cli:config_list_messages_pulled';

/**
 * @description email    {{email}}
 * @localZh email    {{email}}
 * @localEn email    {{email}}
 */
export const PAMENV_CLI_CONFIG_LIST_EMAIL = 'pamenv_cli:config_list_email';

/**
 * @description token    (已设置)
 * @localZh token    (已设置)
 * @localEn token    (set)
 */
export const PAMENV_CLI_CONFIG_LIST_TOKEN_SET = 'pamenv_cli:config_list_token_set';

/**
 * @description token    (无)
 * @localZh token    (无)
 * @localEn token    (none)
 */
export const PAMENV_CLI_CONFIG_LIST_TOKEN_NONE = 'pamenv_cli:config_list_token_none';

/**
 * @description (无)
 * @localZh (无)
 * @localEn (none)
 */
export const PAMENV_CLI_CONFIG_EMAIL_NONE = 'pamenv_cli:config_email_none';

/**
 * @description 正在拉取文案 locale={{locale}} ← {{baseUrl}} ...
 * @localZh 正在拉取文案 locale={{locale}} ← {{baseUrl}} ...
 * @localEn Pulling locales locale={{locale}} from {{baseUrl}} ...
 */
export const PAMENV_CLI_LOCALES_PULLING = 'pamenv_cli:locales_pulling';

/**
 * @description 已加载 {{count}} 条（{{locale}}）← {{baseUrl}}
 * @localZh 已加载 {{count}} 条（{{locale}}）← {{baseUrl}}
 * @localEn Loaded {{count}} keys ({{locale}}) ← {{baseUrl}}
 */
export const PAMENV_CLI_LOCALES_PULLED = 'pamenv_cli:locales_pulled';

/**
 * @description 已取消。
 * @localZh 已取消。
 * @localEn Cancelled.
 */
export const PAMENV_CLI_CANCELLED = 'pamenv_cli:cancelled';

/**
 * @description 正在扫描 {{cwd}} ...
 * @localZh 正在扫描 {{cwd}} ...
 * @localEn Scanning {{cwd}} ...
 */
export const PAMENV_CLI_SCANNING = 'pamenv_cli:scanning';

/**
 * @description 项目名称
 * @localZh 项目名称
 * @localEn project name
 */
export const PAMENV_CLI_PROMPT_PROJECT_NAME = 'pamenv_cli:prompt_project_name';

/**
 * @description 项目名称不能为空
 * @localZh 项目名称不能为空
 * @localEn Project name is required
 */
export const PAMENV_CLI_PROJECT_NAME_REQUIRED = 'pamenv_cli:project_name_required';

/**
 * @description 描述
 * @localZh 描述
 * @localEn description
 */
export const PAMENV_CLI_PROMPT_DESCRIPTION = 'pamenv_cli:prompt_description';

/**
 * @description 分类
 * @localZh 分类
 * @localEn category
 */
export const PAMENV_CLI_PROMPT_CATEGORY = 'pamenv_cli:prompt_category';

/**
 * @description 自定义分类…
 * @localZh 自定义分类…
 * @localEn Custom category…
 */
export const PAMENV_CLI_CATEGORY_CUSTOM = 'pamenv_cli:category_custom';

/**
 * @description 输入分类名称
 * @localZh 输入分类名称
 * @localEn Category name
 */
export const PAMENV_CLI_PROMPT_CATEGORY_CUSTOM =
  'pamenv_cli:prompt_category_custom';

/**
 * @description 分类不能为空
 * @localZh 分类不能为空
 * @localEn Category is required
 */
export const PAMENV_CLI_CATEGORY_REQUIRED = 'pamenv_cli:category_required';

/**
 * @description 仓库地址
 * @localZh 仓库地址
 * @localEn repository url
 */
export const PAMENV_CLI_PROMPT_REPO_URL = 'pamenv_cli:prompt_repo_url';

/**
 * @description 即将创建：
 * @localZh 即将创建：
 * @localEn About to create:
 */
export const PAMENV_CLI_ABOUT_TO_CREATE = 'pamenv_cli:about_to_create';

/**
 * @description 确认创建该 PAM 项目？
 * @localZh 确认创建该 PAM 项目？
 * @localEn Create this PAM project?
 */
export const PAMENV_CLI_CREATE_CONFIRM = 'pamenv_cli:create_confirm';

/**
 * @description 已创建项目 "{{slug}}" ({{id}})。
 * @localZh 已创建项目 "{{slug}}" ({{id}})。
 * @localEn Created project "{{slug}}" ({{id}}).
 */
export const PAMENV_CLI_CREATED_PROJECT = 'pamenv_cli:created_project';

/**
 * @description 未创建环境。可在 PAM 网页添加，或补齐 .env 后重新 init。
 * @localZh 未创建环境。可在 PAM 网页添加，或补齐 .env 后重新 init。
 * @localEn No environments were created. Add them in the PAM UI, or re-run init after adding .env files.
 */
export const PAMENV_CLI_NO_ENVS_CREATED = 'pamenv_cli:no_envs_created';

/**
 * @description 下一步：推送本地 dotenv，例如：
 * @localZh 下一步：推送本地 dotenv，例如：
 * @localEn Next: push local dotenv files, for example:
 */
export const PAMENV_CLI_NEXT_PUSH = 'pamenv_cli:next_push';

/**
 * @description     （读取项目目录中的 {{fileName}}）
 * @localZh     （读取项目目录中的 {{fileName}}）
 * @localEn     (reads {{fileName}} in the project directory)
 */
export const PAMENV_CLI_NEXT_PUSH_READS = 'pamenv_cli:next_push_reads';

/**
 * @description 也可打开 {{url}} 查看项目详情。
 * @localZh 也可打开 {{url}} 查看项目详情。
 * @localEn You can also open {{url}} to view project details.
 */
export const PAMENV_CLI_OPEN_PROJECT_DETAIL = 'pamenv_cli:open_project_detail';

/**
 * @description   package.json: {{value}}
 * @localZh   package.json: {{value}}
 * @localEn   package.json: {{value}}
 */
export const PAMENV_CLI_SCAN_PACKAGE = 'pamenv_cli:scan_package';

/**
 * @description   package.json: (未找到)
 * @localZh   package.json: (未找到)
 * @localEn   package.json: (not found)
 */
export const PAMENV_CLI_SCAN_PACKAGE_MISSING = 'pamenv_cli:scan_package_missing';

/**
 * @description   homepage:     {{value}}
 * @localZh   homepage:     {{value}}
 * @localEn   homepage:     {{value}}
 */
export const PAMENV_CLI_SCAN_HOMEPAGE = 'pamenv_cli:scan_homepage';

/**
 * @description   homepage:     (未找到)
 * @localZh   homepage:     (未找到)
 * @localEn   homepage:     (not found)
 */
export const PAMENV_CLI_SCAN_HOMEPAGE_MISSING = 'pamenv_cli:scan_homepage_missing';

/**
 * @description   git origin:   {{value}}
 * @localZh   git origin:   {{value}}
 * @localEn   git origin:   {{value}}
 */
export const PAMENV_CLI_SCAN_GIT = 'pamenv_cli:scan_git';

/**
 * @description   git origin:   (未找到)
 * @localZh   git origin:   (未找到)
 * @localEn   git origin:   (not found)
 */
export const PAMENV_CLI_SCAN_GIT_MISSING = 'pamenv_cli:scan_git_missing';

/**
 * @description   env 文件:     {{value}}
 * @localZh   env 文件:     {{value}}
 * @localEn   env files:    {{value}}
 */
export const PAMENV_CLI_SCAN_ENV_FILES = 'pamenv_cli:scan_env_files';

/**
 * @description   env 文件:     (无)
 * @localZh   env 文件:     (无)
 * @localEn   env files:    (none)
 */
export const PAMENV_CLI_SCAN_ENV_FILES_NONE = 'pamenv_cli:scan_env_files_none';

/**
 * @description 项目 slug（全局唯一）
 * @localZh 项目 slug（全局唯一）
 * @localEn project slug (globally unique)
 */
export const PAMENV_CLI_PROMPT_SLUG = 'pamenv_cli:prompt_slug';

/**
 * @description slug 不能为空（字母、数字、短横线）
 * @localZh slug 不能为空（字母、数字、短横线）
 * @localEn Slug is required (letters, numbers, dashes)
 */
export const PAMENV_CLI_SLUG_REQUIRED = 'pamenv_cli:slug_required';

/**
 * @description 项目 "{{slug}}" 已存在且归你所有。
 * @localZh 项目 "{{slug}}" 已存在且归你所有。
 * @localEn Project "{{slug}}" already exists and you own it.
 */
export const PAMENV_CLI_PROJECT_EXISTS_OWNED = 'pamenv_cli:project_exists_owned';

/**
 * @description 环境: {{envs}}
 * @localZh 环境: {{envs}}
 * @localEn Environments: {{envs}}
 */
export const PAMENV_CLI_PROJECT_EXISTS_ENVS = 'pamenv_cli:project_exists_envs';

/**
 * @description 使用 `pamenv push {{slug}} -e <env>` 上传 dotenv。
 * @localZh 使用 `pamenv push {{slug}} -e <env>` 上传 dotenv。
 * @localEn Use `pamenv push {{slug}} -e <env>` to upload dotenv files.
 */
export const PAMENV_CLI_PROJECT_EXISTS_PUSH_HINT = 'pamenv_cli:project_exists_push_hint';

/**
 * @description Slug "{{slug}}" 已被其他项目占用。
 * @localZh Slug "{{slug}}" 已被其他项目占用。
 * @localEn Slug "{{slug}}" is already taken by another project.
 */
export const PAMENV_CLI_SLUG_TAKEN = 'pamenv_cli:slug_taken';

/**
 * @description 请换一个 slug 后重新运行 `pamenv init`。
 * @localZh 请换一个 slug 后重新运行 `pamenv init`。
 * @localEn Choose a different slug and run `pamenv init` again.
 */
export const PAMENV_CLI_SLUG_TAKEN_RETRY = 'pamenv_cli:slug_taken_retry';

/**
 * @description 没有 .env 文件且没有 package homepage — 跳过环境创建。
 * @localZh 没有 .env 文件且没有 package homepage — 跳过环境创建。
 * @localEn No .env files and no package homepage — skipping environments.
 */
export const PAMENV_CLI_SKIP_ENVS_NO_FILES_NO_HOME = 'pamenv_cli:skip_envs_no_files_no_home';

/**
 * @description 未找到 .env 文件 — 跳过环境创建（仅有 homepage 不够）。
 * @localZh 未找到 .env 文件 — 跳过环境创建（仅有 homepage 不够）。
 * @localEn No .env files found — skipping environments (homepage alone is not enough).
 */
export const PAMENV_CLI_SKIP_ENVS_NO_FILES = 'pamenv_cli:skip_envs_no_files';

/**
 * @description 要创建的环境
 * @localZh 要创建的环境
 * @localEn environments to create
 */
export const PAMENV_CLI_PROMPT_ENVS_TO_CREATE = 'pamenv_cli:prompt_envs_to_create';

/**
 * @description 未选择环境 — 将创建无环境的项目。
 * @localZh 未选择环境 — 将创建无环境的项目。
 * @localEn No environments selected — creating project without envs.
 */
export const PAMENV_CLI_NO_ENVS_SELECTED = 'pamenv_cli:no_envs_selected';

/**
 * @description 根据 {{sources}} 配置环境：
 * @localZh 根据 {{sources}} 配置环境：
 * @localEn Configure environment from {{sources}}:
 */
export const PAMENV_CLI_CONFIGURE_ENV_FROM = 'pamenv_cli:configure_env_from';

/**
 * @description   环境名
 * @localZh   环境名
 * @localEn   env name
 */
export const PAMENV_CLI_PROMPT_ENV_NAME = 'pamenv_cli:prompt_env_name';

/**
 * @description 环境名不能为空
 * @localZh 环境名不能为空
 * @localEn Environment name is required
 */
export const PAMENV_CLI_ENV_NAME_REQUIRED = 'pamenv_cli:env_name_required';

/**
 * @description   环境 URL
 * @localZh   环境 URL
 * @localEn   env url
 */
export const PAMENV_CLI_PROMPT_ENV_URL = 'pamenv_cli:prompt_env_url';

/**
 * @description 需要有效的 http(s) URL
 * @localZh 需要有效的 http(s) URL
 * @localEn A valid http(s) URL is required
 */
export const PAMENV_CLI_ENV_URL_REQUIRED = 'pamenv_cli:env_url_required';

/**
 * @description 编辑后环境名重复
 * @localZh 编辑后环境名重复
 * @localEn Duplicate environment names after editing
 */
export const PAMENV_CLI_DUPLICATE_ENV_NAMES = 'pamenv_cli:duplicate_env_names';

/**
 * @description (无)
 * @localZh (无)
 * @localEn (none)
 */
export const PAMENV_CLI_LABEL_NONE = 'pamenv_cli:label_none';

/**
 * @description Pull 冲突：自上次同步后本地与远端修改了同一批键
 * @localZh Pull 冲突：自上次同步后本地与远端修改了同一批键
 * @localEn Pull conflict: local and remote changed the same keys since last sync
 */
export const PAMENV_CLI_PULL_CONFLICT = 'pamenv_cli:pull_conflict';

/**
 * @description 冲突键使用哪一边的值？
 * @localZh 冲突键使用哪一边的值？
 * @localEn Which side should win the conflicting keys?
 */
export const PAMENV_CLI_CONFLICT_RESOLVE_PROMPT =
  'pamenv_cli:conflict_resolve_prompt';

/**
 * @description 使用远端值
 * @localZh 使用远端值
 * @localEn Use remote values
 */
export const PAMENV_CLI_CONFLICT_USE_REMOTE = 'pamenv_cli:conflict_use_remote';

/**
 * @description 使用本地值
 * @localZh 使用本地值
 * @localEn Use local values
 */
export const PAMENV_CLI_CONFLICT_USE_LOCAL = 'pamenv_cli:conflict_use_local';

/**
 * @description 取消
 * @localZh 取消
 * @localEn Abort
 */
export const PAMENV_CLI_CONFLICT_ABORT = 'pamenv_cli:conflict_abort';

/**
 * @description 冲突键已使用{{side}}。如需调整，请手动编辑 {{path}} 后运行 `pamenv push {{slug}} -e {{env}}`。
 * @localZh 冲突键已使用{{side}}。如需调整，请手动编辑 {{path}} 后运行 `pamenv push {{slug}} -e {{env}}`。
 * @localEn Conflicting keys now use {{side}}. To adjust, edit {{path}} manually and run `pamenv push {{slug}} -e {{env}}`.
 */
export const PAMENV_CLI_CONFLICT_MANUAL_HINT = 'pamenv_cli:conflict_manual_hint';

/**
 * @description 远端值
 * @localZh 远端值
 * @localEn remote values
 */
export const PAMENV_CLI_SIDE_REMOTE = 'pamenv_cli:side_remote';

/**
 * @description 本地值
 * @localZh 本地值
 * @localEn local values
 */
export const PAMENV_CLI_SIDE_LOCAL = 'pamenv_cli:side_local';

/**
 * @description 已保留本地未推送的修改: {{keys}}。确认后运行 `pamenv push {{slug}} -e {{env}}`。
 * @localZh 已保留本地未推送的修改: {{keys}}。确认后运行 `pamenv push {{slug}} -e {{env}}`。
 * @localEn Kept unpushed local changes: {{keys}}. Run `pamenv push {{slug}} -e {{env}}` when ready.
 */
export const PAMENV_CLI_PULL_LOCAL_KEPT = 'pamenv_cli:pull_local_kept';

/**
 * @description 已把远端修改合并进本地文件: {{keys}}
 * @localZh 已把远端修改合并进本地文件: {{keys}}
 * @localEn Merged remote changes into the local file: {{keys}}
 */
export const PAMENV_CLI_PUSH_MERGED_REMOTE = 'pamenv_cli:push_merged_remote';

/**
 * @description 本地文件: {{path}}
 * @localZh 本地文件: {{path}}
 * @localEn Local file: {{path}}
 */
export const PAMENV_CLI_LOCAL_FILE = 'pamenv_cli:local_file';

/**
 * @description 已是最新: {{slug}}/{{env}} ({{path}})
 * @localZh 已是最新: {{slug}}/{{env}} ({{path}})
 * @localEn Already up to date: {{slug}}/{{env}} ({{path}})
 */
export const PAMENV_CLI_PULL_UP_TO_DATE = 'pamenv_cli:pull_up_to_date';

/**
 * @description 已拉取 {{slug}}/{{env}} → {{path}}
 * @localZh 已拉取 {{slug}}/{{env}} → {{path}}
 * @localEn Pulled {{slug}}/{{env}} → {{path}}
 */
export const PAMENV_CLI_PULLED = 'pamenv_cli:pulled';

/**
 * @description 本地文件已绑定到其他项目
 * @localZh 本地文件 {{path}} 已绑定到 {{boundSlug}}/{{boundEnv}}，不能直接用于 {{slug}}/{{env}}（默认都是 {{defaultFile}}）。请使用 `--file {{suggestedFile}}`，或换目录 / `-o`，或加 `--force` 覆盖绑定。
 * @localEn Local file {{path}} is bound to {{boundSlug}}/{{boundEnv}} and cannot be used for {{slug}}/{{env}} (both default to {{defaultFile}}). Use `--file {{suggestedFile}}`, another directory / `-o`, or `--force` to overwrite the binding.
 */
export const PAMENV_CLI_ENV_FILE_BOUND_TO_OTHER_PROJECT =
  'pamenv_cli:env_file_bound_to_other_project';

/**
 * @description 导出需要项目管理员或所有者权限
 * @localZh 你没有项目 "{{slug}}" 的导出权限（需为项目管理员或所有者）。日常开发请改用 `pamenv run {{slug}} -e <env> -- <命令>`，变量只注入进程、不落盘。
 * @localEn You cannot export from project "{{slug}}" (project admin or owner required). For development use `pamenv run {{slug}} -e <env> -- <command>`, which injects variables into the process without writing files.
 */
export const PAMENV_CLI_NOT_OWNER_EXPORT = 'pamenv_cli:not_owner_export';

/**
 * @description run 需要注入权限
 * @localZh 你没有项目 "{{slug}}" 的变量注入权限（需为项目团队成员）。
 * @localEn You cannot inject variables from project "{{slug}}" (project team membership required).
 */
export const PAMENV_CLI_NO_INJECT_PERMISSION =
  'pamenv_cli:no_inject_permission';

/**
 * @description run 缺少要执行的命令
 * @localZh 请在 `--` 之后提供要运行的命令，例如：pamenv run {{slug}} -e local -- pnpm dev
 * @localEn Provide the command to run after `--`, for example: pamenv run {{slug}} -e local -- pnpm dev
 */
export const PAMENV_CLI_RUN_COMMAND_REQUIRED =
  'pamenv_cli:run_command_required';

/**
 * @description run 注入完成提示（输出到 stderr）
 * @localZh [pamenv] 已从 {{slug}}/{{env}} 注入 {{count}} 个变量
 * @localEn [pamenv] Injected {{count}} variable(s) from {{slug}}/{{env}}
 */
export const PAMENV_CLI_RUN_INJECTED = 'pamenv_cli:run_injected';

/**
 * @description run 无法启动子进程
 * @localZh 无法启动命令 "{{command}}": {{message}}
 * @localEn Failed to start "{{command}}": {{message}}
 */
export const PAMENV_CLI_RUN_SPAWN_FAILED = 'pamenv_cli:run_spawn_failed';

/**
 * @description --only 指定的键在环境中不存在
 * @localZh [pamenv] 警告：环境中不存在这些键：{{keys}}
 * @localEn [pamenv] Warning: these keys do not exist in the environment: {{keys}}
 */
export const PAMENV_CLI_ONLY_MISSING = 'pamenv_cli:only_missing';

/**
 * @description 绕过检查：.env 文件与注入的键重名
 * @localZh [pamenv] 警告：{{file}} 中有 {{count}} 个键与注入的变量重名（{{keys}}）。若项目用 dotenv 加载且开启 override，文件里的值会覆盖注入值，建议删除该文件或这些键。
 * @localEn [pamenv] Warning: {{file}} defines {{count}} key(s) that are also injected ({{keys}}). If dotenv loads it with override enabled, file values win; consider removing the file or those keys.
 */
export const PAMENV_CLI_WARN_DOTENV_OVERLAP = 'pamenv_cli:warn_dotenv_overlap';

/**
 * @description 绕过检查：敏感变量带前端公开前缀
 * @localZh [pamenv] 警告：敏感变量 {{keys}} 带有 NEXT_PUBLIC_ / VITE_ 前缀，会在构建时写进前端代码包，不应存放密钥。
 * @localEn [pamenv] Warning: sensitive variable(s) {{keys}} use a NEXT_PUBLIC_ / VITE_ prefix and will be bundled into client code at build time; do not store secrets there.
 */
export const PAMENV_CLI_WARN_PUBLIC_PREFIX = 'pamenv_cli:warn_public_prefix';

/**
 * @description 绕过检查：turbo 严格环境变量模式
 * @localZh [pamenv] 警告：{{file}} 使用严格环境变量模式，{{count}} 个注入的变量未在 env / passThroughEnv 中声明（{{keys}}），Turbo 运行的任务可能拿不到。
 * @localEn [pamenv] Warning: {{file}} uses strict env mode and {{count}} injected variable(s) are not declared in env / passThroughEnv ({{keys}}); Turbo tasks may not receive them.
 */
export const PAMENV_CLI_WARN_TURBO_STRICT = 'pamenv_cli:warn_turbo_strict';

/**
 * @description render 格式不支持
 * @localZh 不支持的格式 "{{format}}"，可选：{{formats}}
 * @localEn Unsupported format "{{format}}". Choose one of: {{formats}}
 */
export const PAMENV_CLI_RENDER_BAD_FORMAT = 'pamenv_cli:render_bad_format';

/**
 * @description render 写入文件完成（输出到 stderr）
 * @localZh 已输出 {{slug}}/{{env}}（{{format}}，{{count}} 个变量）→ {{path}}
 * @localEn Rendered {{slug}}/{{env}} ({{format}}, {{count}} vars) → {{path}}
 */
export const PAMENV_CLI_RENDERED = 'pamenv_cli:rendered';

/**
 * @description render 将敏感变量写成空值 keep（旧服务端无占位符，输出到 stderr）
 * @localZh [pamenv] {{count}} 个敏感变量已写成空值（{{keys}}）：不含明文；空值 push 时表示保留远端密钥。请用 `pamenv run` 注入进程。
 * @localEn [pamenv] {{count}} sensitive variable(s) written as empty ({{keys}}): no plaintext; empty on push keeps the remote secret. Inject with `pamenv run`.
 */
export const PAMENV_CLI_RENDER_SENSITIVE_EMPTY =
  'pamenv_cli:render_sensitive_empty';

/**
 * @description render 用占位符输出了敏感变量（输出到 stderr）
 * @localZh [pamenv] {{count}} 个敏感变量以占位符输出（{{keys}}）：真实值不会以明文输出，请用 `pamenv run` 注入进程。
 * @localEn [pamenv] {{count}} sensitive variable(s) rendered as placeholders ({{keys}}): real values are never output as plaintext; inject them with `pamenv run`.
 */
export const PAMENV_CLI_RENDER_SENSITIVE_PLACEHOLDER =
  'pamenv_cli:render_sensitive_placeholder';

/**
 * @description push 前发现不属于该环境的敏感占位符
 * @localZh 以下变量的值是敏感占位符，但不属于环境 "{{env}}" 已保存的敏感变量（可能从其它环境复制而来）：{{keys}}。请填写真实值，或先 `pamenv pull` 该环境。
 * @localEn These values are sensitive placeholders that do not match a stored secret in "{{env}}" (maybe copied from another environment): {{keys}}. Enter the real values, or `pamenv pull` this environment first.
 */
export const PAMENV_CLI_PUSH_PLACEHOLDER_INVALID =
  'pamenv_cli:push_placeholder_invalid';

/**
 * @description run 前发现 .env 文件中注入的键写着占位符
 * @localZh [pamenv] 警告：{{file}} 中 {{count}} 个注入的键写的是敏感占位符（{{keys}}）。若项目让 .env 覆盖进程环境变量，程序拿到的会是占位符而不是真实值。
 * @localEn [pamenv] Warning: {{file}} has sensitive placeholders for {{count}} injected key(s) ({{keys}}). If your tooling lets .env override the process environment, the app gets the placeholder instead of the real value.
 */
export const PAMENV_CLI_WARN_DOTENV_PLACEHOLDER =
  'pamenv_cli:warn_dotenv_placeholder';

/**
 * @description push 成功后本地文件中的敏感值已替换
 * @localZh 已把 {{path}} 中 {{count}} 个敏感变量的值替换为占位符（{{keys}}）：值已加密保存在 PAM，本地不保留明文。
 * @localEn Replaced {{count}} sensitive value(s) in {{path}} with placeholders ({{keys}}): they are stored encrypted in PAM; no plaintext is kept locally.
 */
export const PAMENV_CLI_PUSH_SENSITIVE_CLEARED =
  'pamenv_cli:push_sensitive_cleared';

/**
 * @description 你没有项目 "{{slug}}" 的写权限（需为项目拥有者或团队可写成员）。
 * @localZh 你没有项目 "{{slug}}" 的写权限（需为项目拥有者或团队可写成员）。
 * @localEn You do not have write access to project "{{slug}}" (project owner or team writer required).
 */
export const PAMENV_CLI_NOT_OWNER_PUSH = 'pamenv_cli:not_owner_push';

/**
 * @description 已同步: {{slug}}/{{env}}
 * @localZh 已同步: {{slug}}/{{env}}
 * @localEn Already in sync: {{slug}}/{{env}}
 */
export const PAMENV_CLI_PUSH_ALREADY_SYNC = 'pamenv_cli:push_already_sync';

/**
 * @description Push 冲突：自上次同步后本地与远端修改了同一批键
 * @localZh Push 冲突：自上次同步后本地与远端修改了同一批键
 * @localEn Push conflict: local and remote changed the same keys since last sync
 */
export const PAMENV_CLI_PUSH_CONFLICT = 'pamenv_cli:push_conflict';

/**
 * @description 冲突键: {{keys}}
 * @localZh 冲突键: {{keys}}
 * @localEn Conflicting keys: {{keys}}
 */
export const PAMENV_CLI_PUSH_CONFLICT_KEYS = 'pamenv_cli:push_conflict_keys';

/**
 * @description Push 预览: {{slug}}/{{env}}
 * @localZh Push 预览: {{slug}}/{{env}}
 * @localEn Push review: {{slug}}/{{env}}
 */
export const PAMENV_CLI_PUSH_REVIEW = 'pamenv_cli:push_review';

/**
 * @description 已推送 {{slug}}/{{env}} ← {{path}}
 * @localZh 已推送 {{slug}}/{{env}} ← {{path}}
 * @localEn Pushed {{slug}}/{{env}} ← {{path}}
 */
export const PAMENV_CLI_PUSHED = 'pamenv_cli:pushed';

/**
 * @description 已创建环境 {{slug}}/{{name}}
 * @localZh 已创建环境 {{slug}}/{{name}}
 * @localEn Created environment {{slug}}/{{name}}
 */
export const PAMENV_CLI_CREATED_ENVIRONMENT = 'pamenv_cli:created_environment';

/**
 * @description 将创建环境 "{{name}}"，url: {{url}}
 * @localZh 将创建环境 "{{name}}"，url: {{url}}
 * @localEn Will create environment "{{name}}" with url: {{url}}
 */
export const PAMENV_CLI_WILL_CREATE_ENV = 'pamenv_cli:will_create_env';

/**
 * @description 自上次同步后远端已变更。请先运行 `pamenv pull {{slug}} -e {{env}}`。
 * @localZh 自上次同步后远端已变更。请先运行 `pamenv pull {{slug}} -e {{env}}`。
 * @localEn Remote changed since last sync. Run `pamenv pull {{slug}} -e {{env}}` first.
 */
export const PAMENV_CLI_PUSH_REMOTE_ONLY = 'pamenv_cli:push_remote_only';

/**
 * @description 尚无同步基线。创建 {{slug}}/{{env}} 并推送本地变量？
 * @localZh 尚无同步基线。创建 {{slug}}/{{env}} 并推送本地变量？
 * @localEn No sync baseline found. Create {{slug}}/{{env}} and push local variables?
 */
export const PAMENV_CLI_PUSH_NO_BASELINE_CREATE = 'pamenv_cli:push_no_baseline_create';

/**
 * @description 尚无同步基线（此处从未 pull/push）。仍要用本地覆盖远端？
 * @localZh 尚无同步基线（此处从未 pull/push）。仍要用本地覆盖远端？
 * @localEn No sync baseline found (never pulled/pushed here). Push local over remote anyway?
 */
export const PAMENV_CLI_PUSH_NO_BASELINE = 'pamenv_cli:push_no_baseline';

/**
 * @description 将 {{count}} 个变量推送到 {{slug}}/{{env}}？
 * @localZh 将 {{count}} 个变量推送到 {{slug}}/{{env}}？
 * @localEn Push {{count}} variable(s) to {{slug}}/{{env}}?
 */
export const PAMENV_CLI_PUSH_CONFIRM = 'pamenv_cli:push_confirm';

/**
 * @description 创建 {{slug}}/{{env}} 并推送 {{count}} 个变量？
 * @localZh 创建 {{slug}}/{{env}} 并推送 {{count}} 个变量？
 * @localEn Create {{slug}}/{{env}} and push {{count}} variable(s)?
 */
export const PAMENV_CLI_PUSH_CONFIRM_CREATE = 'pamenv_cli:push_confirm_create';

/**
 * @description 检测到大量变更。仍要推送到 PAM？
 * @localZh 检测到大量变更。仍要推送到 PAM？
 * @localEn Large changes detected. Push these variables to PAM anyway?
 */
export const PAMENV_CLI_PUSH_CONFIRM_LARGE = 'pamenv_cli:push_confirm_large';

/**
 * @description 检测到大量变更。仍要创建 {{slug}}/{{env}} 并推送？
 * @localZh 检测到大量变更。仍要创建 {{slug}}/{{env}} 并推送？
 * @localEn Large changes detected. Create {{slug}}/{{env}} and push these variables anyway?
 */
export const PAMENV_CLI_PUSH_CONFIRM_CREATE_LARGE = 'pamenv_cli:push_confirm_create_large';

/**
 * @description 警告：变量名变更较大（新增 {{added}}，删除 {{removed}}；远端原有 {{remote}} 个键）。
 * @localZh 警告：变量名变更较大（新增 {{added}}，删除 {{removed}}；远端原有 {{remote}} 个键）。
 * @localEn Warning: large variable name changes (added {{added}}, removed {{removed}}; remote had {{remote}} keys).
 */
export const PAMENV_CLI_PUSH_LARGE_WARNING = 'pamenv_cli:push_large_warning';

/**
 * @description 已推送 {{path}} → {{slug}}/{{env}}（{{count}} 个变量）
 * @localZh 已推送 {{path}} → {{slug}}/{{env}}（{{count}} 个变量）
 * @localEn Pushed {{path}} → {{slug}}/{{env}} ({{count}} vars)
 */
export const PAMENV_CLI_PUSHED_DETAIL = 'pamenv_cli:pushed_detail';

/**
 * @description {{count}} 个新变量未标记为敏感。现在选择？
 * @localZh {{count}} 个新变量未标记为敏感。现在选择？
 * @localEn {{count}} new variable(s) are not marked sensitive. Choose some now?
 */
export const PAMENV_CLI_SENSITIVE_UNMARKED_CONFIRM =
  'pamenv_cli:sensitive_unmarked_confirm';

/**
 * @description 选择要标记为敏感的新键
 * @localZh 选择要标记为敏感的新键
 * @localEn Select new keys to mark as sensitive
 */
export const PAMENV_CLI_SENSITIVE_SELECT_KEYS =
  'pamenv_cli:sensitive_select_keys';

/**
 * @description 推送前，环境 "{{env}}" 中的敏感变量必须有值: {{keys}}
 * @localZh 推送前，环境 "{{env}}" 中的敏感变量必须有值: {{keys}}
 * @localEn Sensitive variable(s) in "{{env}}" require a value before push: {{keys}}
 */
export const PAMENV_CLI_SENSITIVE_VALUES_REQUIRED =
  'pamenv_cli:sensitive_values_required';

/**
 * @description 项目 {{slug}} 上找不到环境 "{{env}}"
 * @localZh 项目 {{slug}} 上找不到环境 "{{env}}"
 * @localEn Environment "{{env}}" not found on project {{slug}}
 */
export const PAMENV_CLI_ENV_NOT_FOUND_ON_PROJECT =
  'pamenv_cli:env_not_found_on_project';

/**
 * @description 校验后创建环境 "{{env}}" 并推送本地变量？
 * @localZh 校验后创建环境 "{{env}}" 并推送本地变量？
 * @localEn Create environment "{{env}}" after validation and push local variables?
 */
export const PAMENV_CLI_ENV_CREATE_CONFIRM = 'pamenv_cli:env_create_confirm';

/**
 * @description 找不到环境 "{{env}}"。请去掉 -y 以交互创建，或设置 package.json homepage / git origin 作为默认 URL。
 * @localZh 找不到环境 "{{env}}"。请去掉 -y 以交互创建，或设置 package.json homepage / git origin 作为默认 URL。
 * @localEn Environment "{{env}}" not found. Re-run without -y to create it interactively, or set package.json homepage / git origin for a default URL.
 */
export const PAMENV_CLI_ENV_NOT_FOUND_YES_HINT =
  'pamenv_cli:env_not_found_yes_hint';

/**
 * @description 找不到本地文件: {{path}}。{{hint}}
 * @localZh 找不到本地文件: {{path}}。{{hint}}
 * @localEn Local file not found: {{path}}. {{hint}}
 */
export const PAMENV_CLI_LOCAL_FILE_NOT_FOUND =
  'pamenv_cli:local_file_not_found';

/**
 * @description 请创建 {{path}} 或改用其他 --file。
 * @localZh 请创建 {{path}} 或改用其他 --file。
 * @localEn Create {{path}} or choose another --file.
 */
export const PAMENV_CLI_LOCAL_FILE_HINT_CUSTOM =
  'pamenv_cli:local_file_hint_custom';

/**
 * @description 请先运行 `pamenv pull {{slug}} -e {{env}}`，或创建 {{fileName}}（也可传 --file .env）。
 * @localZh 请先运行 `pamenv pull {{slug}} -e {{env}}`，或创建 {{fileName}}（也可传 --file .env）。
 * @localEn Run `pamenv pull {{slug}} -e {{env}}` first, or create {{fileName}} (or pass --file .env).
 */
export const PAMENV_CLI_LOCAL_FILE_HINT_PULL =
  'pamenv_cli:local_file_hint_pull';

/**
 * @description 必须指定环境名。例如: pamenv remove <slug> -e local
 * @localZh 必须指定环境名。例如: pamenv remove <slug> -e local
 * @localEn Environment name is required. Use `-e <name>`, for example: pamenv remove <slug> -e local
 */
export const PAMENV_CLI_REMOVE_ENV_REQUIRED = 'pamenv_cli:remove_env_required';

/**
 * @description 你没有项目 "{{slug}}" 的管理权限。删除环境需要 admin。
 * @localZh 你没有项目 "{{slug}}" 的管理权限。删除环境需要 admin。
 * @localEn You do not have admin access to project "{{slug}}". Removing an environment requires admin.
 */
export const PAMENV_CLI_REMOVE_NOT_ADMIN = 'pamenv_cli:remove_not_admin';

/**
 * @description 删除项目 {{slug}} 上的环境 "{{env}}"？此操作无法撤销。
 * @localZh 删除项目 {{slug}} 上的环境 "{{env}}"？此操作无法撤销。
 * @localEn Delete environment "{{env}}" on project {{slug}}? This cannot be undone.
 */
export const PAMENV_CLI_REMOVE_CONFIRM = 'pamenv_cli:remove_confirm';

/**
 * @description 确认删除 {{slug}}/{{env}}？
 * @localZh 确认删除 {{slug}}/{{env}}？
 * @localEn Really delete {{slug}}/{{env}}?
 */
export const PAMENV_CLI_REMOVE_CONFIRM_AGAIN =
  'pamenv_cli:remove_confirm_again';

/**
 * @description 已删除: {{slug}}/{{env}}
 * @localZh 已删除: {{slug}}/{{env}}
 * @localEn Deleted successfully: {{slug}}/{{env}}
 */
export const PAMENV_CLI_REMOVE_DELETED = 'pamenv_cli:remove_deleted';

/**
 * @description 源项目: {{slug}} ({{name}})
 * @localZh 源项目: {{slug}} ({{name}})
 * @localEn Source: {{slug}} ({{name}})
 */
export const PAMENV_CLI_FORK_SOURCE = 'pamenv_cli:fork_source';

/**
 * @description Fork 后的项目会清空敏感变量的值。
 * @localZh Fork 后的项目会清空敏感变量的值。
 * @localEn Sensitive variable values will be cleared on the forked project.
 */
export const PAMENV_CLI_FORK_SENSITIVE_CLEARED =
  'pamenv_cli:fork_sensitive_cleared';

/**
 * @description fork slug
 * @localZh fork slug
 * @localEn fork slug
 */
export const PAMENV_CLI_FORK_PROMPT_SLUG = 'pamenv_cli:fork_prompt_slug';

/**
 * @description fork 名称
 * @localZh fork 名称
 * @localEn fork name
 */
export const PAMENV_CLI_FORK_PROMPT_NAME = 'pamenv_cli:fork_prompt_name';

/**
 * @description 名称不能为空
 * @localZh 名称不能为空
 * @localEn Name is required
 */
export const PAMENV_CLI_FORK_NAME_REQUIRED = 'pamenv_cli:fork_name_required';

/**
 * @description Fork 到 "{{slug}}" / "{{name}}"？
 * @localZh Fork 到 "{{slug}}" / "{{name}}"？
 * @localEn Fork into "{{slug}}" / "{{name}}"?
 */
export const PAMENV_CLI_FORK_CONFIRM = 'pamenv_cli:fork_confirm';

/**
 * @description 已 Fork "{{source}}" → "{{slug}}" ({{id}})。
 * @localZh 已 Fork "{{source}}" → "{{slug}}" ({{id}})。
 * @localEn Forked "{{source}}" → "{{slug}}" ({{id}}).
 */
export const PAMENV_CLI_FORKED = 'pamenv_cli:forked';

/**
 * @description 请先填写密钥再推送，例如：
 * @localZh 请先填写密钥再推送，例如：
 * @localEn Fill secrets then push, for example:
 */
export const PAMENV_CLI_FORK_FILL_SECRETS = 'pamenv_cli:fork_fill_secrets';

/**
 * @description Fork 结果没有环境。请在 PAM 网页添加，或在其他目录 init。
 * @localZh Fork 结果没有环境。请在 PAM 网页添加，或在其他目录 init。
 * @localEn No environments on the fork. Add some in the PAM UI or via init elsewhere.
 */
export const PAMENV_CLI_FORK_NO_ENVS = 'pamenv_cli:fork_no_envs';

/**
 * @description 未找到项目。
 * @localZh 未找到项目。
 * @localEn No projects found.
 */
export const PAMENV_CLI_NO_PROJECTS = 'pamenv_cli:no_projects';

/**
 * @description {{slug}}\t{{name}}{{role}}\tenvs: {{envs}}\tid: {{id}}
 * @localZh {{slug}}\t{{name}}{{role}}\tenvs: {{envs}}\tid: {{id}}
 * @localEn {{slug}}\t{{name}}{{role}}\tenvs: {{envs}}\tid: {{id}}
 */
export const PAMENV_CLI_PROJECTS_LINE = 'pamenv_cli:projects_line';

/**
 * @description 已退出登录（服务端吊销 + 本地 token/sync 已清除）。配置: {{path}}
 * @localZh 已退出登录（服务端吊销 + 本地 token/sync 已清除）。配置: {{path}}
 * @localEn Logged out (server revoke + local token/sync cleared). Config: {{path}}
 */
export const PAMENV_CLI_LOGOUT_DONE = 'pamenv_cli:logout_done';

/**
 * @description 服务端吊销 token 失败（仍继续本地退出）: {{message}}
 * @localZh 服务端吊销 token 失败（仍继续本地退出）: {{message}}
 * @localEn Server token revoke failed (continuing local logout): {{message}}
 */
export const PAMENV_CLI_LOGOUT_REVOKE_FAILED =
  'pamenv_cli:logout_revoke_failed';

/**
 * @description 使用本地 PAM 配置目录: {{path}}
 * @localZh 使用本地 PAM 配置目录: {{path}}
 * @localEn Using local PAM config root: {{path}}
 */
export const PAMENV_CLI_USING_LOCAL_ROOT = 'pamenv_cli:using_local_root';

/**
 * @description 请只使用 --url 或 --domain 其中一个。
 * @localZh 请只使用 --url 或 --domain 其中一个。
 * @localEn Use only one of --url or --domain, not both.
 */
export const PAMENV_CLI_URL_AND_DOMAIN_EXCLUSIVE =
  'pamenv_cli:url_and_domain_exclusive';

/**
 * @description 请只使用 --local 或 --global 其中一个。
 * @localZh 请只使用 --local 或 --global 其中一个。
 * @localEn Use only one of --local or --global, not both.
 */
export const PAMENV_CLI_LOCAL_AND_GLOBAL_EXCLUSIVE =
  'pamenv_cli:local_and_global_exclusive';

/**
 * @description 新增 ({{count}}):
 * @localZh 新增 ({{count}}):
 * @localEn Created ({{count}}):
 */
export const PAMENV_CLI_DIFF_CREATED = 'pamenv_cli:diff_created';

/**
 * @description 修改 ({{count}}):
 * @localZh 修改 ({{count}}):
 * @localEn Modified ({{count}}):
 */
export const PAMENV_CLI_DIFF_MODIFIED = 'pamenv_cli:diff_modified';

/**
 * @description 删除 ({{count}}):
 * @localZh 删除 ({{count}}):
 * @localEn Deleted ({{count}}):
 */
export const PAMENV_CLI_DIFF_DELETED = 'pamenv_cli:diff_deleted';

/**
 * @description 未检测到变量变更。
 * @localZh 未检测到变量变更。
 * @localEn No variable changes detected.
 */
export const PAMENV_CLI_DIFF_NONE = 'pamenv_cli:diff_none';

/**
 * @description 项目 {{slug}} 没有环境
 * @localZh 项目 {{slug}} 没有环境
 * @localEn Project {{slug}} has no environments
 */
export const PAMENV_CLI_PROJECT_NO_ENVS = 'pamenv_cli:project_no_envs';

/**
 * @description 必须提供项目 slug 或 id
 * @localZh 必须提供项目 slug 或 id
 * @localEn Project slug or id is required
 */
export const PAMENV_CLI_PROJECT_REF_REQUIRED =
  'pamenv_cli:project_ref_required';

/**
 * @description 找不到项目（slug 或 id）: {{ref}}
 * @localZh 找不到项目（slug 或 id）: {{ref}}
 * @localEn Project not found for slug or id: {{ref}}
 */
export const PAMENV_CLI_PROJECT_NOT_FOUND = 'pamenv_cli:project_not_found';

/**
 * @description 构建本地文件需要环境名
 * @localZh 构建本地文件需要环境名
 * @localEn Environment name is required to build the local file
 */
export const PAMENV_CLI_ENV_NAME_REQUIRED_FOR_FILE =
  'pamenv_cli:env_name_required_for_file';

/**
 * @description 尚未登录。请先运行 `pamenv login`。
 * @localZh 尚未登录。请先运行 `pamenv login`。
 * @localEn Not logged in. Run `pamenv login` first.
 */
export const PAMENV_CLI_NOT_LOGGED_IN = 'pamenv_cli:not_logged_in';

/**
 * @description 项目权限列表缺失，需重新登录
 * @localZh 项目 "{{slug}}" 的权限列表缺失。请重新执行 `pamenv login`，或升级 PAM 服务端后再试。
 * @localEn Project "{{slug}}" is missing a permissions list. Run `pamenv login` again, or upgrade the PAM server.
 */
export const PAMENV_CLI_PERMISSIONS_MISSING =
  'pamenv_cli:permissions_missing';

/**
 * @description export 返回了敏感明文（旧检测；现已改为客户端强制占位符）
 * @localZh 拒绝写入：导出结果中敏感键 "{{key}}"（{{slug}}/{{env}}）仍含明文。请检查服务端 redact，或将该变量标记为 sensitive。
 * @localEn Refusing to write: export returned plaintext for sensitive key "{{key}}" ({{slug}}/{{env}}). Check server redaction, or mark the variable sensitive.
 */
export const PAMENV_CLI_EXPORT_SENSITIVE_LEAK =
  'pamenv_cli:export_sensitive_leak';

/**
 * @description pull 将敏感值写成占位符（含兼容旧服务端漏明文）
 * @localZh [pamenv] {{count}} 个敏感变量已写入占位符（{{keys}}）：本地文件不含明文，请用 `pamenv run` 注入真实值。
 * @localEn [pamenv] {{count}} sensitive variable(s) written as placeholders ({{keys}}): no plaintext is kept locally; inject real values with `pamenv run`.
 */
export const PAMENV_CLI_PULL_SENSITIVE_PLACEHOLDER =
  'pamenv_cli:pull_sensitive_placeholder';

/**
 * @description pull 将敏感变量写成空值 keep（旧服务端未提供占位符）
 * @localZh [pamenv] {{count}} 个敏感变量已写成空值（{{keys}}）：本地不含明文；空值 push 时表示保留远端密钥。请用 `pamenv run` 注入进程。
 * @localEn [pamenv] {{count}} sensitive variable(s) written as empty ({{keys}}): no plaintext locally; empty on push keeps the remote secret. Inject with `pamenv run`.
 */
export const PAMENV_CLI_PULL_SENSITIVE_EMPTY =
  'pamenv_cli:pull_sensitive_empty';

/**
 * @description push 行内赋值格式非法
 * @localZh 非法赋值 "{{raw}}"：请使用 KEY=value（可多个）。
 * @localEn Invalid assignment "{{raw}}": use KEY=value (repeatable).
 */
export const PAMENV_CLI_PUSH_ASSIGNMENT_INVALID =
  'pamenv_cli:push_assignment_invalid';

/**
 * @description run 解析到的项目与请求不一致
 * @localZh 拒绝注入：请求的是 "{{ref}}"，但服务端返回了 "{{slug}}"。请使用精确的项目 slug。
 * @localEn Refusing to inject: requested "{{ref}}" but the server returned "{{slug}}". Use an exact project slug.
 */
export const PAMENV_CLI_RUN_PROJECT_MISMATCH =
  'pamenv_cli:run_project_mismatch';

/**
 * @description 目标文件权限过宽，拒绝覆盖
 * @localZh 拒绝写入 {{path}}：文件对 group/other 可读。请先 `chmod 600 {{path}}`，或换路径。
 * @localEn Refusing to write {{path}}: the file is readable by group/others. Run `chmod 600 {{path}}`, or use another path.
 */
export const PAMENV_CLI_FILE_TOO_PERMISSIVE =
  'pamenv_cli:file_too_permissive';

/**
 * @description --force 换绑需要交互确认
 * @localZh 本地文件 {{path}} 已绑定到 {{boundSlug}}/{{boundEnv}}。使用 `--force` 覆盖绑定需要交互确认；当前非 TTY，请改用 `--file {{suggestedFile}}`，或在终端中运行。
 * @localEn Local file {{path}} is bound to {{boundSlug}}/{{boundEnv}}. `--force` rebind requires interactive confirmation; this is not a TTY. Use `--file {{suggestedFile}}`, or run in a terminal.
 */
export const PAMENV_CLI_FORCE_REBIND_NEEDS_TTY =
  'pamenv_cli:force_rebind_needs_tty';

/**
 * @description 确认覆盖环境文件绑定
 * @localZh 确认将 {{path}} 的绑定从 {{boundSlug}}/{{boundEnv}} 改为 {{slug}}/{{env}}？
 * @localEn Rebind {{path}} from {{boundSlug}}/{{boundEnv}} to {{slug}}/{{env}}?
 */
export const PAMENV_CLI_FORCE_REBIND_CONFIRM =
  'pamenv_cli:force_rebind_confirm';

